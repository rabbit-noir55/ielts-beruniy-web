export function tg() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function isTelegram() {
  const app = tg();
  // Telegram skripti brauzerda ham yuklanishi mumkin, lekin initData
  // faqat haqiqiy Telegram WebApp ichida beriladi.
  return !!(app && app.initData);
}
