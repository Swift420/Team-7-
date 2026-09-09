import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { getAccessToken, getProjectId } from './authService.js';
import { env } from '../../config/env.js';
import { generateImagen3Image } from '../ai/imagenService.js';

const execAsync = promisify(exec);

export interface VeoVideoOptions {
  aspectRatio?: '9:16' | '16:9';
  durationSeconds?: 4 | 5 | 6 | 8 | 10;
  model?: string;
  location?: string;
  bustCache?: boolean;
  mock?: boolean;
  headline?: string;
  sceneType?: string;
}

export interface VeoVideoResult {
  videoUrl: string;
  localPath: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9';
  modelUsed: string;
  source: 'veo-3.1' | 'cache' | 'fallback';
  cached: boolean;
}

const DEFAULT_VEO_MODEL = env.veoModel || 'veo-3.1-fast-generate-001';
const DEFAULT_LOCATION = env.googleCloudLocation || 'us-central1';

/** Ensures directory for video storage exists and returns absolute path. */
export function getVideosDir(): string {
  const dir = path.resolve(process.cwd(), 'data/videos');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Enriches raw editorial scene prompts to adhere to Google Veo 3.1 broadsheet cinematography:
 * - 9:16 vertical orientation
 * - 35mm master anamorphic optics, shallow depth of field
 * - Authentic directional lighting, physical textures
 * - Gentle camera motion (slow tracking, subtle dolly)
 * - Negative constraints (zero CGI, zero morphing, zero cartoon)
 */
export function enhanceVeoPrompt(
  rawPrompt: string,
  context?: {
    headline?: string;
    onScreenHeadline?: string;
    prominentMetric?: string;
    sceneType?: string;
  }
): string {
  const clean = (typeof rawPrompt === 'string' ? rawPrompt : '').trim();
  if (clean.includes('Google Veo 3.1') && clean.includes('35mm master')) {
    return clean;
  }

  const cameraMove =
    context?.sceneType === 'hook'
      ? 'dramatic push-in dolly, arresting cinematic motion'
      : context?.sceneType === 'data_stat' || context?.sceneType === 'inflection'
      ? 'smooth lateral tracking pan across empirical environment'
      : context?.sceneType === 'mechanism'
      ? 'fluid documentary tracking shot of operational process'
      : context?.sceneType === 'friction'
      ? 'subtle handheld documentary drift, tense focus'
      : 'gentle ascending crane or slow pullback, wide institutional vista';

  return `vertical 9:16 frame, 9:16 vertical video, Google Veo 3.1 cinematography, photorealistic documentary style for Neue Zürcher Zeitung. 35mm master anamorphic lens, shallow depth of field, authentic directional daylight, natural textures, ${cameraMove}. Subject: ${clean}. Zero CGI, zero 3D animation, zero morphing, no cartoon, no CGI artifacts, no distorted text, uncompressed cinematic European broadsheet realism.`;
}

/** Generates a stable SHA-256 hash for caching video generation results. */
function generateVideoHash(prompt: string, options: VeoVideoOptions): string {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        prompt: prompt.trim(),
        aspectRatio: options.aspectRatio || '9:16',
        durationSeconds: options.durationSeconds || 5,
        model: options.model || DEFAULT_VEO_MODEL,
      })
    )
    .digest('hex');
}

/**
 * Generates an animated vertical 9:16 MP4 video from a high-resolution keyframe
 * using ffmpeg's Ken Burns pan-zoom filter. Serves as a rock-solid, high-fidelity fallback.
 */
async function generateMotionKeyframeFallback(
  prompt: string,
  hash: string,
  options: VeoVideoOptions
): Promise<VeoVideoResult> {
  const videosDir = getVideosDir();
  const filename = `fallback_${hash.slice(0, 16)}.mp4`;
  const outputPath = path.join(videosDir, filename);

  if (fs.existsSync(outputPath) && !options.bustCache) {
    return {
      videoUrl: `/api/videos/${filename}`,
      localPath: outputPath,
      durationSeconds: options.durationSeconds || 5,
      aspectRatio: options.aspectRatio || '9:16',
      modelUsed: 'ken-burns-fallback',
      source: 'cache',
      cached: true,
    };
  }

  console.log(`[VeoService] Generating high-res keyframe for motion fallback...`);
  const imageResult = await generateImagen3Image(prompt, {
    aspectRatio: options.aspectRatio === '16:9' ? '16:9' : '9:16',
    headline: options.headline,
    bustCache: options.bustCache,
  });

  const duration = options.durationSeconds || 5;
  const tempImgPath = path.join(videosDir, `temp_${hash.slice(0, 12)}.jpg`);

  try {
    const imgUrl = imageResult.imageUrl || (imageResult as any).url || '';
    if (imgUrl.startsWith('data:image/')) {
      const base64Data = imgUrl.split(',')[1] || imgUrl;
      await fs.promises.writeFile(tempImgPath, Buffer.from(base64Data, 'base64'));
    } else if (imgUrl.startsWith('http')) {
      const res = await fetch(imgUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.promises.writeFile(tempImgPath, buf);
    } else if (imgUrl.startsWith('/api/images/')) {
      const localRel = imgUrl.replace('/api/images/', '');
      const localFile = path.join(process.cwd(), 'data', 'images', localRel);
      if (fs.existsSync(localFile)) {
        await fs.promises.copyFile(localFile, tempImgPath);
      } else {
        await execAsync(`ffmpeg -y -f lavfi -i color=c=0x18181b:s=1080x1920:d=1 -vframes 1 "${tempImgPath}"`);
      }
    } else if (fs.existsSync(imgUrl)) {
      await fs.promises.copyFile(imgUrl, tempImgPath);
    } else {
      await execAsync(
        `ffmpeg -y -f lavfi -i color=c=0x18181b:s=1080x1920:d=1 -vframes 1 "${tempImgPath}"`
      );
    }

    const totalFrames = duration * 25;
    const filter = `scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(zoom+0.0012,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25`;

    await execAsync(
      `ffmpeg -y -loop 1 -i "${tempImgPath}" -t ${duration} -vf "${filter}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outputPath}"`
    );

    return {
      videoUrl: `/api/videos/${filename}`,
      localPath: outputPath,
      durationSeconds: duration,
      aspectRatio: options.aspectRatio || '9:16',
      modelUsed: 'ken-burns-fallback',
      source: 'fallback',
      cached: false,
    };
  } finally {
    if (fs.existsSync(tempImgPath)) {
      fs.unlinkSync(tempImgPath);
    }
  }
}

/**
 * Generates vertical shortform video clip using Google Cloud Vertex AI Veo 3.1:
 * - veo-3.1-fast-generate-001 (default, ~20-30s latency)
 * - veo-3.1-generate-001 (high cinematic depth)
 * Automatically caches results to disk and gracefully falls back to animated keyframe motion.
 */
export async function generateVeoVideo(
  promptOrParams: string | ({ visualPrompt?: string; prompt?: string } & VeoVideoOptions),
  optionsArg: VeoVideoOptions = {}
): Promise<VeoVideoResult> {
  let prompt: string;
  let options: VeoVideoOptions;
  if (typeof promptOrParams === 'object' && promptOrParams !== null) {
    prompt = (promptOrParams as any).visualPrompt || (promptOrParams as any).prompt || '';
    options = { ...(promptOrParams as any), ...optionsArg };
  } else {
    prompt = String(promptOrParams || '');
    options = optionsArg;
  }

  const model = options.model || DEFAULT_VEO_MODEL;
  const location = options.location || DEFAULT_LOCATION;
  const aspectRatio = options.aspectRatio || '9:16';
  const rawDuration = options.durationSeconds || 5;
  // Vertex AI Veo 3.1 text_to_video specifically requires 4, 6, or 8 seconds
  const durationSeconds = rawDuration <= 4 ? 4 : rawDuration <= 6 ? 6 : 8;

  const enhancedPrompt = enhanceVeoPrompt(prompt, {
    headline: options.headline,
    sceneType: options.sceneType,
  });

  const hash = generateVideoHash(enhancedPrompt, {
    ...options,
    aspectRatio,
    durationSeconds,
    model,
  });

  const videosDir = getVideosDir();
  const filename = `veo_${hash.slice(0, 16)}.mp4`;
  const outputPath = path.join(videosDir, filename);

  // 1. Check disk cache
  if (fs.existsSync(outputPath) && !options.bustCache) {
    console.log(`[VeoService] Cache hit for video "${filename}"`);
    return {
      videoUrl: `/api/videos/${filename}`,
      localPath: outputPath,
      durationSeconds,
      aspectRatio,
      modelUsed: model,
      source: 'cache',
      cached: true,
    };
  }

  // 2. Mock mode bypass
  if (options.mock) {
    console.log(`[VeoService] Mock mode active, generating fallback motion clip`);
    return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
  }

  // 3. Call Vertex AI Veo 3.1
  try {
    const token = await getAccessToken();
    const projectId = await getProjectId();

    if (!token || !projectId) {
      console.warn(`[VeoService] No GCP credentials available, falling back`);
      return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
    }

    const predictUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;

    console.log(`[VeoService] Initiating Veo 3.1 predictLongRunning on ${model}...`);
    const predictRes = await fetch(predictUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ prompt: enhancedPrompt }],
        parameters: {
          aspectRatio,
          durationSeconds,
          sampleCount: 1,
        },
      }),
    });

    if (!predictRes.ok) {
      const errText = await predictRes.text();
      console.warn(
        `[VeoService] Vertex AI predictLongRunning failed (HTTP ${predictRes.status}): ${errText.slice(0, 200)}`
      );
      return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
    }

    const predictData = (await predictRes.json()) as { name?: string };
    if (!predictData.name) {
      console.warn(`[VeoService] No operation name in predict response`);
      return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
    }

    const operationName = predictData.name;
    const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;

    // 4. Poll operation status with backoff
    const startTime = Date.now();
    const maxPollMs = 120_000;
    let delayMs = 4000;

    console.log(`[VeoService] Polling operation: ${operationName}`);
    while (Date.now() - startTime < maxPollMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const pollRes = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operationName }),
      });

      if (!pollRes.ok) {
        console.warn(`[VeoService] Poll request returned HTTP ${pollRes.status}`);
        delayMs = Math.min(8000, delayMs * 1.25);
        continue;
      }

      const pollData = (await pollRes.json()) as {
        done?: boolean;
        error?: { message?: string; code?: number };
        response?: {
          videos?: Array<{
            bytesBase64Encoded?: string;
            gcsUri?: string;
          }>;
        };
      };

      if (pollData.error) {
        console.error(`[VeoService] Generation error: ${pollData.error.message}`);
        return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
      }

      if (pollData.done) {
        const videoObj = pollData.response?.videos?.[0];
        if (videoObj?.bytesBase64Encoded) {
          const videoBuf = Buffer.from(videoObj.bytesBase64Encoded, 'base64');
          await fs.promises.writeFile(outputPath, videoBuf);
          console.log(
            `[VeoService] Successfully generated & saved Veo 3.1 video! Size: ${videoBuf.byteLength} bytes`
          );

          return {
            videoUrl: `/api/videos/${filename}`,
            localPath: outputPath,
            durationSeconds,
            aspectRatio,
            modelUsed: model,
            source: 'veo-3.1',
            cached: false,
          };
        }
        break;
      }

      delayMs = Math.min(8000, delayMs * 1.2);
    }

    console.warn(`[VeoService] Operation timed out, falling back to motion keyframe`);
    return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
  } catch (err) {
    console.error(`[VeoService] Unexpected exception:`, err);
    return generateMotionKeyframeFallback(enhancedPrompt, hash, options);
  }
}

/** Check if Veo service is ready on current GCP credentials. */
export async function getVeoServiceStatus(): Promise<{
  configured: boolean;
  model: string;
  projectId: string | null;
}> {
  try {
    const token = await getAccessToken();
    const projectId = await getProjectId();
    return {
      configured: Boolean(token && projectId),
      model: DEFAULT_VEO_MODEL,
      projectId,
    };
  } catch {
    return {
      configured: false,
      model: DEFAULT_VEO_MODEL,
      projectId: null,
    };
  }
}
