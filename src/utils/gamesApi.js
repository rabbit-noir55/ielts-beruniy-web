import { request } from "./api";

/**
 * O'yinlar API.
 *
 * Har o'yin — bitta faylli HTML (sandbox iframe). Natija `score` + `stats`
 * ko'rinishida yuboriladi; leaderboard har o'yin uchun alohida.
 */

export function fetchGames() {
  return request("/games/");
}

export function fetchGame(gameId) {
  return request(`/games/${gameId}/`);
}

export function fetchGameResults(gameId, limit = 200) {
  return request(`/games/${gameId}/results/?limit=${limit}`);
}

export function submitGameResult(gameId, data) {
  return request(`/games/${gameId}/results/`, {
    method: "POST",
    body: { data },
  });
}

/**
 * Sandbox hujjatini tayyorlaydi: CSP meta qo'shadi.
 * O'yin tashqi internetga chiqa olmaydi, cookie/localStorage ko'rmaydi.
 */
const CSP =
  "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; " +
  "font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

export function buildSandboxDoc(html) {
  const code = String(html || "");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  const headMatch = code.match(/<head[^>]*>/i);
  if (headMatch) {
    const at = headMatch.index + headMatch[0].length;
    return code.slice(0, at) + meta + code.slice(at);
  }
  return meta + code;
}
