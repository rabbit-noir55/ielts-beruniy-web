/** Oxirgi o'ynalgan o'yinlar (Games sahifasidagi "Recently" filtri uchun). */

const KEY = "recent_games_v1";
const MAX = 30;

export function getRecentGames() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((it) => typeof it === "string") : [];
  } catch {
    return [];
  }
}

export function recordRecentGame(to) {
  if (!to) return;
  try {
    const list = getRecentGames().filter((it) => it !== to);
    list.unshift(to);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}
