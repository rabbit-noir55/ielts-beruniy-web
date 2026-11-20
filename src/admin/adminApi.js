import { BASE_URL, request } from "../utils/api";

function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminSummary = () => request("/admin/summary/");

export const adminStudents = (params) => request(`/admin/students/${qs(params)}`);
export const adminStudentAction = (id, body) =>
  request(`/admin/students/${id}/action/`, { method: "POST", body });

export const adminGroups = () => request("/admin/groups/");
export const adminGroupSave = (body) =>
  request("/admin/groups/", { method: "POST", body });
export const adminGroupDelete = (id) =>
  request(`/admin/groups/${id}/delete/`, { method: "POST", body: {} });

export const adminAttendanceToday = (groupId) =>
  request(`/admin/attendance/today/${qs({ group: groupId })}`);
export const adminAttendanceMark = (student) =>
  request("/admin/attendance/mark/", { method: "POST", body: { student } });

export const adminLeague = () => request("/admin/league/");
export const adminLeagueAction = (body) =>
  request("/admin/league/", { method: "POST", body });

export const adminMocks = () => request("/admin/mocks/");
export const adminMockDetail = (id, source) =>
  request(`/admin/mocks/${id}/${qs({ source })}`);
export const adminCambridgeBook = (series) =>
  request(`/admin/mocks/book/${series}/`);
export const adminMockAction = (body) =>
  request("/admin/mocks/", { method: "POST", body });

export const adminGames = () => request("/admin/games/");
export const adminGameResults = (id) => request(`/admin/games/${id}/results/`);
export const adminGameAction = (body) =>
  request("/admin/games/", { method: "POST", body });

export const adminTools = () => request("/admin/tools/");
export const adminToolDetail = (id) => request(`/admin/tools/${id}/`);
export const adminToolAction = (body) =>
  request("/admin/tools/", { method: "POST", body });
export const adminGameDetail = (id) => request(`/admin/games/${id}/`);

export const adminAttendanceMonthly = (params) =>
  request(`/admin/attendance/monthly/${qs(params)}`);
export const adminAttendanceDayOff = () => request("/admin/attendance/day-off/");
export const adminAttendanceDayOffAction = (body) =>
  request("/admin/attendance/day-off/", { method: "POST", body });
export const adminStudentDetail = (id) => request(`/admin/students/${id}/detail/`);

export const adminAttendanceScanLog = (date) =>
  request(`/admin/attendance/scan-log/${qs({ date })}`);
export const adminAttendanceQr = () => request("/admin/attendance/qr/");

export const adminLeagueChecks = () => request("/admin/league/checks/");
export const adminLeagueCheckToggle = (student, skill, pin) =>
  request("/admin/league/checks/", { method: "POST", body: { student, skill, pin } });

export const adminAIProviders = () => request("/admin/ai/providers/");
export const adminAIProviderSave = (body) =>
  request("/admin/ai/providers/", { method: "POST", body });
export const adminAIModels = () => request("/admin/ai/models/");
export const adminAIModelSave = (body) =>
  request("/admin/ai/models/", { method: "POST", body });
export const adminAIUsage = (params) => request(`/admin/ai/usage/${qs(params)}`);

// ── Onlayn darslar ──────────────────────────────────────────────────────────

export const adminLessons = (group) => request(`/admin/lessons/${qs({ group })}`);
export const adminLessonDetail = (id) => request(`/admin/lessons/${id}/`);
export const adminLessonAction = (body) =>
  request("/admin/lessons/", { method: "POST", body });
export const adminLessonComments = (videoId) =>
  request(`/admin/lessons/videos/${videoId}/comments/`);

// ── Guruh materiallari ──────────────────────────────────────────────────────

export const adminResources = (group) =>
  request(`/admin/resources/${qs({ group })}`);
export const adminResourceAction = (body) =>
  request("/admin/resources/", { method: "POST", body });

/** Multipart yuklash: rasm → data URL, PDF/video → storage URL. */
export async function adminUpload(file, kind) {
  const token = localStorage.getItem("ielts_token");
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const response = await fetch(`${BASE_URL}/admin/resources/upload/`, {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
    body: form,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const error = new Error(data?.detail || "Faylni yuklab bo'lmadi.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
