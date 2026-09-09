import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateLiquidDerivatives } from '../src/services/ai/liquidEngine.js';

describe('Liquid Engine AI Generation', () => {
  it('generates 6 valid liquid formats adhering to NZZ Voice Invariant', async () => {
    const sampleArticle = {
      id: 'ld.1886544',
      headline: "Germany's welfare state is threatened with financial collapse",
      lead: 'Demographic trends and medical advances are causing social security contributions to rise rapidly.',
      body: 'Lars Klingbeil has just under four weeks left to deliver his final budget...',
      author: 'Malte Fischer, Düsseldorf',
      language: 'en',
    };

    const result = await generateLiquidDerivatives(sampleArticle, { mock: true, model: 'gemini-3.8-flash' });

    // Audio Brief (60s)
    assert.ok(result.audioBrief.wordCount >= 50 && result.audioBrief.wordCount <= 160);
    assert.equal(result.audioBrief.estimatedDurationSeconds, 60);
    assert.ok(result.audioBrief.ssml.includes('<speak>'));
    assert.ok(result.audioBrief.script.includes('Neue Zürcher Zeitung'));

    // Executive Newsletter (3 bullets)
    assert.equal(result.executiveNewsletter.bullets.length, 3);
    assert.ok(result.executiveNewsletter.wordCount < 100);

    // 60-Second Vertical Video Storyboard (5 scenes)
    assert.equal(result.socialStoryboard.scenes.length, 5);
    assert.equal(result.socialStoryboard.totalDurationSeconds, 60);
    assert.equal(result.socialStoryboard.aspectRatio, '9:16');
    assert.ok(result.socialStoryboard.scenes[0].visualPrompt.length > 10);

    // Instagram / LinkedIn Carousel strictly adhering to NZZ 7-slide Inspo Design System
    assert.equal(result.instagramCarousel.slides.length, 7);
    assert.ok(result.instagramCarousel.captionText.length > 20);
    assert.ok(result.instagramCarousel.hashtags.length >= 2);
    // Style A: Cover Slide 1 must have photorealistic documentary image populated
    assert.ok(result.instagramCarousel.slides[0].imageUrl, 'Cover slide must have imageUrl populated');
    assert.ok(result.instagramCarousel.slides[0].imageUrl.startsWith('https://images.unsplash.com/'));

    // Fact Box
    assert.ok(result.factBox.metrics.length >= 3);

    // Dialectical FAQ (3 items)
    assert.equal(result.dialecticalFaq.items.length, 3);
    assert.equal(result.dialecticalFaq.items[1].perspective, 'counterargument');
    // English translation purity: No German questions when language is English
    const faqText = JSON.stringify(result.dialecticalFaq);
    assert.ok(!faqText.includes('Wie begründen Befürworter'), 'No German phrases in English FAQ');
  });

  it('selects photorealistic naval imagery for submarine articles', async () => {
    const submarineArticle = {
      id: 'ld.submarine-test',
      headline: 'Nukleare U-Boote im Indopazifik: Die lautlose Aufrüstung',
      lead: 'Im Pazifik patrouillieren atomgetriebene Jagd-U-Boote und sichern maritime Transitrouten.',
      body: 'Unterwasser-Operationen und nukleare Antriebe bilden das Rückgrat maritimer Abschreckung.',
      author: 'NZZ Sicherheitspolitik',
      section: 'International',
      language: 'en' as const,
    };

    const result = await generateLiquidDerivatives(submarineArticle, { mock: true, model: 'gemini-3.8-flash', language: 'en' });
    const coverSlide = result.instagramCarousel.slides[0];
    assert.ok(coverSlide.imageUrl);
    assert.ok(coverSlide.imageUrl.includes('photo-1544620347-c4fd4a3d5957'), 'Matches authentic submarine documentary photo');
    assert.equal(coverSlide.detailZoomLabel, 'S9G REACTOR');
  });
});

