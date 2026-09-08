import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JsonDatabase } from '../src/db/database.js';

describe('JSON Database Persistence Layer', () => {
  const testDir = path.resolve(process.cwd(), 'server/data/test_db_' + Date.now());
  let db: JsonDatabase;

  before(() => {
    db = new JsonDatabase(testDir);
  });

  after(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('saves a new article and generates ID, word count, and timestamps', () => {
    const saved = db.saveArticle({
      headline: 'Porsche 911 GT3 RS: Präzisionswerkzeug auf dem Sustenpass',
      lead: 'Mit 525 PS und extremer Aerodynamik setzt der GT3 RS neue Massstäbe im alpinen Grenzbereich.',
      body: 'Der 4,0-Liter-Saugmotor dreht bis auf 9000 Umdrehungen pro Minute. Das Fahrwerk lässt sich vom Lenkrad aus in Druck- und Zugstufe variieren.',
      author: 'NZZ Mobilitätsredaktion',
      category: 'Mobilität & Automotive',
      tags: ['#Porsche', '#Automotive', '#Sportwagen', '#Sustenpass'],
      language: 'de',
    });

    assert.ok(saved.id);
    assert.equal(saved.category, 'Mobilität & Automotive');
    assert.equal(saved.tags?.length, 4);
    assert.ok(saved.wordCount > 10);
    assert.equal(saved.status, 'draft');

    const fetched = db.getArticleById(saved.id);
    assert.ok(fetched);
    assert.equal(fetched?.headline, 'Porsche 911 GT3 RS: Präzisionswerkzeug auf dem Sustenpass');
  });

  it('filters articles by category and search query', () => {
    const list = db.getAllArticles({ category: 'Mobilität' });
    assert.ok(list.length >= 1);
    assert.ok(list.some(a => a.headline.includes('Porsche')));

    const searchResults = db.getAllArticles({ query: 'Sustenpass' });
    assert.equal(searchResults.length, 1);
  });

  it('updates an existing article and recalculates word count', () => {
    const all = db.getAllArticles();
    const article = all[0];
    const updated = db.updateArticle(article.id, {
      lead: 'Aktualisierter Vorspann für die NZZ-Printausgabe.',
      status: 'published',
    });

    assert.ok(updated);
    assert.equal(updated?.status, 'published');
    assert.equal(updated?.lead, 'Aktualisierter Vorspann für die NZZ-Printausgabe.');
  });

  it('persists and retrieves derivatives', () => {
    const all = db.getAllArticles();
    const article = all[0];
    const mockDerivatives: any = {
      articleId: article.id,
      generatedAt: new Date().toISOString(),
      source: 'vertex-ai',
      audioBrief: { headline: 'Audio Brief' },
    };

    db.saveDerivatives(article.id, mockDerivatives);
    const retrieved = db.getDerivatives(article.id);
    assert.ok(retrieved);
    assert.equal(retrieved?.articleId, article.id);
  });

  it('returns dynamic categories and tags', () => {
    const categories = db.getCategories();
    assert.ok(categories.includes('Mobilität & Automotive'));

    const tags = db.getAllTags();
    assert.ok(tags.includes('#Porsche'));
    assert.ok(tags.includes('#Automotive'));
  });

  it('deletes an article and its derivatives cleanly', () => {
    const all = db.getAllArticles();
    const id = all[0].id;
    const deleted = db.deleteArticle(id);
    assert.equal(deleted, true);

    assert.equal(db.getArticleById(id), null);
    assert.equal(db.getDerivatives(id), null);
  });
});
