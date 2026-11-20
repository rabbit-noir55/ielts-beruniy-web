import { book, book2 } from "../data/book";

/**
 * O'yinlar uchun lug'at: `book.js` dagi Essential 4000 juftliklari.
 * Bitta inglizcha so'z faqat bir marta olinadi; tarjimaning birinchi
 * ma'nosi ishlatiladi (verguldan keyingi qismlar tashlanadi).
 */

const clean = (text) => String(text || "").split(",")[0].trim();

let cache = null;

export function allPairs() {
  if (cache) return cache;
  const seen = new Set();
  const pairs = [];
  [book, book2].forEach((source) => {
    Object.values(source || {}).forEach((unit) => {
      if (!Array.isArray(unit)) return;
      unit.forEach((item) => {
        const english = String(item?.english || "").trim();
        const uzbek = clean(item?.uzbek);
        if (!english || !uzbek) return;
        if (!/^[a-zA-Z' -]+$/.test(english) || english.length > 22) return;
        const key = english.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        pairs.push({ english, uzbek });
      });
    });
  });
  cache = pairs;
  return pairs;
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function samplePairs(count) {
  return shuffle(allPairs()).slice(0, count);
}

/** To'g'ri javobga o'xshash, lekin boshqa ma'noli variantlar. */
export function distractors(pair, count = 3) {
  const pool = allPairs().filter(
    (item) =>
      item.english !== pair.english &&
      item.uzbek !== pair.uzbek &&
      item.english.length <= 14
  );
  return shuffle(pool).slice(0, count);
}

export function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}
