export function tg() {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function isTelegram() {
  return !!tg();
}
