export const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://127.0.0.1:8000/api";

const TOKEN_KEY = "ielts_token";
const USER_KEY = "ielts_user";
const PENDING_KEY = "ielts_pending_results";
const BG_IMAGE_KEY = "ielts_bg_image";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export async function refreshUser() {
  if (!isAuthenticated()) return null;
  try {
    const user = await request("/auth/me/");
    if (user && user.id) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }
  } catch (err) {
    // Faqat 401 (token yaroqsiz) bo'lgandagina chiqish.
    // Network xatolari (broken pipe, timeout) va boshqa xatolarda
    // tokenni saqlab qolamiz — keyingi poll'da qayta urinib ko'ramiz.
    if (err && err.status === 401) {
      clearAuth();
    }
  }
  return null;
}

export async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    let data = null;
    try {
      data = await res.json();
      if (data.detail) detail = data.detail;
      else if (data.error) detail = data.error;
      else if (typeof data === "object") detail = Object.values(data).flat().join(" ");
    } catch {
      detail = `HTTP ${res.status}`;
    }
    const err = new Error(detail);
    err.status = res.status;
    err.data = data;
    if (data?.code) err.code = data.code;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function register({ email, password, first_name, last_name }) {
  return request("/auth/register/", {
    method: "POST",
    body: { email, password, first_name, last_name },
  });
}

export function login(email, password) {
  return request("/auth/login/", { method: "POST", body: { email, password } });
}

export function googleLogin(credential) {
  return request("/auth/google/", { method: "POST", body: { credential } });
}

export function updateProfile(payload) {
  return request("/auth/me/", { method: "PATCH", body: payload });
}

export function changePassword(old_password, new_password) {
  return request("/auth/change-password/", {
    method: "POST",
    body: { old_password, new_password },
  });
}

const REVEAL_PASSWORD_ERRORS = {
  "Google hisobi mos kelmadi.": "Google hisobi mos kelmadi.",
  "Parol o'qituvchi tomonidan o'rnatilmagan.": "Parol o'qituvchi tomonidan o'rnatilmagan.",
  "Faqat o'quvchi uchun.": "Faqat o'quvchi uchun.",
};

export async function revealPassword(credential) {
  try {
    return await request("/auth/reveal-password/", {
      method: "POST",
      body: { credential },
    });
  } catch (err) {
    const mapped = REVEAL_PASSWORD_ERRORS[err.message];
    if (mapped) throw new Error(mapped, { cause: err });
    throw err;
  }
}

export function getSettings() {
  const settings = { autoSync: true };
  try {
    const stored = JSON.parse(localStorage.getItem("ielts_settings"));
    if (stored && typeof stored === "object") {
      settings.autoSync = stored.autoSync !== false;
    }
  } catch {
    /* ignore parse errors */
  }
  return settings;
}

export function setSettings(patch) {
  const settings = getSettings();
  Object.assign(settings, patch);
  localStorage.setItem("ielts_settings", JSON.stringify(settings));
  return settings;
}

export function getBackgroundImage() {
  try {
    return localStorage.getItem(BG_IMAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setBackgroundImage(dataUrl) {
  localStorage.setItem(BG_IMAGE_KEY, dataUrl);
}

export function clearBackgroundImage() {
  localStorage.removeItem(BG_IMAGE_KEY);
}

function submitResult(payload) {
  return request("/results/", { method: "POST", body: payload });
}

export function saveTypingResult(payload) {
  return request("/typing/results/", { method: "POST", body: payload });
}

export function fetchTypingLeaderboard(mode) {
  return request(`/typing/leaderboard/?mode=${mode}`);
}

function enqueuePending(payload) {
  let queue = [];
  try {
    const stored = JSON.parse(localStorage.getItem(PENDING_KEY));
    if (Array.isArray(stored)) queue = stored;
  } catch {
    /* ignore parse errors */
  }
  queue.push({ payload, at: Date.now() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
}

function getPendingResults() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) || [];
  } catch {
    return [];
  }
}

export function clearPendingResults() {
  localStorage.removeItem(PENDING_KEY);
}

export function hasMockAccess() {
  const user = getUser();
  // External user (guruh yo'q) — mock access bor
  if (!user?.group_detail) return true;
  const groupParams = user.group_detail.parameters;
  if (groupParams && typeof groupParams.mock_access === 'boolean') {
    return groupParams.mock_access;
  }
  return true;
}

export function getUserGroupName() {
  const user = getUser();
  return user?.group_detail?.name || '';
}

export function getUserGroupLogo() {
  const user = getUser();
  return user?.group_detail?.logo_url || null;
}

function getUserGroupType() {
  const user = getUser();
  return user?.group_detail?.group_type || 'ielts';
}

export function isIeltsGroup() {
  return getUserGroupType() === 'ielts';
}

export function isRoundUpGroup() {
  return getUserGroupType() === 'roundup';
}

export async function submitResultSafe(payload) {
  if (!isAuthenticated()) return false;
  if (!getSettings().autoSync) return false;
  try {
    await submitResult(payload);
    return true;
  } catch (err) {
    if (err && err.status >= 400 && err.status < 500) {
      // Server rejected (e.g. daily test limit / validation) — do NOT queue, surface error.
      throw err;
    }
    enqueuePending(payload);
    return false;
  }
}

export async function flushPendingResults() {
  if (!isAuthenticated()) return 0;
  const pending = getPendingResults();
  if (pending.length === 0) return 0;
  let synced = 0;
  const remaining = [];
  for (const item of pending) {
    try {
      await submitResult(item.payload);
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
  return synced;
}
