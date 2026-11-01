export const HIGHLIGHT_COLORS = [
  { id: "yellow", name: "Yellow", color: "#fbbf24" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "red", name: "Red", color: "#ef4444" },
];

export const DEFAULT_HIGHLIGHT = HIGHLIGHT_COLORS[0].id;

export function getHighlightColor(id) {
  return HIGHLIGHT_COLORS.find((c) => c.id === id) || HIGHLIGHT_COLORS[0];
}