import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BarChart3, Check, LoaderCircle, LocateFixed, Save, Sparkles } from 'lucide-react';
import { analyzeArticleVisualizations, saveArticleVisualizations } from '../services/api';
import { Article, SavedVisualization, VisualizationAnalysis, VisualizationChartType, VisualizationOpportunity } from '../types';
import { VisualizationChart } from './VisualizationChart';
import { summarizeVisualization } from './visualSummary';

interface ArticleVisualizerProps {
  article: Article;
  savedVisualizations: SavedVisualization[];
  onSaved: (visualizations: SavedVisualization[]) => void;
  approvalCount?: number;
}

const chartLabels: Record<VisualizationChartType, string> = {
  bar: 'Bar chart',
  line: 'Line chart',
  area: 'Area chart',
  stacked_bar: 'Stacked bar',
  dot_plot: 'Dot plot',
  donut: 'Donut chart',
  timeline: 'Timeline',
  map: 'Map',
};

export const ArticleVisualizer: React.FC<ArticleVisualizerProps> = ({ article, savedVisualizations, onSaved, approvalCount = 0 }) => {
  const [analysis, setAnalysis] = useState<VisualizationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [chartTypes, setChartTypes] = useState<Record<string, VisualizationChartType>>({});
  const autoAnalyzed = useRef(false);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const result = await analyzeArticleVisualizations(article.id);
      setAnalysis(result);
      setSelectedIds([]);
      setChartTypes(Object.fromEntries(result.opportunities.map((opportunity) => [opportunity.id, opportunity.chartType])));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to analyze this article');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('visualize') === '1' && !autoAnalyzed.current) {
      autoAnalyzed.current = true;
      void analyze();
    }
  }, [article.id]);

  const updateOpportunity = (id: string, update: (opportunity: VisualizationOpportunity) => VisualizationOpportunity) => {
    setAnalysis((current) => current ? {
      ...current,
      opportunities: current.opportunities.map((opportunity) => opportunity.id === id ? update(opportunity) : opportunity),
    } : current);
  };

  const saveSelected = async () => {
    if (!analysis) return;
    setSaving(true);
    setError(null);
    try {
      const selected = analysis.opportunities
        .filter((opportunity) => selectedIds.includes(opportunity.id))
        .map((opportunity) => ({ ...opportunity, chartType: chartTypes[opportunity.id] || opportunity.chartType }));
      const saved = await saveArticleVisualizations(article.id, selected);
      onSaved(saved);
      setSaveMessage(`${selected.length} ${selected.length === 1 ? 'visual' : 'visuals'} added to the article.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save visualizations');
    } finally {
      setSaving(false);
    }
  };

  const clearSaved = async () => {
    setSaving(true);
    setError(null);
    try {
      onSaved(await saveArticleVisualizations(article.id, []));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to remove saved visualizations');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const jumpToSource = (elementId: string) => {
    document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return <section className="article-visualizer" aria-labelledby="article-visualizer-title">
    <div className="visualizer-intro">
      <div className="visualizer-icon"><Sparkles size={22} /></div>
      <div className="visualizer-copy">
        <span className="visualizer-eyebrow">Gemini editorial assistant</span>
        <h2 id="article-visualizer-title">Turn this article into visuals</h2>
        <p>Find trustworthy comparisons and trends not already covered by existing visuals, edit their data, then save them inline.</p>
        {(savedVisualizations.length > 0 || approvalCount > 0) && <div className="visual-status-row">{savedVisualizations.length > 0 && <span className="saved-visual-count"><Check size={12} /> {savedVisualizations.length} visual{savedVisualizations.length === 1 ? '' : 's'} saved <button className="visual-text-button" disabled={saving} onClick={() => void clearSaved()}>Remove saved</button></span>}{approvalCount > 0 && <span className="approval-count-badge">{approvalCount} approval snapshot{approvalCount === 1 ? '' : 's'}</span>}</div>}
      </div>
      <div className="visualizer-intro-actions">
        <a className="btn-secondary" href={`/api/articles/${article.id}/visualizations/embed`} target="_blank" rel="noreferrer">Export embed</a>
        <button className="visualize-article-button" onClick={() => void analyze()} disabled={loading}>
          {loading ? <LoaderCircle className="spin" size={18} /> : <BarChart3 size={18} />}
          {loading ? 'Reading article…' : analysis ? 'Analyze again' : 'Visualize Article'}
        </button>
      </div>
    </div>

    {error && <div className="visualizer-error"><AlertTriangle size={18} /><div><strong>Analysis failed</strong><p>{error}</p></div></div>}

    {analysis && <div className="visualizer-results">
      <div className="analysis-summary">
        <div><strong>{analysis.opportunities.length} opportunities found</strong><p>{analysis.summary}</p></div>
        <span>{analysis.model}</span>
      </div>

      {analysis.opportunities.length === 0 ? <div className="no-visual-opportunities">Gemini did not find enough explicit, comparable data to build a trustworthy chart from this article alone.</div>
        : <div className="opportunity-list">{analysis.opportunities.map((opportunity) => {
          const selected = selectedIds.includes(opportunity.id);
          const sourceIds = [...new Set([...opportunity.data.flatMap((point) => point.sourceElementIds), ...(opportunity.events || []).flatMap((event) => event.sourceParagraphIds)])];
          return <article className={`opportunity-card ${selected ? 'is-selected' : ''}`} key={opportunity.id}>
            <div className="opportunity-header">
              <label className="opportunity-select">
                <input type="checkbox" checked={selected} onChange={() => toggleSelected(opportunity.id)} />
                <span>{selected ? 'Selected' : 'Select visual'}</span>
              </label>
              <div className={`data-status ${opportunity.dataStatus}`}>
                {opportunity.dataStatus === 'ready' ? <Check size={13} /> : <AlertTriangle size={13} />}
                {opportunity.dataStatus === 'ready' ? 'Ready' : 'Review data'}
              </div>
            </div>
            <div className="opportunity-title-row">
              <div className="visual-copy-editor">
                <input className="visual-title-input" aria-label="Visualization title" value={opportunity.title} onChange={(event) => updateOpportunity(opportunity.id, (current) => ({ ...current, title: event.target.value }))} />
                <input className="visual-subtitle-input" aria-label="Visualization subtitle" value={opportunity.subtitle} placeholder="Optional subtitle" onChange={(event) => updateOpportunity(opportunity.id, (current) => ({ ...current, subtitle: event.target.value }))} />
              </div>
              <span className="confidence-score">{Math.round(opportunity.confidence * 100)}% confidence</span>
            </div>
            <p className="opportunity-rationale">{opportunity.rationale}</p>
            <div className="chart-controls">
              <label>Format<select value={chartTypes[opportunity.id] || opportunity.chartType} onChange={(event) => setChartTypes((current) => ({ ...current, [opportunity.id]: event.target.value as VisualizationChartType }))}>
                {Object.entries(chartLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></label>
              <span>{opportunity.data.length} data points · {opportunity.series.length} {opportunity.series.length === 1 ? 'series' : 'series'}</span>
            </div>
            <VisualizationChart opportunity={opportunity} chartType={chartTypes[opportunity.id]} />
            <p className="visual-plain-summary">What this shows: {summarizeVisualization({ ...opportunity, chartType: chartTypes[opportunity.id] || opportunity.chartType })}</p>
            <div className="visual-data-editor">
              <div className="data-editor-heading"><strong>Editable chart data</strong><span>Changes update the preview immediately</span></div>
              <div className="data-table-scroll"><table>
                <thead><tr><th>Label</th>{opportunity.series.map((series, seriesIndex) => <th key={series.key}><input aria-label={`Series ${seriesIndex + 1} label`} value={series.label} onChange={(event) => updateOpportunity(opportunity.id, (current) => ({ ...current, series: current.series.map((item, index) => index === seriesIndex ? { ...item, label: event.target.value } : item) }))} /></th>)}</tr></thead>
                <tbody>{opportunity.data.map((point, pointIndex) => <tr key={`${point.label}-${pointIndex}`}><td><input aria-label={`Data row ${pointIndex + 1} label`} value={point.label} onChange={(event) => updateOpportunity(opportunity.id, (current) => ({ ...current, data: current.data.map((item, index) => index === pointIndex ? { ...item, label: event.target.value } : item) }))} /></td>{point.values.map((value, valueIndex) => <td key={valueIndex}><input type="number" aria-label={`Value ${pointIndex + 1}, ${valueIndex + 1}`} value={value} onChange={(event) => { const next = event.target.valueAsNumber; if (Number.isFinite(next)) updateOpportunity(opportunity.id, (current) => ({ ...current, data: current.data.map((item, index) => index === pointIndex ? { ...item, values: item.values.map((itemValue, index) => index === valueIndex ? next : itemValue) } : item) })); }} /></td>)}</tr>)}</tbody>
              </table></div>
            </div>
            <div className="opportunity-footer">
              <div className="source-links"><LocateFixed size={14} /> Evidence: {sourceIds.slice(0, 4).map((id) => <button key={id} onClick={() => jumpToSource(id)}>{id}</button>)}</div>
              {opportunity.caveats.length > 0 && <p className="visual-caveat">Review: {opportunity.caveats.join(' · ')}</p>}
            </div>
          </article>;
        })}</div>}

      {analysis.opportunities.length > 0 && <div className="visualizer-actions">
        <span>{selectedIds.length ? `${selectedIds.length} selected` : 'Choose one or more recommendations'}</span>
        <button className="insert-visuals-button" disabled={!selectedIds.length || saving} onClick={() => void saveSelected()}>
          {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} {saving ? 'Saving…' : 'Save selected inline'}
        </button>
        {saveMessage && <span className="visual-save-confirmation" role="status" aria-live="polite"><Check size={15} /> {saveMessage}</span>}
      </div>}
    </div>}
  </section>;
};
