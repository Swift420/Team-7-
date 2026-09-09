import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Headphones,
  Video,
  Mail,
  AlertCircle,
  Clock,
  Trash2,
  FileText,
  BarChart2,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { generateLiquidFormats } from '../../services/liquidApi';
import type { LiquidDerivativesPayload, CarouselSlide } from '../../types/liquid';
import { CarouselPreview } from './CarouselPreview';
import { AudioBriefPlayer } from '../reader/AudioBriefPlayer';
import { GenerationProgressBar } from './GenerationProgressBar';

interface DraftStudioProps {
  language: 'en' | 'de';
  onLanguageChange?: (lang: 'en' | 'de') => void;
}

const PRESETS = [
  {
    id: 'lockbit-de',
    title: '🇩🇪 LockBit Cyber-Erpressungskartell',
    lang: 'de' as const,
    section: 'Technologie',
    author: 'Adrienne Fichter',
    headline: 'Das LockBit-Kartell: Anatomie einer globalen Cyber-Erpressung',
    lead: 'Das Justizdepartement der USA und Europol zerschlagen die Infrastruktur des weltweiten Ransomware-Netzwerks LockBit. Eine forensische Rekonstruktion offenbart industrielle Arbeitsteilung, Milliarden-Lösegelder und die Verwundbarkeit Schweizer KMU.',
    body: `Das Phänomen Ransomware hat sich von isolierten Hacker-Attacken zu einer hochspezialisierten Schattenwirtschaft entwickelt. Im Zentrum dieses Ökosystems stand über Jahre die Gruppe LockBit, deren Erpressungstrojaner weltweit für mehr als 2000 registrierte Angriffe verantwortlich war. Die von den Betreibern erpresste Gesamtsumme beläuft sich nach behördlichen Schätzungen auf über 120 Millionen Dollar.

Die internationale Operation «Cronos», an der zehn nationale Polizeibehörden beteiligt waren, markiert einen beispiellosen Wendepunkt in der Kriminalitätsbekämpfung. Ermittler beschlagnahmten 34 Server in den Niederlanden, Deutschland, Finnland, der Schweiz und den USA. Zudem wurden hunderte von Krypto-Wallets eingefroren, die direkte Zahlungsströme der Opfer abbildeten.

Für den Schweizer Wirtschaftsstandort ist der Fall LockBit ein drastischer Weckruf. Zahlreiche mittelständische Zulieferer, Bildungsinstitutionen und Gesundheitseinrichtungen wurden in den vergangenen 24 Monaten von Partnern des LockBit-Affiliate-Programms kompromittiert. Die Angreifer nutzten vor allem ungepatchte VPN-Schwachstellen und gestohlene Zugangsdaten aus Phishing-Kampagnen. 

Ordnungspolitisch steht die Schweiz vor einer Richtungsentscheidung: Soll eine gesetzliche Meldepflicht für Ransomware-Vorfälle und ein striktes Lösegeld-Zahlungsverbot nach französischem Vorbild eingeführt werden? Während Sicherheitsbehörden ein Zahlungsverbot befürworten, um das kriminelle Geschäftsmodell auszutrocknen, warnen Wirtschaftsverbände vor existenzbedrohenden Konsequenzen für betroffene Firmen.`,
  },
  {
    id: 'defense-en',
    title: '🇬🇧 European Defense Reinvestment (€380B)',
    lang: 'en' as const,
    section: 'Economy',
    author: 'Dr. Beat Gygi',
    headline: 'European Defense Spending Surges Past €380 Billion Amid NATO Strategic Realignment',
    lead: 'European member states are radically overhauling military procurement cycles. A structural breakdown of capital allocation reveals unprecedented investment into autonomous drones, layered air defense, and hardened domestic munitions manufacturing.',
    body: `Following two decades of strategic underinvestment, European NATO members face an unprecedented fiscal transformation. According to official data from the European Defence Agency, aggregate military expenditure reached €380 billion this year, marking a 14.5% year-on-year expansion.

"Credible military deterrence requires not merely political statements, but binding industrial contracts with domestic defence contractors," notes a leading security strategist in Zurich.

The most critical bottleneck lies in industrial manufacturing capacities:
- 155mm artillery shell production has tripled across German and Scandinavian facilities, targeting 1.5 million shells annually.
- Multi-layered air defense systems (IRIS-T SLM and Patriot PAC-3) absorb over €42 billion in committed long-term contracts.
- Next-generation autonomous drone swarms and electronic warfare systems are being deployed directly into tactical ground doctrines.

The fiscal trade-off is severe: national treasuries must reconcile colossal defense budgets with statutory debt brakes. Sovereign defense bonds may bridge immediate liquidity gaps, but enduring defense readiness demands rigorous fiscal discipline and structural reallocations.`,
  },
];

/** Generates derivatives directly from an unsaved draft; persistence belongs to the article workflow. */
export const DraftStudio: React.FC<DraftStudioProps> = ({
  language: initialLanguage,
}) => {
  const [headline, setHeadline] = useState('');
  const [lead, setLead] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('NZZ Editorial');
  const [section, setSection] = useState('Wirtschaft');
  const [lang, setLang] = useState<'en' | 'de'>(initialLanguage || 'en');
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-pro' | 'gemini-2.5-flash'>('gemini-2.5-pro');

  const [activeTab, setActiveTab] = useState<'carousel' | 'audio' | 'video' | 'newsletter' | 'charts' | 'faq'>('carousel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingLabel, setGeneratingLabel] = useState('Google Cloud Vertex AI');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [derivatives, setDerivatives] = useState<LiquidDerivativesPayload | null>(null);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setHeadline(preset.headline);
    setLead(preset.lead);
    setBody(preset.body);
    setAuthor(preset.author);
    setSection(preset.section);
    setLang(preset.lang);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setHeadline('');
    setLead('');
    setBody('');
    setErrorMessage(null);
    setDerivatives(null);
  };

  const handleGenerate = async (focusTab?: typeof activeTab) => {
    if (!headline.trim()) {
      setErrorMessage(lang === 'de' ? 'Bitte geben Sie einen Titel ein.' : 'Please enter an article headline.');
      return;
    }

    if (!body.trim() && !lead.trim()) {
      setErrorMessage(lang === 'de' ? 'Bitte fügen Sie den Artikeltext in das Textfeld ein.' : 'Please paste or write your article body text.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    const labelMap: Record<string, string> = {
      audio: lang === 'de' ? 'Generiere 60-Sekunden Audio-Briefing & Cloud TTS...' : 'Generating 60-Second Audio Brief & Cloud TTS...',
      video: lang === 'de' ? 'Entwickle 9:16 Video-Storyboard mit Gemini...' : 'Drafting 9:16 Video Storyboard with Gemini...',
      carousel: lang === 'de' ? 'Generiere redaktionelles Instagram-Karussell...' : 'Synthesizing Editorial Carousel with Gemini...',
      newsletter: lang === 'de' ? 'Formuliere Executive Newsletter...' : 'Drafting Executive Newsletter with Gemini...',
      factbox: lang === 'de' ? 'Extrahiere NZZ-Faktenbox-Kennzahlen...' : 'Extracting Verified Fact Box...',
      faq: lang === 'de' ? 'Analysiere dialektisches FAQ (3 Perspektiven)...' : 'Synthesizing Dialectical FAQ (3 Perspectives)...',
    };
    setGeneratingLabel(focusTab && labelMap[focusTab] ? labelMap[focusTab] : `Calling Google Cloud Vertex AI (${selectedModel})...`);

    try {
      const result = await generateLiquidFormats({
        // Notice: NO articleId passed! Direct synthesis from user draft text!
        headline: headline.trim(),
        lead: lead.trim(),
        body: body.trim() || lead.trim(),
        author: author.trim() || (lang === 'de' ? 'NZZ Redaktion' : 'NZZ Editorial'),
        section: section || 'Wirtschaft',
        language: lang,
        model: selectedModel,
      });

      setDerivatives(result);
      if (focusTab) {
        setActiveTab(focusTab);
      }
    } catch (err: any) {
      console.error('Vertex AI Generation Failure:', err);
      setErrorMessage(err.message || 'Generation failed with an unexpected error from Vertex AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSlide = (updatedSlide: CarouselSlide) => {
    if (!derivatives?.instagramCarousel) return;
    const slides = [...derivatives.instagramCarousel.slides];
    const idx = slides.findIndex((s) => s.slideNumber === updatedSlide.slideNumber);
    if (idx >= 0) {
      slides[idx] = updatedSlide;
      setDerivatives({
        ...derivatives,
        instagramCarousel: {
          ...derivatives.instagramCarousel,
          slides,
        },
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-red-500 font-semibold">
              Live Multimodal Composer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white mt-1">
            {lang === 'de' ? 'Redaktioneller Entwurf & Multimodale Generierung' : 'Live Article Draft & Real-Time Synthesis'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 font-serif mt-1">
            {lang === 'de'
              ? 'Geben Sie einen neuen Artikel ein. Google Cloud Vertex AI transformiert den Text in Echtzeit in alle 6 Medienformate.'
              : 'Paste or type fresh article text. Google Cloud Vertex AI synthesizes it into 6 verified multimodal deliverables.'}
          </p>
        </div>

        {/* Quick Presets Dropdown / Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-stone-400 font-mono">Sample:</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleLoadPreset(p)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 transition-colors"
            >
              {p.title}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-stone-950 hover:bg-red-950/40 text-stone-500 hover:text-red-400 border border-stone-800 transition-colors"
            title="Clear fields"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Draft Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top: Metadata Bar (Author, Section, Language) */}
        <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-950/90 border border-stone-800/80 rounded-xl p-4">
          <div>
            <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              {lang === 'de' ? 'Autor / Byline' : 'Author / Byline'}
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Dr. Beat Gygi"
              className="w-full bg-stone-900 border border-stone-800 focus:border-red-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              {lang === 'de' ? 'Ressort / Rubrik' : 'Section / Desk'}
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 focus:border-red-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="Wirtschaft">Wirtschaft / Economy</option>
              <option value="Technologie">Technologie / Technology</option>
              <option value="International">International / World</option>
              <option value="Finanzen">Finanzen / Finance</option>
              <option value="Wissenschaft">Wissenschaft / Science</option>
              <option value="Feuilleton">Feuilleton / Culture</option>
              <option value="Meinung">Meinung / Opinion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider mb-1.5">
              {lang === 'de' ? 'Sprache' : 'Target Language'}
            </label>
            <div className="flex rounded-lg overflow-hidden border border-stone-800">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  lang === 'en' ? 'bg-red-600 text-white' : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => setLang('de')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  lang === 'de' ? 'bg-red-600 text-white' : 'bg-stone-900 text-stone-400 hover:text-white'
                }`}
              >
                🇩🇪 Deutsch
              </button>
            </div>
          </div>
        </div>

        {/* Headline Input */}
        <div className="lg:col-span-12 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider">
              {lang === 'de' ? 'Titel / Schlagzeile (NZZ-Stil: kein Schlusspunkt)' : 'Headline (NZZ Standard: No Terminal Period)'}
            </label>
            {/[.!?]$/.test(headline.trim()) && (
              <span className="text-[11px] text-amber-400 font-mono">
                ⚠ NZZ Invariant: Headlines must not end with a terminal period.
              </span>
            )}
          </div>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={lang === 'de' ? 'Aussagekräftigen Titel eingeben...' : 'Enter compelling investigative headline...'}
            className="w-full bg-stone-950 border border-stone-800 focus:border-red-600 rounded-xl px-4 py-3 text-lg font-serif font-bold text-white focus:outline-none transition-colors"
          />
        </div>

        {/* Lead Paragraph Input */}
        <div className="lg:col-span-12 space-y-1.5">
          <label className="block text-xs font-mono text-stone-400 uppercase tracking-wider">
            {lang === 'de' ? 'Lead / Vorspann (optional)' : 'Lead / Executive Summary (Optional)'}
          </label>
          <textarea
            rows={2}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            placeholder={lang === 'de' ? 'Fassen Sie die Kernbotschaft in 1-2 prägnanten Sätzen zusammen...' : 'Summarize the core premise in 1-2 dense sentences...'}
            className="w-full bg-stone-950 border border-stone-800 focus:border-red-600 rounded-xl px-4 py-2.5 text-sm font-serif text-stone-200 focus:outline-none transition-colors resize-y"
          />
        </div>

        {/* Body Textarea */}
        <div className="lg:col-span-12 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span className="uppercase tracking-wider">
              {lang === 'de' ? 'Artikelkorpus (Text)' : 'Article Body (Full Text)'}
            </span>
            <div className="flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={lang === 'de' ? 'Fügen Sie hier Ihren vollständigen Recherchetext oder Entwurf ein...' : 'Paste your full investigative draft, report, or analysis here...'}
            className="w-full bg-stone-950 border border-stone-800 focus:border-red-600 rounded-xl p-4 text-sm font-serif leading-relaxed text-stone-100 focus:outline-none transition-colors resize-y font-normal"
          />
        </div>

        {/* Action Buttons Bar */}
        <div className="lg:col-span-12 bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>{lang === 'de' ? 'Multimodale Generierung auslösen' : 'Synthesize Multimodal Deliverables'}</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {lang === 'de'
                ? `Sendet den Text direkt an Google Cloud Vertex AI (${selectedModel}). Keine Scheindaten.`
                : `Calls Google Cloud Vertex AI (${selectedModel}) in real time. Zero local fallbacks.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Model Selector Toggle */}
            <div className="inline-flex rounded-xl bg-stone-950 p-1 border border-stone-800 mr-1">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-2.5-pro')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedModel === 'gemini-2.5-pro'
                    ? 'bg-red-600 text-white shadow-sm font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Gemini 2.5 Pro
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-2.5-flash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedModel === 'gemini-2.5-flash'
                    ? 'bg-red-600 text-white shadow-sm font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Gemini 2.5 Flash
              </button>
            </div>

            {/* Primary Generate All Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/50 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'de' ? 'Alle Formate generieren' : 'Generate All Formats'}</span>
            </button>

            {/* Individual Quick Trigger Buttons */}
            <button
              onClick={() => handleGenerate('carousel')}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>Carousel</span>
            </button>

            <button
              onClick={() => handleGenerate('audio')}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Headphones className="w-3.5 h-3.5 text-red-500" />
              <span>Audio Brief</span>
            </button>

            <button
              onClick={() => handleGenerate('video')}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Video className="w-3.5 h-3.5 text-red-500" />
              <span>Video</span>
            </button>

            <button
              onClick={() => handleGenerate('newsletter')}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span>Newsletter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar Display */}
      {isGenerating && (
        <GenerationProgressBar
          isLoading={true}
          formatName={generatingLabel}
        />
      )}

      {/* Error Feedback Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-sm text-red-200 flex items-start gap-3 shadow-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-red-300">
              {lang === 'de' ? 'Fehler bei der Vertex AI Kommunikation:' : 'Vertex AI Communication Error:'}
            </h4>
            <p className="font-mono text-xs break-words">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {derivatives && (
        <div className="space-y-6 pt-4 border-t border-stone-800 animate-fade-in">
          {/* Provenance Header: Source Badge, Latency, Model ID */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-950 border border-stone-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-sans font-medium text-stone-400">Model Provenance:</span>
              <span
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  derivatives.source === 'vertex-ai'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700'
                    : derivatives.source === 'template'
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-700'
                    : 'bg-blue-950/80 text-blue-400 border border-blue-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{derivatives.source === 'vertex-ai' ? 'Live Vertex AI' : (derivatives.source || 'vertex-ai')}</span>
              </span>

              <span className="text-stone-700">|</span>
              <span className="text-stone-300 font-mono">
                Model: <strong className="text-white">{derivatives.model || selectedModel}</strong>
              </span>

              {derivatives.elapsedMs && (
                <>
                  <span className="text-stone-700">|</span>
                  <span className="text-stone-300 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>{derivatives.elapsedMs.toLocaleString()} ms</span>
                  </span>
                </>
              )}
            </div>

            {/* Generated At */}
            <div className="text-[11px] font-mono text-stone-500">
              Generated: {new Date(derivatives.generatedAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Format Selection Tabs */}
          <div className="flex flex-wrap items-center border-b border-stone-800 gap-1">
            <button
              onClick={() => setActiveTab('carousel')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                activeTab === 'carousel'
                  ? 'border-red-600 text-white bg-stone-900/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4 text-red-500" />
              <span>Instagram Carousel (4:5)</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                activeTab === 'audio'
                  ? 'border-red-600 text-white bg-stone-900/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Headphones className="w-4 h-4 text-red-500" />
              <span>Audio Brief (Cloud TTS)</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                activeTab === 'video'
                  ? 'border-red-600 text-white bg-stone-900/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Video className="w-4 h-4 text-red-500" />
              <span>Vertical Video (9:16)</span>
            </button>

            <button
              onClick={() => setActiveTab('newsletter')}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                activeTab === 'newsletter'
                  ? 'border-red-600 text-white bg-stone-900/50'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mail className="w-4 h-4 text-red-500" />
              <span>Newsletter & FactBox</span>
            </button>

            {derivatives.visualVelocity && derivatives.visualVelocity.charts?.length > 0 && (
              <button
                onClick={() => setActiveTab('charts')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                  activeTab === 'charts'
                    ? 'border-red-600 text-white bg-stone-900/50'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-red-500" />
                <span>Visual Velocity</span>
              </button>
            )}

            {derivatives.dialecticalFaq?.items?.length > 0 && (
              <button
                onClick={() => setActiveTab('faq')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
                  activeTab === 'faq'
                    ? 'border-red-600 text-white bg-stone-900/50'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-red-500" />
                <span>Dialectical FAQ</span>
              </button>
            )}
          </div>

          {/* Active Tab View */}
          <div className="pt-4">
            {/* 1. CAROUSEL */}
            {activeTab === 'carousel' && derivatives.instagramCarousel && (
              <div className="space-y-4">
                <CarouselPreview
                  carousel={derivatives.instagramCarousel}
                  language={lang}
                  onUpdateSlide={handleUpdateSlide}
                />
              </div>
            )}

            {/* 2. AUDIO BRIEF */}
            {activeTab === 'audio' && derivatives.audioBrief && (
              <div className="max-w-2xl mx-auto space-y-6">
                <AudioBriefPlayer
                  audioBrief={derivatives.audioBrief}
                  headline={headline}
                />
                <div className="bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-stone-400">Synthesized Script (Studio Cadence)</h4>
                  <p className="text-sm font-serif text-stone-200 leading-relaxed whitespace-pre-line">
                    {derivatives.audioBrief.script}
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs font-mono text-stone-500 border-t border-stone-800/80">
                    <span>Voice: {derivatives.audioBrief.voiceProfile?.voiceName || 'Neural2'}</span>
                    <span>Words: {derivatives.audioBrief.wordCount}</span>
                    <span>Target: 60 seconds</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. VERTICAL VIDEO STORYBOARD */}
            {activeTab === 'video' && derivatives.socialStoryboard && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-serif font-bold text-white">
                    {derivatives.socialStoryboard.title}
                  </h3>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-stone-900 text-stone-300 border border-stone-800">
                    9:16 Vertical • {derivatives.socialStoryboard.totalDurationSeconds}s
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {derivatives.socialStoryboard.scenes.map((scene) => (
                    <div
                      key={scene.sceneIndex}
                      className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                        <span className="px-1.5 py-0.5 rounded bg-stone-900 text-red-400 font-bold">
                          Scene {scene.sceneIndex}
                        </span>
                        <span>{scene.timeRange}</span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-serif font-bold text-white">
                          {scene.onScreenHeadline}
                        </h4>
                        {scene.prominentMetric && (
                          <div className="p-2 bg-stone-900/80 rounded border border-stone-800 text-xs font-mono text-red-400 font-bold">
                            {scene.prominentMetric}
                          </div>
                        )}
                        <p className="text-xs text-stone-300 leading-relaxed font-sans">
                          {scene.voiceoverText}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-800/80 text-[10px] text-stone-500 font-mono">
                        <span className="block font-semibold text-stone-400">Visual Cue:</span>
                        <span className="line-clamp-2">{scene.visualPrompt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. NEWSLETTER & FACTBOX */}
            {activeTab === 'newsletter' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {derivatives.executiveNewsletter && (
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-mono uppercase text-stone-400 tracking-wider">
                        Executive Brief
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white leading-tight">
                      {derivatives.executiveNewsletter.headline}
                    </h3>
                    <p className="text-sm font-serif text-stone-300 italic border-l-2 border-red-600 pl-3">
                      {derivatives.executiveNewsletter.subhead}
                    </p>
                    <ul className="space-y-2.5 pt-2">
                      {derivatives.executiveNewsletter.bullets?.map((b, i) => (
                        <li key={i} className="text-xs text-stone-200 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {derivatives.factBox && (
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-mono uppercase text-stone-400 tracking-wider">
                        Fact Box (Verified Quantitative Data)
                      </span>
                    </div>
                    <h3 className="text-lg font-serif font-bold text-white">
                      {derivatives.factBox.title}
                    </h3>
                    <div className="space-y-3 pt-2">
                      {derivatives.factBox.metrics?.map((m) => (
                        <div key={m.id} className="p-3 bg-stone-900/60 border border-stone-800 rounded-xl flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-stone-200">{m.metricName}</div>
                            <div className="text-[11px] text-stone-400 mt-0.5">{m.contextNote}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-serif font-bold text-white font-mono">{m.value}</span>
                            {m.delta && (
                              <div className="text-[10px] text-red-400 font-mono">{m.delta}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. VISUAL VELOCITY CHARTS */}
            {activeTab === 'charts' && derivatives.visualVelocity && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {derivatives.visualVelocity.charts?.map((c, idx) => (
                    <div key={idx} className="bg-stone-950 border border-stone-800 rounded-2xl p-6 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-serif font-bold text-white">{c.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-400 uppercase">
                          {c.type}
                        </span>
                      </div>
                      <div className="space-y-2 pt-2">
                        {c.data?.map((d, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs text-stone-300">
                              <span>{d.label}</span>
                              <span className="font-mono font-bold text-white">
                                {d.value} {c.unit || ''}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-600 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.max(8, (d.value / Math.max(...c.data.map((x) => x.value || 1))) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {c.sourceLabel && (
                        <div className="text-[10px] font-mono text-stone-500 border-t border-stone-800/80 pt-2">
                          Source: {c.sourceLabel}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. DIALECTICAL FAQ */}
            {activeTab === 'faq' && derivatives.dialecticalFaq && (
              <div className="max-w-3xl mx-auto space-y-4">
                <h3 className="text-lg font-serif font-bold text-white mb-2">
                  {derivatives.dialecticalFaq.topic}
                </h3>
                {derivatives.dialecticalFaq.items?.map((item, idx) => (
                  <div key={idx} className="bg-stone-950 border border-stone-800 rounded-xl p-5 space-y-2 shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-stone-900 text-red-400 border border-stone-800">
                        {item.perspective.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-serif font-bold text-white pt-1">
                      {item.question}
                    </h4>
                    <p className="text-xs text-stone-300 leading-relaxed font-sans">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
