import { request } from "./api";
import { buildSandboxDoc } from "./gamesApi";

/** Ustoz qo'shgan tools (vositalar). */
export function fetchTools() {
  return request("/tools/");
}

export function fetchTool(toolId) {
  return request(`/tools/${toolId}/`);
}

export function getToolState(toolId, key) {
  const q = key ? `?key=${encodeURIComponent(key)}` : "";
  return request(`/tools/${toolId}/state/${q}`);
}

export function setToolState(toolId, key, value) {
  return request(`/tools/${toolId}/state/`, {
    method: "POST",
    body: { key, value },
  });
}

export function rateGame(gameId, starred) {
  return request(`/games/${gameId}/rating/`, {
    method: "POST",
    body: { starred },
  });
}

export { buildSandboxDoc };
