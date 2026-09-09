import React, { useState, useRef } from "react";
import {
  X,
  Sparkles,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Clock,
  User,
  Tag,
  CheckCircle2,
  BookmarkPlus,
  HelpCircle,
} from "lucide-react";
import { saveCustomArticle } from "../../services/liquidApi";
import type { ArticleDetail } from "../../types/liquid";

interface ArticleComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleSaved: (articleId: string) => void;
  defaultLanguage?: "en" | "de";
}

interface ArticlePreset {
  id: string;
  nameEn: string;
  nameDe: string;
  sectionEn: string;
  sectionDe: string;
  authorEn: string;
  authorDe: string;
  headlineEn: string;
  headlineDe: string;
  leadEn: string;
  leadDe: string;
  bodyEn: string;
  bodyDe: string;
}

const PRESETS: ArticlePreset[] = [
  {
    id: "defense-procurement",
    nameEn: "🛡️ European Defense Procurement (New)",
    nameDe: "🛡️ Europäische Rüstungsbeschaffung (Neu)",
    sectionEn: "World",
    sectionDe: "International",
    authorEn: "Dr. Beat Gygi",
    authorDe: "Dr. Beat Gygi",
    headlineEn:
      "European Defense Budgets Surge Past €380 Billion Amid NATO Strategic Realignment",
    headlineDe:
      "Europäische Verteidigungsausgaben übersteigen 380 Milliarden Euro im Zuge der Nato-Neuausrichtung",
    leadEn:
      "European member states are radically overhauling military procurement cycles. A structural breakdown of capital allocation reveals unprecedented investment into autonomous drones, layered air defense, and hardened domestic munitions manufacturing.",
    leadDe:
      "Europäische Staaten strukturieren ihre Rüstungsbeschaffung grundlegend um. Eine Analyse der Mittelallokation offenbart historische Investitionen in autonome Drohnen, gestaffelte Flugabwehr und die heimische Munitionsproduktion.",
    bodyEn: `## The Strategic Imperative

Following two decades of underinvestment, European NATO members face an unprecedented fiscal challenge. According to latest data, aggregate European defense expenditure reached €380 billion this year, marking a 14.5% year-on-year increase.

«Verlässliche militärische Abschreckung erfordert nicht nur politische Bekenntnisse, sondern verbindliche Beschaffungsverträge mit der wehrtechnischen Industrie,» explains an institutional defense strategist in Berlin.

## Munitions, Drones, and Production Bottlenecks

The most critical bottleneck lies in industrial manufacturing capacities:
- 155mm artillery shell production has tripled across German and Scandinavian facilities.
- Multi-layered air defense systems (IRIS-T SLM and Patriot) absorb over €42 billion in committed contracts.
- Next-generation sovereign drone swarms are being integrated across frontline tactical units.

## Institutional and Fiscal Trade-offs

The NZZ analysis highlights a decisive economic friction: balancing defense rearmament against strict constitutional debt ceilings. Sovereign defense bonds may bridge temporary liquidity gaps, but long-term readiness demands rigorous prioritization in national budgets.`,
    bodyDe: `## Das strategische Erfordernis

Nach zwei Jahrzehnten unzureichender Investitionen stehen die europäischen Nato-Partner vor einer beispiellosen finanzpolitischen Bewährungsprobe. Aktuellen Erhebungen zufolge beliefen sich die europäischen Verteidigungsausgaben in diesem Jahr auf 380 Milliarden Euro – ein Anstieg von 14,5% im Vergleich zum Vorjahr.

«Verlässliche militärische Abschreckung erfordert nicht nur politische Bekenntnisse, sondern verbindliche Beschaffungsverträge mit der wehrtechnischen Industrie,» betont ein Verteidigungsexperte in Berlin.

## Munition, Drohnensysteme und industrielle Engpässe

Die grössten Herausforderungen betreffen derzeit die industriellen Produktionskapazitäten:
- Die Produktion von 155-mm-Artilleriemunition wurde in Deutschland und Skandinavien verdreifacht.
- Gestaffelte Flugabwehrsysteme (IRIS-T SLM und Patriot) binden mehr als 42 Milliarden Euro an Auftragsvolumen.
- Taktische Drohnenschwärme der nächsten Generation werden nun direkt in die Einsatzdoktrin integriert.

## Ordnungspolitische Zielkonflikte

Die Analyse der NZZ verweist auf einen entscheidenden ordnungspolitischen Zielkonflikt: Die Vereinbarkeit massiver Wehrausgaben mit bestehenden Schuldenbremsen. Rüstungsanleihen können temporäre Lücken schliessen, doch dauerhafte Wehrfähigkeit verlangt konsequente Prioritätensetzung in den nationalen Haushalten.`,
  },
  {
    id: "anthropic-defense-ai",
    nameEn: "🤖 AI Governance & Sovereign Compute (New)",
    nameDe: "🤖 KI-Souveränität & Pentagon-Verträge (Neu)",
    sectionEn: "Technology",
    sectionDe: "Technologie",
    authorEn: "René Höltschi",
    authorDe: "René Höltschi",
    headlineEn:
      "Anthropic Expands Defense Partnerships: Sovereign AI at the Crossroad of Geopolitics",
    headlineDe:
      "Anthropic baut Verteidigungspartnerschaften aus: Souveräne KI am Scheideweg der Geopolitik",
    leadEn:
      "As front-tier AI laboratories partner directly with defense agencies, strict constitutional boundaries between civil research and tactical intelligence deployment are rapidly dissolving.",
    leadDe:
      "Führende KI-Entwickler kooperieren zunehmend mit Sicherheitsbehörden. Die Grenzlinie zwischen ziviler Spitzenforschung und taktischer Verteidigungsanwendung verschiebt sich unwiderruflich.",
    bodyEn: `## The Militarization of Frontier Models

The deployment of generative reasoning engines within tactical military logistics marks a paradigm shift for Silicon Valley. Under new procurement frameworks, Anthropic’s Claude 3.5 architecture is being deployed across classified intelligence environments.

«Sovereign autonomy in artificial intelligence has become as critical as ballistic deterrence or energy security,» notes a senior policy researcher in Zurich.

## Key Empirical Metrics
- €12.8 billion in total annual compute investments allocated toward sovereign defense clusters.
- Over 99.4% precision benchmarks in multi-sensor battlefield telemetry reconciliation.
- Multi-agency oversight committees established to enforce constitutional alignment standards.

## Institutional Safeguards

The NZZ assessment underlines the delicate balance between rapid operational superiority and algorithmic auditability. Transparent rules of engagement and human-in-the-loop validation remain indispensable cornerstones of liberal democratic governance.`,
    bodyDe: `## Die Militarisierung von Spitzenmodellen

Der Einsatz generativer Sprach- und Reasoning-Modelle in militärischen Führungsstäben markiert einen tiefgreifenden Wandel. Im Rahmen neuer Beschaffungsrichtlinien wird Anthropics Modellarchitektur Claude 3.5 für vertrauliche Sicherheitsanalysen freigegeben.

«Digitale Souveränität in der künstlichen Intelligenz ist heute ebenso sicherheitsrelevant wie konventionelle Abschreckung oder die Energiesicherheit,» konstatiert ein Zürcher Sicherheitsexperte.

## Relevante Kennzahlen
- 12,8 Milliarden Euro Jahresinvestitionen in geschützte staatliche Rechenzentren.
- Über 99,4% Zuverlässigkeit bei der Zusammenführung komplexer Lagebilder.
- Parlamentarische Kontrollgremien zur Einhaltung verfassungsrechtlicher Grundsätze.

## Ordnungspolitische Einordnung

Die NZZ betont die Notwendigkeit robuster Kontrollmechanismen. Verlässliche ethische Richtlinien und das Prinzip des «Human-in-the-loop» müssen die Grundpfeiler liberaler Gesellschaften bleiben, auch bei fortschreitender Automatisierung.`,
  },
  {
    id: "commercial-space-logistics",
    nameEn: "🪐 Commercial Space & Orbital Supply Chains (New)",
    nameDe: "🪐 Kommerzielle Raumfahrt & Mondlogistik (Neu)",
    sectionEn: "Science",
    sectionDe: "Wissenschaft",
    authorEn: "Dr. Katharina Fontana",
    authorDe: "Dr. Katharina Fontana",
    headlineEn:
      "Commercial Space Stations and Lunar Supply Chains Reorder Global Aerospace Economics",
    headlineDe:
      "Kommerzielle Raumstationen und Mond-Versorgungslinien verändern die Raumfahrtökonomie",
    leadEn:
      "The retirement of the International Space Station ushers in an era of private orbital hubs and sovereign lunar infrastructure, driving private space investment to a record €65 billion.",
    leadDe:
      "Mit dem bevorstehenden Ende der ISS bricht das Zeitalter privater Raumstationen an. Investitionen in orbitale Infrastruktur und Mondmissionen erreichen ein Rekordvolumen von 65 Milliarden Euro.",
    bodyEn: `## Orbital Economics After the ISS

With the decommissioning of the ISS planned for 2030, space agencies are transitioning into commercial service customers. Private orbital facilities developed by Axiom and Voyager Space are establishing new benchmarks for microgravity research and orbital manufacturing.

«The low Earth orbit is no longer an experimental outpost, but an expanding commercial industrial zone,» explains an aerospace economist at ETH Zurich.

## Critical Benchmarks
- €65 billion in cumulative private venture capital deployed across launch vehicles and satellite constellations.
- Launch costs reduced to under $1,200 per kilogram to low Earth orbit.
- Over 45 planned lunar surface logistics missions scheduled through 2029.

## Regulatory and Geopolitical Implications

The commercialization of orbital space raises pressing questions of space traffic management and property rights under the Artemis Accords. Switzerland and its European partners must secure independent launch access while championing open, rules-based international space treaties.`,
    bodyDe: `## Die Ökonomie der erdnahen Umlaufbahn

Vor dem Hintergrund der für 2030 geplanten Stilllegung der ISS transformieren sich staatliche Weltraumagenturen zu kommerziellen Auftraggebern. Private Stationen von Anbietern wie Axiom oder Voyager Space definieren neue Standards für Schwerelosigkeitsforschung.

«Der erdnahe Orbit ist kein rein wissenschaftlicher Aussenposten mehr, sondern wird zu einer dynamischen Industriezone,» erklärt ein Raumfahrtökonom der ETH Zürich.

## Wesentliche Eckdaten
- 65 Milliarden Euro privates Risikokapital flossen in Trägersysteme und Satellitenflotten.
- Startkosten auf unter 1200 Dollar pro Kilogramm Nutzlast gesenkt.
- Mehr als 45 geplante Mondlogistik-Missionen bis zum Jahr 2029.

## Ordnungspolitischer Rahmen

Die verstärkte Privatisierung verlangt klare Regeln für das Verkehrsmanagement im Orbit und die Nutzung von Weltraumressourcen. Für die Schweiz und europäische Partner gilt es, verlässliche Kooperationsstrukturen zu schaffen und marktwirtschaftliche Anreize mit völkerrechtlicher Ordnung zu verbinden.`,
  },
  {
    id: "porsche-911-gt3-rs-review",
    nameEn:
      "🏎️ Automotive Review: Porsche 911 GT3 RS on Sustenpass (New Category)",
    nameDe:
      "🏎️ Fahrbericht: Porsche 911 GT3 RS auf dem Sustenpass (Neue Kategorie)",
    sectionEn: "Mobility & Automotive",
    sectionDe: "Mobilität & Automotive",
    authorEn: "Christian Eichberger",
    authorDe: "Christian Eichberger",
    headlineEn:
      "Porsche 911 GT3 RS: Aerodynamic Extremism and Mechanical Purity on the Sustenpass",
    headlineDe:
      "Porsche 911 GT3 RS: Aerodynamischer Grenzbereich und mechanische Reinheit am Sustenpass",
    leadEn:
      "With 525 horsepower, active DRS wing architecture, and 860 kilograms of downforce, the GT3 RS transforms the high alpine Sustenpass into an uncompromised masterclass of German motorsport engineering.",
    leadDe:
      "Mit 525 PS, aktivem DRS-Flügelwerk und 860 Kilogramm Anpressdruck verwandelt der GT3 RS den Sustenpass in ein kompromissloses Lehrstück deutscher Ingenieurskunst.",
    bodyEn: `## Atmospheric High RPM and Alpine Elevation

At 2,224 meters above sea level, thin alpine air chokes forced-induction engines, but the 4.0-liter naturally aspirated flat-six in the 911 GT3 RS screams with unfiltered clarity up to its 9,000 RPM redline. Developing 525 horsepower without turbos, its mechanical throttle response on the ascent from Innertkirchen provides millimetric traction control across damp asphalt switchbacks.

«This is not a touring vehicle disguised as a racer. It is a homologated motorsport chassis engineered specifically for high-speed lateral compression,» explains Porsche motorsport director Andreas Preuninger.

## Dynamic Aerodynamics and Chassis Telemetry

The defining leap in this generation lies in Formula 1-derived active aerodynamics:
- Active front diffusers and a two-tier rear carbon wing generate 860 kg of downforce at 285 km/h.
- Steering wheel rotary dials allow independent adjustment of front and rear rebound and compression damping across four stages.
- Electronically controlled differential lock can be fine-tuned mid-corner to manipulate vehicle yaw on tight alpine hairpins.

## The NZZ Verdict: Mechanical Sovereignty in an Electric Era

In an automotive landscape increasingly dominated by heavy, sanitized electric luxury barges, the GT3 RS represents an unapologetic monument to analogue mechanical precision. Its lightweight carbon construction (1,450 kg DIN) and carbon-ceramic brakes deliver deceleration forces that demand physical resilience. It is an uncompromising triumph of specialized German mechanical engineering.`,
    bodyDe: `## Saugmotor-Furor auf 2224 Metern Höhe

Auf 2224 Metern über dem Meeresspiegel wird die Luft dünn, doch der 4,0-Liter-Sechszylinder-Boxer des 911 GT3 RS dreht unbeeindruckt bis auf 9000 Umdrehungen pro Minute. Mit 525 PS ohne Turboaufladung folgt das Aggregat am Sustenpass jedem Millimeter Gaspedalweg mit einer Spontaneität, die modernen Turbomotoren fremd ist.

«Dieses Auto ist kein verkappter Gran Turismo, sondern ein lupenreines Rennsportgerät mit Strassenzulassung,» bringt es Andreas Preuninger, Leiter der GT-Fahrzeuge bei Porsche, auf den Punkt.

## Aktive Aerodynamik und Fahrwerkstelemetrie

Der technologische Quantensprung dieses Modells manifestiert sich in der Aerodynamik:
- Aktive Frontdiffusoren und ein gewaltiger Schwanenhals-Heckflügel erzeugen 860 Kilogramm Abtrieb bei 285 km/h.
- Vier Drehschalter am Alcantara-Lenkrad ermöglichen die getrennte Justierung von Zug- und Druckstufe der Stossdämpfer in Echtzeit.
- Die elektronische Differenzialsperre lässt sich für Kurvenein- und -ausgang vom Cockpit aus kalibrieren.

## Das NZZ-Urteil: Ein mechanisches Denkmal

In einer automobilen Gegenwart, die von batterieelektrischen Schwergewichten geprägt wird, setzt der GT3 RS ein unmissverständliches Zeichen für den puristischen Leichtbau (1450 kg) und die mechanische Rückmeldung. Die Carbon-Keramik-Bremsanlage verzögert mit unerbittlicher Härte. Ein Faszinosum deutscher Ingenieurskunst, das in keine herkömmliche Schablone passt.`,
  },
];

export const ArticleComposer: React.FC<ArticleComposerProps> = ({
  isOpen,
  onClose,
  onArticleSaved,
  defaultLanguage = "en",
}) => {
  const [lang, setLang] = useState<"en" | "de">(defaultLanguage);
  const [headline, setHeadline] = useState("");
  const [lead, setLead] = useState("");
  const [body, setBody] = useState("");
  const [section, setSection] = useState("Economy");
  const [author, setAuthor] = useState("NZZ Redaktion");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const isGerman = lang === "de";

  const sectionsEn = [
    "Economy",
    "Technology",
    "World",
    "Science",
    "Culture",
    "Sports",
    "Opinion",
  ];
  const sectionsDe = [
    "Wirtschaft",
    "Technologie",
    "International",
    "Wissenschaft",
    "Feuilleton",
    "Sport",
    "Meinung",
  ];
  const activeSections = isGerman ? sectionsDe : sectionsEn;

  // Word count & reading time calculation
  const totalWords = (body + " " + lead)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const calculatedReadingTime = Math.max(1, Math.round(totalWords / 200));

  // Rich Text Insertion Helper
  const insertFormatting = (
    prefix: string,
    suffix: string = "",
    defaultPlaceholder: string = "",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newBody =
      body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    }, 0);
  };

  const handleApplyPreset = (preset: ArticlePreset) => {
    if (isGerman) {
      setHeadline(preset.headlineDe);
      setLead(preset.leadDe);
      setBody(preset.bodyDe);
      setSection(preset.sectionDe);
      setAuthor(preset.authorDe);
    } else {
      setHeadline(preset.headlineEn);
      setLead(preset.leadEn);
      setBody(preset.bodyEn);
      setSection(preset.sectionEn);
      setAuthor(preset.authorEn);
    }
    setStatusMessage(
      isGerman
        ? `Vorlage «${preset.nameDe}» eingefügt.`
        : `Loaded draft «${preset.nameEn}».`,
    );
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLanguageSwitch = (newLang: "en" | "de") => {
    setLang(newLang);
    setSection(newLang === "de" ? "Wirtschaft" : "Economy");
  };

  const handleSaveAndGenerate = () => {
    const cleanHeadline = headline.trim();
    if (!cleanHeadline) {
      alert(
        isGerman
          ? "Bitte geben Sie einen Titel ein."
          : "Please enter an article headline.",
      );
      return;
    }

    const cleanLead = lead.trim();
    const cleanBody = body.trim();
    if (cleanLead.length < 20 && cleanBody.length < 50) {
      alert(
        isGerman
          ? "Bitte verfassen Sie mindestens 2-3 Sätze im Textkorpus."
          : "Please write at least 2-3 sentences in the article body.",
      );
      return;
    }

    const newArticleId = `custom-${Date.now()}`;
    const newArticle: ArticleDetail = {
      id: newArticleId,
      headline: cleanHeadline,
      lead: cleanLead,
      body: cleanBody || cleanLead,
      author: author.trim() || (isGerman ? "NZZ Redaktion" : "NZZ Editorial"),
      section: section,
      wordCount: totalWords || 350,
      language: lang,
    };

    saveCustomArticle(newArticle);
    onArticleSaved(newArticleId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-stone-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-red-600 text-white font-serif font-black text-sm flex items-center justify-center shadow">
              N
            </span>
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                {isGerman
                  ? "Neuen NZZ-Artikel verfassen"
                  : "Compose New NZZ Article"}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/60 uppercase">
                  Real-Time Synthesis
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                {isGerman
                  ? "Verfassen Sie Ihren Text mit Schweizer Typografie. Alle 6 multimodalen Formate passen sich dem Inhalt an."
                  : "Write your investigative piece. Artifacts and Instagram carousels will synthesize directly from this text."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleLanguageSwitch("en")}
                className={`px-2.5 py-1 rounded transition-all ${
                  lang === "en"
                    ? "bg-red-600 text-white font-semibold shadow"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageSwitch("de")}
                className={`px-2.5 py-1 rounded transition-all ${
                  lang === "de"
                    ? "bg-red-600 text-white font-semibold shadow"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                🇩🇪 DE
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Form */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Quick-Fill Presets Bar */}
          <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-stone-300 font-medium">
              <BookmarkPlus className="w-4 h-4 text-red-500" />
              <span>
                {isGerman
                  ? "Schnell-Vorlagen für Sofort-Test:"
                  : "Instant Test Presets:"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-all text-[11px]"
                >
                  {isGerman ? p.nameDe : p.nameEn}
                </button>
              ))}
            </div>
          </div>

          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-red-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Metadata Row: Rubric, Author, Reading Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Section / Rubrik */}
            <div>
              <label className="text-[11px] uppercase font-bold text-stone-400 flex items-center gap-1.5 mb-1">
                <Tag className="w-3.5 h-3.5 text-stone-500" />
                {isGerman ? "Rubrik" : "Section"}
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-red-600 text-xs"
              >
                {activeSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Author / Autor */}
            <div>
              <label className="text-[11px] uppercase font-bold text-stone-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-stone-500" />
                {isGerman ? "Autor / Byline" : "Author / Byline"}
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={
                  isGerman ? "z. B. Beat Gygi" : "e.g. René Höltschi"
                }
                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-red-600 text-xs"
              />
            </div>

            {/* Reading stats */}
            <div>
              <label className="text-[11px] uppercase font-bold text-stone-400 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                {isGerman ? "Lesezeit & Umfang" : "Reading Time & Volume"}
              </label>
              <div className="w-full bg-stone-900/60 border border-stone-800 rounded-lg px-3 py-2 text-stone-400 flex items-center justify-between text-xs font-mono">
                <span>~{calculatedReadingTime} min read</span>
                <span className="text-stone-300 font-bold">
                  {totalWords} {isGerman ? "Wörter" : "words"}
                </span>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-stone-400 flex items-center justify-between">
              <span>
                {isGerman ? "Titel / Schlagzeile" : "Article Headline"}
              </span>
              <span className="text-stone-500 text-[10px] lowercase">
                NZZ font-serif style
              </span>
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={
                isGerman
                  ? "Geben Sie den Haupttitel des Artikels ein..."
                  : "Enter the in-depth investigative headline..."
              }
              className="w-full bg-stone-900/80 border border-stone-800 rounded-lg px-4 py-3 text-base sm:text-lg font-serif font-bold text-white focus:outline-none focus:border-red-600 placeholder-stone-600"
            />
          </div>

          {/* Lead / Vorspann */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold text-stone-400 flex items-center justify-between">
              <span>
                {isGerman
                  ? "Vorspann / Lead (1–3 Sätze)"
                  : "Lead Paragraph (1–3 Sentences)"}
              </span>
              <span className="text-stone-500 text-[10px]">
                analytical summary
              </span>
            </label>
            <textarea
              rows={2}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder={
                isGerman
                  ? "Fassen Sie die Kernanalyse prägnant zusammen..."
                  : "Synthesize the essential premise and analytical stake..."
              }
              className="w-full bg-stone-900/80 border border-stone-800 rounded-lg px-3 py-2 text-xs font-serif italic text-stone-300 focus:outline-none focus:border-red-600 placeholder-stone-600 leading-relaxed"
            />
          </div>

          {/* Body Content with Rich-Text Formatting Toolbar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase font-bold text-stone-400">
                {isGerman ? "Haupttext & Textkorpus" : "Full Article Body"}
              </label>

              {/* Toolbar Buttons */}
              <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg p-1 text-stone-400">
                <button
                  type="button"
                  onClick={() => insertFormatting("**", "**", "fett")}
                  title="Bold (**text**)"
                  className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("*", "*", "kursiv")}
                  title="Italic (*text*)"
                  className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-stone-800 mx-0.5" />
                <button
                  type="button"
                  onClick={() =>
                    insertFormatting("## ", "\n", "Zwischenüberschrift")
                  }
                  title="Heading 2 (## Headline)"
                  className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertFormatting("### ", "\n", "Detail-Überschrift")
                  }
                  title="Heading 3 (### Subhead)"
                  className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-stone-800 mx-0.5" />
                <button
                  type="button"
                  onClick={() => insertFormatting("«", "»", "Schweizer Zitat")}
                  title="Swiss Guillemets («...»)"
                  className="p-1 hover:text-red-400 hover:bg-stone-800 rounded font-serif font-bold text-xs px-1"
                >
                  « »
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("- ", "\n", "Listenpunkt")}
                  title="Bullet List (- item)"
                  className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertFormatting("1. ", "\n", "Nummerierter Punkt")
                  }
                  title="Numbered List (1. item)"
                  className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-stone-800 mx-0.5" />
                <button
                  type="button"
                  onClick={() => insertFormatting("**[", " Mrd. €]**", "14,5")}
                  title="Metric Callout (**[14,5 Mrd. €]**)"
                  className="px-1.5 py-0.5 hover:text-white hover:bg-stone-800 rounded text-[10px] font-mono font-bold text-red-400"
                >
                  % / €
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                isGerman
                  ? "Geben Sie den vollständigen Artikeltext ein. Nutzen Sie die Formatierungsleiste oben für Zwischenüberschriften (##), Aufzählungen (-) und Schweizer Guillemets («...»)..."
                  : "Enter the complete article body. Use the toolbar above for section headings (##), bullet points (-), and Swiss quotes («...»)..."
              }
              className="w-full bg-stone-900/80 border border-stone-800 rounded-lg p-3 text-xs font-serif text-stone-200 leading-relaxed focus:outline-none focus:border-red-600 placeholder-stone-600"
            />
          </div>

          <div className="p-3 bg-stone-900/40 border border-stone-800/60 rounded-xl text-[11px] text-stone-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-stone-500 shrink-0" />
            <span>
              {isGerman
                ? "NZZ-Stil-Hinweis: Die Generierungsmodelle werten Metriken (z. B. «380 Mrd. €») und Zitate («...») automatisch für das Instagram-Karussell (Stil A) und die Faktenbox aus."
                : 'NZZ Style Guideline: The multimodal engine automatically isolates metrics (e.g. "€380 billion") and quotes («...») into Style A Instagram carousels and fact boxes.'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition-colors text-xs font-medium"
          >
            {isGerman ? "Abbrechen" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleSaveAndGenerate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isGerman
                ? "Artikel speichern & Im Studio öffnen"
                : "Save & Open in Studio"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
