
const ListGroupBlock = ({
  type,
  body,
  start,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  desc = {},
  wide,
}) => {
  const isSectionSelect = type === "select-section";

  let letters = [];
  if (isSectionSelect) {
    const [first, last] = desc.sectionRange || ["A", "G"];
    if (first && last) {
      for (let i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
        letters.push(String.fromCharCode(i));
      }
    }
  } else {
    letters = body.list
      ? body.list.map((_, i) => String.fromCharCode(65 + i))
      : [];
  }

  // Handle new format: items are objects with { question_num, label, options }
  const isNewFormat = isSectionSelect && body.items?.[0]?.question_num;

  let currentId = start;
  const renderedItems = (body.items || []).map((item) => {
    if (item === "↓") {
      return { type: "arrow" };
    }

    if (isNewFormat && typeof item === "object" && item !== null) {
      const qid = String(item.question_num);
      const label = item.label || "";
      const itemLetters = item.options || letters;
      return { type: "question", qid, text: label, itemLetters };
    }

    if (typeof item !== "string") {
      return { type: "question", qid: String(currentId++), text: String(item) };
    }

    const cleaned = item.replace("<input>", "").trim();
    const qid = currentId;
    currentId++;
    return { type: "question", qid, text: cleaned, itemLetters: letters };
  });

  return (
    <div className={`space-y-5 ${wide ? "mx-auto max-w-2xl" : ""}`}>
      {!isSectionSelect && body.list && (
        <div className="rounded-md border border-black/[0.12] bg-black/[0.02] p-4 dark:border-white/10 dark:bg-slate-800">
          {body.listTitle && (
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-black/50 dark:text-white/50">
              {body.listTitle}
            </h3>
          )}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {body.list.map((option, idx) => (
              <div
                key={idx}
                className="text-sm text-[#17171A] dark:text-[#F5F5F5]"
              >
                <span className="font-bold mr-1">{letters[idx]}.</span>
                {option}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {renderedItems.map((item, idx) => {
          if (item.type === "arrow") {
            return (
              <div key={`arrow-${idx}`} className="flex justify-center">
                <span className="text-xl text-black/40 dark:text-white/40">
                  ↓
                </span>
              </div>
            );
          }

          const { qid, text, itemLetters: qLetters } = item;
          const answer = userAnswers?.[qid] || "";
          const correct = getCorrectAnswer ? getCorrectAnswer(qid) : "";
          const effectiveLetters = qLetters || letters;

          let selectClasses =
            "block w-24 rounded border py-1.5 pl-2 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors ";

          if (showResults) {
            selectClasses += "disabled:opacity-70 ";
            if (answer === correct) {
              selectClasses +=
                "border-green-600 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950 dark:text-green-300 ";
            } else {
              selectClasses +=
                "border-red-600 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950 dark:text-red-300 ";
            }
          } else {
            selectClasses +=
              "border-black/[0.12] bg-white text-[#17171A] dark:border-white/10 dark:bg-slate-800 dark:text-white ";
          }

          return (
            <div
              key={qid}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.02] dark:border-white/10 pb-2 last:border-0 last:pb-0"
            >
              <span className="flex-1 text-sm text-[#17171A] dark:text-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => document.getElementById(`select-list-${qid}`)?.focus()}
                  className="answer-badge mr-1.5 font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-semibold shrink-0 cursor-pointer transition-all duration-200 border-black/[0.2] dark:border-white/20 text-black/50 dark:text-white/50 hover:scale-110 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] hover:border-[var(--accent)]"
                >
                  {qid}
                </button>
                {text}
              </span>

              <div className="flex items-center gap-2">
                <select
                  id={`select-list-${qid}`}
                  value={answer}
                  onChange={(e) =>
                    handleAnswerChange(String(qid), e.target.value)
                  }
                  disabled={showResults}
                  className={selectClasses}
                >
                  <option value="">--</option>
                  {effectiveLetters.map((letter, i) => (
                    <option key={letter} value={letter}>
                      {letter}{" "}
                      {!isSectionSelect && body.list
                        ? ` - ${body.list[i]}`
                        : ""}
                    </option>
                  ))}
                </select>

                {showResults && answer !== correct && correct && (
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

export default ListGroupBlock;
