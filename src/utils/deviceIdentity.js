/**
 * Qurilma identifikatsiyasi: bir qurilma — bir hisob uchun.
 *
 * `device_id` — localStorage/bridge'dagi UUID; `fingerprint` — normalizatsiyalangan
 * signallar hash'i (brauzer, Telegram Mini App va ilovani bog'lash uchun).
 */

const ID_KEY = "ielts_device_id";
let cachedId = null;

function randomId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fallback */
  }
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDeviceId() {
  if (cachedId) return cachedId;
  try {
    const bridgeId = window?.AndroidBridge?.getDeviceId?.();
    if (bridgeId) {
      cachedId = String(bridgeId);
      try {
        localStorage.setItem(ID_KEY, cachedId);
      } catch {
        /* xotira yopiq */
      }
      return cachedId;
    }
  } catch {
    /* bridge yo'q */
  }
  try {
    let value = localStorage.getItem(ID_KEY);
    if (!value) {
      value = randomId();
      localStorage.setItem(ID_KEY, value);
    }
    cachedId = value;
    return cachedId;
  } catch {
    cachedId = randomId();
    return cachedId;
  }
}

export function getPlatform() {
  if (typeof window === "undefined") return "web";
  const ua = navigator?.userAgent || "";
  if (/IELTSApp/i.test(ua)) return "android";
  if (window?.Telegram?.WebApp?.initData) return "telegram";
  return "web";
}

function normalizeUserAgent(ua) {
  return String(ua || "")
    .replace(/Telegram[^\s)]*/gi, "")
    .replace(/IELTSApp[^\s)]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getFingerprint() {
  if (typeof window === "undefined") return "";
  const nav = typeof navigator !== "undefined" ? navigator : {};
  let timeZone;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    timeZone = "";
  }
  let screenSize;
  try {
    const [a, b] = [window.screen?.width || 0, window.screen?.height || 0].sort(
      (x, y) => x - y
    );
    screenSize = `${a}x${b}x${window.screen?.colorDepth || 0}`;
  } catch {
    screenSize = "";
  }
  const signals = [
    getPlatform(),
    normalizeUserAgent(nav.userAgent),
    screenSize,
    timeZone,
    nav.language || "",
    nav.hardwareConcurrency || 0,
  ];
  return fnv1a(signals.join("|"));
}

export function deviceHeaders() {
  return {
    "X-Device-Id": getDeviceId(),
    "X-Device-Fingerprint": getFingerprint(),
    "X-Device-Platform": getPlatform(),
  };
}
