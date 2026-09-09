import assert from "node:assert/strict";
import test from "node:test";
import { ArticleRecord } from "../types/article.js";
import {
  parseVisualizationAnalysis,
  VisualizationAnalysisError,
} from "./visualizationService.js";

const article: ArticleRecord = {
  id: "7a0afce3-14b0-4c58-8b8e-89d89b31d90c",
  importKey: "test",
  nzzId: null,
  documentId: null,
  headline: "Rents and wages",
  lead: null,
  authorLine: null,
  section: "Economy",
  language: "en",
  sourceUrl: null,
  publishedAt: null,
  body: [
    {
      id: "element-0001",
      type: "paragraph",
      text: "Rents rose from 100 to 136.",
    },
    {
      id: "element-0002",
      type: "paragraph",
      text: "Wages rose from 100 to 108.",
    },
  ],
  rawContent: {},
  sourceFormat: "NZZ_JSON",
  teaserImage: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validResponse = {
  summary: "One comparison is supported.",
  opportunities: [
    {
      title: "Rents outpace wages",
      subtitle: "Index, start = 100",
      rationale: "Two comparable series.",
      chartType: "line",
      confidence: 0.95,
      dataStatus: "ready",
      relatedElementIds: ["element-0001", "element-0002"],
      suggestedPlacementAfter: "element-0002",
      xAxisLabel: "Period",
      yAxisLabel: "Index",
      unit: "",
      series: [
        { key: "rent", label: "Rent" },
        { key: "wages", label: "Wages" },
      ],
      data: [
        {
          label: "Start",
          values: [100, 100],
          sourceElementIds: ["element-0001", "element-0002"],
        },
        {
          label: "End",
          values: [136, 108],
          sourceElementIds: ["element-0001", "element-0002"],
        },
      ],
      sourceNote: "Article text",
      caveats: [],
      accessibilitySummary: "Rents rose more than wages.",
    },
  ],
};

test("parses a valid visualization analysis and assigns stable result ids", () => {
  const parsed = parseVisualizationAnalysis(
    JSON.stringify(validResponse),
    article,
    "gemini-test",
  );
  assert.equal(parsed.model, "gemini-test");
  assert.equal(parsed.opportunities[0].id, "visual-1");
  assert.deepEqual(parsed.opportunities[0].data[1].values, [136, 108]);
});

test("rejects evidence references that do not exist in the article", () => {
  const invalid = structuredClone(validResponse);
  invalid.opportunities[0].data[0].sourceElementIds = ["element-9999"];
  assert.throws(
    () =>
      parseVisualizationAnalysis(
        JSON.stringify(invalid),
        article,
        "gemini-test",
      ),
    (error: unknown) =>
      error instanceof VisualizationAnalysisError &&
      error.code === "AI_RESPONSE_INVALID",
  );
});

test("rejects data points whose values do not match the series count", () => {
  const invalid = structuredClone(validResponse);
  invalid.opportunities[0].data[0].values = [100];
  assert.throws(
    () =>
      parseVisualizationAnalysis(
        JSON.stringify(invalid),
        article,
        "gemini-test",
      ),
    (error: unknown) =>
      error instanceof VisualizationAnalysisError &&
      error.code === "AI_RESPONSE_INVALID",
  );
});

test("parses evidence-linked timeline events and normalizes the editorial reason", () => {
  const timeline = {
    summary: "The article follows a clear policy shift.",
    opportunities: [
      {
        type: "TIMELINE",
        title: "Policy shift",
        subtitle: "",
        reason: "The chronology explains the change.",
        chartType: "timeline",
        confidence: 0.95,
        dataStatus: "ready",
        relatedElementIds: ["element-0001", "element-0002"],
        suggestedPlacementAfter: "element-0002",
        xAxisLabel: "",
        yAxisLabel: "",
        unit: "",
        series: [{ key: "events", label: "Events" }],
        data: [],
        events: [
          {
            dateLabel: "Earlier",
            title: "Rents rise",
            description: "Rents start at 100.",
            sourceParagraphIds: ["element-0001"],
          },
          {
            dateLabel: "Later",
            title: "Rents accelerate",
            description: "Rents reach 136.",
            sourceParagraphIds: ["element-0001"],
          },
        ],
        sourceNote: "Article text",
        caveats: [],
        accessibilitySummary: "A two-event chronology.",
      },
    ],
  };
  const parsed = parseVisualizationAnalysis(
    JSON.stringify(timeline),
    article,
    "gemini-test",
  );
  assert.equal(parsed.opportunities[0].type, "TIMELINE");
  assert.equal(
    parsed.opportunities[0].rationale,
    "The chronology explains the change.",
  );
});
