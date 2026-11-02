const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_URL) ||
  "https://ieltsberuniy.onrender.com/api";

export const ERROR_TEXT = {
  invalid_code: "QR kod noto'g'ri.",
  external_user: "Siz guruhga biriktirilmagansiz.",
  blocked: "Hisobingiz bloklangan.",
  no_location: "GPS aniqlanmadi. Geoloatsiyani yoqing.",
  low_accuracy: "GPS aniqligi past. Ochiq joyga chiqing.",
  too_far: "Siz markaz hududida emassiz.",
  no_lesson: "Bugun bu guruhda dars yo'q.",
  no_schedule: "Guruh jadvali to'liq emas. Ustozga murojaat qiling.",
  out_of_window: "Dars vaqti oynasidan tashqarida.",
  already_marked: "Bugun allaqachon belgilangan.",
};

export function token() {
  try {
    const fromApp = window.AndroidBridge?.getToken?.();
    if (fromApp) return fromApp;
  } catch {
    /* native ko'prigi yo'q */
  }
  // Brauzerda lokal sinov uchun (ilovada AndroidBridge ishlatiladi).
  try {
    return localStorage.getItem("ielts_token") || "";
  } catch {
    return "";
  }
}

export function openSiteTab() {
  try {
    window.AndroidBridge?.openSiteTab?.();
  } catch {
    /* native yo'q */
  }
}

export async function scan({ code, latitude, longitude, accuracy }) {
  const t = token();
  if (!t) {
    const err = new Error("Avval saytda tizimga kiring.");
    err.code = "no_token";
    throw err;
  }

  const res = await fetch(`${API_BASE}/attendance/scan/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${t}`,
    },
    body: JSON.stringify({ code, latitude, longitude, accuracy }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* bo'sh javob */
  }

  if (!res.ok) {
    const key = data?.code || "";
    const err = new Error(data?.error || ERROR_TEXT[key] || `HTTP ${res.status}`);
    err.code = key;
    err.status = res.status;
    throw err;
  }
  return data;
}
