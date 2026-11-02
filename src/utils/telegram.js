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

/**
 * Sayt Android ilovaning WebView'i ichida ochilganmi?
 *
 * Ilova User-Agent'ga "IELTSApp" qo'shadi (WebViewFragment.java).
 * UA har navigatsiyada saqlanadi, query param esa yo'qoladi — shuning uchun UA.
 *
 * Nega kerak: Google OAuth embedded WebView'da ishlamaydi
 * (disallowed_useragent), shuning uchun ilova ichida Google tugmasi yashiriladi.
 */
export function isInApp() {
  if (typeof navigator === "undefined") return false;
  return /IELTSApp/i.test(navigator.userAgent || "");
}

/** Google login faqat oddiy brauzerda ishlaydi. */
export function canUseGoogleLogin() {
  return !isTelegram() && !isInApp();
}
