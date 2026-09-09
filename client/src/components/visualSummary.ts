import { VisualizationOpportunity } from "../types";

export function summarizeVisualization(
  visual: VisualizationOpportunity,
): string {
  if (visual.chartType === "timeline" && visual.events?.length) {
    return `${visual.events.length} events are ordered from ${visual.events[0].dateLabel} to ${visual.events[visual.events.length - 1].dateLabel}.`;
  }
  if (!visual.data.length || !visual.series.length)
    return "This visual has no numeric data to summarize yet.";
  const first = visual.data[0];
  const last = visual.data[visual.data.length - 1];
  const primary = visual.series[0].label;
  const highest = visual.data.reduce(
    (best, point) => (point.values[0] > best.values[0] ? point : best),
    first,
  );
  const lowest = visual.data.reduce(
    (best, point) => (point.values[0] < best.values[0] ? point : best),
    first,
  );
  const direction =
    last.values[0] > first.values[0]
      ? "increases"
      : last.values[0] < first.values[0]
        ? "decreases"
        : "stays broadly level";
  return `${primary} ${direction} from ${first.label} to ${last.label}; the highest value is ${highest.values[0]} at ${highest.label}, and the lowest is ${lowest.values[0]} at ${lowest.label}.`;
}
