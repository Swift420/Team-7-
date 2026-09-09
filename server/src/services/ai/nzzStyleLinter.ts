export interface LintOptions {
  isHeadline?: boolean;
  isSubhead?: boolean;
  language?: 'de' | 'en';
}

export interface LintReport {
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: string[];
  warnings: string[];
}

const FORBIDDEN_CLICKBAIT_WORDS = [
  'game-changer',
  'mind-blowing',
  'unbelievable',
  'shocking',
  'crazy',
  'unglaublich',
  'wahnsinn',
  'sensationell',
  'atemberaubend',
  'hammer',
];

const GERMAN_FINITE_VERBS = [
  'ist', 'sind', 'war', 'waren', 'wird', 'werden', 'wurde', 'wurden',
  'hat', 'haben', 'hatte', 'hatten', 'macht', 'machen', 'geht', 'gehen',
  'droht', 'drohen', 'bringt', 'bringen', 'sieht', 'sehen', 'bleibt', 'bleiben',
  'ersetzen', 'ersetzt', 'steigt', 'steigen', 'fällt', 'fallen', 'fordert', 'fordern',
  'warnt', 'warnen', 'steht', 'stehen', 'liegt', 'liegen', 'zahlt', 'zahlen'
];

const ENGLISH_FINITE_VERBS = [
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'does', 'do', 'did',
  'replaces', 'replaces', 'sees', 'makes', 'brings', 'takes'
];

export function lintNZZStyle(text: string, options: LintOptions = {}): LintReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const trimmed = text.trim();

  // 1. Quotation Marks Check: NZZ strictly requires Swiss guillemets « »
  const hasStraightQuotes = /["]/.test(trimmed);
  const hasCurlyQuotes = /[“”]/.test(trimmed);
  if (hasStraightQuotes || hasCurlyQuotes) {
    errors.push('Use Swiss guillemets « » instead of US quotes');
  }

  // 2. Headlines Check
  if (options.isHeadline) {
    // No terminal period
    if (trimmed.endsWith('.')) {
      errors.push('Headlines must not have a terminal period');
    }

    // Capitalize first word after colon
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts.length > 1) {
        const afterColon = parts[1].trim();
        if (afterColon.length > 0 && afterColon[0] !== afterColon[0].toUpperCase()) {
          errors.push('The first word after a colon in a headline must be capitalized');
        }
      }
    }
  }

  // 3. Subheads Check: Sentence case, no terminal period, NO finite verbs (noun/adjective phrases only)
  if (options.isSubhead) {
    if (trimmed.endsWith('.')) {
      errors.push('Subheads must not have a terminal period');
    }

    const words = trimmed.toLowerCase().replace(/[^a-zäöüß\s]/g, '').split(/\s+/);
    const verbList = options.language === 'en' ? ENGLISH_FINITE_VERBS : [...GERMAN_FINITE_VERBS, ...ENGLISH_FINITE_VERBS];

    for (const verb of verbList) {
      if (words.includes(verb)) {
        warnings.push(`Subheads should be noun/adjective phrases without finite verbs (found: "${verb}")`);
        break;
      }
    }
  }

  // 4. Clickbait / Sensationalism Check
  const lower = trimmed.toLowerCase();
  for (const buzzword of FORBIDDEN_CLICKBAIT_WORDS) {
    if (lower.includes(buzzword)) {
      errors.push(`NZZ Voice violation: Avoid sensationalist buzzword "${buzzword}"`);
    }
  }

  return {
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
  };
}
