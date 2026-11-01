import { Fragment } from "react";
import AnswerInput from "../AnswerInput";

const DiagramGroupBlock = ({
  type,
  body,
  start,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
}) => {
  const isInputDiagram = type === "input-diagram";

  const [first, last] = body.desc?.optionRange || ["A", "I"];
  const optionLetters = [];
  if (first && last && !isInputDiagram) {
    for (let i = first.charCodeAt(0); i <= last.charCodeAt(0); i++) {
      optionLetters.push(String.fromCharCode(i));
    }
  }

  const rawItems = body.items || [];

  let groups;
  if (
    rawItems.length > 0 &&
    typeof rawItems[0] === "object" &&
    !Array.isArray(rawItems[0]) &&
    rawItems[0] !== null &&
    Array.isArray(rawItems[0].items)
  ) {
    groups = rawItems.map((g) => ({
      title: g.title ? String(g.title).trim() : null,
      lines: g.items || [],
    }));
  } else if (Array.isArray(rawItems[0])) {
    groups = [{ title: null, lines: rawItems.flat() }];
  } else {
    groups = [{ title: null, lines: rawItems }];
  }

  let runningId = start;
  const questions = [];
  groups.forEach((group, gIdx) => {
    group.lines.forEach((rawText, lineIdx) => {
      const cleanText = String(rawText).replace("<input>", "").trim();
      questions.push({
        id: runningId++,
        text: cleanText,
        groupTitle: lineIdx === 0 ? group.title : null,
        isFirstInGroup: lineIdx === 0,
        groupIdx: gIdx,
      });
    });
  });

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div className="w-full qz-anim-fade-in">
        <div className="rounded-md border border-black/[0.12] dark:border-white/10 bg-white dark:bg-slate-900 p-3 transition-shadow hover:shadow-md">
          <img
            src={`/images/${body.img}`}
            alt="Diagram for labelling"
            className="max-w-full h-auto rounded mx-auto max-h-[350px] object-contain"
          />
        </div>
      </div>

      <div className="w-full">
        <div className="space-y-3">
          {questions.map((q, qIdx) => {
            const userAnswer = userAnswers[q.id] || "";
            const correctAnswerRaw = getCorrectAnswer(q.id);
            const correctAnswer = correctAnswerRaw
              ? String(correctAnswerRaw)
              : "";
            const isCorrect =
              showResults && correctAnswer
                ? userAnswer.trim().toLowerCase() ===
                  correctAnswer.trim().toLowerCase()
                : null;

            return (
              <Fragment key={q.id}>
                {q.groupTitle && (
                  <h4
                    className={`text-sm font-bold text-black/50 dark:text-white/50 ${
                      q.groupIdx > 0
                        ? "pt-2 mt-2 border-t border-black/[0.08] dark:border-white/10"
                        : ""
                    }`}
                  >
                    {q.groupTitle}
                  </h4>
                )}
                <div
                  className="qz-row-in flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.02] dark:border-white/10 pb-2 last:border-0 last:pb-0"
                  style={{ animationDelay: `${Math.min(qIdx, 8) * 40}ms` }}
                >
                  <label
                    htmlFor={`control-q${q.id}`}
                    className="text-sm text-[#17171A] dark:text-[#F5F5F5] flex-1"
                  >
                    <button
                      type="button"
                      onClick={() => document.getElementById(`control-q${q.id}`)?.focus()}
                      className="answer-badge font-semibold mr-1 inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-semibold shrink-0 cursor-pointer transition-all duration-200 border-black/[0.2] dark:border-white/20 text-black/50 dark:text-white/50 hover:scale-110 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] hover:border-[var(--accent)]"
                    >
                      {q.id}
                    </button>
                    {q.text}
                  </label>
                  <div className="flex items-center gap-2">
                    {isInputDiagram ? (
                      <AnswerInput
                        qid={String(q.id)}
                        value={userAnswer}
                        onChange={(id, val) =>
                          handleAnswerChange(Number(id), val)
                        }
                        disabled={showResults}
                        correct={isCorrect}
                        showResult={showResults}
                        isDark={isDark}
                      />
                    ) : (
                      <select
                        id={`control-q${q.id}`}
                        value={userAnswer}
                        onChange={(e) =>
                          handleAnswerChange(q.id, e.target.value)
                        }
                        disabled={showResults}
                        className={`block w-24 px-2 py-1.5 text-sm border rounded bg-white dark:bg-slate-800 text-[#17171A] dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-80 transition-all ${
                          showResults && correctAnswer
                            ? isCorrect
                              ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-950"
                              : "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950"
                            : "border-black/[0.12] dark:border-white/10"
                        }`}
                      >
                        <option value="">--</option>
                        {optionLetters.map((letter) => (
                          <option key={letter} value={letter}>
                            {letter}
                          </option>
                        ))}
                      </select>
                    )}

                    {showResults && correctAnswer && !isCorrect && (
                      <span className="qz-anim-pop-in text-xs font-semibold text-green-700 dark:text-green-400">
                        Correct: {correctAnswer}
                      </span>
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiagramGroupBlock;
