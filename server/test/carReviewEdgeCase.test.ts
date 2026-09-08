import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/database.js';
import { generateLiquidDerivatives } from '../src/services/ai/liquidEngine.js';
import { synthesizePhotojournalismPrompt } from '../src/services/ai/imagenService.js';
import type { ArticleInput } from '../src/types/liquid.js';

describe('Car Review Edge Case: Dynamic Taxonomy, Depth & Prompt Synthesis', () => {
  const carReviewArticle: ArticleInput = {
    id: `car-review-gt3rs-${Date.now()}`,
    headline: 'Porsche 911 GT3 RS: Aerodynamischer Grenzbereich und mechanische Reinheit am Sustenpass',
    lead: 'Mit 525 PS, aktivem DRS-Flügelwerk und 860 Kilogramm Anpressdruck verwandelt der GT3 RS den Sustenpass in ein kompromissloses Lehrstück deutscher Ingenieurskunst.',
    body: `## Saugmotor-Furor auf 2224 Metern Höhe

Auf 2224 Metern über dem Meeresspiegel wird die Luft dünn, doch der 4,0-Liter-Sechszylinder-Boxer des 911 GT3 RS dreht unbeeindruckt bis auf 9000 Umdrehungen pro Minute. Mit 525 PS ohne Turboaufladung folgt das Aggregat am Sustenpass jedem Millimeter Gaspedalweg mit einer Spontaneität, die modernen Turbomotoren fremd ist.

«Dieses Auto ist kein verkappter Gran Turismo, sondern ein lupenreines Rennsportgerät mit Strassenzulassung,» bringt es Andreas Preuninger, Leiter der GT-Fahrzeuge bei Porsche, auf den Punkt.

## Aktive Aerodynamik und Fahrwerkstelemetrie

Der technologische Quantensprung dieses Modells manifestiert sich in der Aerodynamik:
- Aktive Frontdiffusoren und ein gewaltiger Schwanenhals-Heckflügel erzeugen 860 Kilogramm Abtrieb bei 285 km/h.
- Vier Drehschalter am Alcantara-Lenkrad ermöglichen die getrennte Justierung von Zug- und Druckstufe der Stossdämpfer in Echtzeit.
- Die elektronische Differenzialsperre lässt sich für Kurvenein- und -ausgang vom Cockpit aus kalibrieren.

## Das NZZ-Urteil: Ein mechanisches Denkmal

In einer automobilen Gegenwart, die von batterieelektrischen Schwergewichten geprägt wird, setzt der GT3 RS ein unmissverständliches Zeichen für den puristischen Leichtbau (1450 kg) und die mechanische Rückmeldung. Die Carbon-Keramik-Bremsanlage verzögert mit unerbittlicher Härte. Ein Faszinosum deutscher Ingenieurskunst, das in keine herkömmliche Schablone passt.`,
    author: 'Christian Eichberger',
    section: 'Mobilität & Automotive',
    language: 'de',
  };

  after(() => {
    // Clean up test article
    try {
      db.deleteArticle(carReviewArticle.id);
    } catch {
      // ignore
    }
  });

  it('1. Persists car review to database and discovers new dynamic category', () => {
    const saved = db.saveArticle({
      id: carReviewArticle.id,
      headline: carReviewArticle.headline,
      lead: carReviewArticle.lead,
      body: carReviewArticle.body,
      author: carReviewArticle.author,
      section: carReviewArticle.section,
      category: 'Mobilität & Automotive',
      tags: ['#Automotive', '#Porsche911', '#Fahrbericht', '#NZZ'],
      language: 'de',
      status: 'draft',
    });

    assert.equal(saved.id, carReviewArticle.id);
    assert.equal(saved.category, 'Mobilität & Automotive');
    assert.ok(saved.wordCount > 150);

    const categories = db.getCategories();
    assert.ok(
      categories.includes('Mobilität & Automotive'),
      'Discovered categories must contain Mobilität & Automotive'
    );

    const tags = db.getAllTags();
    assert.ok(tags.includes('#Porsche911'), 'Tags must contain #Porsche911');
  });

  it('2. AI engine auto-detects dynamic category, tags, and editorial depth for car review', async () => {
    const result = await generateLiquidDerivatives(carReviewArticle, {
      mock: true,
      model: 'gemini-2.5-flash',
      language: 'de',
    });

    // Dynamic Taxonomy Discovery
    assert.ok(result.detectedCategory, 'Must have detected category');
    assert.equal(result.detectedCategory, 'Mobilität & Automotive');
    assert.ok(result.suggestedTags.includes('#Automotive'));
    assert.ok(result.suggestedTags.includes('#Porsche911'));

    // Dynamic Depth Deck Sizing
    assert.ok(result.editorialAnalysis, 'Must include editorial depth analysis');
    assert.ok(result.editorialAnalysis.slideCount >= 4 && result.editorialAnalysis.slideCount <= 8);
    assert.equal(result.instagramCarousel.slides.length, result.editorialAnalysis.slideCount);

    // Automotive Contextual Imagery
    const coverSlide = result.instagramCarousel.slides[0];
    assert.equal(coverSlide.slideType, 'cover');
    assert.equal(coverSlide.detailZoomLabel, 'SWAN-NECK AERO');
    assert.ok(coverSlide.imageUrl.startsWith('https://images.unsplash.com/'));
  });

  it('3. Dedicated photojournalism prompt writer synthesizes authentic 35mm automotive prompts', () => {
    const slide = {
      slideNumber: 1,
      slideType: 'cover' as const,
      headline: 'Porsche 911 GT3 RS am Sustenpass',
      bodyText: 'Extrem aerodynamischer Abtrieb auf 2224 Metern Höhe.',
    };

    const synthesized = synthesizePhotojournalismPrompt(slide, {
      headline: carReviewArticle.headline,
      category: 'Mobilität & Automotive',
      lead: carReviewArticle.lead,
    });

    // Check photojournalistic invariants and label
    assert.equal(synthesized.detailLabel, 'SWAN-NECK AERO');
    assert.ok(synthesized.prompt.includes('35mm editorial documentary photography'));
    assert.ok(synthesized.prompt.includes('Neue Zürcher Zeitung'));
    assert.ok(synthesized.prompt.includes('Sustenpass'));
    assert.ok(synthesized.prompt.includes('zero CGI'));
  });

  it('4. Persists and reloads full car review derivatives from database', async () => {
    const result = await generateLiquidDerivatives(carReviewArticle, {
      mock: true,
      model: 'gemini-2.5-flash',
      language: 'de',
    });

    db.saveDerivatives(carReviewArticle.id, result);
    const reloaded = db.getDerivatives(carReviewArticle.id);

    assert.ok(reloaded, 'Derivatives must be retrieved from database');
    assert.equal(reloaded?.articleId, carReviewArticle.id);
    assert.equal(reloaded?.detectedCategory, 'Mobilität & Automotive');
    assert.equal(reloaded?.instagramCarousel.slides[0].detailZoomLabel, 'SWAN-NECK AERO');
  });
});
