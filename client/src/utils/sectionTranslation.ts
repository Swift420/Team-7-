export const SECTION_TRANSLATIONS_EN: Record<string, string> = {
  wirtschaft: "Economy",
  finanzen: "Finance",
  technologie: "Technology",
  tech: "Technology",
  "tech & policy": "Technology",
  wissenschaft: "Science",
  sport: "Sports",
  sports: "Sports",
  gesellschaft: "Society",
  feuilleton: "Culture",
  meinung: "Opinion",
  reisen: "Travel",
  mobilität: "Mobility & Automotive",
  "mobilität & motor": "Mobility & Automotive",
  "mobility & automotive": "Mobility & Automotive",
  "nzz am sonntag magazin": "NZZ Magazine",
  "nzz in english": "English Edition",
  international: "International",
  panorama: "Panorama",
  folio: "Folio",
};

export const SECTION_TRANSLATIONS_DE: Record<string, string> = {
  economy: "Wirtschaft",
  finance: "Finanzen",
  technology: "Technologie",
  science: "Wissenschaft",
  sports: "Sport",
  society: "Gesellschaft",
  culture: "Feuilleton",
  opinion: "Meinung",
  travel: "Reisen",
  "mobility & automotive": "Mobilität",
  "english edition": "NZZ in English",
  "nzz magazine": "NZZ am Sonntag Magazin",
  international: "International",
  panorama: "Panorama",
  folio: "Folio",
};

export function normalizeSection(
  section?: string | null,
  targetLang: "en" | "de" = "en",
): string {
  if (!section) return targetLang === "de" ? "NZZ Analyse" : "NZZ Analysis";
  const key = section.toLowerCase().trim();
  if (targetLang === "en") {
    return SECTION_TRANSLATIONS_EN[key] || section;
  }
  return SECTION_TRANSLATIONS_DE[key] || section;
}

export function sectionsMatch(
  sectionA?: string | null,
  sectionB?: string | null,
): boolean {
  if (!sectionA || !sectionB) return false;
  if (sectionA.toLowerCase().trim() === sectionB.toLowerCase().trim())
    return true;
  const normA = normalizeSection(sectionA, "en").toLowerCase();
  const normB = normalizeSection(sectionB, "en").toLowerCase();
  return normA === normB;
}
