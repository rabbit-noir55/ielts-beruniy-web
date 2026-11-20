import { request } from "./api";

export function getLeaderboard(week = "active") {
  return request(`/competition/leaderboard/?week=${encodeURIComponent(week)}`);
}

export function getWeeks() {
  return request("/competition/weeks/");
}

export function toggleCheck({ student, skill, week, pin, webauthn, authMethod }) {
  const body = {
    student,
    skill,
    week,
    auth_method: authMethod || (webauthn ? "biometric" : "pin"),
  };
  if (pin) body.pin = pin;
  if (webauthn) body.webauthn = webauthn;
  return request("/competition/toggle/", {
    method: "POST",
    body,
  });
}
