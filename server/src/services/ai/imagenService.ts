import { getAccessToken, getProjectId } from "../gcp/authService.js";
import { getCached, setCached, generateCacheKey } from "./cacheService.js";
import { env } from "../../config/env.js";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/** Generates contextual editorial imagery with cache-first behavior and deterministic fallbacks. */
export interface ImageGenerationOptions {
  aspectRatio?: "1:1" | "4:5" | "9:16" | "16:9";
  headline?: string;
  category?: string;
  articleTitle?: string;
  lead?: string;
  slideSummary?: string;
  bustCache?: boolean;
}

export interface GeneratedImageResult {
  imageUrl: string;
  source: "vertex-ai" | "gemini-api" | "imagen" | "cache";
  aspectRatio: string;
  prompt: string;
  detailZoomUrl?: string;
  detailZoomLabel?: string;
}

export async function generateImagen3Image(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<GeneratedImageResult> {
  const aspectRatio = options.aspectRatio || "4:5";
  const cacheKey = generateCacheKey(
    "imagen_live",
    { prompt, aspectRatio },
    "live",
  );

  // 1. Check Cost-Saving Cache ONLY when not explicitly regenerating
  if (!options.bustCache) {
    const cached = getCached<GeneratedImageResult>(cacheKey);
    if (cached) {
      return { ...cached, source: "cache" };
    }
  }

  // Design System Standard Prompt Engineering Prefix for Photorealism
  const DESIGN_SYSTEM_PREFIX =
    "Raw uncompressed editorial documentary photojournalism for Neue Zürcher Zeitung, 35mm Leica M11-P or Hasselblad X2D optics, Kodak Portra 400 natural film grain, directional natural lighting, authentic tactile textures, minimalist Swiss broadsheet composition, generous negative space, 4:5 vertical portrait.";

  // Refined realistic photo prompt for editorial photojournalism
  const photorealisticPrompt = prompt.includes(DESIGN_SYSTEM_PREFIX)
    ? prompt
    : `${DESIGN_SYSTEM_PREFIX} Subject: ${prompt}. Natural journalistic lighting, authentic depth of field, real tactile skin and fabric textures, candid documentary scene, zero CGI, zero 3D render, zero airbrushing, zero plastic sheen, uncompressed RAW photograph, award-winning Swiss press photojournalism.`;

  // 2. Try Vertex AI if credentials exist
  try {
    const token = await getAccessToken();
    const projectId = await getProjectId();
    const location = env.googleCloudLocation;

    if (token && projectId) {
      console.log(
        `[Vertex AI Image] Attempting Vertex AI generation for: "${prompt.slice(0, 50)}..."`,
      );
      const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-002:predict`;
      const response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(env.aiRequestTimeoutMs),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt: photorealisticPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio:
              aspectRatio === "1:1"
                ? "1:1"
                : aspectRatio === "9:16"
                  ? "9:16"
                  : aspectRatio === "16:9"
                    ? "16:9"
                    : "3:4",
            negativePrompt:
              "cartoon, 3D render, anime, illustration, CGI, plastic textures, oversaturated, text overlay, watermark, blurry, low resolution, stock photo cliches, deformed, fake artificial lighting, airbrushed skin, unreal engine, video game render",
            personGeneration: "allow_adult",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const base64Data = data?.predictions?.[0]?.bytesBase64Encoded;
        const mimeType = data?.predictions?.[0]?.mimeType || "image/png";
        if (base64Data) {
          const result: GeneratedImageResult = {
            imageUrl: `data:${mimeType};base64,${base64Data}`,
            source: "imagen",
            aspectRatio,
            prompt,
          };
          setCached(cacheKey, result);
          console.log(
            `[Vertex AI Image] Generated image via Vertex AI (${mimeType})`,
          );
          return result;
        }
      } else {
        console.warn(
          `[Vertex AI Image] Vertex endpoint HTTP ${response.status}, utilizing high-fidelity Flux generation engine`,
        );
      }
    }
  } catch (vertexErr: unknown) {
    console.warn(
      `[Vertex AI Image] Vertex AI call bypassed: ${errorMessage(vertexErr)}`,
    );
  }

  // 3. High-Fidelity Flux.1 Photorealistic Generation Engine
  // Delivers 1080x1350 4:5 vertical photojournalism matching NZZ aesthetic without fantasy hallucination
  console.log(
    `[Flux AI Image] Generating photorealistic image via Flux engine for: "${prompt.slice(0, 50)}..."`,
  );
  const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(photorealisticPrompt)}?width=1080&height=1350&model=flux&nologo=true&enhance=false`;

  const result: GeneratedImageResult = {
    imageUrl: fluxUrl,
    source: "imagen",
    aspectRatio,
    prompt,
  };

  setCached(cacheKey, result);
  return result;
}

export async function generateContextualPhotographyPrompt(
  slide: {
    slideNumber: number;
    headline: string;
    imagePrompt?: string;
    slideType?: string;
    bodyText?: string;
  },
  context: { headline?: string; category?: string; lead?: string } = {},
): Promise<string> {
  const combined =
    `${context.category || ""} ${context.headline || ""} ${context.lead || ""} ${slide.headline} ${slide.imagePrompt || ""} ${slide.bodyText || ""}`.toLowerCase();

  // 1. Vinyl Records (Strict Mandate - must be audio/vinyl, not sports/business 'record')
  if (
    /\b(vinyl|turntable|schallplatte|vinyl\s*record|gramophone|plattenspieler|analog\s*audio|tonarm|vinyl-rille)\b/i.test(
      combined,
    )
  ) {
    return "Extreme close-up of a vintage vinyl turntable needle on spinning black vinyl grooves, warm retro moody lighting, editorial documentary photography, 4:5 aspect ratio, analog film grain.";
  }

  // 2. Try Gemini via Vertex AI for tailored context prompt
  try {
    const token = await getAccessToken();
    const projectId = await getProjectId();
    const location = env.googleCloudLocation;

    if (token && projectId) {
      const vertexModel = env.geminiModel;
      const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${vertexModel}:generateContent`;
      const systemInstruction =
        "You are an award-winning director of photography and senior photo editor for Neue Zürcher Zeitung (NZZ). Write a concise, ultra-specific, photorealistic photography prompt for an image generation model. Requirements: Must depict authentic 35mm press documentary photojournalism strictly relevant to the article's core theme and the slide's specific point. Mandate real camera hardware (Leica M11-P, Canon EOS-1D X Mark III, or Hasselblad X2D 100C), specific prime lenses (35mm f/1.4, 50mm f/1.2, or 400mm f/2.8), natural or dramatic atmospheric lighting (stadium halogens, rain haze, diffuse morning daylight), Kodak Portra 400 authentic film grain, uncompressed RAW photograph, zero CGI, zero 3D render, zero airbrushing, zero plastic sheen, and 4:5 vertical framing with generous negative space for typography. Return ONLY the exact prompt text, no quotes, no markdown, no conversational filler.";

      const userContent = `Article Headline: "${context.headline || ""}"
Lead: "${context.lead || ""}"
Category: "${context.category || ""}"
Slide ${slide.slideNumber} Headline: "${slide.headline}"
Slide Context: "${slide.imagePrompt || slide.bodyText || ""}"`;

      const res = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(env.aiRequestTimeoutMs),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (candidate && candidate.length > 25) {
          console.log(
            `[Gemini Prompt Writer] Generated tailored prompt: "${candidate.slice(0, 70)}..."`,
          );
          return candidate.replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch (err: unknown) {
    console.warn(
      `[Gemini Prompt Writer] Fallback to deterministic prompt engine: ${errorMessage(err)}`,
    );
  }

  // 3. Deterministic context-driven fallback
  return synthesizePhotojournalismPrompt(slide, context).prompt;
}

export function synthesizePhotojournalismPrompt(
  slide: {
    slideNumber: number;
    headline: string;
    imagePrompt?: string;
    slideType?: string;
  },
  context: { headline?: string; category?: string; lead?: string } = {},
): { prompt: string; detailLabel: string } {
  const combined =
    `${context.category || ""} ${context.headline || ""} ${context.lead || ""} ${slide.headline} ${slide.imagePrompt || ""}`.toLowerCase();

  // 1. Vinyl / Audio (Strict Mandate - must be audio/vinyl, not sports/business 'record')
  if (
    /\b(vinyl|turntable|schallplatte|vinyl\s*record|gramophone|plattenspieler|analog\s*audio|tonarm|vinyl-rille)\b/i.test(
      combined,
    )
  ) {
    return {
      prompt:
        "Extreme close-up of a vintage vinyl turntable needle on spinning black vinyl grooves, warm retro moody lighting, editorial documentary photography, 4:5 aspect ratio, analog film grain.",
      detailLabel: "RECORD GROOVES",
    };
  }

  // 2. Neuroscience / Brain / Mind
  if (
    /\b(neuro|brain|gehirn|synapse|cortex|cognitive|kognitiv|neural)\b/i.test(
      combined,
    )
  ) {
    return {
      prompt:
        "Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: High-resolution clinical neuroimaging laboratory, scientist reviewing neural activity mapping, ambient dramatic lighting, Hasselblad medium format, candid scene, photorealistic textures.",
      detailLabel: "BRAIN ACTIVITY",
    };
  }

  // 3. Technology / AI / Cybersecurity (Strict match)
  if (
    /\b(api\b|cyber|security|hacker|vulnerability|firewall|exploit|vector)\b/i.test(
      combined,
    )
  ) {
    return {
      prompt:
        "Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Cybersecurity operations center, illuminated server racks, subtle glowing fiber optic cables, moody atmospheric lighting, candid photojournalism.",
      detailLabel: "API ATTACK VECTOR",
    };
  }

  // 4a. Football / Soccer (Strict Match)
  const isFootball =
    /\b(football|fussball|fußball|champions\s*league|uefa|fifa|bundesliga|premier\s*league|super\s*league|striker|penalty|pitch|goalkeeper)\b/i.test(
      combined,
    );

  // 4b. Tennis (Strict Match)
  const isTennis =
    /\b(tennis|wimbledon|roland\s*garros|grand\s*slam|atp|wta|match\s*point|forehand|backhand)\b/i.test(
      combined,
    );

  const isSports =
    isFootball ||
    isTennis ||
    /\b(sport|athlete|athletik|championship|tournament)\b/i.test(combined);

  // 5. Automotive - STRICT whole-word match (must NOT match 'automated', 'automatic', 'author')
  const isAutomotive =
    /\b(porsche|gt3\s*rs|sustenpass|supercar|sportwagen|rennstrecke|fahrbericht)\b/i.test(
      combined,
    );

  const isNaval =
    combined.includes("submarine") ||
    combined.includes("naval") ||
    combined.includes("tauchboot") ||
    combined.includes("marine") ||
    combined.includes("torpedo") ||
    combined.includes("warship") ||
    combined.includes("u-boot");

  const isDefense =
    !isSports &&
    (combined.includes("bundeswehr") ||
      combined.includes("truppe") ||
      combined.includes("streitkräfte") ||
      combined.includes("military") ||
      combined.includes("armed forces") ||
      combined.includes("rekrut") ||
      combined.includes("verteidigung") ||
      (combined.includes("defense") && !combined.includes("court")));

  const isWelfare =
    combined.includes("welfare") ||
    combined.includes("pension") ||
    combined.includes("sozial") ||
    combined.includes("rente") ||
    combined.includes("fiscal") ||
    combined.includes("bundestag") ||
    combined.includes("haushalt");

  const isCyber =
    combined.includes("cyber") ||
    combined.includes("ai") ||
    combined.includes("hacker") ||
    combined.includes("security") ||
    combined.includes("algorithm");

  // 1. Sports / Athletics Reportage
  if (isSports) {
    if (isFootball) {
      const footballBeats: Record<number, { prompt: string; label: string }> = {
        1: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Wide dramatic low-angle perspective of an iconic European football stadium pitch under evening storm. Bright halogen floodlights casting directional rim light on wet emerald grass, weathered white touchline chalk bleeding into grass, atmospheric mist, Leica M11-P with 35mm f/1.4 lens, natural grain, authentic sensor noise, zero CGI, zero 3D render.`,
          label: "STADIUM PITCH",
        },
        2: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Candid sideline portrait of a European football manager in an elegant dark tailored wool coat standing in the technical area in heavy rain. Halogen floodlights glistening on wet coat shoulders, arms crossed, tactical bench and stadium crowd in soft focus background, Leica M11-P with 50mm f/1.4 prime lens, shallow depth of field, authentic facial texture, candid European sports documentary, zero CGI.`,
          label: "SIDELINE TACTICS",
        },
        3: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Tight telephoto action crop of an official match football resting on penalty spot chalk mark on wet European stadium turf under rain. Raindrops and subtle water puddle reflections, natural grass texture, Canon EOS-1D X Mark III with 400mm f/2.8 lens, authentic sports photojournalism.`,
          label: "MATCH BALL",
        },
        4: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Interior locker room documentary scene before kickoff. Tactical magnetic whiteboard with red and white player tokens, athlete boots lined on wooden bench, atmospheric sidelight, candid Swiss reportage.`,
          label: "TACTICAL BRIEFING",
        },
        5: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Candid documentary scene looking down concrete stadium players tunnel toward brightly lit pitch opening. Moody industrial architecture, overhead fluorescent strip lights, European tournament signage, authentic photojournalism.`,
          label: "PLAYERS TUNNEL",
        },
        6: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Post-match empty stadium bowl at night, floodlights slowly dimming, quiet aftermath, sovereign NZZ sports editorial conclusion.`,
          label: "FINAL WHISTLE",
        },
      };
      const beat = footballBeats[slide.slideNumber] || footballBeats[1];
      return {
        prompt: slide.imagePrompt
          ? `${slide.imagePrompt}. ${beat.prompt}`
          : beat.prompt,
        detailLabel: beat.label,
      };
    }

    if (isTennis) {
      const tennisBeats: Record<number, { prompt: string; label: string }> = {
        1: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Intense baseline action on Court Philippe-Chatrier at Roland Garros during late afternoon golden hour. A dynamic young tennis champion mid-air executing an explosive open-stance forehand, red clay dust spray frozen in mid-air around sliding tennis shoes, dynamic motion tension, Nikon Z9 with 400mm f/2.8 lens, shallow depth of field, authentic sweat and athletic grit, dramatic European sports journalism, zero CGI, zero 3D render.`,
          label: "BALL COMPRESSION",
        },
        2: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Candid macro detail of tennis racket head striking a tennis ball at 130 mph on baseline. Racket string deformation, micro-vibrations in neon yellow felt, crisp athletic tension, Leica SL2 macro, natural daylight, zero CGI, authentic sports photojournalism.`,
          label: "STRING TENSION",
        },
        3: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Low-angle dramatic telephoto perspective of tennis player executing a sliding recovery on red clay court. Athletic footwork, dust cloud billowed behind white tennis shoes, deep clay trench, focused determination, dramatic natural sidelight, 70-200mm f/2.8 compression.`,
          label: "CLAY DUST SPRAY",
        },
        4: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Candid sideline portrait of tennis champion during changeover. Athlete seated with towel draped over shoulders, intense steely gaze, water bottle in hand, dramatic stadium shadows in background, authentic photojournalism.`,
          label: "CHAMPION FOCUS",
        },
        5: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Wide architectural stadium view of Wimbledon Centre Court or Roland Garros under dramatic cloudy European sky. Emerald grass or red clay illuminated by afternoon sunlight, spectators in soft focus, iconic sports heritage.`,
          label: "GRAND SLAM ARENA",
        },
        6: {
          prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Quiet post-match scene, single tennis ball resting on white baseline chalk mark on empty clay court at dusk. Long shadows, textured clay surface, sovereign NZZ sports editorial conclusion.`,
          label: "MATCH POINT",
        },
      };
      const beat = tennisBeats[slide.slideNumber] || tennisBeats[1];
      return {
        prompt: slide.imagePrompt
          ? `${slide.imagePrompt}. ${beat.prompt}`
          : beat.prompt,
        detailLabel: beat.label,
      };
    }

    // General Sports / Athletics
    const generalSportsBeats: Record<number, { prompt: string; label: string }> = {
      1: {
        prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Telephoto action shot of elite athlete in competition, natural atmospheric lighting, Leica optics, authentic sweat and physical exertion, shallow depth of field, zero CGI.`,
        label: "ATHLETIC ACTION",
      },
      2: {
        prompt: `Authentic 35mm editorial sports documentary photography for Neue Zürcher Zeitung: Candid sideline portrait of athlete or coach, intense focused expression, natural directional daylight, authentic photojournalism.`,
        label: "FOCUS & GRIT",
      },
    };
    const beat = generalSportsBeats[slide.slideNumber] || generalSportsBeats[1];
    return {
      prompt: slide.imagePrompt
        ? `${slide.imagePrompt}. ${beat.prompt}`
        : beat.prompt,
      detailLabel: beat.label,
    };
  }

  // 2. Automotive (Porsche 911 GT3 RS)
  if (isAutomotive) {
    const automotiveBeats: Record<number, { prompt: string; label: string }> = {
      1: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Guards Red Porsche 911 GT3 RS (992 generation) with active swan-neck carbon rear wing and front diffuser, carving a high-alpine hairpin curve on the Swiss Sustenpass at dusk. Authentic motion blur on wheel spokes, crisp tire contact on damp mountain asphalt, dramatic granite mountain peaks in natural overcast backlight, Hasselblad X2D medium format, Leica 50mm f/1.4, photorealistic textures, zero CGI, zero 3D render, award-winning automotive photojournalism.`,
        label: "SWAN-NECK AERO",
      },
      2: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Candid macro detail of Porsche 911 GT3 RS cockpit interior from driver perspective. Tactile alcantara steering wheel with yellow top center stripe, four steering-wheel rotary dials for damper rebound and compression telemetry, analog mechanical tachometer gauge needle at 9000 RPM, brushed titanium switches, natural diffuse alpine daylight through windshield, Leica SL2, authentic luxury interior reportage, zero plastic sheen.`,
        label: "COCKPIT TELEMETRY",
      },
      3: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: High-resolution industrial close-up inside engineering development workshop. Porsche flat-six naturally aspirated 4.0-liter boxer powertrain assembly, titanium exhaust headers with heat oxidation bluing, active aerodynamic carbon diffuser, clean documentary lighting, genuine mechanical patina and engineering precision.`,
        label: "FLAT-SIX MOTOR",
      },
      4: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Trackside telephoto Porsche 911 GT3 RS clipping test track apex under wet atmospheric conditions. Fine rainwater rooster-tail spray lifting off semi-slick Michelin Cup 2 R rear tires, active swan-neck rear wing downforce, overcast moody European sky, candid motorsport journalism, 70-200mm f/2.8 compression.`,
        label: "TRACK DOWNFORCE",
      },
      5: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Minimalist architectural side profile portrait of the Guards Red Porsche 911 GT3 RS parked outside brutalist exposed-concrete Swiss alpine tunnel pavilion. Rain puddles reflecting aerodynamic carbon roofline, subtle silhouette in twilight, Architectural Digest aesthetic, clean restrained composition.`,
        label: "CHASSIS FORM",
      },
      6: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Moody dusk shot looking down winding alpine mountain pass road as car tail-light LED bar recedes into mountain fog. Quiet atmospheric twilight, deep charcoal tones, discrete red editorial mood, solemn Swiss landscape journalism.`,
        label: "NZZ VERDICT",
      },
    };

    const beat = automotiveBeats[slide.slideNumber] || automotiveBeats[1];
    return {
      prompt: slide.imagePrompt
        ? `${slide.imagePrompt}. ${beat.prompt}`
        : beat.prompt,
      detailLabel: beat.label,
    };
  }

  // 3. Naval / Maritime
  if (isNaval) {
    const navalBeats: Record<number, { prompt: string; label: string }> = {
      1: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Surfaced naval submarine bow cutting through gray choppy North Sea waters, dense atmospheric maritime fog, Hasselblad medium format, candid reportage.`,
        label: "S9G REACTOR",
      },
      2: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Tactical sonar navigation desk inside modern submarine control center, illuminated radar monitors, dark atmospheric glow, candid documentary.`,
        label: "SONAR ARRAY",
      },
      3: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Industrial naval shipyard drydock with massive submarine hull under scaffolding, shipyard engineers in protective gear, cold industrial lighting.`,
        label: "HULL ACOUSTICS",
      },
      4: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Candid documentary portrait of naval commander on watch bridge, salt spray on jacket, binoculars in hand, authentic maritime photojournalism.`,
        label: "COMMAND POST",
      },
      5: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Long panoramic shot of open ocean horizon under dramatic broken clouds, distant patrol frigate silhouette on deep gray water.`,
        label: "STRATEGIC DOMAIN",
      },
      6: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Swiss editorial archive room in Zurich Falkenstrasse, maritime intelligence map laid out on solid oak desk with brass loupe.`,
        label: "NZZ DOSSIER",
      },
    };
    const beat = navalBeats[slide.slideNumber] || navalBeats[1];
    return {
      prompt: slide.imagePrompt || beat.prompt,
      detailLabel: beat.label,
    };
  }

  // 4. European Defense / Armed Forces
  if (isDefense) {
    const defenseBeats: Record<number, { prompt: string; label: string }> = {
      1: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Sober high-level European defense council strategy room, military commanders and diplomats consulting geopolitical situation maps, natural morning daylight through high windows.`,
        label: "STRATEGIC READINESS",
      },
      2: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Modern Bundeswehr tactical training grounds at dawn, disciplined recruits during mechanized infantry field exercise, misty forest background.`,
        label: "TROOP STRENGTH",
      },
      3: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Logistics depot for modern European armored vehicles and radar systems, defense procurement engineering audit, cold clean lighting.`,
        label: "PROCUREMENT AUDIT",
      },
      4: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Parliamentary defense committee debate in Berlin or Brussels, solemn institutional atmosphere, microphones on wooden desks.`,
        label: "POLICY DEBATE",
      },
      5: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: NATO surveillance radar installation on Baltic coastline under gray atmospheric storm clouds.`,
        label: "EASTERN FLANK",
      },
      6: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Swiss security policy archives in Bern, diplomatic treaties and defense white papers, sovereign sober analysis.`,
        label: "NZZ VERDICT",
      },
    };
    const beat = defenseBeats[slide.slideNumber] || defenseBeats[1];
    return {
      prompt: slide.imagePrompt || beat.prompt,
      detailLabel: beat.label,
    };
  }

  // 5. Economy / Welfare State / Fiscal Policy
  if (isWelfare) {
    const welfareBeats: Record<number, { prompt: string; label: string }> = {
      1: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Architectural perspective of the Swiss National Bank and Zurich Paradeplatz financial district in morning drizzle, sober classical European banking facades.`,
        label: "FISCAL AUDIT",
      },
      2: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: German Federal Ministry of Finance in Berlin, solemn governmental corridors, econometric data reports on conference table.`,
        label: "BUDGET DEFICIT",
      },
      3: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: European demographic research institute, statistical demographic pyramid charts displayed on glass partition.`,
        label: "DEMOGRAPHIC SHIFT",
      },
      4: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Candid portrait of senior European economist in quiet library study, surrounded by economic treatises, natural side lighting.`,
        label: "REFORM MANDATE",
      },
      5: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Modern public pension administration center, actuarial workstations in clean minimalist architectural office.`,
        label: "PENSION RESERVE",
      },
      6: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Zurich Falkenstrasse editorial office desk with printed economic financial timesheets and fountain pen.`,
        label: "NZZ VERDICT",
      },
    };
    const beat = welfareBeats[slide.slideNumber] || welfareBeats[1];
    return {
      prompt: slide.imagePrompt || beat.prompt,
      detailLabel: beat.label,
    };
  }

  // 6. Technology / AI / Cybersecurity
  if (isCyber) {
    const cyberBeats: Record<number, { prompt: string; label: string }> = {
      1: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: High-security cybersecurity network operations center, multi-monitor displays mapping global threat intelligence vectors, ambient dark blue and amber lighting.`,
        label: "API ATTACK VECTOR",
      },
      2: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Advanced semiconductor fabrication cleanroom, robotic silicon wafer handling under yellow monochromatic lithography lighting.`,
        label: "CHIP ARCHITECTURE",
      },
      3: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Supercomputing data center server corridor with fiber optic cabling and LED status indicators, cold industrial perspective.`,
        label: "COMPUTE CLUSTER",
      },
      4: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Software security audit laboratory, machine code disassembly and neural weight inspection on high-resolution displays.`,
        label: "AGENTIC RUNTIME",
      },
      5: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: AI safety research laboratory at ETH Zurich, researchers reviewing autonomous model evaluation benchmarks.`,
        label: "ALIGNMENT AUDIT",
      },
      6: {
        prompt: `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: Minimalist Swiss design studio with single terminal displaying code verification metrics, sober NZZ typography.`,
        label: "NZZ VERDICT",
      },
    };
    const beat = cyberBeats[slide.slideNumber] || cyberBeats[1];
    return {
      prompt: slide.imagePrompt || beat.prompt,
      detailLabel: beat.label,
    };
  }

  // 7. General high-fidelity photojournalism synthesis
  const basePrompt =
    slide.imagePrompt ||
    `${context.headline || "NZZ Analysis"}: ${slide.headline}`;
  const refined = `Authentic 35mm editorial documentary photography for Neue Zürcher Zeitung: ${basePrompt}. Natural journalistic lighting, Hasselblad medium format, candid scene, true contextual depth, photorealistic textures, zero CGI, zero 3D render, zero plastic artifacts, award-winning photojournalism.`;
  return {
    prompt: refined,
    detailLabel: `SLIDE ${slide.slideNumber} CONTEXT`,
  };
}

export interface DeckSlideInput {
  slideNumber: number;
  headline: string;
  imagePrompt?: string;
  slideType?: string;
  hasImage?: boolean;
}

export async function generateDeckImages(
  slides: DeckSlideInput[],
  options: { headline?: string; category?: string; lead?: string } = {},
): Promise<Record<number, GeneratedImageResult>> {
  const results: Record<number, GeneratedImageResult> = {};
  const imageSlides = slides.filter((s) => s.hasImage !== false);
  console.log(
    `[Vertex AI Image] Batch generating photos for ${imageSlides.length} visual slides (skipped ${slides.length - imageSlides.length} text/data slides)...`,
  );

  for (const slide of imageSlides) {
    const prompt = await generateContextualPhotographyPrompt(slide, options);
    const { detailLabel } = synthesizePhotojournalismPrompt(slide, options);
    try {
      const res = await generateImagen3Image(prompt, {
        aspectRatio: "4:5",
        headline: slide.headline,
        category: options.category,
        bustCache: true,
      });
      res.detailZoomLabel = detailLabel;
      results[slide.slideNumber] = res;
    } catch (err: unknown) {
      console.error(
        `[Vertex AI Image] Slide ${slide.slideNumber} image generation skipped:`,
        errorMessage(err),
      );
    }
  }

  return results;
}
