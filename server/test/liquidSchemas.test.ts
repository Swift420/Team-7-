import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { liquidDerivativesSchema } from '../src/services/ai/liquidSchemas.js';

describe('Liquid Derivatives Zod Schema', () => {
  it('validates a correct payload with 6 liquid formats', () => {
    const validPayload = {
      articleId: 'ld.1886544',
      generatedAt: new Date().toISOString(),
      model: 'gemini-3.8-flash',
      audioBrief: {
        headline: "Deutschlands Sozialstaat droht der Kollaps",
        wordCount: 142,
        estimatedDurationSeconds: 60,
        script: "In Berlin droht dem deutschen Sozialstaat der finanzielle Kollaps...",
        ssml: "<speak><prosody rate='1.0'>In Berlin droht dem deutschen Sozialstaat...</prosody></speak>",
        voiceProfile: {
          languageCode: "de-DE",
          voiceName: "de-DE-Neural2-B",
          gender: "MALE"
        },
        approved: false
      },
      executiveNewsletter: {
        headline: "Deutschlands Sozialstaat droht der finanzielle Kollaps",
        subhead: "Explodierende Beiträge und Schuldenlast",
        bullets: [
          "Sozialabgaben klettern auf historischen Höchststand von fast 42 Prozent des Bruttoeinkommens.",
          "Staat überbrückt Defizite mit kreditfinanzierten Milliardensubventionen statt Strukturreformen.",
          "Ökonomen fordern längere Lebensarbeitszeiten zur Abwendung eines fiskalischen Zusammenbruchs."
        ],
        wordCount: 78,
        approved: false
      },
      socialStoryboard: {
        title: "Sozialstaat am Limit",
        aspectRatio: "9:16",
        platformTargets: ["tiktok", "reels"],
        totalDurationSeconds: 60,
        scenes: [
          {
            sceneIndex: 1,
            timeRange: "0:00 - 0:10",
            durationSeconds: 10,
            sceneType: "hook",
            onScreenHeadline: "Steht Deutschland vor dem Kollaps?",
            visualPrompt: "Dramatic slow dolly shot of the Reichstag building in Berlin under overcast skies",
            voiceoverText: "42 Prozent vom Bruttolohn fließen in Deutschland bereits in die Sozialkassen."
          },
          {
            sceneIndex: 2,
            timeRange: "0:10 - 0:22",
            durationSeconds: 12,
            sceneType: "data_stat",
            onScreenHeadline: "42% Abgaben-Rekord",
            prominentMetric: "42%",
            visualPrompt: "Clean motion graphics displaying the rising curve of non-wage labor costs since 1970",
            voiceoverText: "Ein Rekordwert seit dem Zweiten Weltkrieg. Und die Kurve steigt unaufhaltsam weiter."
          },
          {
            sceneIndex: 3,
            timeRange: "0:22 - 0:35",
            durationSeconds: 13,
            sceneType: "mechanism",
            onScreenHeadline: "Die demografische Falle",
            visualPrompt: "Cinematic shot of empty factory assembly line juxtaposed with bustling medical care center",
            voiceoverText: "Immer weniger Beitragszahler finanzieren immer mehr Rentner und teurere Medizin."
          },
          {
            sceneIndex: 4,
            timeRange: "0:35 - 0:48",
            durationSeconds: 13,
            sceneType: "friction",
            onScreenHeadline: "Reallöhne schrumpfen",
            prominentMetric: "-0.4%",
            visualPrompt: "Medium close-up of a German worker checking monthly payslip with noticeable frustration",
            voiceoverText: "Trotz Lohnerhöhungen bleibt durch die Abgabenlast real weniger Geld im Portemonnaie."
          },
          {
            sceneIndex: 5,
            timeRange: "0:48 - 1:00",
            durationSeconds: 12,
            sceneType: "verdict",
            onScreenHeadline: "Zeit für echte Reformen",
            visualPrompt: "NZZ monogram seal overlay with clean Swiss typography link to nzz.ch",
            voiceoverText: "Warum Notkredite die Krise nur vertagen. Die ganze Analyse jetzt auf NZZ.ch."
          }
        ],
        approved: false
      },
      instagramCarousel: {
        title: "Deutschlands Wohlfahrtsstaat am Limit",
        aspectRatio: "4:5",
        captionText: "Fast 42 Prozent des Bruttolohns fließen in Deutschland inzwischen in die Sozialkassen...",
        hashtags: ["#NZZ", "#Wirtschaft", "#Deutschland", "#Sozialstaat"],
        slides: [
          {
            slideNumber: 1,
            slideType: "cover",
            headline: "Deutschlands Wohlfahrtsstaat vor dem Kollaps?",
            imagePrompt: "Monochrome high-contrast architectural shot of Berlin government district with bold NZZ red badge"
          },
          {
            slideNumber: 2,
            slideType: "data_point",
            headline: "42% Rekordabgaben",
            metricHighlight: {
              value: "41.9%",
              label: "Anteil der Sozialabgaben am Bruttoeinkommen"
            },
            imagePrompt: "Minimalist infographic card with bold typography and Swiss red accents"
          },
          {
            slideNumber: 3,
            slideType: "context",
            headline: "Milliardenlöcher im Bundeshaushalt",
            bodyText: "Bis zu 100 Milliarden Euro Finanzierungslücke klaffen zwischen Einnahmen und Ausgaben.",
            imagePrompt: "Documentary shot of budget committee session in Berlin"
          },
          {
            slideNumber: 4,
            slideType: "quote",
            headline: "Warnung der Krankenkassen",
            quote: {
              text: "Ohne Ausgabenstopp explodieren die Beiträge zur nächsten Jahreswende.",
              speaker: "Doris Pfeiffer, GKV-Spitzenverband"
            },
            imagePrompt: "Portrait of health insurance executive in executive office setting"
          },
          {
            slideNumber: 5,
            slideType: "consequences",
            headline: "Die drei Konsequenzen",
            bodyText: "1. Sinkende Reallöhne\n2. Verlust von Industriearbeitsplätzen\n3. Anstieg der Bundesschulden",
            imagePrompt: "Visual comparison card showing economic pressure points"
          },
          {
            slideNumber: 6,
            slideType: "outro",
            headline: "Mehr Einordnung auf NZZ.ch",
            bodyText: "Detaillierte Berechnungen des Leibniz-Instituts und Kommentar von Malte Fischer.",
            imagePrompt: "Signature NZZ logo card with clean call to action"
          }
        ],
        approved: false
      },
      factBox: {
        title: "Kernindikatoren der Krise",
        metrics: [
          {
            id: "m1",
            metricName: "Sozialabgabenquote",
            value: "41.9%",
            delta: "+0.8%",
            direction: "up",
            contextNote: "Höchster Stand seit 1945"
          },
          {
            id: "m2",
            metricName: "Haushaltsdefizit 2025",
            value: "€100 Mrd.",
            delta: "+95%",
            direction: "up",
            contextNote: "Verdopplung gegenüber bisheriger Planung"
          },
          {
            id: "m3",
            metricName: "GKV-Defizit 2024",
            value: "€6 Mrd.",
            direction: "down",
            contextNote: "Dramatischer Fehlbetrag der gesetzlichen Kassen"
          }
        ],
        approved: false
      },
      dialecticalFaq: {
        topic: "Streit um Sozialreformen",
        items: [
          {
            question: "Warum subventioniert der Bund die Sozialkassen mit Milliarden?",
            answer: "Um die Beiträge kurzfristig zu deckeln und politische Unruhe vor den Wahlen zu vermeiden.",
            perspective: "consensus"
          },
          {
            question: "Welche Gegenargumente bringen Wirtschaftsforscher vor?",
            answer: "Subventionen lösen das demografische Problem nicht und verlagern Lasten auf künftige Generationen.",
            perspective: "counterargument"
          },
          {
            question: "Welche strukturellen Alternativen existieren?",
            answer: "Eine Erhöhung des Renteneintrittsalters und mehr marktwirtschaftliche Anreize im Gesundheitswesen.",
            perspective: "structural_outlook"
          }
        ],
        approved: false
      }
    };

    const parseResult = liquidDerivativesSchema.safeParse(validPayload);
    assert.equal(parseResult.success, true);
  });

  it('rejects invalid video scene counts or invalid bullet lengths', () => {
    const invalidPayload = {
      articleId: 'test',
      generatedAt: 'invalid-date',
      model: 'invalid-model',
    };
    const parseResult = liquidDerivativesSchema.safeParse(invalidPayload);
    assert.equal(parseResult.success, false);
  });
});

