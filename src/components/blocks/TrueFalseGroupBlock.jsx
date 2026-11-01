
const TrueFalseGroupBlock = ({
  type,
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

  const isYesNo = type === "option-yes-no";
  const options = isYesNo
    ? ["YES", "NO", "NOT GIVEN"]
    : ["TRUE", "FALSE", "NOT GIVEN"];

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
      <div className="space-y-4">
        {body.items.map((itemText, idx) => {
          const qid = String(start + idx);
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
              <p className="text-sm text-[#17171A] dark:text-[#F5F5F5] mb-2 flex items-start gap-1.5">
                <span className="answer-badge flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-semibold shrink-0 mt-0.5 border-black/[0.2] dark:border-white/20 text-black/50 dark:text-white/50">
                  {qid}
                </span>
                <span className="flex-1">{itemText}</span>
              </p>

              <div className="flex flex-wrap gap-2 pl-6">
                {options.map((opt) => {
                  const isSelected = userVal === opt;
                  const isCorrectOpt = correctVal === opt;

                  let btnClasses =
                    "px-3 py-1 text-xs font-medium rounded border transition-all duration-150 ";

                  if (showResults) {
                    if (isSelected && isCorrectOpt) {
                      btnClasses +=
                        "bg-green-600 border-green-600 text-white shadow-md shadow-green-200 dark:shadow-none";
                    } else if (isSelected && !isCorrectOpt) {
                      btnClasses +=
                        "bg-red-600 border-red-600 text-white shadow-md shadow-red-200 dark:shadow-none";
                    } else if (!isSelected && isCorrectOpt) {
                      btnClasses +=
                        "border-green-600 border-dashed text-green-700 dark:text-green-400";
                    } else {
                      btnClasses +=
                        "bg-black/[0.04] dark:bg-slate-800 border-black/[0.08] dark:border-white/10 text-black/40 dark:text-white/40 cursor-not-allowed";
                    }
                  } else {
                    if (isSelected) {
                      btnClasses +=
                        "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none";
                    } else {
                      btnClasses +=
                        "bg-white dark:bg-slate-800 border-black/[0.12] dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/50 dark:hover:border-white/40 hover:bg-black/[0.02] dark:hover:bg-slate-750";
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() =>
                        !showResults && handleAnswerChange(qid, opt)
                      }
                      disabled={showResults}
                      className={btnClasses}
                    >
                      {opt}
                    </button>
                  );
                })}

                {showResults && !isCorrect && correctVal && (
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400 self-center ml-2">
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

export default TrueFalseGroupBlock;
