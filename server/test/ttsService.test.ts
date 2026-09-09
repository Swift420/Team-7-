import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSSML, synthesizeAudioBrief } from '../src/services/gcp/ttsService.js';

describe('TTS Service & SSML Generator', () => {
  it('wraps raw script with prosody, breath breaks, and sign-off cadence', () => {
    const raw = 'In Berlin droht der Kollaps. Reformen sind nötig.';
    const ssml = buildSSML(raw, 'Malte Fischer', { language: 'de' });

    assert.ok(ssml.includes('<speak>'));
    assert.ok(ssml.includes('<prosody rate="1.0">'));
    assert.ok(ssml.includes('<break time="300ms"/>'));
    assert.ok(ssml.includes('Für die Neue Zürcher Zeitung, Malte Fischer.'));
  });

  it('substitutes Swiss abbreviations with phonetic expansions in SSML', () => {
    const raw = 'Laut NZZ und SBB steigen die Kosten.';
    const ssml = buildSSML(raw, 'Redaktion');

    assert.ok(ssml.includes('<sub alias="Neue Zürcher Zeitung">NZZ</sub>'));
    assert.ok(ssml.includes('<sub alias="Schweizerische Bundesbahnen">SBB</sub>'));
  });

  it('synthesizes audio brief returning mp3 URL and realistic duration', async () => {
    const script = 'Dies ist ein Testskript für das morgendliche Pendler-Briefing der Neuen Zürcher Zeitung. Mehrere Sätze zur Überprüfung der Dauer.';
    const result = await synthesizeAudioBrief(script, { mock: true, language: 'de' });

    assert.ok(result.audioUrl.endsWith('.mp3'));
    assert.equal(result.format, 'mp3');
    assert.ok(result.durationSeconds >= 55);
    assert.equal(result.voiceUsed, 'de-DE-Studio-B');
  });
});

