import { API_URL } from "./theme";

export const ERROR_TEXT = {
  invalid_code: "QR kod noto'g'ri.",
  external_user: "Siz guruhga biriktirilmagansiz.",
  blocked: "Hisobingiz bloklangan.",
  no_location: "GPS aniqlanmadi. Geolokatsiyani yoqing.",
  low_accuracy: "GPS aniqligi past. Ochiq joyga chiqing.",
  too_far: "Siz markaz hududida emassiz.",
  no_lesson: "Bugun bu guruhda dars yo'q.",
  no_schedule: "Guruh jadvali to'liq emas. Ustozga murojaat qiling.",
  out_of_window: "Dars vaqti oynasidan tashqarida.",
  already_marked: "Bugun allaqachon belgilangan.",
  no_token: "Avval saytda tizimga kiring.",
};

export async function scanAttendance({ token, code, latitude, longitude, accuracy }) {
  if (!token) {
    const err = new Error(ERROR_TEXT.no_token);
    err.code = "no_token";
    throw err;
  }

  const res = await fetch(`${API_URL}/attendance/scan/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      code: String(code || "").trim().toUpperCase(),
      latitude,
      longitude,
      accuracy,
    }),
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
