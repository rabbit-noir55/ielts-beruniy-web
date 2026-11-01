/**
 * ourMocks JSON formatini eski formatga normalize qilish.
 * Cambridge mocklarga hech qanday ta'sir qilmaydi.
 *
 * Our Mocks JSON'ida savol turlari Cambridge formatidan farq qiladi:
 *   input, single_choice, multiple_choice, true_false_not_given,
 *   yes_no_not_given, matching, summary, select, table
 * Quyidagi funksiyalar ularni Reading/Listening sahifalari tushunadigan
 * blok formatiga (input-note, option-abc, checkbox, matching,
 * input-summary, select-summary-given-list va h.k.) o'giradi.
 */

/* Variant matnlaridagi "A. ", "A: ", "A) " kabi harf prefikslarini olib tashlaydi */
function stripOptionPrefix(option) {
  return String(option ?? "")
    .replace(/^\s*[A-Z]\s*[-.):]\s*/, "")
    .trim();
}

function cleanOptions(options) {
  return (options || []).map(stripOptionPrefix).filter(Boolean);
}

function optionsKey(q) {
  return JSON.stringify(effectiveOptions(q));
}

/* "A = matn, B = matn" ko'rinishidagi variant izohini ajratadi */
function parseOptionLegend(text) {
  const src = String(text || "");
  if (!/[A-Z]\s*=/.test(src)) return null;
  const out = [];
  const re = /([A-Z])\s*=\s*([^,]+?)(?=\s*,\s*[A-Z]\s*=|$)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    out.push(`${m[1]}. ${m[2].trim()}`);
  }
  return out.length >= 2 ? out : null;
}

function effectiveOptions(q) {
  const options = cleanOptions(q.options);
  const lettersOnly =
    options.length > 0 && options.every((option) => /^[A-Z]$/i.test(option));
  if (!lettersOnly) return options;

  // "A = She really likes it, B = ... C = ..." ko'rinishidagi izoh
  const legend = parseOptionLegend(q.context);
  if (legend && legend.length === options.length) return legend;

  const prompt = String(q.prompt || "").toLowerCase();
  if (prompt.includes("correct date")) {
    return [
      "A. 1851",
      "B. 1874",
      "C. 1967",
      "D. 1974",
      "E. 1979",
      "F. 1981",
      "G. 1985",
      "H. 1991",
    ];
  }
  if (prompt.includes("correct ending")) {
    return [
      "A. is more frequent among female dolphins.",
      "B. is possibly linked to a physical characteristic.",
      "C. is only possible in salt water.",
      "D. is more typical of male dolphins.",
      "E. is evidence of a dolphin's use of sound.",
      "F. is a threat to commercial fishing.",
      "G. is the most likely way that sponge use is learned.",
      "H. is not accepted by investigators.",
    ];
  }
  return options;
}

/**
 * Javoblar kalitini normallashtiradi:
 *  - "q1" kabi kalitlarni "1" ga o'giradi;
 *  - bir nechta to'g'ri javobni "|" bilan birlashtiradi (splitAlternatives
 *    ham shu belgi bo'yicha ajratadi).
 */
function parseAnswers(raw) {
  if (!raw) return {};
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = String(k).replace(/^q(?=\d)/i, "");
      out[key] = Array.isArray(v) ? v.join("|") : v;
    }
    return out;
  }
  return {};
}

/*
 * Passage'lar generator versiyasiga qarab oddiy string yoki
 * { heading, content } ko'rinishida keladi. UI sentence_raw uchun doim string
 * kutadi, shuning uchun ikkala formatni bitta ko'rinishga keltiramiz.
 */
function passageToText(passage) {
  if (typeof passage === "string") return passage.trim();
  if (!passage || typeof passage !== "object") return "";

  const heading = String(passage.heading || passage.title || "").trim();
  const content = String(
    passage.content || passage.text || passage.paragraph || passage.sentence_raw || "",
  ).trim();

  if (!heading) return content;
  if (!content || content.startsWith(heading)) return content || heading;
  return `${heading}\n${content}`;
}

/* Bitta matn ichidagi qatorlarga bo'lingan paragraflarni ajratadi.
 * Ba'zi fayllarda butun passage bitta satrda "\n" bilan yozilgan bo'ladi;
 * birinchi qator ko'pincha sarlavha — uni tashlab yuboramiz (u alohida chiqadi).
 */
function splitParagraphs(text, title) {
  const titleNorm = String(title || "").trim().toLowerCase();
  return String(text || "")
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !titleNorm || line.toLowerCase() !== titleNorm);
}

function normalizePassages(passages, title) {
  const out = [];
  (Array.isArray(passages) ? passages : []).forEach((entry) => {
    const text = passageToText(entry);
    if (!text) return;
    out.push(...splitParagraphs(text, title));
  });
  return out;
}

/* Savolning raqam oralig'i: number_range, "q21-22" id yoki number */
function questionRange(q) {
  if (Array.isArray(q.number_range) && q.number_range.length === 2) {
    const a = Number(q.number_range[0]);
    const b = Number(q.number_range[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return [Math.min(a, b), Math.max(a, b)];
    }
  }
  const idMatch = String(q.id || "").match(/q(\d+)\s*[-–]\s*(\d+)/i);
  if (idMatch) {
    const a = Number(idMatch[1]);
    const b = Number(idMatch[2]);
    return [Math.min(a, b), Math.max(a, b)];
  }
  const n = Number(q.number ?? q.answer_key_ref);
  return Number.isFinite(n) ? [n, n] : [null, null];
}

function questionNumber(q, fallback) {
  const [a] = questionRange(q);
  return a ?? fallback;
}

/* Matndagi [7] kabi bo'shliqlarni aniq qidli input'ga aylantiradi */
function toQzoneInputs(text) {
  return String(text ?? "")
    .replace(/\[input\s*:?\s*(\d+)\]/gi, "[qzone-input-$1]")
    .replace(/\[(\d+)\]/g, "[qzone-input-$1]");
}

function ensureOwnInput(text, number) {
  const t = toQzoneInputs(text);
  const token = `[qzone-input-${number}]`;
  if (t.includes(token)) return t;
  return `${t} ${token}`.trim();
}

function hasPlaceholder(text) {
  return /\[(?:select|input\s*:?\s*\d+|\d+)\]/i.test(String(text ?? ""));
}

/* Note/table/summary kabi bo'shliqli savollar uchun matn tanlash */
function inputSentence(q) {
  const prompt = String(q.prompt || "").trim();
  const context = String(q.context || "").trim();
  const own = questionNumber(q);
  const ownRe = own != null ? new RegExp(`\\[${own}\\]`) : null;

  if (prompt && hasPlaceholder(prompt)) return prompt;
  if (context && hasPlaceholder(context)) return context;
  if (ownRe && ownRe.test(prompt)) return prompt;
  if (prompt && context) return `${context}: ${prompt}`;
  return prompt || context;
}

function makeInputBlock(questions, start, end) {
  const seen = new Set();
  const items = [];
  questions.forEach((q, idx) => {
    const number = questionNumber(q, start + idx);
    const item = ensureOwnInput(inputSentence(q), number);
    if (seen.has(item)) return;
    seen.add(item);
    items.push(item);
  });
  return {
    type: "input-note",
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: { items },
  };
}

/* Option-abc/checkbox uchun matnlar: komponent harfni o'zi qo'shadi,
 * shuning uchun "A. " prefiksini olib tashlaymiz (yalang'och harf bo'lsa — bo'sh). */
function choiceOptionTexts(q) {
  return effectiveOptions(q).map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const text = String(opt).replace(/^[A-Z]\s*[.):-]\s*/i, "").trim();
    if (!text || text.toUpperCase() === letter) return "";
    return text;
  });
}

function makeChoiceBlock(questions, start, end) {
  const opts = choiceOptionTexts(questions[0]);
  return {
    type: "option-abc",
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: {
      items: questions.map((g) => ({ title: g.prompt || "", options: opts })),
    },
  };
}

/* "Choose TWO/THREE letters" — bir nechta to'g'ri javobli checkbox blok */
function makeCheckboxBlock(questions, start, end) {
  return {
    type: "checkbox",
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: {
      title: questions[0].prompt || "",
      options: choiceOptionTexts(questions[0]),
    },
  };
}

/* TF / Yes-No savollarida qaysi maydon ko'rsatma, qaysi biri gap
 * ekanini aniqlaydi (ma'lumotlarda ikkala tartib ham uchraydi). */
const TF_INSTRUCTION_RE =
  /do the following|agree with the (information|claims|writer)|write\s+(true|false|yes|no)|choose\s+(true|false|yes|no)|decide if|are the following statements/i;

function pickTFStatement(q) {
  const prompt = String(q.prompt || "").trim();
  const context = String(q.context || "").trim();
  const promptIsInstruction = TF_INSTRUCTION_RE.test(prompt);
  const contextIsInstruction = TF_INSTRUCTION_RE.test(context);

  if (promptIsInstruction && !contextIsInstruction) {
    return { text: context, instruction: prompt };
  }
  if (contextIsInstruction && !promptIsInstruction) {
    return { text: prompt, instruction: context };
  }
  return { text: prompt || context, instruction: "" };
}

function makeTFBlock(questions, start, end, type = "option-true-false") {
  const picked = questions.map(pickTFStatement);
  const instruction = picked.find((p) => p.instruction)?.instruction || "";
  return {
    type,
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: { title: instruction, items: picked.map((p) => p.text) },
  };
}

/* "List of Headings: i. ..., ii. ..." matnidan sarlavhalar ro'yxatini ajratadi */
function parseHeadingsBank(text) {
  const src = String(text || "");
  const idx = src.search(/list of headings/i);
  if (idx < 0) return null;
  const rest = src
    .slice(idx)
    .replace(/^list of headings\s*:?\s*/i, "")
    .trim();
  if (!rest) return null;
  const parts = rest
    .split(/,\s*(?=(?:[ivxlcdm]{1,6}|[A-Z])[.)]\s)/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts : null;
}

/* Matching savolining ko'rinadigan matni: agar context faqat variantlar
 * ro'yxati ("List of Headings"/"Word bank") bo'lsa, prompt ishlatiladi. */
function matchingQuestionText(g) {
  const ctx = String(g.context || "").trim();
  if (/^list of headings/i.test(ctx) || /^word bank/i.test(ctx)) {
    return String(g.prompt || ctx);
  }
  return ctx || String(g.prompt || "");
}

/* Matching uchun variantlar: yalang'och "i/ii/..." bo'lsa, matndagi
 * "List of Headings" ro'yxatidan to'liq sarlavhalarni tiklaymiz. */
function matchingOptions(questions) {
  const base = effectiveOptions(questions[0]);
  const bare = base.length > 0 && base.every((o) => /^(?:[ivxlcdm]{1,6}|[A-Z])$/i.test(o));
  if (!bare) return base;

  for (const q of questions) {
    const bank = parseHeadingsBank(q.context) || parseHeadingsBank(q.prompt);
    if (bank && bank.length === base.length) return bank;
  }
  return base;
}

function makeMatchingBlock(questions, start, end) {
  const bodyItems = questions.map((g) => ({
    question_num: questionNumber(g),
    question: matchingQuestionText(g),
  }));
  bodyItems.push({ options: matchingOptions(questions) });
  return {
    type: "matching",
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: { items: bodyItems },
  };
}

/* "Word bank: A. ..., B. ..." ko'rinishidagi ro'yxatni ajratib oladi */
function parseWordBank(text) {
  const src = String(text || "");
  const idx = src.search(/word bank/i);
  if (idx < 0) return null;
  const bank = src.slice(idx);
  const out = [];
  const re = /([A-Z])\s*[-.):]\s*([^,]+?)(?=\s*,\s*[A-Z]\s*[-.):]|\s*$)/g;
  let m;
  while ((m = re.exec(bank)) !== null) out.push(m[2].trim());
  return out.length ? out : null;
}

function selectOptions(q) {
  const cleaned = cleanOptions(q.options);
  const onlyLetters =
    cleaned.length > 0 && cleaned.every((o) => /^[A-Z]$/i.test(o));
  if (!onlyLetters) return cleaned;
  return parseWordBank(q.context) || parseWordBank(q.prompt) || cleaned;
}

/* summary/select savoli uchun gap matni */
function summarySentence(q) {
  const prompt = String(q.prompt || "").trim();
  const context = String(q.context || "").trim();
  if (hasPlaceholder(prompt)) return prompt;
  if (hasPlaceholder(context)) return context;
  return prompt || context;
}

function summaryTitle(q) {
  const sentence = summarySentence(q);
  const other = sentence === String(q.prompt || "").trim() ? q.context : q.prompt;
  const title = String(other || "").trim();
  if (!title || /^word bank/i.test(title) || hasPlaceholder(title)) {
    return undefined;
  }
  return title;
}

function makeSelectSummaryBlock(questions, start, end) {
  const options = selectOptions(questions[0]);
  const seen = new Set();
  const items = [];
  questions.forEach((q, idx) => {
    const number = questionNumber(q, start + idx);
    let text = summarySentence(q).replace(
      /\[select\]/gi,
      `[qzone-input-${number}]`,
    );
    text = ensureOwnInput(text, number);
    if (seen.has(text)) return;
    seen.add(text);
    items.push(text);
  });

  return {
    type: "select-summary-given-list",
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: {
      title: summaryTitle(questions[0]),
      list: options,
      items,
    },
  };
}

function makeInputSummaryBlock(questions, start, end) {
  const items = [];
  const seen = new Set();
  questions.forEach((q, idx) => {
    const number = questionNumber(q, start + idx);
    let text = summarySentence(q);

    // Bir nechta input bo'lsa va matnda bo'shliq belgilanmagan bo'lsa —
    // ularni matn oxiriga qo'shamiz.
    const inputNumbers = (q.inputs || [])
      .map((inp) => Number(inp?.number))
      .filter((n) => Number.isFinite(n));
    if (!hasPlaceholder(text) && inputNumbers.length > 1) {
      text = `${text} ${inputNumbers
        .map((n) => `[qzone-input-${n}]`)
        .join(" ")}`;
    }
    text = ensureOwnInput(text, number);
    if (seen.has(text)) return;
    seen.add(text);
    items.push(text);
  });

  return {
    type: "input-summary",
    start,
    end,
    prompt: questions[0].prompt,
    constraint: questions[0].constraint || "",
    desc: { constraint: questions[0].constraint || "" },
    body: { title: summaryTitle(questions[0]), items },
  };
}

const isInputLike = (q) => q.type === "input" || q.type === "table";

function groupQuestions(questions) {
  const result = [];
  let i = 0;

  while (i < questions.length) {
    const q = questions[i];

    // input / table — matn ichidagi [n] belgilari bilan birga
    if (isInputLike(q)) {
      const group = [];
      while (i < questions.length && isInputLike(questions[i])) {
        group.push(questions[i++]);
      }
      const start = Math.min(
        ...group.map((g, idx) => questionNumber(g, idx + 1)),
      );
      const end = Math.max(
        ...group.map((g, idx) => {
          const [, b] = questionRange(g);
          return Number.isFinite(b) ? b : questionNumber(g, idx + 1);
        }),
      );
      result.push(makeInputBlock(group, start, end));
      continue;
    }

    // bir nechta javobli savol (Choose TWO / THREE letters)
    if (q.type === "multiple_choice") {
      const key = `${optionsKey(q)}|${q.prompt || ""}`;
      const group = [];
      while (
        i < questions.length &&
        questions[i].type === "multiple_choice" &&
        `${optionsKey(questions[i])}|${questions[i].prompt || ""}` === key
      ) {
        group.push(questions[i++]);
      }
      const start = Math.min(
        ...group.map((g, idx) => questionNumber(g, idx + 1)),
      );
      const end = Math.max(
        ...group.map((g, idx) => {
          const [, b] = questionRange(g);
          return Number.isFinite(b) ? b : questionNumber(g, idx + 1);
        }),
      );
      result.push(makeCheckboxBlock(group, start, end));
      continue;
    }

    if (q.type === "single_choice") {
      const key = optionsKey(q);
      const group = [];
      while (
        i < questions.length &&
        questions[i].type === "single_choice" &&
        optionsKey(questions[i]) === key
      ) {
        group.push(questions[i++]);
      }
      result.push(makeChoiceBlock(group, group[0].number, group[group.length - 1].number));
      continue;
    }

    if (q.type === "true_false_not_given") {
      const key = optionsKey(q);
      const group = [];
      while (
        i < questions.length &&
        questions[i].type === "true_false_not_given" &&
        optionsKey(questions[i]) === key
      ) {
        group.push(questions[i++]);
      }
      result.push(
        makeTFBlock(group, group[0].number, group[group.length - 1].number),
      );
      continue;
    }

    if (q.type === "yes_no_not_given") {
      const key = optionsKey(q);
      const group = [];
      while (
        i < questions.length &&
        questions[i].type === "yes_no_not_given" &&
        optionsKey(questions[i]) === key
      ) {
        group.push(questions[i++]);
      }
      result.push(
        makeTFBlock(
          group,
          group[0].number,
          group[group.length - 1].number,
          "option-yes-no",
        ),
      );
      continue;
    }

    if (q.type === "matching") {
      const key = optionsKey(q);
      const group = [];
      while (
        i < questions.length &&
        questions[i].type === "matching" &&
        optionsKey(questions[i]) === key
      ) {
        group.push(questions[i++]);
      }
      result.push(
        makeMatchingBlock(group, group[0].number, group[group.length - 1].number),
      );
      continue;
    }

    // summary: variantlar bo'lsa — ro'yxatdan tanlash, bo'lmasa — matn kiritish
    if (q.type === "summary") {
      if ((q.options || []).length > 0) {
        const key = optionsKey(q);
        const group = [];
        while (
          i < questions.length &&
          questions[i].type === "summary" &&
          optionsKey(questions[i]) === key
        ) {
          group.push(questions[i++]);
        }
        const start = Math.min(...group.map((g) => questionNumber(g)));
        const end = Math.max(
          ...group.map((g, idx) => {
            const [, b] = questionRange(g);
            return Number.isFinite(b) ? b : questionNumber(g, idx + 1);
          }),
        );
        result.push(makeSelectSummaryBlock(group, start, end));
      } else {
        const group = [];
        while (i < questions.length && questions[i].type === "summary") {
          group.push(questions[i++]);
        }
        const start = Math.min(...group.map((g) => questionNumber(g)));
        const end = Math.max(
          ...group.flatMap((g) => {
            const numbers = [];
            const text = `${g.prompt || ""} ${g.context || ""}`;
            for (const m of text.matchAll(/\[(\d+)\]/g)) {
              numbers.push(Number(m[1]));
            }
            for (const inp of g.inputs || []) {
              if (Number.isFinite(Number(inp?.number))) {
                numbers.push(Number(inp.number));
              }
            }
            const [a, b] = questionRange(g);
            if (a != null) numbers.push(a, b ?? a);
            return numbers;
          }),
        );
        result.push(makeInputSummaryBlock(group, start, end));
      }
      continue;
    }

    // select — word bank / variantlar ro'yxatidan tanlash
    if (q.type === "select") {
      const key = optionsKey(q);
      const group = [];
      while (
        i < questions.length &&
        questions[i].type === "select" &&
        optionsKey(questions[i]) === key
      ) {
        group.push(questions[i++]);
      }
      const start = Math.min(...group.map((g) => questionNumber(g)));
      const end = Math.max(
        ...group.map((g, idx) => {
          const [, b] = questionRange(g);
          return Number.isFinite(b) ? b : questionNumber(g, idx + 1);
        }),
      );
      result.push(makeSelectSummaryBlock(group, start, end));
      continue;
    }

    result.push(q);
    i++;
  }

  return result;
}

function normalizePart(part) {
  if (!part || !Array.isArray(part.questions)) return part;
  return {
    ...part,
    question: { test_question: groupQuestions(part.questions) },
  };
}

export function normalizeOurMocksListening(data, testNum) {
  if (!data || !data.parts) return data;

  const mediaAudio = Array.isArray(data.media?.audio_urls) ? data.media.audio_urls : [];
  const partsObj = {};

  data.parts.forEach((part, index) => {
    const key = String(part.part);
    const normalized = normalizePart(part);
    partsObj[key] = normalized;

    // Audio: part.audio_url ustun, bo'lmasa media.audio_urls (part tartibida)
    const audio = part.audio_url || mediaAudio[index] || mediaAudio[0] || "";
    if (audio) partsObj[key].audio_src = audio;

    // Transcript (ixtiyoriy): {start,end,speaker,text} -> start_time/end_time
    const transcript = Array.isArray(part.transcript) ? part.transcript : [];
    if (transcript.length > 0) {
      const audioscript = transcript.map((line) => ({
        speaker: line.speaker || "",
        text: line.text || "",
        start_time: line.start ?? null,
        end_time: line.end ?? null,
      }));
      normalized.text = {
        ...(normalized.text || {}),
        test_text: { ...(normalized.text?.test_text || {}), audioscript },
      };
    }
  });

  return {
    tests: {
      [testNum]: {
        parts: partsObj,
        answers: parseAnswers(data.answer_key || {}),
      },
    },
  };
}

export function normalizeOurMocksReading(data, testNum) {
  if (!data || !data.parts) return data;

  const partsObj = {};
  data.parts.forEach((part) => {
    const key = String(part.part);
    partsObj[key] = normalizePart(part);
    const paragraphs = normalizePassages(part.passages, part.title);

    if (paragraphs.length > 0) {
      partsObj[key].text = {
        test_text: {
          article: {
            sections: paragraphs.map((paragraph) => ({
              items: [
                {
                  items: [{ sentence_raw: paragraph, items: [] }],
                },
              ],
            })),
            subtitles: [part.title || ""],
          },
        },
      };
    }
  });

  return {
    tests: {
      [testNum]: {
        parts: partsObj,
        answers: parseAnswers(data.answer_key || {}),
        passages: data.parts.map((part) => ({
          part: part.part,
          paragraphs: normalizePassages(part.passages, part.title),
        })),
      },
    },
  };
}
