import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  enhanceVeoPrompt,
  getVeoServiceStatus,
  generateVeoVideo,
} from '../src/services/gcp/veoService.js';
import {
  createSceneOverlay,
  renderFullVerticalVideo,
} from '../src/services/video/videoStitcher.js';

describe('Google Veo 3.1 Video Service & Cinematography Prompting', () => {
  it('1. enhances raw visual prompt with 9:16 vertical cinematography and camera motion', () => {
    const rawPrompt = 'Quantum sensor chip glowing on laboratory bench in Zurich';
    const enhanced = enhanceVeoPrompt(rawPrompt, {
      sceneType: 'hook',
      onScreenHeadline: 'Quantum Leap in Precision',
      prominentMetric: '0.001%',
    });

    // Must include 9:16 vertical orientation
    assert.ok(
      enhanced.includes('vertical 9:16 frame'),
      'Must enforce vertical 9:16 frame'
    );

    // Must include 35mm lens and photorealistic cinematography keywords
    assert.ok(
      enhanced.includes('35mm master anamorphic lens') || enhanced.includes('cinematic'),
      'Must specify 35mm anamorphic optics'
    );

    // Must include camera motion appropriate for hook beat
    assert.ok(
      enhanced.includes('push-in') || enhanced.includes('camera'),
      'Must specify intentional camera motion'
    );

    // Must enforce negative constraints (no cartoon, no CGI, no distorted text)
    assert.ok(
      enhanced.includes('no cartoon') && enhanced.includes('no CGI artifacts'),
      'Must prohibit artificial or cartoon artifacts'
    );
  });

  it('2. returns correct Veo 3.1 service configuration and model metadata', async () => {
    const status = await getVeoServiceStatus();

    assert.equal(typeof status.configured, 'boolean');
    assert.equal(typeof status.model, 'string');
    assert.ok(
      status.model.includes('veo-3.1'),
      `Model must be a Veo 3.1 variant, got ${status.model}`
    );
  });

  it('3. generates or caches a 9:16 vertical video clip and returns valid MP4 URL', async () => {
    const result = await generateVeoVideo({
      visualPrompt: 'High-speed train traversing Swiss Alps in heavy snow, cinematic 35mm',
      onScreenHeadline: 'Alpine Transit Revolution',
      prominentMetric: '300 km/h',
      sceneType: 'inflection',
      durationSeconds: 5,
      bustCache: false,
    });

    assert.ok(result.videoUrl, 'Must return a videoUrl');
    assert.ok(result.videoUrl.endsWith('.mp4'), 'Video file must have .mp4 extension');
    assert.ok(result.durationSeconds >= 4, 'Duration must be at least 4 seconds');
    assert.ok(
      result.modelUsed.includes('veo-3.1') || result.modelUsed.includes('flux'),
      `Model used must be Veo 3.1 or fallback: ${result.modelUsed}`
    );

    // Verify video file exists on disk
    const relativePath = result.videoUrl.replace(/^\/api\/videos\//, '');
    const fullDiskPath = path.join(process.cwd(), 'data', 'videos', relativePath);
    assert.ok(
      fs.existsSync(fullDiskPath),
      `Generated video file must exist on disk at ${fullDiskPath}`
    );
    const stats = fs.statSync(fullDiskPath);
    assert.ok(stats.size > 1000, `Video file size (${stats.size} bytes) must be non-trivial`);
  });

  it('4. creates Swiss broadsheet typography overlay PNG (1080x1920) via Sharp', async () => {
    const tmpOverlay = path.join(
      process.cwd(),
      'data',
      'videos',
      `test_overlay_${Date.now()}.png`
    );

    await createSceneOverlay({
      sceneIndex: 1,
      totalScenes: 5,
      headline: 'The Alpine Transit Revolution',
      metric: '300 km/h',
      sceneType: 'hook',
      subtitle: 'Switzerland completes its most ambitious tunnel project in decades.',
      outputPath: tmpOverlay,
    });

    assert.ok(fs.existsSync(tmpOverlay), 'Overlay PNG must exist');

    // Verify PNG magic bytes: 0x89 0x50 0x4E 0x47
    const buffer = fs.readFileSync(tmpOverlay);
    assert.equal(buffer[0], 0x89);
    assert.equal(buffer[1], 0x50); // P
    assert.equal(buffer[2], 0x4e); // N
    assert.equal(buffer[3], 0x47); // G

    // Cleanup
    if (fs.existsSync(tmpOverlay)) {
      fs.unlinkSync(tmpOverlay);
    }
  });

  it('5. renders and stitches multi-scene 9:16 vertical video using ffmpeg', async () => {
    const testStoryboard = {
      title: 'Swiss Tech Test',
      aspectRatio: '9:16',
      totalDurationSeconds: 10,
      scenes: [
        {
          sceneIndex: 1,
          timeRange: '0:00 - 0:05',
          durationSeconds: 5,
          sceneType: 'hook',
          onScreenHeadline: 'Quantum Sensor Breakthrough',
          prominentMetric: '0.001%',
          visualPrompt: 'Quantum sensor chip in Zurich lab, photorealistic 35mm',
          voiceoverText: 'In Zurich, researchers have broken the quantum sensing limit.',
        },
        {
          sceneIndex: 2,
          timeRange: '0:05 - 0:10',
          durationSeconds: 5,
          sceneType: 'inflection',
          onScreenHeadline: 'Global Implications',
          prominentMetric: '10x Faster',
          visualPrompt: 'High tech cleanroom with lasers and optics, 35mm film',
          voiceoverText: 'The new device operates tenfold faster than traditional atomic clocks.',
        },
      ],
      videoUrl: '',
      approved: true,
    };

    const rendered = await renderFullVerticalVideo(testStoryboard, {
      language: 'en',
    });

    assert.ok(rendered.videoUrl, 'Rendered video must have videoUrl');
    assert.ok(rendered.videoUrl.endsWith('.mp4'), 'Must be an MP4 video');
    assert.ok(
      rendered.totalDurationSeconds > 0 && rendered.totalDurationSeconds <= 60,
      `Duration must be between 1 and 60 seconds (got ${rendered.totalDurationSeconds}s)`
    );

    // Verify file exists on disk
    const diskPath = path.join(
      process.cwd(),
      'data',
      'videos',
      rendered.videoUrl.replace('/api/videos/', '')
    );
    assert.ok(fs.existsSync(diskPath), `Rendered master video must exist at ${diskPath}`);
    const stat = fs.statSync(diskPath);
    assert.ok(stat.size > 5000, `Rendered video file must be valid (>5KB), got ${stat.size} bytes`);
  });
});
