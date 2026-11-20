import { request } from "./api";

/** Onlayn darslar: pleylist, video, layk, izoh, material. */

export function fetchLessonsOverview() {
  return request("/lessons/overview/");
}

export function fetchPlaylist(playlistId) {
  return request(`/lessons/playlists/${playlistId}/`);
}

export function fetchLessonVideo(videoId) {
  return request(`/lessons/videos/${videoId}/`);
}

export function toggleVideoLike(videoId) {
  return request(`/lessons/videos/${videoId}/like/`, {
    method: "POST",
    body: {},
  });
}

export function fetchVideoComments(videoId) {
  return request(`/lessons/videos/${videoId}/comments/`);
}

export function addVideoComment(videoId, text) {
  return request(`/lessons/videos/${videoId}/comments/`, {
    method: "POST",
    body: { text },
  });
}

export function deleteVideoComment(commentId) {
  return request(`/lessons/comments/${commentId}/delete/`, {
    method: "POST",
    body: {},
  });
}

export function hideVideoComment(commentId, value = true) {
  return request(`/lessons/comments/${commentId}/hide/`, {
    method: "POST",
    body: { value },
  });
}

export function fetchLessonResources(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return request(`/lessons/resources/${query ? `?${query}` : ""}`);
}

export function fetchCambridgeMocks() {
  return request("/cambridge-mocks/");
}
