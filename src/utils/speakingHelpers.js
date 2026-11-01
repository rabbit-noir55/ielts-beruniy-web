import { request } from "./api";

const BASE_AUDIO_URL =
  "https://oss.jumpinto.com/resource/exam/ielts/speaking-audio";

export const PART_TIMES = { 1: 300, 2: 240, 3: 300 };
export const MOCK_TOTAL_MS = 14 * 60 * 1000;

export const getAudioUrl = (series, test, part, subtopicIdx, questionIdx) => {
  if (part === 2) return null;
  return `${BASE_AUDIO_URL}/a${series}t${test}s${part}-${subtopicIdx}-${questionIdx}-en_male_hades_moon_bigtts.mp3`;
};

export const buildSegments = (topics, currentPart, series, testNum) => {
  const segs = [];
  if (currentPart === 1) {
    topics.forEach((topic, ti) => {
      (topic.items || []).forEach((q, qi) => {
        segs.push({
          id: `p1-${ti}-${qi}`,
          label: `Question ${qi + 1}`,
          text: q,
          audioUrl: getAudioUrl(series, testNum, 1, ti, qi),
          subtopicIdx: ti,
          questionIdx: qi,
        });
      });
    });
  } else if (currentPart === 2) {
    topics.forEach((topic, ti) => {
      const items = topic.items || [];
      if (items.length > 0) {
        items.forEach((item, ii) => {
          segs.push({
            id: `p2-${ti}-${ii}`,
            label: topic.title || "Prompt",
            text: item,
            audioUrl: getAudioUrl(series, testNum, 2, ti, ii),
            subtopicIdx: ti,
            questionIdx: ii,
          });
        });
      } else {
        segs.push({
          id: `p2-${ti}`,
          label: topic.title || "Part 2",
          text: topic.title || "",
          audioUrl: getAudioUrl(series, testNum, 2, ti, 0),
          subtopicIdx: ti,
          questionIdx: 0,
        });
      }
    });
  } else if (currentPart === 3) {
    topics.forEach((topic, ti) => {
      (topic.items || []).forEach((q, qi) => {
        segs.push({
          id: `p3-${ti}-${qi}`,
          label: `${topic.title || "Discussion"} Q${qi + 1}`,
          text: q,
          audioUrl: getAudioUrl(series, testNum, 3, ti, qi),
          subtopicIdx: ti,
          questionIdx: qi,
        });
      });
    });
  }
  return segs;
};

export const buildFeedbackPrompt = (transcript, taskPart, topics) =>
  `You are an experienced IELTS Speaking expert. Evaluate the following student response according to IELTS Speaking criteria:
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation

TASK (Speaking Part ${taskPart}):
${topics.map((t) => `- ${t.title || ""}\n  ${(t.items || []).join("\n  ")}`).join("\n")}

STUDENT ANSWER (transcript):
"""
${transcript}
"""

Answer ONLY in the following JSON format:
{
  "fluencyAndCoherence": { "band": <0-9, step 0.5>, "comment": "<comment in English>" },
  "lexicalResource": { "band": <0-9>, "comment": "<comment>" },
  "grammaticalRange": { "band": <0-9>, "comment": "<comment>" },
  "pronunciation": { "band": <0-9>, "comment": "<comment>" },
  "overallBand": <average, rounded to 0.5>,
  "strengths": ["<strength>"],
  "improvements": ["<area to improve>"],
  "summary": "<2-3 sentence summary in English>"
}`;

export async function getSpeakingFeedback(prompt) {
  try {
    const res = await request("/ai/speaking/", {
      method: "POST",
      body: { prompt },
    });
    if (res && res.data) return { success: true, data: res.data };
    return { success: false, error: "AI xizmati bo'sh javob qaytardi." };
  } catch (err) {
    return { success: false, error: err?.message || "AI xizmati ishlamayapti." };
  }
}

export const CRITERIA = [
  { key: "fluencyAndCoherence", label: "Fluency & Coherence" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range" },
  { key: "pronunciation", label: "Pronunciation" },
];
