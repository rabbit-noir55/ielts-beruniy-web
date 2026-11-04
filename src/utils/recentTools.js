/**
 * Oxirgi ishlatilgan tool'lar (header dropdown uchun).
 * localStorage'da saqlanadi: [{ to, label }], eng yangisi birinchi.
 */

const KEY = "recent_tools_v1";
const MAX = 5;

const TOOL_CATALOG = {
  "/tools/ai": "AI Checker & Generator",
  "/tools/band": "Band Calculator",
  "/tools/vocabulary": "Vocabulary Quiz",
  "/tools/speaking-draw": "Random Speaking",
  "/typing": "Typing test",
  "/tools/words": "Word Counter",
  "/tools/dictionary": "Dictionary",
};

export function getRecentTools() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((it) => it && it.to) : [];
  } catch {
    return [];
  }
}

export function recordRecentTool(to, label) {
  if (!to || !label) return;
  try {
    const list = getRecentTools().filter((it) => it.to !== to);
    list.unshift({ to, label });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* localStorage yo'q — e'tiborsiz */
  }
}

/** Joriy pathname tool bo'lsa, uning nomini qaytaradi (custom uchun null). */
export function toolLabelForPath(pathname) {
  if (TOOL_CATALOG[pathname]) return TOOL_CATALOG[pathname];
  return null;
}

export function isCustomToolPath(pathname) {
  return pathname.startsWith("/tools/play/");
}
