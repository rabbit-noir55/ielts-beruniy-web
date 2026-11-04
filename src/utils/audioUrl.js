const OSS_BASE = "https://oss.jumpinto.com";

/**
 * Audio manzilini har qanday muhitda ishlaydigan absolut URL ga aylantiradi.
 *
 * Ma'lumotlarda Cambridge audio yo'llari nisbiy (`/resource/...`) yoki eski
 * `/oss/...` proxy ko'rinishida uchraydi. Statik hostingda (Netlify) bunday
 * yo'llar SPA `index.html` ni qaytaradi va audio yuklanmaydi — shuning uchun
 * ularni to'g'ridan-to'g'ri OSS manziliga aylantiramiz.
 */
export function resolveAudioUrl(raw) {
  if (!raw) return null;
  const url = String(raw).trim();
  if (!url) return null;
  if (/^(blob:|data:)/i.test(url)) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/oss/")) return `${OSS_BASE}/${url.slice(5)}`;
  if (url.startsWith("/")) return `${OSS_BASE}${url}`;
  return url;
}
