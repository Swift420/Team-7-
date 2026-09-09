import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateContextualPhotographyPrompt,
  synthesizePhotojournalismPrompt,
  generateImagen3Image,
} from '../src/services/ai/imagenService.js';
import { getContextualTopicImagery } from '../src/services/ai/liquidEngine.js';

describe('Mission: Carousel Pipeline Overhaul & Editorial Strictness', () => {
  test('1. Vinyl Records mandates exact user prompt specification', async () => {
    const vinylSlide = {
      slideNumber: 1,
      headline: 'The Resurgence of Vinyl: Why Analog Sound Still Resonates in the Digital Age',
    };
    const options = {
      headline: 'The Resurgence of Vinyl: Why Analog Sound Still Resonates in the Digital Age',
      category: 'CULTURE & MUSIC',
      lead: 'In an era of hyper-compressed digital streaming, the tactile warmth of vinyl records has seen an unprecedented renaissance.',
    };

    const prompt = await generateContextualPhotographyPrompt(vinylSlide, options);
    assert.equal(
      prompt,
      'Extreme close-up of a vintage vinyl turntable needle on spinning black vinyl grooves, warm retro moody lighting, editorial documentary photography, 4:5 aspect ratio, analog film grain.'
    );

    // Verify liquidEngine fallback also assigns Vinyl topic imagery
    const topicImagery = getContextualTopicImagery({
      id: 'vinyl-test-1',
      headline: vinylSlide.headline,
      lead: options.lead,
      category: 'Kultur',
    });
    assert.ok(
      topicImagery.coverUrl.includes('1603048588665') || topicImagery.coverUrl.includes('vinyl'),
      'Vinyl article must receive turntable imagery, never Porsche'
    );
  });

  test('2. Articles with "automated" or "author" do NOT leak Porsche automotive imagery', () => {
    const nonAutoArticle = {
      id: 'automation-policy',
      headline: 'Workforce Automation in European Healthcare Systems',
      lead: 'The author explores automated scheduling algorithms and artificial intelligence diagnostic vectors across hospitals.',
      body: 'Autonomous systems and automation pipelines are reshaping hospital operations without human intervention.',
    };

    const topicImagery = getContextualTopicImagery(nonAutoArticle);
    assert.ok(
      !topicImagery.coverUrl.includes('photo-1614162692292-7ac56d7f7f1e'),
      'Must NOT return Porsche 911 GT3 RS image for healthcare automation article'
    );

    const { prompt } = synthesizePhotojournalismPrompt(
      { slideNumber: 1, headline: 'Workforce Automation' },
      { headline: nonAutoArticle.headline, lead: nonAutoArticle.lead }
    );
    assert.ok(
      !prompt.toLowerCase().includes('porsche') && !prompt.toLowerCase().includes('sustenpass'),
      'Synthesized prompt must not contain Porsche'
    );
  });

  test('3. Neuroscience topic imagery and prompt synthesis', () => {
    const neuroArticle = {
      id: 'neuro-test',
      headline: 'How Neural Synapses Adapt Under Extreme Cognitive Stress',
      lead: 'Neuroscience researchers at ETH Zurich examine prefrontal cortex plasticity.',
    };

    const topicImagery = getContextualTopicImagery(neuroArticle);
    assert.ok(
      topicImagery.coverUrl.includes('1559757175-5700dde675bc'),
      'Must return neuroscience imagery'
    );

    const { prompt } = synthesizePhotojournalismPrompt(
      { slideNumber: 1, headline: 'Neural Synaptic Plasticity' },
      { headline: neuroArticle.headline, lead: neuroArticle.lead }
    );
    assert.ok(
      prompt.toLowerCase().includes('neuroscience') || prompt.toLowerCase().includes('brain') || prompt.toLowerCase().includes('laboratory'),
      'Synthesized prompt must reflect brain / neuroscience context'
    );
  });

  test('4. Cybersecurity topic imagery and prompt synthesis', () => {
    const cyberArticle = {
      id: 'api-security',
      headline: 'API Attack Vectors Threaten Modern Infrastructure',
      lead: 'Zero-day vulnerabilities in cloud microservices expose critical financial networks.',
    };

    const topicImagery = getContextualTopicImagery(cyberArticle);
    assert.ok(
      topicImagery.coverUrl.includes('1558494949-ef010cbdcc31'),
      'Must return cybersecurity network center imagery'
    );

    const { prompt } = synthesizePhotojournalismPrompt(
      { slideNumber: 1, headline: 'API Attack Surface' },
      { headline: cyberArticle.headline, lead: cyberArticle.lead }
    );
    assert.ok(
      prompt.toLowerCase().includes('cybersecurity') || prompt.toLowerCase().includes('network operations center'),
      'Synthesized prompt must reflect cybersecurity context'
    );
  });

  test('5. Image generation with bustCache: true generates new cached entry', async () => {
    const testPrompt = 'Extreme close-up of a vintage vinyl turntable needle on spinning black vinyl grooves, warm retro moody lighting, editorial documentary photography, 4:5 aspect ratio, analog film grain.';
    const res = await generateImagen3Image(testPrompt, {
      aspectRatio: '4:5',
      headline: 'The Resurgence of Vinyl',
      category: 'CULTURE',
      bustCache: true,
    });

    assert.ok(res.imageUrl, 'Must return image URL');
    assert.ok(
      res.imageUrl.includes('pollinations') ||
      res.imageUrl.includes('vinyl') ||
      res.imageUrl.includes('1603048588665') ||
      res.imageUrl.startsWith('data:') ||
      res.imageUrl.includes('unsplash'),
      'Vinyl prompt must return an AI-generated or photorealistic vinyl image URL'
    );
  });

  test('6. Football article with "record transfer fee" does NOT leak vinyl or turntable imagery', () => {
    const footballArticle = {
      id: 'football-transfer-record',
      headline: 'Record Transfer Fee: Real Madrid Signs Midfield Sensation',
      lead: 'The European champions set a new financial record in the summer transfer window after intense Champions League negotiations.',
      body: 'With a record turnover and record sponsorship deal, the club cements its continental dominance.',
    };

    const topicImagery = getContextualTopicImagery(footballArticle);
    assert.ok(
      !topicImagery.coverUrl.includes('1603048588665'),
      'Must NOT return vinyl turntable for football article with word "record"'
    );
    assert.notEqual(topicImagery.zoomLabel, 'RECORD GROOVES');

    const { prompt, detailLabel } = synthesizePhotojournalismPrompt(
      { slideNumber: 1, headline: 'Record Transfer Fee' },
      { headline: footballArticle.headline, lead: footballArticle.lead, category: 'Sport' }
    );
    assert.ok(
      !prompt.toLowerCase().includes('vinyl') && !prompt.toLowerCase().includes('turntable'),
      'Synthesized football prompt must not mention vinyl or turntable'
    );
    assert.ok(
      prompt.toLowerCase().includes('football') || prompt.toLowerCase().includes('pitch') || prompt.toLowerCase().includes('stadium'),
      'Prompt must be focused on European football documentary'
    );
    assert.equal(detailLabel, 'STADIUM PITCH');
  });

  test('7. Football carousel slides generate authentic sideline and pitch beats', () => {
    const { prompt: slide2Prompt, detailLabel: slide2Label } = synthesizePhotojournalismPrompt(
      { slideNumber: 2, headline: 'Tactical Realignment' },
      { headline: 'Champions League Showdown', lead: 'European football tactical analysis', category: 'Sport' }
    );
    assert.equal(slide2Label, 'SIDELINE TACTICS');
    assert.ok(slide2Prompt.includes('wool coat') || slide2Prompt.includes('tactical'));

    const { prompt: slide3Prompt, detailLabel: slide3Label } = synthesizePhotojournalismPrompt(
      { slideNumber: 3, headline: 'Dead-Ball Mastery' },
      { headline: 'Champions League Showdown', lead: 'European football tactical analysis', category: 'Sport' }
    );
    assert.equal(slide3Label, 'MATCH BALL');
    assert.ok(slide3Prompt.includes('match football') || slide3Prompt.includes('penalty spot'));
  });
});
