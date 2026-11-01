import { request } from "./api";

const GENERATOR_BAND = 9;

export async function getToolFeedback(prompt) {
  try {
    const res = await request("/ai/chat/", {
      method: "POST",
      body: { prompt },
    });
    if (res && res.data) return { success: true, data: res.data };
    return { success: false, error: "AI xizmati bo'sh javob qaytardi." };
  } catch (err) {
    return { success: false, error: err?.message || "AI xizmati ishlamayapti." };
  }
}

export function buildWritingGeneratorPrompt(taskType, requirement, hasImage = false) {
  const labels = {
    report: "IELTS Writing Task 1 Academic (a chart/graph/process report)",
    letter: "IELTS Writing Task 1 General Training (a letter)",
    essay: "IELTS Writing Task 2 (an essay)",
  };
  const label = labels[taskType] || labels.essay;
  const wordTarget = taskType === "essay" ? 250 : 150;

  const imageNote = hasImage
    ? "\n\nIMPORTANT: An image (chart/graph/table/diagram) has been provided alongside this task. You MUST carefully analyze the image data and describe the key features, trends, and comparisons shown in it. Base your answer on the actual data visible in the image."
    : "";

  return `You are an expert IELTS tutor. Write a Band ${GENERATOR_BAND} model answer for the following ${label} task.

TASK TEXT:
"""
${requirement}
"""${imageNote}

Requirements:
- Aim for around ${wordTarget} words.
- Match the exact type: ${taskType === "letter" ? "a formal letter with an appropriate salutation and closing" : taskType === "report" ? "an academic report describing the data/process, no personal opinion" : "a well-structured essay with introduction, body paragraphs and conclusion"}.
- Use Band ${GENERATOR_BAND} vocabulary and complex grammar naturally.

Answer ONLY in the following JSON format, do not add any other text:
{
  "answer": "<full model answer text>"
}`;
}

export function buildSpeakingGeneratorPrompt(part, question) {
  const partLabel =
    part === 1
      ? "Part 1 (Introduction and Interview — short, natural answers of 2-4 sentences)"
      : part === 2
        ? "Part 2 (Individual Long Turn — speak for about 2 minutes on the prompt, include the cue card bullet points)"
        : "Part 3 (Two-way Discussion — detailed answers of 3-5 sentences)";

  return `You are an expert IELTS Speaking tutor. Write a Band ${GENERATOR_BAND} model answer for the following ${partLabel} question.

QUESTION:
"""
${question}
"""

Requirements:
- Match the expected length of ${partLabel}.
- Sound natural and fluent, use idiomatic language and a range of grammar.

Answer ONLY in the following JSON format, do not add any other text:
{
  "answer": "<full model answer text>"
}`;
}

export function buildSpeakingCheckerPrompt(part, question, answer) {
  const partLabel =
    part === 1
      ? "Part 1 (Introduction and Interview)"
      : part === 2
        ? "Part 2 (Individual Long Turn)"
        : "Part 3 (Two-way Discussion)";

  return `You are an experienced IELTS Speaking expert. Evaluate the following student response for ${partLabel} according to IELTS Speaking criteria:
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation

QUESTION:
"""
${question}
"""

STUDENT ANSWER:
"""
${answer}
"""

Answer ONLY in the following JSON format, do not add any other text:
{
  "fluencyAndCoherence": { "band": <0-9, step 0.5>, "comment": "<comment in English>" },
  "lexicalResource": { "band": <0-9, step 0.5>, "comment": "<comment in English>" },
  "grammaticalRange": { "band": <0-9, step 0.5>, "comment": "<comment in English>" },
  "pronunciation": { "band": <0-9, step 0.5>, "comment": "<comment in English>" },
  "overallBand": <average, rounded to 0.5>,
  "strengths": ["<strength>"],
  "improvements": ["<area to improve>"],
  "summary": "<2-3 sentence summary in English>"
}`;
}

export function buildRandomGeneratorPrompt() {
  return `You are an expert IELTS test designer. Create a single random IELTS practice task.
First, choose a random topic yourself from common IELTS topics (e.g. technology, education, environment, health, travel, work, culture, society, family, cities, sports, media — pick any one).
Then choose a task type randomly from the list below (any one):
- Writing Task 1 Academic (a chart/graph/table/process)
- Writing Task 1 General Training (a letter)
- Writing Task 2 (an essay question)
- Speaking Part 1 (3 short questions on one topic)
- Speaking Part 2 (a cue card with bullet points)
- Speaking Part 3 (3 follow-up discussion questions)

The topic and the task type should be different each time you are asked — do not repeat a previous task.

Return a task that looks exactly like a real IELTS exam task.

IMPORTANT: Do NOT use any markdown formatting, asterisks, underscores, or bullet symbols in the task text. Return plain clean text only.

Answer ONLY in the following JSON format, do not add any other text:
{
  "type": "<writing-report | writing-letter | writing-essay | speaking-part1 | speaking-part2 | speaking-part3>",
  "title": "<short title of the topic>",
  "task": "<the full task text, ready to be used in practice>"
}`;
}

export function requireText(text, fallback) {
  const t = (text || "").trim();
  if (!t) {
    return { ok: false, error: fallback || "Field is empty." };
  }
  return { ok: true, value: t };
}

export function cleanTaskText(text) {
  if (!text) return "";
  return String(text)
    // Terminal/ANSI artefaktlarini olib tashlash (masalan [{<35;38;35M)
    .replace(/\[\{[<>0-9;]*[a-zA-Z]?\}/g, "")
    .replace(/\[\{?[<>0-9;]*[0-9]+[a-zA-Z]+/g, "")
    .replace(/\[\[?<[0-9;]*[a-zA-Z]/g, "")
    .replace(/\[[<>0-9;]*[0-9]+[a-zA-Z]+\]/g, "")
    // Markdown/formatlash belgilarini olib tashlash
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/__/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .replace(/\[\[/g, "[")
    .replace(/\]\]/g, "]")
    // Qoldiq jingalak qavslar (AI noto'g'ri qo'shgan bo'lsa)
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    // Qator boshidagi ro'yxat belgilari
    .replace(/^[-•◦▪]\s*/gm, "")
    .trim();
}

export function buildRandomWritingTaskPrompt(taskType) {
  const labels = {
    report: "Writing Task 1 Academic (a chart/graph/table/process)",
    letter: "Writing Task 1 General Training (a letter)",
    essay: "Writing Task 2 (an essay question)",
  };
  const label = labels[taskType] || labels.essay;
  const seed = Math.random().toString(36).slice(2, 8);
  const topics = [
    "technology", "education", "environment", "health", "travel", "work",
    "culture", "society", "family", "cities", "sports", "media", "food",
    "transport", "housing", "art", "science", "history", "music", "finance",
    "communication", "nature", "architecture", "fashion", "agriculture",
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  return `[${seed}] You are an expert IELTS test designer. Create a single random IELTS ${label} task.
IMPORTANT: You MUST pick the topic "${randomTopic}" for this task. Do NOT use any other topic.
Then write a full ${label} question that looks exactly like a real IELTS exam task.
The topic must be unique and specific — avoid generic or vague descriptions.

IMPORTANT: Do NOT use any markdown formatting, asterisks, underscores, or bullet symbols in the task text. Return plain clean text only.

Answer ONLY in the following JSON format, do not add any other text:
{
  "type": "${taskType}",
  "title": "<short title of the topic>",
  "task": "<the full task text, ready to be used in practice>"
}`;
}

export function buildRandomSpeakingQuestionPrompt(part) {
  const partLabel =
    part === 1
      ? "Part 1 (Introduction and Interview — 3 short questions on one topic)"
      : part === 2
        ? "Part 2 (Individual Long Turn — a cue card with bullet points)"
        : "Part 3 (Two-way Discussion — 3 follow-up discussion questions)";
  const seed = Math.random().toString(36).slice(2, 8);
  const topics = [
    "technology", "education", "environment", "health", "travel", "work",
    "culture", "society", "family", "cities", "sports", "media", "food",
    "transport", "housing", "art", "science", "history", "music", "finance",
    "communication", "nature", "architecture", "fashion", "agriculture",
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  return `[${seed}] You are an expert IELTS test designer. Create a single random IELTS Speaking ${partLabel} task.
IMPORTANT: You MUST pick the topic "${randomTopic}" for this task. Do NOT use any other topic.
Then write the full task text that looks exactly like a real IELTS exam speaking part.
The topic must be unique and specific — avoid generic or vague descriptions.

IMPORTANT: Do NOT use any markdown formatting, asterisks, underscores, or bullet symbols in the task text. Return plain clean text only.

Answer ONLY in the following JSON format, do not add any other text:
{
  "type": "speaking-part${part}",
  "title": "<short title of the topic>",
  "task": "<the full task text, ready to be used in practice>"
}`;
}
