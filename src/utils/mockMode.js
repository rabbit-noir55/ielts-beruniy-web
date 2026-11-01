let active = false;
const listeners = new Set();

export function setMockActive(v) {
  active = !!v;
  listeners.forEach((fn) => fn(active));
}

export function getMockActive() {
  return active;
}

export function onMockChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}