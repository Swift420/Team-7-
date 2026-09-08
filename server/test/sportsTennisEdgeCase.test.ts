import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db/database.js';
import { generateLiquidDerivatives } from '../src/services/ai/liquidEngine.js';
import { synthesizePhotojournalismPrompt } from '../src/services/ai/imagenService.js';
import type { ArticleInput } from '../src/types/liquid.js';

describe('Sports & Tennis Edge Case: Dynamic Taxonomy & Visual Direction', () => {
  const tennisArticle: ArticleInput = {
    id: `sports-tennis-${Date.now()}`,
    headline: 'Tennis enters an era of unpredictable dominance',
    lead: 'With defensive baseline endurance pushed to athletic limits, Grand Slam tournaments reveal how modern racket tech and extreme physical conditioning reshape the sport.',
    body: `## The Modern Baseline Revolution

On the red clay of Roland Garros and the lawns of Wimbledon, modern tennis has evolved into a war of physical attrition. Defensive baseline recoveries that were once considered impossible are now routine, as athletes combine extreme topspin with relentless cardiovascular stamina.

«The margin between victory and defeat at the Grand Slam level is no longer decided by raw talent alone, but by string tension calibration, kinetic recovery, and mental endurance under pressure,» observes former world number one Mats Wilander.

## Technological Evolution: Rackets, Strings, and Court Surface Velocity

Three structural factors govern this new athletic epoch:
- High-modulus graphite composite frames deliver unprecedented torsional stability on off-center impacts.
- Monofilament polyester strings generate over 3500 rpm of ball spin, fundamentally altering defensive margins.
- Surface friction coefficients across clay, hardcourt, and grass demand distinct footwork biomechanics.

## Strategic Horizons: An Era of Open Rivalry

As the historic hegemony of the Big Three recedes, men's and women's professional tennis enters a hyper-competitive vacuum. The sport's new champions must master both defensive fortitude and explosive baseline offense to endure five-set marathons.`,
    author: 'Simon Häring',
    section: 'Sport & Athletik',
    language: 'en',
  };

  after(() => {
    try {
      db.deleteArticle(tennisArticle.id);
    } catch {
      // ignore
    }
  });

  it('1. Persists tennis article to database with dynamic sports category', () => {
    const saved = db.saveArticle({
      id: tennisArticle.id,
      headline: tennisArticle.headline,
      lead: tennisArticle.lead,
      body: tennisArticle.body,
      author: tennisArticle.author,
      section: tennisArticle.section,
      category: 'Sports & Athletics',
      tags: ['#Tennis', '#GrandSlam', '#Sport', '#Wimbledon', '#NZZ'],
      language: 'en',
      status: 'draft',
    });

    assert.equal(saved.id, tennisArticle.id);
    assert.equal(saved.category, 'Sports & Athletics');
    assert.ok(saved.tags.includes('#Tennis'));
  });

  it('2. AI engine classifies tennis correctly and avoids military/defense collision', async () => {
    const result = await generateLiquidDerivatives(tennisArticle, {
      mock: true,
      model: 'gemini-2.5-flash',
      language: 'en',
    });

    // Dynamic Category & Tags
    assert.equal(result.detectedCategory, 'Sports & Athletics');
    assert.ok(result.suggestedTags.includes('#Tennis'), 'Must suggest #Tennis tag');
    assert.ok(!result.suggestedTags.includes('#Geopolitik'), 'Must NOT include military/geopolitik tags');
    assert.ok(!result.suggestedTags.includes('#Verteidigung'), 'Must NOT include defense tags');

    // Instagram Carousel Zoom Label Verification
    const coverSlide = result.instagramCarousel.slides[0];
    assert.equal(coverSlide.slideType, 'cover');
    assert.notEqual(coverSlide.detailZoomLabel, 'PERSONNEL QUOTA', 'Must NOT assign military PERSONNEL QUOTA to tennis');
    assert.equal(coverSlide.detailZoomLabel, 'BALL COMPRESSION', 'Must assign tennis-specific zoom label');

    // Slide 2 zoom label
    const dataSlide = result.instagramCarousel.slides[1];
    assert.equal(dataSlide.detailZoomLabel, 'STRING TENSION', 'Slide 2 must highlight technical string tension');
  });

  it('3. Photojournalism synthesis generates authentic Grand Slam visual beats', () => {
    const slide1 = synthesizePhotojournalismPrompt(
      { slideNumber: 1, headline: tennisArticle.headline, slideType: 'cover' },
      { headline: tennisArticle.headline, category: 'Sports & Athletics', lead: tennisArticle.lead }
    );

    assert.equal(slide1.detailLabel, 'BALL COMPRESSION');
    assert.ok(slide1.prompt.includes('tennis') || slide1.prompt.includes('clay') || slide1.prompt.includes('court'));
    assert.ok(slide1.prompt.includes('35mm editorial sports documentary photography'));
    assert.ok(slide1.prompt.includes('zero CGI'));

    const slide2 = synthesizePhotojournalismPrompt(
      { slideNumber: 2, headline: 'Baseline Statistics', slideType: 'data_point' },
      { headline: tennisArticle.headline, category: 'Sports & Athletics', lead: tennisArticle.lead }
    );
    assert.equal(slide2.detailLabel, 'STRING TENSION');
    assert.ok(slide2.prompt.includes('tennis') || slide2.prompt.includes('strings'));
  });
});
