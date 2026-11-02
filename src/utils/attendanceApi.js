import { request } from "./api";

const SCAN_ERROR_MESSAGES = {
  invalid_code: "QR kod noto'g'ri.",
  external_user: "Siz guruhga biriktirilmagansiz.",
  blocked: "Hisobingiz bloklangan.",
  no_location: "GPS aniqlanmadi. Iltimos, geolokatsiyani yoqing.",
  low_accuracy: "GPS aniqligi past. Iltimos, ochiq joyga chiqing.",
  too_far: "Siz markaz hududida emassiz.",
  no_lesson: "Bugun bu guruhda dars yo'q.",
  out_of_window: "Dars vaqti oynasidan tashqarida.",
  already_marked: "Bugun allaqachon davomat belgilangan.",
};

export function myAttendance() {
  return request("/attendance/my/");
}

export async function scanAttendance({ code, latitude, longitude, accuracy }) {
  try {
    return await request("/attendance/scan/", {
      method: "POST",
      body: { code, latitude, longitude, accuracy },
    });
  } catch (err) {
    const msg = SCAN_ERROR_MESSAGES[err.code] || err.message || "Davomatni tekshirishda xatolik";
    throw new Error(msg, { cause: err });
  }
}


