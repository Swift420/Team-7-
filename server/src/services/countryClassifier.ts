import { ArticleRecord } from '../types/article.js';

interface CountryRule { code: string; name: string; aliases: string[] }

export const countryRules: CountryRule[] = [
  { code: 'US', name: 'United States', aliases: ['united states', 'u.s.', 'usa', 'american', 'americans', 'washington'] },
  { code: 'CA', name: 'Canada', aliases: ['canada', 'canadian'] },
  { code: 'PL', name: 'Poland', aliases: ['poland', 'polish'] },
  { code: 'IN', name: 'India', aliases: ['india', 'indian'] },
  { code: 'SL', name: 'Sierra Leone', aliases: ['sierra leone', 'sierraleonean'] },
  { code: 'NL', name: 'Netherlands', aliases: ['netherlands', 'dutch', 'holland'] },
  { code: 'BE', name: 'Belgium', aliases: ['belgium', 'belgian', 'antwerp', 'brussels'] },
  { code: 'DE', name: 'Germany', aliases: ['germany', 'german', 'berlin'] },
  { code: 'CH', name: 'Switzerland', aliases: ['switzerland', 'swiss', 'zurich', 'bern'] },
  { code: 'CN', name: 'China', aliases: ['china', 'chinese', 'beijing'] },
  { code: 'IR', name: 'Iran', aliases: ['iran', 'iranian', 'tehran'] },
  { code: 'KW', name: 'Kuwait', aliases: ['kuwait', 'kuwaiti'] },
  { code: 'GB', name: 'United Kingdom', aliases: ['united kingdom', 'britain', 'british', 'england', 'london'] },
  { code: 'FR', name: 'France', aliases: ['france', 'french', 'paris'] },
  { code: 'ES', name: 'Spain', aliases: ['spain', 'spanish', 'madrid'] },
  { code: 'IT', name: 'Italy', aliases: ['italy', 'italian', 'rome'] },
  { code: 'UA', name: 'Ukraine', aliases: ['ukraine', 'ukrainian', 'kyiv'] },
  { code: 'RU', name: 'Russia', aliases: ['russia', 'russian', 'moscow'] },
  { code: 'ZA', name: 'South Africa', aliases: ['south africa', 'south african'] },
  { code: 'NG', name: 'Nigeria', aliases: ['nigeria', 'nigerian'] },
  { code: 'KE', name: 'Kenya', aliases: ['kenya', 'kenyan'] },
  { code: 'TZ', name: 'Tanzania', aliases: ['tanzania', 'tanzanian', 'dar es salaam'] },
  { code: 'UG', name: 'Uganda', aliases: ['uganda', 'ugandan', 'kampala'] },
  { code: 'RW', name: 'Rwanda', aliases: ['rwanda', 'rwandan', 'kigali'] },
  { code: 'ET', name: 'Ethiopia', aliases: ['ethiopia', 'ethiopian', 'addis ababa'] },
  { code: 'GH', name: 'Ghana', aliases: ['ghana', 'ghanaian', 'accra'] },
  { code: 'SN', name: 'Senegal', aliases: ['senegal', 'senegalese', 'dakar'] },
  { code: 'CM', name: 'Cameroon', aliases: ['cameroon', 'cameroonian'] },
  { code: 'CD', name: 'Democratic Republic of the Congo', aliases: ['democratic republic of the congo', 'drc', 'congolese'] },
  { code: 'ZM', name: 'Zambia', aliases: ['zambia', 'zambian', 'lusaka'] },
  { code: 'ZW', name: 'Zimbabwe', aliases: ['zimbabwe', 'zimbabwean', 'harare'] },
  { code: 'AU', name: 'Australia', aliases: ['australia', 'australian'] },
  { code: 'JP', name: 'Japan', aliases: ['japan', 'japanese', 'tokyo'] },
  { code: 'BR', name: 'Brazil', aliases: ['brazil', 'brazilian'] },
  { code: 'MX', name: 'Mexico', aliases: ['mexico', 'mexican'] },
];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function classifyArticleCountries(article: ArticleRecord) {
  const headlineLead = `${article.headline} ${article.lead || ''}`.toLowerCase();
  const body = article.body.map((element) => element.text || '').join(' ').toLowerCase();
  const fullText = `${headlineLead} ${body}`;
  return countryRules.flatMap((rule) => {
    const mentions = rule.aliases.reduce((total, alias) => total + (fullText.match(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'gi')) || []).length, 0);
    const headlineMentions = rule.aliases.reduce((total, alias) => total + (headlineLead.match(new RegExp(`\\b${escapeRegex(alias)}\\b`, 'gi')) || []).length, 0);
    if (!headlineMentions && mentions < 2) return [];
    const relevance = Math.min(1, headlineMentions * 0.45 + Math.min(mentions, 6) * 0.08);
    return [{ code: rule.code, name: rule.name, relevance, confidence: Math.min(0.98, 0.55 + relevance * 0.4), evidence: [`${mentions} meaningful text mention${mentions === 1 ? '' : 's'}`, ...(headlineMentions ? ['headline or lead mention'] : [])] }];
  });
}
