const STORAGE_KEY = "ielts_onboarding_v1";

export function isOnboardingDone() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingDone() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* xotira yopiq */
  }
}

/** Qo'llanmani qayta ochish (Sozlamalardan). */
export function restartOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* xotira yopiq */
  }
  window.dispatchEvent(new Event("ielts:onboarding"));
}
