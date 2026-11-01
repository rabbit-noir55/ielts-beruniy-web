// Rasmiy IELTS conversion jadvallari (IELTS.org / British Council / IDP).
// Qatorlar band o'sishi tartibida qo'yilgan; lookup yuqoridan-pastga tekshiradi.

const LISTENING = [
  [39, 40, 9.0], [37, 38, 8.5], [35, 36, 8.0], [32, 34, 7.5],
  [30, 31, 7.0], [26, 29, 6.5], [23, 25, 6.0], [18, 22, 5.5],
  [16, 17, 5.0], [13, 15, 4.5], [10, 12, 4.0], [8, 9, 3.5],
  [6, 7, 3.0], [4, 5, 2.5], [2, 3, 2.0], [1, 1, 1.0], [0, 0, 0.0],
];

const READING_ACADEMIC = [
  [39, 40, 9.0], [37, 38, 8.5], [35, 36, 8.0],
  [33, 34, 7.5], [30, 32, 7.0], [27, 29, 6.5],
  [23, 26, 6.0], [19, 22, 5.5], [15, 18, 5.0],
  [13, 14, 4.5], [10, 12, 4.0], [8, 9, 3.5],
  [6, 7, 3.0],
];

const READING_GENERAL = [
  [40, 40, 9.0], [39, 39, 8.5], [38, 38, 8.0], [36, 37, 7.5],
  [34, 35, 7.0], [32, 33, 6.5], [30, 31, 6.0], [27, 29, 5.5],
  [23, 26, 5.0], [19, 22, 4.5], [15, 18, 4.0], [12, 14, 3.5],
  [9, 11, 3.0],
];

function lookup(raw, table) {
  for (const [lo, hi, band] of table) {
    if (raw >= lo && raw <= hi) return band;
  }
  return 0.0;
}

export function listeningBand(raw) {
  return lookup(raw, LISTENING);
}

export function readingBand(raw, type = "academic") {
  return lookup(raw, type === "general" ? READING_GENERAL : READING_ACADEMIC);
}

function roundBand(value) {
  const whole = Math.floor(value);
  const frac = value - whole;
  if (frac < 0.25) return whole;
  if (frac < 0.75) return whole + 0.5;
  return whole + 1;
}

export function calcOverall(bands) {
  const valid = bands.filter((b) => b != null && !isNaN(b));
  if (valid.length === 0) return null;
  return roundBand(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export function calcWritingBand(task1, task2) {
  if (
    task1 == null || task2 == null ||
    Number.isNaN(task1) || Number.isNaN(task2)
  ) return null;
  return roundBand(task1 / 3 + task2 * (2 / 3));
}

export function saveResult({ series, testNum, listening, reading, writing, writingTask, speaking, details }) {
  const key = `ielts_result_${series}_${testNum}`;
  const existing = (() => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  })();
  const result = { ...existing };
  if (listening != null) {
    result.listening = { raw: listening.raw, band: listening.band };
  }
  if (reading != null) {
    result.reading = { raw: reading.raw, band: reading.band };
  }
  if (details != null) {
    result.details = { ...result.details, ...details };
  }
  if (writing != null) result.writing = { band: writing };
  if (writingTask != null) {
    result.writing = result.writing || {};
    result.writing[`task${writingTask.taskPart}`] = writingTask.band;
    const taskBands = [result.writing.task1, result.writing.task2].filter(
      (b) => b != null && !isNaN(b),
    );
    if (taskBands.length === 2) {
      result.writing.band = calcWritingBand(taskBands[0], taskBands[1]);
    } else {
      delete result.writing.band;
    }
  }
  if (speaking != null) result.speaking = { band: speaking };
  result.overall = calcOverall([
    result.listening?.band,
    result.reading?.band,
    result.writing?.band,
    result.speaking?.band,
  ]);
  localStorage.setItem(key, JSON.stringify(result));
  return result;
}

function normalizeWriting(writing) {
  if (!writing) return writing;
  const hasTasks = writing.task1 != null || writing.task2 != null;
  if (hasTasks) {
    if (writing.task1 == null || writing.task2 == null) {
      return { ...writing, band: undefined };
    }
    return writing;
  }
  return { ...writing, band: undefined };
}

function recomputeOverall(data) {
  data.overall = calcOverall([
    data.listening?.band,
    data.reading?.band,
    data.writing?.band,
    data.speaking?.band,
  ]);
  return data;
}

export function loadResult(series, testNum) {
  try {
    const raw = localStorage.getItem(`ielts_result_${series}_${testNum}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.writing) data.writing = normalizeWriting(data.writing);
    return recomputeOverall(data);
  } catch { return null; }
}

export function loadAllResults() {
  const results = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const m = key && key.match(/^ielts_result_(\d+)_(\d+)$/);
    if (m) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.writing) data.writing = normalizeWriting(data.writing);
        results.push(recomputeOverall({ series: parseInt(m[1]), testNum: parseInt(m[2]), ...data }));
      } catch { /* ignore corrupted entry */ }
    }
  }
  return results.sort((a, b) => b.series - a.series || b.testNum - a.testNum);
}

export function deleteResult(series, testNum) {
  localStorage.removeItem(`ielts_result_${series}_${testNum}`);
}

/**
 * Mavjud natijadan barcha qismlarning xom ballarini yig'adi.
 * Har bir qism (part1, part2, ...) details ichida saqlanadi.
 */
export function getCumulativeRaw(skill, series, testNum) {
  const key = `ielts_result_${series}_${testNum}`;
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (!data?.details?.[skill]) return 0;
    const parts = data.details[skill];
    let total = 0;
    for (const partKey of Object.keys(parts)) {
      const part = parts[partKey];
      if (part && typeof part === "object") {
        total += Object.values(part).filter((q) => q?.isCorrect === true).length;
      }
    }
    return total;
  } catch {
    return 0;
  }
}
