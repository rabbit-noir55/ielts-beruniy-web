import { request } from "./api";

export function getLeaderboard(week = "active") {
  return request(`/competition/leaderboard/?week=${encodeURIComponent(week)}`);
}

export function getWeeks() {
  return request("/competition/weeks/");
}

export function toggleCheck({ student, skill, week }) {
  return request("/competition/toggle/", {
    method: "POST",
    body: { student, skill, week },
  });
}
