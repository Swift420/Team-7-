import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import type { VideoScene, SocialStoryboardFormat } from '../../types/liquid.js';
import { generateVeoVideo, getVideosDir } from '../gcp/veoService.js';
import { synthesizeAudioBrief } from '../gcp/ttsService.js';

const execAsync = promisify(exec);

export interface RenderVideoOptions {
  articleId?: string;
  language?: 'de' | 'en';
  mock?: boolean;
}

export interface RenderVideoResult {
  videoUrl: string;
  localPath: string;
  totalDurationSeconds: number;
  totalScenes: number;
  modelUsed: string;
  format: 'mp4';
}

/** Escapes XML special characters for SVG text inclusion. */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Word-wraps text into lines not exceeding maxChars. */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Creates high-resolution 1080x1920 Swiss broadsheet typography overlay PNG:
 * - 5-segment top progress bar
 * - NZZ VISUAL red pill badge
 * - Scene counter
 * - Large prominent metric badge (if metric present)
 * - Headline & voiceover closed captions with dark legibility backplate
 */
export async function createSceneOverlay(
  sceneOrParams: any,
  totalScenesArg: number = 5,
  activeIndexArg: number = 1,
  optionsArg: { language?: 'de' | 'en'; outputPath?: string } = {}
): Promise<Buffer> {
  let scene: any = sceneOrParams;
  let totalScenes = totalScenesArg;
  let activeIndex = activeIndexArg;
  let options = { ...optionsArg };

  if (sceneOrParams && typeof sceneOrParams === 'object') {
    if (sceneOrParams.outputPath) {
      options.outputPath = sceneOrParams.outputPath;
    }
    if (sceneOrParams.language) {
      options.language = sceneOrParams.language;
    }
    if (sceneOrParams.totalScenes) {
      totalScenes = sceneOrParams.totalScenes;
    }
    if (sceneOrParams.sceneIndex) {
      activeIndex = sceneOrParams.sceneIndex;
    }

    scene = {
      ...sceneOrParams,
      onScreenHeadline: sceneOrParams.onScreenHeadline || sceneOrParams.headline || '',
      prominentMetric: sceneOrParams.prominentMetric || sceneOrParams.metric,
      voiceoverText: sceneOrParams.voiceoverText || sceneOrParams.subtitle || '',
    };
  }

  const isGerman = options.language !== 'en';
  const width = 1080;
  const height = 1920;

  // Segmented progress bar at top safe zone
  const marginX = 80;
  const barGap = 16;
  const totalBarWidth = width - marginX * 2;
  const segWidth = (totalBarWidth - (totalScenes - 1) * barGap) / totalScenes;
  const progressBars = Array.from({ length: totalScenes }, (_, i) => {
    const x = marginX + i * (segWidth + barGap);
    const fill = i + 1 <= activeIndex ? '#E50012' : 'rgba(255, 255, 255, 0.25)';
    return `<rect x="${x}" y="90" width="${segWidth}" height="6" rx="3" fill="${fill}"/>`;
  }).join('\n  ');

  const sceneLabel = isGerman ? `SZENE ${activeIndex} / ${totalScenes}` : `SCENE ${activeIndex} / ${totalScenes}`;
  const headlineLines = wrapText(scene.onScreenHeadline || '', 28).slice(0, 3);
  const voiceoverClean = (scene.voiceoverText || '').replace(/^[«"']|[»"']$/g, '');
  const subtitleLines = wrapText(voiceoverClean, 38).slice(0, 4);

  // Prominent Metric Badge (if present)
  let metricSvg = '';
  if (scene.prominentMetric) {
    const escapedMetric = escapeXml(scene.prominentMetric);
    metricSvg = `
      <g transform="translate(80, 1180)">
        <rect width="auto" min-width="320" height="80" rx="16" fill="#E50012"/>
        <text x="30" y="56" fill="#FFFFFF" font-family="'SF Mono', 'Courier New', monospace" font-size="48" font-weight="bold">${escapedMetric}</text>
      </g>
    `;
  }

  // Headline SVG
  const headlineSvg = headlineLines
    .map((line, idx) => {
      const y = 1420 + idx * 62;
      return `<text x="110" y="${y}" fill="#FFFFFF" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="bold">${escapeXml(line)}</text>`;
    })
    .join('\n  ');

  // Subtitle / Closed Captions SVG
  const subtitleSvg = subtitleLines
    .map((line, idx) => {
      const y = 1620 + idx * 46;
      return `<text x="110" y="${y}" fill="rgba(255, 255, 255, 0.88)" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="normal">${escapeXml(line)}</text>`;
    })
    .join('\n  ');

  const backplateHeight = 180 + headlineLines.length * 62 + subtitleLines.length * 46;

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Top Progress Indicator -->
    <g>
      ${progressBars}
    </g>

    <!-- Editorial Badges -->
    <g transform="translate(80, 120)">
      <!-- Red Pill Logo Badge -->
      <rect width="160" height="42" rx="21" fill="#E50012"/>
      <text x="22" y="27" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" letter-spacing="2">NZZ VISUAL</text>

      <!-- Scene Counter -->
      <text x="180" y="28" fill="rgba(255, 255, 255, 0.75)" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" letter-spacing="1.5">${sceneLabel}</text>
    </g>

    ${metricSvg}

    <!-- Lower-Third Editorial Card -->
    <g>
      <rect x="70" y="1330" width="940" height="${backplateHeight}" rx="28" fill="rgba(12, 12, 14, 0.88)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2"/>
      ${headlineSvg}
      ${subtitleSvg}
    </g>
  </svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, pngBuffer);
  }
  return pngBuffer;
}

/** Measures exact duration of an audio or video file via ffprobe. */
async function probeDurationSeconds(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    const parsed = parseFloat(stdout.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  } catch {
    return 5;
  }
}

/**
 * Assembles and renders the complete 60-second vertical shortform video:
 * 1. Generates / retrieves Veo 3.1 video clip per scene
 * 2. Synthesizes Google Cloud TTS spoken audio per scene
 * 3. Overlays Swiss broadsheet typography & subtitles
 * 4. Stitches all scenes seamlessly with H.264/AAC at 1080x1920
 */
export async function renderFullVerticalVideo(
  storyboard: SocialStoryboardFormat,
  options: RenderVideoOptions = {}
): Promise<RenderVideoResult> {
  const videosDir = getVideosDir();
  const runId = crypto.randomBytes(6).toString('hex');
  const tempDir = path.join(videosDir, `render_tmp_${runId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const finalFilename = `stitched_${options.articleId || 'video'}_${runId}.mp4`;
  const finalOutputPath = path.join(videosDir, finalFilename);

  const sceneOutputFiles: string[] = [];
  const scenes = storyboard.scenes.slice(0, 5); // Ensure strictly max 5 scenes
  let totalCalculatedSeconds = 0;

  try {
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneIndex = i + 1;
      console.log(`[VideoStitcher] Processing Scene ${sceneIndex}/${scenes.length}: "${scene.onScreenHeadline}"...`);

      // 1. Synthesize audio narration via Google Cloud TTS
      const ttsResult = await synthesizeAudioBrief(scene.voiceoverText, {
        language: options.language,
        mock: options.mock,
      });

      const sceneAudioPath = path.join(tempDir, `scene_${sceneIndex}_audio.mp3`);
      if (ttsResult.audioUrl.startsWith('/api/')) {
        // Local path
        const localTts = path.resolve(process.cwd(), ttsResult.audioUrl.replace('/api/', 'data/'));
        if (fs.existsSync(localTts)) {
          await fs.promises.copyFile(localTts, sceneAudioPath);
        } else {
          // Fallback tone
          await execAsync(
            `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${scene.durationSeconds || 10} -q:a 9 -acodec libmp3lame "${sceneAudioPath}"`
          );
        }
      } else if (ttsResult.audioUrl.startsWith('http')) {
        const res = await fetch(ttsResult.audioUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.promises.writeFile(sceneAudioPath, buf);
      } else {
        // Silent audio fallback matching desired scene duration
        const dur = Math.max(4, Math.min(14, scene.durationSeconds || 10));
        await execAsync(
          `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${dur} -q:a 9 -acodec libmp3lame "${sceneAudioPath}"`
        );
      }

      // Check audio duration
      const audioDuration = await probeDurationSeconds(sceneAudioPath);
      // Pacing breath cushion (300ms)
      const sceneDuration = Math.max(audioDuration + 0.3, 4.0);
      totalCalculatedSeconds += sceneDuration;

      // 2. Generate or retrieve Veo 3.1 video clip
      let sceneVideoClipPath = '';
      if (scene.videoUrl && scene.videoUrl.startsWith('/api/videos/')) {
        const candidate = path.join(videosDir, path.basename(scene.videoUrl));
        if (fs.existsSync(candidate)) {
          sceneVideoClipPath = candidate;
        }
      }

      if (!sceneVideoClipPath) {
        console.log(`[VideoStitcher] Generating Veo 3.1 clip for Scene ${sceneIndex}...`);
        const veoResult = await generateVeoVideo(scene.visualPrompt, {
          aspectRatio: '9:16',
          durationSeconds: 5,
          mock: options.mock,
          headline: scene.onScreenHeadline,
          sceneType: scene.sceneType,
        });
        sceneVideoClipPath = veoResult.localPath;
      }

      // 3. Generate Typography Overlay PNG
      const overlayBuffer = await createSceneOverlay(scene, scenes.length, sceneIndex, {
        language: options.language,
      });
      const overlayPath = path.join(tempDir, `scene_${sceneIndex}_overlay.png`);
      await fs.promises.writeFile(overlayPath, overlayBuffer);

      // 4. Composite Video + Overlay + Audio for this scene
      const sceneCompPath = path.join(tempDir, `scene_${sceneIndex}_comp.mp4`);
      const ffmpegCmd = `ffmpeg -y -stream_loop -1 -i "${sceneVideoClipPath}" -i "${overlayPath}" -i "${sceneAudioPath}" -filter_complex "[0:v][1:v]overlay=0:0[v]" -map "[v]" -map 2:a -t ${sceneDuration} -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p "${sceneCompPath}"`;

      await execAsync(ffmpegCmd);
      sceneOutputFiles.push(sceneCompPath);
    }

    // 5. Concatenate scenes into master 60s video
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = sceneOutputFiles.map((file) => `file '${file}'`).join('\n');
    await fs.promises.writeFile(concatListPath, concatContent);

    console.log(`[VideoStitcher] Concatenating ${sceneOutputFiles.length} scenes into master MP4...`);
    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -movflags +faststart "${finalOutputPath}"`
    );

    const finalDuration = await probeDurationSeconds(finalOutputPath);
    console.log(`[VideoStitcher] Render complete! Duration: ${finalDuration.toFixed(1)}s, File: ${finalFilename}`);

    return {
      videoUrl: `/api/videos/${finalFilename}`,
      localPath: finalOutputPath,
      totalDurationSeconds: Math.round(finalDuration),
      totalScenes: scenes.length,
      modelUsed: 'Google Veo 3.1 + TTS',
      format: 'mp4',
    };
  } finally {
    // Cleanup temp directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
  }
}
