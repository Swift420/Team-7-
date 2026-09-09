import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  FileBarChart,
  Image as ImageIcon,
  LoaderCircle,
  MapPinned,
} from "lucide-react";
import {
  fetchExistingVisualizations,
  fetchSavedVisualizations,
  fetchVisualizationHistory,
} from "../services/api";
import {
  Article,
  ArticleBodyElement,
  ExistingVisualization,
  SavedVisualization,
  VisualizationOpportunity,
} from "../types";
import { ArticleVisualizer } from "./ArticleVisualizer";
import { VisualizationChart } from "./VisualizationChart";
import { summarizeVisualization } from "./visualSummary";

// Existing embeds are authored content; generated visuals are additive and never replace them.
const MapVisualization: React.FC<{
  title: string;
  rows: Array<{ label: string; value: string }>;
}> = ({ title, rows }) => {
  const categories = [...new Set(rows.map((row) => row.value))];
  return (
    <div className="native-map" aria-label={`${title} geographic distribution`}>
      <div className="native-map-legend">
        {categories.slice(0, 6).map((category, index) => (
          <span key={category}>
            <i
              style={{
                background: `hsl(${204 - index * 18} 80% ${72 - index * 7}%)`,
              }}
            />
            {category}
          </span>
        ))}
      </div>
      <div className="native-map-grid">
        {rows.map((row, index) => (
          <div
            className="map-region"
            key={row.label}
            title={`${row.label}: ${row.value}`}
            style={{
              background: `hsl(${204 - (categories.indexOf(row.value) % 6) * 18} 80% ${72 - (categories.indexOf(row.value) % 6) * 7}%)`,
            }}
          >
            <strong>{row.label}</strong>
            <small>{row.value}</small>
            <em>{index + 1}</em>
          </div>
        ))}
      </div>
      <small className="native-map-note">
        Interactive regional view · hover a region for its value
      </small>
    </div>
  );
};

const isUnsafeEmbedText = (text: string) =>
  /@import\s+url\(|ml-form-|g-recaptcha|mailerlite|<\/?style\b|<\/?script\b|document\.querySelector/i.test(
    text,
  );

const ExistingVisual: React.FC<{ visual: ExistingVisualization }> = ({
  visual,
}) => {
  const chartOpportunity: VisualizationOpportunity | null =
    visual.chartType && visual.data.length && visual.series.length
      ? {
          id: visual.externalId,
          title: visual.title,
          subtitle: visual.subtitle,
          rationale: "Existing article visualization",
          chartType: visual.chartType,
          confidence: 1,
          dataStatus: "ready",
          relatedElementIds: [visual.elementId],
          suggestedPlacementAfter: visual.elementId,
          xAxisLabel: visual.table[0]?.[0] || "",
          yAxisLabel: "",
          unit: visual.subtitle.toLowerCase().includes("prozent") ? "%" : "",
          series: visual.series,
          data: visual.data,
          sourceNote: visual.sources.map((source) => source.text).join(", "),
          caveats: visual.notes ? [visual.notes] : [],
          accessibilitySummary: `${visual.title}. ${visual.subtitle}`,
        }
      : null;

  return (
    <figure className="existing-visual" id={visual.elementId}>
      <div className="existing-visual-heading">
        <span>
          <FileBarChart size={14} /> Existing {visual.tool.replaceAll("_", " ")}
        </span>
        <strong>{visual.title}</strong>
        {visual.subtitle && <p>{visual.subtitle}</p>}
      </div>
      {visual.chartType === "map" && visual.mapData?.length ? (
        <MapVisualization title={visual.title} rows={visual.mapData} />
      ) : chartOpportunity ? (
        <VisualizationChart opportunity={chartOpportunity} />
      ) : visual.assetUrls.length ? (
        <div className="existing-asset-strip">
          {visual.assetUrls.map((url, index) => (
            <img
              key={url}
              src={url}
              alt={`${visual.title}, panel ${index + 1}`}
            />
          ))}
        </div>
      ) : visual.table.length > 1 ? (
        <div className="existing-table-wrap">
          <table>
            <thead>
              <tr>
                {visual.table[0].map((cell, index) => (
                  <th key={`${cell}-${index}`}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visual.table.slice(1, 16).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td key={`${cell}-${index}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {visual.table.length > 16 && (
            <small>Showing 15 of {visual.table.length - 1} rows</small>
          )}
        </div>
      ) : (
        <div className="existing-rich-fallback">
          {visual.tool.includes("map") ? (
            <MapPinned size={30} />
          ) : (
            <ImageIcon size={30} />
          )}
          <span>
            The original {visual.tool.replaceAll("_", " ")} metadata is
            available, but its proprietary renderer is not included in this
            dataset.
          </span>
        </div>
      )}
      <div className="visual-plain-summary">
        What this shows:{" "}
        {chartOpportunity
          ? summarizeVisualization(chartOpportunity)
          : visual.mapData?.length
            ? `${visual.mapData.length} regions are grouped into ${new Set(visual.mapData.map((row) => row.value)).size} value bands.`
            : "The original visualization is preserved with its available data."}
      </div>
      {(visual.notes || visual.sources.length > 0) && (
        <figcaption>
          {visual.notes && (
            <span>
              {visual.notes
                .replace(/<br\s*\/?>(?:\s*)/gi, " · ")
                .replace(/<[^>]+>/g, "")}
            </span>
          )}
          {visual.sources.map((source) =>
            source.url ? (
              <a
                key={`${source.text}-${source.url}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                {source.text}
              </a>
            ) : (
              <span key={source.text}>{source.text}</span>
            ),
          )}
        </figcaption>
      )}
    </figure>
  );
};

const GeneratedVisual: React.FC<{
  saved: SavedVisualization;
  showEditorialLabel: boolean;
}> = ({ saved, showEditorialLabel }) => (
  <figure className="inserted-visual inline-generated-visual">
    {showEditorialLabel && (
      <div className="generated--visual-label">
        AI-assisted · Editor approved
      </div>
    )}
    <figcaption>
      <h3>{saved.specification.title}</h3>
      {saved.specification.subtitle && <p>{saved.specification.subtitle}</p>}
    </figcaption>
    <VisualizationChart opportunity={saved.specification} />
    <div className="visual-plain-summary">
      What this shows: {summarizeVisualization(saved.specification)}
    </div>
    <div className="visual-source">
      {saved.specification.sourceNote || "Source: article text"}
    </div>
  </figure>
);

function renderElement(
  element: ArticleBodyElement,
  existing: ExistingVisualization | undefined,
  loadingExisting: boolean,
) {
  if (element.type === "heading")
    return element.level && element.level >= 3 ? (
      <h3 id={element.id} className="article-h3">
        {element.text}
      </h3>
    ) : (
      <h2 id={element.id} className="article-h2">
        {element.text}
      </h2>
    );
  if (element.type === "image" && element.url)
    return (
      <figure id={element.id} className="article-inline-figure">
        <img src={element.url} alt={element.caption || ""} />
        {(element.caption || element.credit) && (
          <figcaption>
            {element.caption}
            {element.credit && ` — ${element.credit}`}
          </figcaption>
        )}
      </figure>
    );
  if (element.type === "q_tool_embed") {
    if (existing) return <ExistingVisual visual={existing} />;
    return (
      <aside id={element.id} className="existing-visual-placeholder">
        {loadingExisting ? (
          <LoaderCircle className="spin" size={20} />
        ) : (
          <FileBarChart size={22} />
        )}
        <span>
          {loadingExisting
            ? "Loading existing visualization…"
            : "Existing visualization data unavailable"}
        </span>
      </aside>
    );
  }
  if (element.type === "embed")
    return (
      <aside id={element.id} className="existing-visual-placeholder">
        <span>
          Embedded media{element.service ? ` · ${element.service}` : ""}
        </span>
      </aside>
    );
  if (element.text && !isUnsafeEmbedText(element.text))
    return (
      <p id={element.id} className="article-p">
        {element.text}
      </p>
    );
  if (element.text && isUnsafeEmbedText(element.text))
    return (
      <aside id={element.id} className="article-embed-suppressed">
        Embedded newsletter/media block hidden from the reading view.
      </aside>
    );
  return null;
}

export const ArticleContent: React.FC<{
  article: Article;
  isEditor: boolean;
}> = ({ article, isEditor }) => {
  const [existingVisuals, setExistingVisuals] = useState<
    ExistingVisualization[]
  >([]);
  const [savedVisuals, setSavedVisuals] = useState<SavedVisualization[]>([]);
  const [approvalCount, setApprovalCount] = useState(0);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const existingByElement = useMemo(
    () => new Map(existingVisuals.map((visual) => [visual.elementId, visual])),
    [existingVisuals],
  );
  const savedByElement = useMemo(() => {
    const grouped = new Map<string, SavedVisualization[]>();
    savedVisuals.forEach((visual) =>
      grouped.set(visual.placementAfterElementId, [
        ...(grouped.get(visual.placementAfterElementId) || []),
        visual,
      ]),
    );
    return grouped;
  }, [savedVisuals]);

  useEffect(() => {
    let active = true;
    setLoadingExisting(true);
    Promise.all([
      fetchExistingVisualizations(article.id),
      fetchSavedVisualizations(article.id),
      fetchVisualizationHistory(article.id),
    ])
      .then(([existing, saved, history]) => {
        if (active) {
          setExistingVisuals(existing);
          setSavedVisuals(saved);
          setApprovalCount(history.length);
        }
      })
      .catch((error) =>
        console.warn("Unable to load article visualizations", error),
      )
      .finally(() => {
        if (active) setLoadingExisting(false);
      });
    return () => {
      active = false;
    };
  }, [article.id]);

  return (
    <>
      {isEditor && (
        <ArticleVisualizer
          key={`visualizer-${article.id}`}
          article={article}
          savedVisualizations={savedVisuals}
          approvalCount={approvalCount}
          onSaved={(next) => {
            setSavedVisuals(next);
            setApprovalCount((count) => count + 1);
          }}
        />
      )}
      <article className="article-content-body">
        {article.body?.map((element) => (
          <Fragment key={element.id}>
            {renderElement(
              element,
              existingByElement.get(element.id),
              loadingExisting,
            )}
            {savedByElement.get(element.id)?.map((saved) => (
              <GeneratedVisual
                key={saved.id}
                saved={saved}
                showEditorialLabel={isEditor}
              />
            ))}
          </Fragment>
        ))}
      </article>
    </>
  );
};
