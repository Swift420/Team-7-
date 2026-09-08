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

    // Instagram / LinkedIn Carousel (6 slides)
    assert.equal(result.instagramCarousel.slides.length, 6);
    assert.ok(result.instagramCarousel.captionText.length > 20);
    assert.ok(result.instagramCarousel.hashtags.length >= 2);

    // Fact Box
    assert.ok(result.factBox.metrics.length >= 3);

    // Dialectical FAQ (3 items)
    assert.equal(result.dialecticalFaq.items.length, 3);
    assert.equal(result.dialecticalFaq.items[1].perspective, 'counterargument');
  });
});
