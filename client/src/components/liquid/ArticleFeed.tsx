import React, { useState, useEffect } from "react";
import { Search, ArrowRight, Clock, Globe, PenTool } from "lucide-react";
import type { ArticleSummary } from "../../types/liquid";
import { fetchArticles } from "../../services/liquidApi";
import { ArticleComposer } from "./ArticleComposer";

interface ArticleFeedProps {
  language: "en" | "de";
  onLanguageChange: (lang: "en" | "de") => void;
  onSelectArticle: (articleId: string) => void;
}

export const ArticleFeed: React.FC<ArticleFeedProps> = ({
  language,
  onLanguageChange,
  onSelectArticle,
}) => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchArticles(language)
      .then((data) => {
        if (isMounted) {
          setArticles(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load articles:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  const defaultSectionsEn = [
    "ALL",
    "Economy",
    "Technology",
    "World",
    "Science",
    "Culture",
    "Sports",
    "Mobility & Automotive",
  ];
  const defaultSectionsDe = [
    "ALLE",
    "Wirtschaft",
    "Technologie",
    "International",
    "Wissenschaft",
    "Feuilleton",
    "Sport",
    "Mobilität & Automotive",
  ];
  const baseSections =
    language === "de" ? defaultSectionsDe : defaultSectionsEn;

  // Dynamically include any new categories discovered or added
  const discoveredCategories = Array.from(
    new Set(
      articles.map((a) => a.category || a.section).filter(Boolean) as string[],
    ),
  );
  const currentSections = Array.from(
    new Set([...baseSections, ...discoveredCategories]),
  );

  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.lead &&
        art.lead.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.author &&
        art.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.category &&
        art.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.tags &&
        art.tags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    if (!matchesSearch) return false;
    if (selectedSection === "ALL" || selectedSection === "ALLE") return true;

    return (
      (art.category &&
        art.category.toLowerCase() === selectedSection.toLowerCase()) ||
      (art.section &&
        art.section.toLowerCase() === selectedSection.toLowerCase()) ||
      false
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top NZZ Editorial Header */}
      <header className="border-b border-stone-800/80 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-red-600 text-white font-serif font-black text-xs flex items-center justify-center shadow">
                N
              </span>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-red-500 font-semibold">
                Neue Zürcher Zeitung
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
              {language === "de"
                ? "Redaktionelle Dossiers"
                : "Editorial Dossiers"}
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 font-serif">
              {language === "de"
                ? "Wählen Sie einen fundierten Artikel zur multimodalen Weiterverarbeitung."
                : "Select an in-depth analytical investigation to synthesize into multimodal media."}
            </p>
          </div>

          {/* Action & Bilingual Controls */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* New Article Authoring Button */}
            <button
              onClick={() => setIsComposerOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>
                {language === "de" ? "Neuer Artikel" : "Write Article"}
              </span>
            </button>

            {/* Bilingual Language Switcher (Zero bleed) */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-stone-400" />
              <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-1 shadow-inner">
                <button
                  onClick={() => onLanguageChange("en")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === "en"
                      ? "bg-red-600 text-white font-semibold shadow"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => onLanguageChange("de")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    language === "de"
                      ? "bg-red-600 text-white font-semibold shadow"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  Deutsch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {currentSections.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSection === sec
                    ? "bg-stone-200 text-stone-950 font-bold shadow"
                    : "bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "de" ? "Artikel suchen..." : "Search articles..."
              }
              className="w-full pl-9 pr-4 py-1.5 bg-stone-900/90 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Articles Feed */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-stone-400">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-serif italic text-stone-300">
            {language === "de"
              ? "Artikel werden geladen..."
              : "Loading articles..."}
          </span>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center text-stone-500 font-serif">
          {language === "de"
            ? "Keine Artikel für die gewählten Filter gefunden."
            : "No articles match your criteria."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              onClick={() => onSelectArticle(article.id)}
              className="group bg-stone-950/70 hover:bg-stone-900/90 border border-stone-800/80 hover:border-red-600/50 rounded-2xl p-6 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Meta Bar: Section / Category + Status + Reading Time */}
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[11px] font-medium text-stone-300 uppercase tracking-wider">
                      {article.category || article.section}
                    </span>
                    {article.status === "draft" && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/60 text-[10px] font-mono text-amber-400">
                        {language === "de" ? "ENTWURF" : "DRAFT"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-stone-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      {Math.round((article.readingTimeSeconds || 360) / 60)} min
                    </span>
                  </div>
                </div>

                {/* Article Headline in Playfair Serif */}
                <h2 className="text-xl font-serif font-bold text-white group-hover:text-red-400 transition-colors leading-snug">
                  {article.headline}
                </h2>

                {/* Article Lead */}
                {article.lead && (
                  <p className="text-xs text-stone-400 font-sans line-clamp-3 leading-relaxed">
                    {article.lead}
                  </p>
                )}

                {/* Suggested / Associated Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {article.tags.slice(0, 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-mono text-stone-500 hover:text-stone-300 transition-colors"
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-4 border-t border-stone-800/60 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-serif italic line-clamp-1">
                  {article.author}
                </span>

                <div className="flex items-center gap-1 text-red-500 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>{language === "de" ? "Öffnen" : "Synthesize"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Authoring Composer Modal */}
      <ArticleComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        defaultLanguage={language}
        onArticleSaved={(newId) => {
          setIsComposerOpen(false);
          fetchArticles(language).then((data) => setArticles(data));
          onSelectArticle(newId);
        }}
      />
    </div>
  );
};
