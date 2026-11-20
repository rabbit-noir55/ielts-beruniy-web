/** Qurilma turini aniqlash — tool/o'yinlarni filtrlash uchun. */

export function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const smallScreen = window.matchMedia?.("(max-width: 640px)")?.matches;
  const ua = navigator?.userAgent || "";
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|IELTSApp/i.test(ua);
  return Boolean(mobileUa || coarse || smallScreen);
}

export function deviceType() {
  return isMobileDevice() ? "mobile" : "desktop";
}

/** `both` har doim ko'rinadi. */
export function matchesDevice(itemDevice, current = deviceType()) {
  if (!itemDevice || itemDevice === "both") return true;
  return itemDevice === current;
}
