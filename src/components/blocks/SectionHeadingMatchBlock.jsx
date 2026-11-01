
const parseParagraphLine = (raw) => {
  const text = String(raw);
  const presetMatch = text.match(/<input\s*=\s*([^>]+)>/i);
  const preset = presetMatch ? presetMatch[1].trim() : null;
  const cleaned = text.replace(/<input[^>]*>/i, "").trim();
  return { label: cleaned, preset };
};

const isRoman = (s) =>
  typeof s === "string" && /^[ivxlcdm]+$/i.test(s) && s.length <= 10;

const romanToInt = (r) => {
  const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  let total = 0;
  for (let i = 0; i < r.length; i++) {
    const cur = map[r[i].toLowerCase()];
    const next = map[(r[i + 1] || "").toLowerCase()] || 0;
    total += cur < next ? -cur : cur;
  }
  return total;
};

const intToRoman = (n) => {
  const table = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"],
    [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"],
    [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  for (const [v, s] of table) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
};

const SectionHeadingMatchBlock = ({
  body,
  start,
  end,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  desc = {},
}) => {
  const rangeLabel =
    end > start ? `Questions ${start}–${end}` : `Question ${start}`;

  const [optFirst, optLast] = desc.optionRange || [];
  let optionLabels = [];
  if (optFirst && optLast && isRoman(optFirst) && isRoman(optLast)) {
    // Rim raqamlari (masalan "i"–"viii") — harflarga emas, rim ketma-ketlikka chiqariladi.
    const from = romanToInt(optFirst);
    const to = romanToInt(optLast);
    for (let n = from; n <= to; n++) {
      optionLabels.push(intToRoman(n));
    }
  } else if (optFirst && optLast && optFirst.length === 1 && optLast.length === 1) {
    for (let i = optFirst.charCodeAt(0); i <= optLast.charCodeAt(0); i++) {
      optionLabels.push(String.fromCharCode(i));
    }
  } else if (body.list) {
    const romanNumerals = [
      "i",
      "ii",
      "iii",
      "iv",
      "v",
      "vi",
      "vii",
      "viii",
      "ix",
      "x",
      "xi",
      "xii",
      "xiii",
      "xiv",
      "xv",
    ];
    optionLabels = body.list.map(
      (_, idx) => romanNumerals[idx] || String(idx + 1),
    );
  }

  let runningId = start;

  return (
    <div className="mb-2">
      {end > start && (
        <p className="text-sm font-semibold text-black/40 dark:text-white/40 mb-2">
          {rangeLabel}
        </p>
      )}

      {body.list && (
        <div className="mb-4 rounded-md border border-black/[0.12] bg-black/[0.02] p-4 dark:border-white/10 dark:bg-slate-800">
          {body.listTitle && (
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
              {body.listTitle}
            </h3>
          )}
          <div className="space-y-1.5">
            {body.list.map((heading, idx) => (
              <div
                key={idx}
                className="text-sm text-[#17171A] dark:text-[#F5F5F5]"
              >
                <span className="font-bold mr-2 italic">
                  {optionLabels[idx]}
                </span>
                {String(heading).trim()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(body.items || []).map((rawItem, idx) => {
          const isExample =
            rawItem &&
            typeof rawItem === "object" &&
            rawItem.type === "example";
          const { label, preset } = parseParagraphLine(
            isExample ? rawItem.items : rawItem,
          );

          if (isExample) {
            return (
              <div
                key={`example-${idx}`}
                className="flex items-center justify-between gap-2 rounded-md bg-black/[0.04] dark:bg-slate-800/60 px-3 py-2 border border-dashed border-black/[0.12] dark:border-white/10"
              >
                <span className="text-sm text-black/40 dark:text-white/40 italic flex-1">
                  {label}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-black/40 dark:text-white/40">
                    Example
                  </span>
                  <span className="px-2 py-0.5 text-sm font-semibold rounded border border-black/[0.12] dark:border-white/10 bg-white dark:bg-slate-900 text-black/50 dark:text-white/50">
                    {preset}
                  </span>
                </span>
              </div>
            );
          }

          const qid = String(runningId++);
          const answer = userAnswers?.[qid] || "";
          const correct = showResults ? getCorrectAnswer(qid) : "";
          const isCorrect =
            showResults &&
            correct &&
            answer.trim().toLowerCase() ===
              String(correct).trim().toLowerCase();

          let selectClasses =
            "w-24 rounded border py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all ";
          if (showResults) {
            selectClasses += isCorrect
              ? "border-green-600 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950 dark:text-green-300 "
              : "border-red-600 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950 dark:text-red-300 ";
          } else {
            selectClasses +=
              "border-black/[0.12] bg-white text-[#17171A] dark:border-white/10 dark:bg-slate-800 dark:text-white ";
          }

          return (
            <div
              key={qid}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.02] dark:border-white/10 pb-2 last:border-0 last:pb-0"
            >
              <span className="flex-1 text-sm text-[#17171A] dark:text-[#F5F5F5] flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => document.getElementById(`select-section-${qid}`)?.focus()}
                  className="answer-badge flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-semibold shrink-0 cursor-pointer transition-all duration-200 border-black/[0.2] dark:border-white/20 text-black/50 dark:text-white/50 hover:scale-110 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] hover:border-[var(--accent)]"
                >
                  {qid}
                </button>
                {label}
              </span>
              <div className="flex items-center gap-2">
                <select
                  id={`select-section-${qid}`}
                  value={answer}
                  onChange={(e) => handleAnswerChange(qid, e.target.value)}
                  disabled={showResults}
                  className={selectClasses}
                >
                  <option value="">--</option>
                  {optionLabels.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {showResults && !isCorrect && correct && (
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                    Correct: {correct}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionHeadingMatchBlock;
