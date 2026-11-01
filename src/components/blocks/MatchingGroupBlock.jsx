
const MatchingGroupBlock = ({
  body,
  start,
  end,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
}) => {
  const rangeLabel =
    end > start ? `Questions ${start}–${end}` : `Question ${start}`;

  // Extract questions and options from body.items
  const questions = [];
  let options = [];
  (body.items || []).forEach((item) => {
    if (Array.isArray(item.options)) {
      options = item.options;
    } else if (item.question_num || item.type === "drop-zone") {
      questions.push(item);
    }
  });

  // Extract letter/roman labels from options (e.g., "A. It's badly organised." → "A",
  // "iv. The clues ..." → "iv"). Yalang'och "i"/"A" bo'lsa, label yo'q hisoblanadi.
  const OPTION_PREFIX = /^((?:[A-Z]|[ivxlcdm]{1,6}))\s*[.):-]\s*/i;
  const optionLetters = options.map((opt) => {
    const match = String(opt).match(OPTION_PREFIX);
    return match ? match[1] : String(opt);
  });

  const optionTexts = options.map((opt) =>
    String(opt).replace(OPTION_PREFIX, ""),
  );

  return (
    <div className="mb-6">
      {end > start && (
        <p className="text-sm font-semibold text-black/40 dark:text-white/40 mb-2">
          {rangeLabel}
        </p>
      )}
      {body.title && (
        <h3 className="text-base font-bold mb-3 text-[#17171A] dark:text-white">
          {body.title}
        </h3>
      )}

      {/* Options list */}
      {options.length > 0 && (
        <div className="mb-4 rounded-lg border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-slate-800 p-3">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {options.map((opt, idx) => {
              const hasLabel = optionLetters[idx] !== String(opt);
              const text = optionTexts[idx];
              const showText =
                !hasLabel ||
                (text && text.toLowerCase() !== String(optionLetters[idx]).toLowerCase());
              return (
                <div key={idx} className="text-sm text-[#17171A] dark:text-[#F5F5F5]">
                  {hasLabel && (
                    <span className="font-bold mr-1">{optionLetters[idx]}.</span>
                  )}
                  {showText ? text : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Questions with dropdowns */}
      <div className="space-y-3">
        {questions.map((q) => {
          const qid = String(q.question_num);
          const rawAnswer = userAnswers[qid] || "";
          const userVal = rawAnswer.trim().toUpperCase();

          const correctValRaw = showResults ? getCorrectAnswer(qid) : "";
          const correctVal = correctValRaw
            ? correctValRaw.trim().toUpperCase()
            : "";

          const isCorrect =
            showResults && userVal === correctVal && correctVal !== "";

          return (
            <div
              key={qid}
              className="border-b border-black/[0.02] dark:border-white/10 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="answer-badge flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-semibold shrink-0 border-black/[0.2] dark:border-white/20 text-black/50 dark:text-white/50">
                  {qid}
                </span>
                <span className="text-sm text-[#17171A] dark:text-[#F5F5F5]">
                  {q.question || `Question ${qid}`}
                </span>
              </div>

              <div className="pl-6">
                <select
                  value={userVal}
                  onChange={(e) =>
                    !showResults && handleAnswerChange(qid, e.target.value)
                  }
                  disabled={showResults}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    showResults
                      ? isCorrect
                        ? "border-green-600 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                        : "border-red-600 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                      : "border-black/[0.12] dark:border-white/10 bg-white dark:bg-slate-800 text-[#17171A] dark:text-[#F5F5F5]"
                  }`}
                >
                  <option value="">—</option>
                  {optionLetters.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                </select>

                {showResults && !isCorrect && correctVal && (
                  <span className="ml-2 text-xs font-semibold text-green-700 dark:text-green-400">
                    Correct: {correctVal}
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

export default MatchingGroupBlock;
