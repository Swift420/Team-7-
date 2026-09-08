import 'dotenv/config';
import { pool } from '../config/database.js';
import { listArticles, getArticle } from '../repositories/articleRepository.js';
import { replaceArticleCountries } from '../repositories/countryRepository.js';
import { classifyArticleCountries } from '../services/countryClassifier.js';

const articles = await listArticles();
for (const summary of articles) {
  const article = await getArticle(summary.id);
  if (!article) continue;
  const assignments = classifyArticleCountries(article);
  await replaceArticleCountries(article.id, assignments);
  console.log(`${article.headline}: ${assignments.map((item) => item.code).join(', ') || 'no country match'}`);
}
await pool.end();
