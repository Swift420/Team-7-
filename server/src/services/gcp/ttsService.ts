import { getAccessToken, getProjectId } from './authService.js';
import { getCached, setCached, generateCacheKey } from '../ai/cacheService.js';

export interface TTSOptions {
  language?: 'de' | 'en';
  voiceName?: string;
  gender?: 'MALE' | 'FEMALE';
  author?: string;
  mock?: boolean;
}

export interface AudioSynthesisResult {
  audioUrl: string;
  durationSeconds: number;
  wordCount: number;
  format: 'mp3';
  voiceUsed: string;
  source: 'cloud-tts' | 'cache' | 'mock';
}

/**
 * Builds SSML markup applying NZZ audio broadcast cadence:
 * - Natural paragraph and sentence breath breaks (250-350ms)
 * - Phonetic alias substitution for Swiss entities
 * - Prosody pitch drop on final attribution
 */
export function buildSSML(
  script: string,
  author: string = 'NZZ Redaktion',
  options: { rate?: string; language?: 'de' | 'en' } = {}
): string {
  const rate = options.rate || '1.0';
  const isGerman = options.language === 'de';

  let clean = script.trim();

  // Replace common Swiss abbreviations with phonetic expansions
  clean = clean
    .replace(/\bNZZ\b/g, '<sub alias="Neue Zürcher Zeitung">NZZ</sub>')
    .replace(/\bSBB\b/g, '<sub alias="Schweizerische Bundesbahnen">SBB</sub>')
    .replace(/\bGKV\b/g, '<sub alias="Gesetzliche Krankenversicherung">GKV</sub>')
    .replace(/\bECB\b/g, '<sub alias="European Central Bank">ECB</sub>')
    .replace(/\bSNB\b/g, '<sub alias="Swiss National Bank">SNB</sub>');

  // Insert natural breath breaks after sentence terminals
  const withBreaks = clean.replace(/([.!?])\s+/g, '$1<break time="300ms"/> ');

  const alreadyHasAttribution = clean.includes('Neue Zürcher Zeitung');
  const outro = alreadyHasAttribution
    ? ''
    : isGerman
    ? ` <break time="450ms"/><prosody pitch="-1st">Für die Neue Zürcher Zeitung, ${author}.</prosody>`
    : ` <break time="450ms"/><prosody pitch="-1st">For the Neue Zürcher Zeitung, ${author}.</prosody>`;

  return `<speak><prosody rate="${rate}">${withBreaks}${withBreaks.endsWith('.') ? '' : '.'}${outro}</prosody></speak>`;
}

export async function synthesizeAudioBrief(
  script: string,
  options: TTSOptions = {}
): Promise<AudioSynthesisResult> {
  const isGerman = options.language === 'de';
  const voiceName = options.voiceName || (isGerman ? 'de-DE-Studio-B' : 'en-US-Journey-F');
  const languageCode = isGerman ? 'de-DE' : 'en-US';
  const words = script.trim().split(/\s+/).length;
  const durationSeconds = Math.max(55, Math.round(words / 2.33));

  if (options.mock) {
    return {
      audioUrl: '/audio/sample-briefing.mp3',
      durationSeconds: 60,
      wordCount: words,
      format: 'mp3',
      voiceUsed: voiceName,
      source: 'mock',
    };
  }

  const cacheKey = generateCacheKey('tts_audio', { script, voiceName, languageCode }, 'live');

  // 1. Check Cost-Saving Cache
  const cached = getCached<AudioSynthesisResult>(cacheKey);
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  // Journey and Studio voices are generative neural models that do NOT support SSML tags
  const isJourneyOrStudio = voiceName.includes('Journey') || voiceName.includes('Studio');
  
  let input: { ssml?: string; text?: string };
  if (isJourneyOrStudio) {
    let plainText = script.trim();
    if (!plainText.includes('Neue Zürcher Zeitung')) {
      const outroText = isGerman
        ? `Für die Neue Zürcher Zeitung, ${options.author || 'die Redaktion'}.`
        : `For the Neue Zürcher Zeitung, ${options.author || 'the Editorial Board'}.`;
      plainText = `${plainText}\n\n${outroText}`;
    }
    input = { text: plainText };
  } else {
    input = { ssml: buildSSML(script, options.author, { language: options.language }) };
  }

  // 2. Google Cloud TTS via ADC
  const token = await getAccessToken();
  const projectId = await getProjectId();

  if (!token || !projectId) {
    const errorMsg = 'Google Cloud credentials not found. Cloud TTS is unauthenticated.';
    console.error(`[Google Cloud TTS] ${errorMsg}`);
    throw new Error(`AUTH_MISSING: ${errorMsg}`);
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Goog-User-Project': projectId,
  };

  const endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
  console.log(`[Google Cloud TTS] Synthesizing speech with voice ${voiceName} (${isJourneyOrStudio ? 'plain-text' : 'SSML'}) for project ${projectId}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input,
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const errorBody = await response.text();
    console.error(`[Google Cloud TTS Error] HTTP ${status}: ${errorBody}`);
    throw new Error(`Cloud TTS error (${status}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data.audioContent) {
    console.error('[Google Cloud TTS] Empty audioContent returned:', JSON.stringify(data));
    throw new Error('Cloud TTS returned empty audioContent');
  }

  const result: AudioSynthesisResult = {
    audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
    durationSeconds,
    wordCount: words,
    format: 'mp3',
    voiceUsed: voiceName,
    source: 'cloud-tts',
  };

  setCached(cacheKey, result);
  console.log(`[Google Cloud TTS] Synthesized ${words} words (${durationSeconds}s) successfully`);
  return result;
}
