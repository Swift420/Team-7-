import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { normalizeSection } from '../utils/sectionTranslation';

export type Language = 'en' | 'de';

const TRANSLATIONS = {
  en: {
    // Top Bar & Utility
    'nav.edition': 'International Edition',
    'nav.epaper': 'E-Paper',
    'nav.jobs': 'Jobs',
    'nav.newsletter': 'Newsletter',
    'nav.academy': 'Academy',
    'nav.editorial_status': 'Editorial Desk: Online',
    'nav.switch_language': 'Language Switcher',

    // Masthead
    'nav.menu': 'Menu',
    'nav.home': 'Home',
    'nav.search_placeholder': 'Search NZZ...',
    'nav.search_label': 'Search articles',
    'nav.search_clear': 'Clear search',
    'nav.globe': 'Globe 3D',
    'nav.globe_title': 'Toggle 3D Story Globe',
    'nav.import_article': 'Import',
    'nav.create_article': 'Write',
    'nav.sign_in': 'Sign In',
    'nav.sign_out': 'Sign Out',
    'nav.editor': 'Editor',
    'nav.reader': 'Reader',
    'nav.pro_badge': 'PRO Liquid Journalism',

    // Sections
    'section.all': 'All',
    'section.international': 'International',
    'section.economy': 'Economy',
    'section.switzerland': 'Switzerland',
    'section.culture': 'Culture',
    'section.sports': 'Sports',
    'section.opinion': 'Opinion',
    'section.technology': 'Technology',
    'section.science': 'Science',
    'section.society': 'Society',
    'section.travel': 'Travel',
    'section.mobility': 'Mobility & Automotive',
    'section.finance': 'Finance',
    'section.pro': 'Pro',

    // Homepage Feed
    'feed.latest_reporting': 'Latest Coverage & Analyses',
    'feed.articles_count': 'articles available',
    'feed.article_count_single': 'article available',
    'feed.refresh': 'Refresh',
    'feed.loading': 'Loading articles...',
    'feed.empty': 'No articles found matching your criteria.',
    'feed.more_analyses': 'Key Developing Stories',
    'feed.all_analyses': 'Chronological News Stream',
    'feed.today': 'Today',
    'feed.yesterday': 'Yesterday',
    'feed.min_read': 'min read',
    'feed.bookmark': 'Bookmark article',
    'feed.delete_article': 'Delete article',
    'feed.delete_confirm': 'Are you sure you want to delete article: "{title}"?',

    // Globus Banner & Explorer
    'globe.banner_kicker': 'NZZ PRO · 3D STORY GLOBE',
    'globe.banner_headline': 'Explore Global Reporting in 3D',
    'globe.banner_lead': 'Interactive spatial visualization of international NZZ investigations across 40+ countries.',
    'globe.banner_open': 'Open 3D Globe',
    'globe.banner_close': 'Close 3D Globe',
    'globe.title': 'Global Focal Points in 3D',
    'globe.title_docked': 'Geopolitical Focal Points',
    'globe.description': 'Countries with NZZ reporting are highlighted on the globe. Rotate or click a country to open analyses.',
    'globe.countries': 'Countries',
    'globe.articles': 'Articles',
    'globe.show_connections': 'Show Connections',
    'globe.hide_connections': 'Hide Connections',
    'globe.close': 'Close globe',
    'globe.focus_countries': 'Hotspots in Focus',
    'globe.selected_country': 'Selected Country',
    'globe.reports_for_country': 'NZZ Reports',
    'globe.loading_reports': 'Loading reports…',
    'globe.no_reports': 'No articles found for this country.',
    'globe.open_story': 'Open article →',
    'globe.open_article': 'Open Article',
    'globe.hint': 'Click on a highlighted country on the globe to explore in-depth reporting.',
    'globe.lead': 'Interactive spatial visualization of international NZZ investigations across 40+ countries.',
    'globe.article_single': 'article',
    'globe.shared_reports': 'Shared Reports',
    'globe.general': 'General',
    'globe.no_stories': 'No stories found for this country.',
    'globe.focus_hotspots': 'Hotspots in Focus',

    // Reader & Article Detail
    'detail.back': 'Back to overview',
    'detail.studio': 'Multimodal Studio',
    'detail.publish': 'Publish',
    'detail.published': 'Published',
    'detail.delete': 'Delete',
    'detail.published_at': 'Published on',
    'detail.today': 'Today',
    'detail.original_source': 'Original Source',
    'detail.format_json': 'NZZ Original JSON',
    'detail.format_md': 'Markdown Import',
    'detail.photo_credit': 'Photo: Keystone / NZZ Visual Journalism',
    'detail.loading': 'Loading article…',
    'detail.not_found': 'Article not found.',
    'detail.author_default': 'NZZ Editorial Desk',
    'detail.close_studio': 'Close ✕',

    // Audio Player
    'audio.kicker': 'NZZ AUDIO · 60s BRIEFING',
    'audio.voice_default': 'NZZ Voice',
    'audio.restart': 'Restart from beginning',
    'audio.play': 'Play audio briefing',
    'audio.pause': 'Pause audio',
    'audio.speed': 'Speed',

    // Executive Briefing Card
    'exec.kicker': 'AT A GLANCE · 3 KEY INSIGHTS',
    'exec.meta': 'NZZ Briefing < 90 words',
    'exec.default_subhead': 'Core strategic takeaways from this investigation',

    // Visualizations & Charts
    'visual.existing': 'Existing {tool}',
    'visual.ai_approved': 'AI-assisted · Editor approved',
    'visual.what_shows': 'What this shows:',
    'visual.source': 'Source:',
    'visual.loading': 'Loading existing visualization…',
    'visual.unavailable': 'Existing visualization data unavailable',
    'visual.table_showing': 'Showing 15 of {count} rows',
    'visual.map_note': 'Interactive regional view · hover a region for its value',
    'visual.map_summary': '{count} regions are grouped into {groups} value bands.',
    'visual.preserved': 'The original visualization is preserved with its available data.',

    // Editor Role Banner
    'role.editor_desc': 'Editor permissions active: You can compose, import NZZ articles, and manage visual enhancements.',
    'role.viewer_desc': 'Viewer mode active: Read-only access to NZZ article library. Switch to an Editor account to test composition and import.',
    'role.banner_editor_desc': 'Editor permissions active: You can compose, import NZZ articles, and manage visual enhancements.',
    'role.banner_viewer_desc': 'Viewer mode active: Read-only access to NZZ article library. Switch to an Editor account to test composition and import.',
    'role.switch_editor': 'Switch to Editor Mode',
    'role.staff_accounts': 'Staff Accounts',
    'role.dummy_accounts': 'Demo Profiles',
    'role.import_btn': 'Import Article',
    'role.create_btn': 'Write Article',

    // Auth Modal
    'auth.kicker': 'NZZ EDITORIAL SYSTEM',
    'auth.title': 'Editor Sign In',
    'auth.headline': 'Editor Sign In',
    'auth.sub': 'Access for editorial staff, data journalism, and Multimodal Studio (Gemini 2.5 Flash, Imagen 3 & Cloud TTS).',
    'auth.select_profile': 'Select an editor profile (1-Click Login)',
    'auth.profile_label': 'Select an editor profile (1-Click Login):',
    'auth.or_credentials': 'Or sign in with credentials',
    'auth.username': 'Username',
    'auth.username_placeholder': 'Enter username',
    'auth.password': 'Password',
    'auth.password_placeholder': 'Enter password',
    'auth.cancel': 'Cancel',
    'auth.submit': 'Sign In as Editor',
    'auth.submitting': 'Signing in…',
    'auth.logging_in': 'Signing in…',
    'auth.error': 'Invalid editor username or password.',

    // Create / Import Modal
    'editor.tab_write': 'Compose Article',
    'editor.tab_import': 'Import NZZ Dataset',
    'editor.headline': 'Headline *',
    'editor.headline_placeholder': 'Write headline in NZZ broadsheet style…',
    'editor.lead': 'Lead / Standfirst (optional)',
    'editor.lead_placeholder': 'Introductory paragraph with core thesis…',
    'editor.author': 'Author / Editor (optional)',
    'editor.author_placeholder': 'e.g. Beat Gygi, Zurich',
    'editor.section': 'Section (optional)',
    'editor.section_placeholder': 'Economy, International, Switzerland…',
    'editor.body': 'Article Body (Markdown supported) *',
    'editor.body_placeholder': 'Paste or write full article text here…',
    'editor.lint_check': 'Check NZZ Style',
    'editor.linting': 'Checking style…',
    'editor.lint_valid': 'NZZ Style Guidelines passed (100% Compliant)',
    'editor.lint_warnings': 'NZZ Style Suggestions:',
    'editor.save_draft': 'Save Draft',
    'editor.save_visualize': 'Save & Visualize',
    'editor.saving': 'Saving…',
    'editor.dropzone_title': 'Drop NZZ JSON or Markdown file here, or click to browse',
    'editor.dropzone_hint': 'Supports official NZZ export formats (.json) and structured markdown (.md)',
    'editor.import_action': 'Import Article',
    'editor.importing': 'Importing…',
    'editor.cancel': 'Cancel',
    'editor.import_success': 'Article imported successfully.',
    'editor.import_exists': 'Article already exists in library.',
    'editor.req_error': 'Headline and article body are required.',
    'editor.file_error': 'Select an NZZ JSON or Markdown article file.',

    // Footer
    'footer.title': 'NZZ Pulse • Multimodal & Visual Studio',
    'footer.collab': 'Neue Zürcher Zeitung & Google Cloud Hackathon',
    'footer.active': 'Active:',
    'footer.role_editor': 'Editor',
    'footer.role_reader': 'Reader',
  },
  de: {
    // Top Bar & Utility
    'nav.edition': 'Schweizer Ausgabe',
    'nav.epaper': 'E-Paper',
    'nav.jobs': 'Jobs',
    'nav.newsletter': 'Newsletter',
    'nav.academy': 'Akademie',
    'nav.editorial_status': 'Redaktion: Live online',
    'nav.switch_language': 'Sprachauswahl',

    // Masthead
    'nav.menu': 'Menü',
    'nav.home': 'Startseite',
    'nav.search_placeholder': 'NZZ durchsuchen...',
    'nav.search_label': 'Artikel durchsuchen',
    'nav.search_clear': 'Suche löschen',
    'nav.globe': 'Globus 3D',
    'nav.globe_title': '3D-Story-Globus umschalten',
    'nav.import_article': 'Import',
    'nav.create_article': 'Erstellen',
    'nav.sign_in': 'Anmelden',
    'nav.sign_out': 'Abmelden',
    'nav.editor': 'Redaktor',
    'nav.reader': 'Leser',
    'nav.pro_badge': 'PRO Liquid Journalism',

    // Sections
    'section.all': 'Alle',
    'section.international': 'International',
    'section.economy': 'Wirtschaft',
    'section.switzerland': 'Schweiz',
    'section.culture': 'Feuilleton',
    'section.sports': 'Sport',
    'section.opinion': 'Meinung',
    'section.technology': 'Technologie',
    'section.science': 'Wissenschaft',
    'section.society': 'Gesellschaft',
    'section.travel': 'Reisen',
    'section.mobility': 'Mobilität & Motor',
    'section.finance': 'Finanzen',
    'section.pro': 'Pro',

    // Homepage Feed
    'feed.latest_reporting': 'Aktuelle Berichterstattung & Analysen',
    'feed.articles_count': 'Berichte verfügbar',
    'feed.article_count_single': 'Bericht verfügbar',
    'feed.refresh': 'Aktualisieren',
    'feed.loading': 'Artikel werden geladen...',
    'feed.empty': 'Keine Artikel für die aktuelle Auswahl gefunden.',
    'feed.more_analyses': 'Weitere wichtige Analysen',
    'feed.all_analyses': 'Alle Berichte im Überblick',
    'feed.today': 'Heute',
    'feed.yesterday': 'Gestern',
    'feed.min_read': 'Min. Lesezeit',
    'feed.bookmark': 'Artikel merken',
    'feed.delete_article': 'Artikel löschen',
    'feed.delete_confirm': 'Möchten Sie den Artikel wirklich löschen: "{title}"?',

    // Globus Banner & Explorer
    'globe.banner_kicker': 'NZZ PRO · GLOBUS',
    'globe.banner_headline': 'Globale Berichterstattung in 3D entdecken',
    'globe.banner_lead': 'Interaktive räumliche Visualisierung weltweiter NZZ-Recherchen über 40 Länder hinweg.',
    'globe.banner_open': '3D-Globus einblenden',
    'globe.banner_close': '3D-Globus schliessen',
    'globe.title': 'Globale Brennpunkte im 3D-Globus',
    'globe.title_docked': 'Geopolitische Brennpunkte',
    'globe.description': 'Länder mit NZZ-Berichterstattung sind farblich markiert. Drehen Sie den Globus oder wählen Sie ein Land aus, um Analysen zu öffnen.',
    'globe.countries': 'Länder',
    'globe.articles': 'Artikel',
    'globe.show_connections': 'Verbindungen anzeigen',
    'globe.hide_connections': 'Verbindungen verbergen',
    'globe.close': 'Globus schliessen',
    'globe.focus_countries': 'Brennpunkte im Fokus',
    'globe.selected_country': 'Ausgewähltes Land',
    'globe.reports_for_country': 'NZZ Berichte',
    'globe.loading_reports': 'Lade Berichte…',
    'globe.no_reports': 'Keine Artikel für dieses Land gefunden.',
    'globe.open_story': 'Artikel öffnen →',
    'globe.open_article': 'Artikel öffnen',
    'globe.hint': 'Klicken Sie auf ein markiertes Land auf dem Globus, um vertiefte Recherchen zu lesen.',
    'globe.lead': 'Interaktive räumliche Visualisierung weltweiter NZZ-Recherchen über 40 Länder hinweg.',
    'globe.article_single': 'Artikel',
    'globe.shared_reports': 'Gemeinsame Berichte',
    'globe.general': 'Allgemein',
    'globe.no_stories': 'Keine Berichte für dieses Land verfügbar.',
    'globe.focus_hotspots': 'Brennpunkte im Fokus',

    // Reader & Article Detail
    'detail.back': 'Zurück zur Übersicht',
    'detail.studio': 'Multimodales Studio',
    'detail.publish': 'Veröffentlichen',
    'detail.published': 'Veröffentlicht',
    'detail.delete': 'Löschen',
    'detail.published_at': 'Veröffentlicht am',
    'detail.today': 'Heute',
    'detail.original_source': 'Originalquelle',
    'detail.format_json': 'NZZ Original JSON',
    'detail.format_md': 'Markdown Import',
    'detail.photo_credit': 'Foto: Keystone / NZZ Visual Journalism',
    'detail.loading': 'Artikel wird geladen…',
    'detail.not_found': 'Artikel nicht gefunden.',
    'detail.author_default': 'NZZ Redaktion',
    'detail.close_studio': 'Schliessen ✕',

    // Audio Player
    'audio.kicker': 'NZZ AUDIO · 60s BRIEFING',
    'audio.voice_default': 'NZZ Stimme',
    'audio.restart': 'Von vorne abspielen',
    'audio.play': 'Audio-Briefing abspielen',
    'audio.pause': 'Audio anhalten',
    'audio.speed': 'Geschwindigkeit',

    // Executive Briefing Card
    'exec.kicker': 'AUF EINEN BLICK · 3 KERNPUNKTE',
    'exec.meta': 'NZZ Briefing < 90 Wörter',
    'exec.default_subhead': 'Wesentliche strategische Erkenntnisse dieser Analyse',

    // Visualizations & Charts
    'visual.existing': 'Bestehende Grafik: {tool}',
    'visual.ai_approved': 'KI-assistiert · Von Redaktion freigegeben',
    'visual.what_shows': 'Was diese Grafik zeigt:',
    'visual.source': 'Quelle:',
    'visual.loading': 'Lade bestehende Visualisierung…',
    'visual.unavailable': 'Bestehende Visualisierungsdaten nicht verfügbar',
    'visual.table_showing': 'Zeige 15 von {count} Zeilen',
    'visual.map_note': 'Interaktive regionale Ansicht · Maus über eine Region bewegen für Details',
    'visual.map_summary': '{count} Regionen sind in {groups} Wertegruppen unterteilt.',
    'visual.preserved': 'Die Originalgrafik wurde mit den verfügbaren Daten beibehalten.',

    // Editor Role Banner
    'role.editor_desc': 'Redaktionsrechte aktiv: Sie können Artikel verfassen, importieren und Visualisierungen steuern.',
    'role.viewer_desc': 'Lesermodus aktiv: Lesezugriff auf das NZZ-Archiv. Zu einem Redaktionskonto wechseln, um Import und Bearbeitung zu testen.',
    'role.banner_editor_desc': 'Sie verfügen über volle Redaktionsrechte zum Importieren, Verfassen, Bearbeiten und Erweitern von Artikeln.',
    'role.banner_viewer_desc': 'Sie befinden sich im Lesermodus. Wechseln Sie zu einem Redaktor-Profil, um redaktionelle Workflows zu testen.',
    'role.switch_editor': 'In Redaktionsmodus wechseln',
    'role.staff_accounts': 'Redaktionskonten',
    'role.dummy_accounts': 'Demo-Profile',
    'role.import_btn': 'Artikel importieren',
    'role.create_btn': 'Artikel verfassen',

    // Auth Modal
    'auth.kicker': 'NZZ REDAKTIONSSYSTEM',
    'auth.title': 'Redaktor Anmelden',
    'auth.headline': 'Redaktor Anmelden',
    'auth.sub': 'Zugang für Redaktion, Datenjournalismus und Multimodal Studio (Gemini 2.5 Flash, Imagen 3 & Cloud TTS).',
    'auth.select_profile': 'Redaktor-Profil auswählen (1-Klick Login)',
    'auth.profile_label': 'Redaktor-Profil auswählen (1-Klick Login):',
    'auth.or_credentials': 'Oder mit Zugangsdaten anmelden',
    'auth.username': 'Benutzername',
    'auth.username_placeholder': 'Benutzername eingeben',
    'auth.password': 'Passwort',
    'auth.password_placeholder': 'Passwort eingeben',
    'auth.cancel': 'Abbrechen',
    'auth.submit': 'Als Redaktor anmelden',
    'auth.submitting': 'Wird angemeldet…',
    'auth.logging_in': 'Wird angemeldet…',
    'auth.error': 'Ungültiger Benutzername oder Passwort.',

    // Create / Import Modal
    'editor.tab_write': 'Artikel verfassen',
    'editor.tab_import': 'NZZ-Datensatz importieren',
    'editor.headline': 'Titel / Schlagzeile *',
    'editor.headline_placeholder': 'Schlagzeile im NZZ-Stil verfassen…',
    'editor.lead': 'Lead / Vorspann (optional)',
    'editor.lead_placeholder': 'Einleitender Absatz mit Hauptthese…',
    'editor.author': 'Autor / Redaktor (optional)',
    'editor.author_placeholder': 'z. B. Beat Gygi, Zürich',
    'editor.section': 'Ressort (optional)',
    'editor.section_placeholder': 'Wirtschaft, International, Schweiz…',
    'editor.body': 'Artikeltext (Markdown unterstützt) *',
    'editor.body_placeholder': 'Vollständigen Text hier einfügen oder schreiben…',
    'editor.lint_check': 'NZZ-Stil prüfen',
    'editor.linting': 'Stil wird geprüft…',
    'editor.lint_valid': 'NZZ-Stilrichtlinien erfüllt (100% konform)',
    'editor.lint_warnings': 'NZZ-Stilhinweise:',
    'editor.save_draft': 'Entwurf speichern',
    'editor.save_visualize': 'Speichern & Visualisieren',
    'editor.saving': 'Wird gespeichert…',
    'editor.dropzone_title': 'NZZ-JSON- oder Markdown-Datei hierher ziehen oder klicken',
    'editor.dropzone_hint': 'Unterstützt offizielle NZZ-Exportformate (.json) und strukturiertes Markdown (.md)',
    'editor.import_action': 'Artikel importieren',
    'editor.importing': 'Wird importiert…',
    'editor.cancel': 'Abbrechen',
    'editor.import_success': 'Artikel erfolgreich importiert.',
    'editor.import_exists': 'Artikel existiert bereits im Archiv.',
    'editor.req_error': 'Titel und Artikeltext sind erforderlich.',
    'editor.file_error': 'Wählen Sie eine NZZ-JSON- oder Markdown-Datei aus.',

    // Footer
    'footer.title': 'NZZ Pulse • Multimodales Visual Studio',
    'footer.collab': 'Neue Zürcher Zeitung & Google Cloud Hackathon',
    'footer.active': 'Aktives Konto:',
    'footer.role_editor': 'Redaktor',
    'footer.role_reader': 'Leser',
  },
} as const;

import { LanguageContext } from './LanguageContextValue';

export type TranslationKey = (keyof typeof TRANSLATIONS.en) | (string & {});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always prioritise English by default as requested
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('nzz_language');
      if (saved === 'en' || saved === 'de') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('nzz_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'de' : 'en');
  }, [language, setLanguage]);

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // ignore
    }
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      let text = (dict as Record<string, string>)[key] || (TRANSLATIONS.en as Record<string, string>)[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    },
    [language]
  );

  const formatSection = useCallback(
    (section?: string | null): string => {
      return normalizeSection(section, language);
    },
    [language]
  );

  const formatDate = useCallback(
    (date?: string | Date | null, style: 'short' | 'medium' | 'long' | 'weekday' = 'medium'): string => {
      if (!date) return language === 'de' ? 'Heute' : 'Today';
      const parsed = date instanceof Date ? date : new Date(date);
      if (isNaN(parsed.getTime())) return language === 'de' ? 'Heute' : 'Today';

      const locale = language === 'de' ? 'de-CH' : 'en-GB';

      if (style === 'weekday') {
        return new Intl.DateTimeFormat(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(parsed);
      }

      if (style === 'long') {
        return new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(parsed);
      }

      if (style === 'short') {
        return new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'numeric',
          year: '2-digit',
        }).format(parsed);
      }

      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(parsed);
    },
    [language]
  );

  const formatRelativeDate = useCallback(
    (date?: string | Date | null): string => {
      if (!date) return language === 'de' ? 'Heute' : 'Today';
      const parsed = date instanceof Date ? date : new Date(date);
      if (isNaN(parsed.getTime())) return language === 'de' ? 'Heute' : 'Today';

      const now = new Date();
      const diffMs = now.getTime() - parsed.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) return language === 'de' ? 'Gerade eben' : 'Just now';
      if (diffHours < 24) {
        return language === 'de' ? `vor ${diffHours} Std.` : `${diffHours}h ago`;
      }
      if (diffDays === 1) return language === 'de' ? 'Gestern' : 'Yesterday';
      if (diffDays < 7) {
        return language === 'de' ? `vor ${diffDays} Tagen` : `${diffDays}d ago`;
      }

      return formatDate(date, 'medium');
    },
    [language, formatDate]
  );

  const formatReadTime = useCallback(
    (minutes: number): string => {
      return language === 'de' ? `${minutes} Min. Lesezeit` : `${minutes} min read`;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatSection,
      formatDate,
      formatRelativeDate,
      formatReadTime,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatSection,
      formatDate,
      formatRelativeDate,
      formatReadTime,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
