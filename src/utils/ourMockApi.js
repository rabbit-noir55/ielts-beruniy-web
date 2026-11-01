import { BASE_URL } from "./api";

/**
 * Our Mock ma'lumotlari.
 *
 * Tartib:
 *   1) backend API (`/api/mocks/...`) — ustoz admin paneldan qo'shgan testlar;
 *   2) bo'lmasa — statik `public/json/ourMocks/*.json` (eski testlar / offline).
 *
 * Shu tufayli backend ishlamasa ham sayt buzilmaydi.
 */

const STATIC_INDEX = "/json/ourMocks/index.json";
const staticPath = (skill, series) => `/json/ourMocks/${skill}_test${series}.json`;

async function readJson(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    throw new Error("not-json");
  }
  return res.json();
}

/** Barcha mavjud mocklar ro'yxati: [{series, skills, titles}] */
export async function fetchOurMockList() {
  try {
    const res = await fetch(`${BASE_URL}/mocks/`);
    if (res.ok) {
      const data = await readJson(res);
      if (Array.isArray(data?.items) && data.items.length > 0) {
        return data.items;
      }
    }
  } catch {
    // backend yo'q — statik ro'yxatga o'tamiz
  }

  try {
    const res = await fetch(STATIC_INDEX);
    if (res.ok) {
      const data = await readJson(res);
      if (Array.isArray(data?.items)) return data.items;
    }
  } catch {
    // statik ro'yxat ham yo'q
  }
  return [];
}

/**
 * Bitta mock payloadi (ourmock/v2).
 * @param {object} opts
 * @param {string} [opts.previewToken] — preview uchun token (series o'rniga)
 */
export async function fetchOurMock(series, skill, { previewToken } = {}) {
  if (previewToken) {
    const res = await fetch(`${BASE_URL}/mocks/preview/${previewToken}/`);
    if (!res.ok) {
      throw new Error("Preview topilmadi yoki muddati tugagan.");
    }
    return readJson(res);
  }

  try {
    const res = await fetch(`${BASE_URL}/mocks/${series}/${skill}/`);
    if (res.ok) {
      return await readJson(res);
    }
    // 404 — statik faylga o'tamiz
  } catch {
    // tarmoq xatosi — statik faylga o'tamiz
  }

  let res;
  try {
    res = await fetch(staticPath(skill, series));
  } catch {
    throw new Error("Test ma'lumotlari topilmadi.");
  }
  if (!res.ok) {
    throw new Error(`Test ma'lumotlari topilmadi (HTTP ${res.status}).`);
  }
  try {
    return await readJson(res);
  } catch {
    throw new Error("Test ma'lumotlari topilmadi.");
  }
}

export function getPreviewToken(searchParams) {
  return searchParams?.get?.("preview") || null;
}
