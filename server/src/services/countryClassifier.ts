import { ArticleRecord } from "../types/article.js";

interface CountryRule {
  code: string;
  name: string;
  aliases: string[];
}

// Rules intentionally require meaningful repetition or a headline/lead mention to avoid noisy map coverage.
const baseCountryRules: CountryRule[] = [
  {
    code: "US",
    name: "United States",
    aliases: [
      "united states",
      "u.s.",
      "usa",
      "american",
      "americans",
      "washington",
    ],
  },
  { code: "CA", name: "Canada", aliases: ["canada", "canadian"] },
  { code: "PL", name: "Poland", aliases: ["poland", "polish"] },
  { code: "IN", name: "India", aliases: ["india", "indian"] },
  {
    code: "SL",
    name: "Sierra Leone",
    aliases: ["sierra leone", "sierraleonean"],
  },
  {
    code: "NL",
    name: "Netherlands",
    aliases: ["netherlands", "dutch", "holland"],
  },
  {
    code: "BE",
    name: "Belgium",
    aliases: ["belgium", "belgian", "antwerp", "brussels"],
  },
  { code: "DE", name: "Germany", aliases: ["germany", "german", "berlin"] },
  {
    code: "CH",
    name: "Switzerland",
    aliases: ["switzerland", "swiss", "zurich", "bern"],
  },
  { code: "CN", name: "China", aliases: ["china", "chinese", "beijing"] },
  { code: "IR", name: "Iran", aliases: ["iran", "iranian", "tehran"] },
  { code: "KW", name: "Kuwait", aliases: ["kuwait", "kuwaiti"] },
  {
    code: "GB",
    name: "United Kingdom",
    aliases: ["united kingdom", "britain", "british", "england", "london"],
  },
  { code: "FR", name: "France", aliases: ["france", "french", "paris"] },
  { code: "ES", name: "Spain", aliases: ["spain", "spanish", "madrid"] },
  { code: "IT", name: "Italy", aliases: ["italy", "italian", "rome"] },
  { code: "UA", name: "Ukraine", aliases: ["ukraine", "ukrainian", "kyiv"] },
  { code: "RU", name: "Russia", aliases: ["russia", "russian", "moscow"] },
  {
    code: "ZA",
    name: "South Africa",
    aliases: ["south africa", "south african"],
  },
  { code: "NG", name: "Nigeria", aliases: ["nigeria", "nigerian"] },
  { code: "KE", name: "Kenya", aliases: ["kenya", "kenyan"] },
  {
    code: "TZ",
    name: "Tanzania",
    aliases: ["tanzania", "tanzanian", "dar es salaam"],
  },
  { code: "UG", name: "Uganda", aliases: ["uganda", "ugandan", "kampala"] },
  { code: "RW", name: "Rwanda", aliases: ["rwanda", "rwandan", "kigali"] },
  {
    code: "ET",
    name: "Ethiopia",
    aliases: ["ethiopia", "ethiopian", "addis ababa"],
  },
  { code: "GH", name: "Ghana", aliases: ["ghana", "ghanaian", "accra"] },
  { code: "SN", name: "Senegal", aliases: ["senegal", "senegalese", "dakar"] },
  { code: "CM", name: "Cameroon", aliases: ["cameroon", "cameroonian"] },
  {
    code: "CD",
    name: "Democratic Republic of the Congo",
    aliases: ["democratic republic of the congo", "drc", "congolese"],
  },
  { code: "ZM", name: "Zambia", aliases: ["zambia", "zambian", "lusaka"] },
  {
    code: "ZW",
    name: "Zimbabwe",
    aliases: ["zimbabwe", "zimbabwean", "harare"],
  },
  { code: "NA", name: "Namibia", aliases: ["namibia", "namibian", "windhoek"] },
  { code: "AU", name: "Australia", aliases: ["australia", "australian"] },
  { code: "JP", name: "Japan", aliases: ["japan", "japanese", "tokyo"] },
  { code: "BR", name: "Brazil", aliases: ["brazil", "brazilian"] },
  { code: "MX", name: "Mexico", aliases: ["mexico", "mexican"] },
];

// Complete ISO-style country coverage for articles that mention countries not
// represented by the editorial alias rules above. The base rules remain first
// so their richer city/demonym aliases and scoring continue to apply.
const additionalCountries = [
  ["AF", "Afghanistan"],
  ["AL", "Albania"],
  ["DZ", "Algeria"],
  ["AD", "Andorra"],
  ["AO", "Angola"],
  ["AG", "Antigua and Barbuda"],
  ["AR", "Argentina"],
  ["AM", "Armenia"],
  ["AT", "Austria"],
  ["AZ", "Azerbaijan"],
  ["BS", "Bahamas"],
  ["BH", "Bahrain"],
  ["BD", "Bangladesh"],
  ["BB", "Barbados"],
  ["BY", "Belarus"],
  ["BZ", "Belize"],
  ["BJ", "Benin"],
  ["BT", "Bhutan"],
  ["BO", "Bolivia"],
  ["BA", "Bosnia and Herzegovina"],
  ["BW", "Botswana"],
  ["BR", "Brazil"],
  ["BN", "Brunei"],
  ["BG", "Bulgaria"],
  ["BF", "Burkina Faso"],
  ["BI", "Burundi"],
  ["CV", "Cabo Verde"],
  ["KH", "Cambodia"],
  ["CM", "Cameroon"],
  ["CF", "Central African Republic"],
  ["TD", "Chad"],
  ["CL", "Chile"],
  ["CO", "Colombia"],
  ["KM", "Comoros"],
  ["CG", "Republic of the Congo"],
  ["CD", "Democratic Republic of the Congo"],
  ["CR", "Costa Rica"],
  ["CI", "Côte d'Ivoire"],
  ["HR", "Croatia"],
  ["CU", "Cuba"],
  ["CY", "Cyprus"],
  ["CZ", "Czechia"],
  ["DK", "Denmark"],
  ["DJ", "Djibouti"],
  ["DM", "Dominica"],
  ["DO", "Dominican Republic"],
  ["EC", "Ecuador"],
  ["EG", "Egypt"],
  ["SV", "El Salvador"],
  ["GQ", "Equatorial Guinea"],
  ["ER", "Eritrea"],
  ["EE", "Estonia"],
  ["SZ", "Eswatini"],
  ["FJ", "Fiji"],
  ["FI", "Finland"],
  ["GA", "Gabon"],
  ["GM", "Gambia"],
  ["GE", "Georgia"],
  ["GR", "Greece"],
  ["GD", "Grenada"],
  ["GT", "Guatemala"],
  ["GN", "Guinea"],
  ["GW", "Guinea-Bissau"],
  ["GY", "Guyana"],
  ["HT", "Haiti"],
  ["HN", "Honduras"],
  ["HU", "Hungary"],
  ["IS", "Iceland"],
  ["ID", "Indonesia"],
  ["IQ", "Iraq"],
  ["IE", "Ireland"],
  ["IL", "Israel"],
  ["JM", "Jamaica"],
  ["JO", "Jordan"],
  ["KZ", "Kazakhstan"],
  ["KI", "Kiribati"],
  ["KP", "North Korea"],
  ["KR", "South Korea"],
  ["KG", "Kyrgyzstan"],
  ["LA", "Laos"],
  ["LV", "Latvia"],
  ["LB", "Lebanon"],
  ["LS", "Lesotho"],
  ["LR", "Liberia"],
  ["LY", "Libya"],
  ["LI", "Liechtenstein"],
  ["LT", "Lithuania"],
  ["LU", "Luxembourg"],
  ["MG", "Madagascar"],
  ["MW", "Malawi"],
  ["MY", "Malaysia"],
  ["MV", "Maldives"],
  ["ML", "Mali"],
  ["MT", "Malta"],
  ["MH", "Marshall Islands"],
  ["MR", "Mauritania"],
  ["MU", "Mauritius"],
  ["FM", "Micronesia"],
  ["MD", "Moldova"],
  ["MC", "Monaco"],
  ["MN", "Mongolia"],
  ["ME", "Montenegro"],
  ["MA", "Morocco"],
  ["MZ", "Mozambique"],
  ["MM", "Myanmar"],
  ["NA", "Namibia"],
  ["NR", "Nauru"],
  ["NP", "Nepal"],
  ["NI", "Nicaragua"],
  ["NE", "Niger"],
  ["MK", "North Macedonia"],
  ["NO", "Norway"],
  ["OM", "Oman"],
  ["PK", "Pakistan"],
  ["PW", "Palau"],
  ["PA", "Panama"],
  ["PG", "Papua New Guinea"],
  ["PY", "Paraguay"],
  ["PE", "Peru"],
  ["PH", "Philippines"],
  ["PT", "Portugal"],
  ["QA", "Qatar"],
  ["RO", "Romania"],
  ["KN", "Saint Kitts and Nevis"],
  ["LC", "Saint Lucia"],
  ["VC", "Saint Vincent and the Grenadines"],
  ["WS", "Samoa"],
  ["SM", "San Marino"],
  ["ST", "Sao Tome and Principe"],
  ["SA", "Saudi Arabia"],
  ["RS", "Serbia"],
  ["SC", "Seychelles"],
  ["SL", "Sierra Leone"],
  ["SG", "Singapore"],
  ["SK", "Slovakia"],
  ["SI", "Slovenia"],
  ["SB", "Solomon Islands"],
  ["SO", "Somalia"],
  ["SS", "South Sudan"],
  ["LK", "Sri Lanka"],
  ["SD", "Sudan"],
  ["SR", "Suriname"],
  ["SE", "Sweden"],
  ["SY", "Syria"],
  ["TJ", "Tajikistan"],
  ["TH", "Thailand"],
  ["TL", "Timor-Leste"],
  ["TG", "Togo"],
  ["TO", "Tonga"],
  ["TT", "Trinidad and Tobago"],
  ["TN", "Tunisia"],
  ["TR", "Turkey"],
  ["TM", "Turkmenistan"],
  ["TV", "Tuvalu"],
  ["AE", "United Arab Emirates"],
  ["UY", "Uruguay"],
  ["UZ", "Uzbekistan"],
  ["VU", "Vanuatu"],
  ["VA", "Vatican City"],
  ["VE", "Venezuela"],
  ["VN", "Vietnam"],
  ["YE", "Yemen"],
  ["ZM", "Zambia"],
  ["ZW", "Zimbabwe"],
] as const;

export const countryRules: CountryRule[] = [
  ...baseCountryRules,
  ...additionalCountries
    .filter(([code]) => !baseCountryRules.some((rule) => rule.code === code))
    .map(([code, name]) => ({ code, name, aliases: [name.toLowerCase()] })),
];

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function classifyArticleCountries(article: ArticleRecord) {
  const headlineLead =
    `${article.headline} ${article.lead || ""}`.toLowerCase();
  const body = Array.isArray(article.body)
    ? article.body
        .map((element) => element.text || "")
        .join(" ")
        .toLowerCase()
    : String(article.body || "").toLowerCase();
  const fullText = `${headlineLead} ${body}`;
  return countryRules.flatMap((rule) => {
    const mentions = rule.aliases.reduce(
      (total, alias) =>
        total +
        (fullText.match(new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi")) || [])
          .length,
      0,
    );
    const headlineMentions = rule.aliases.reduce(
      (total, alias) =>
        total +
        (
          headlineLead.match(new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi")) ||
          []
        ).length,
      0,
    );
    if (!headlineMentions && mentions < 2) return [];
    const relevance = Math.min(
      1,
      headlineMentions * 0.45 + Math.min(mentions, 6) * 0.08,
    );
    return [
      {
        code: rule.code,
        name: rule.name,
        relevance,
        confidence: Math.min(0.98, 0.55 + relevance * 0.4),
        evidence: [
          `${mentions} meaningful text mention${mentions === 1 ? "" : "s"}`,
          ...(headlineMentions ? ["headline or lead mention"] : []),
        ],
      },
    ];
  });
}
