import { parseTextWithInputs } from "../../utils/questionParser";

const TableGroupBlock = ({
  body,
  start,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
}) => {
  if (!body || !body.items || body.items.length === 0) {
    return (
      <div className="text-black/40 dark:text-white/40">No table data</div>
    );
  }

  const headers = body.items[0];
  const rows = body.items.slice(1);

  const idCounter = { current: start };

  const hasInput = (str) => typeof str === "string" && (str.includes("<input>") || str.includes("[qzone-input-"));

  // Check if this is a "matching" type table (Our Mocks format)
  // Header row has empty first cell followed by single letters (A, B, C, D, E, F)
  // Data rows have question text in first cell and empty strings in other cells
  const isMatchingTable = headers.length > 1 &&
    headers[0] === "" &&
    headers.slice(1).every(h => typeof h === "string" && /^[A-Z]$/.test(h.trim())) &&
    rows.length > 0 &&
    rows.every(row => row.length === headers.length && row.slice(1).every(cell => cell === ""));

  // If this is a matching table, render radio buttons
  if (isMatchingTable) {
    const options = headers.slice(1); // ['A', 'B', 'C', 'D', 'E', 'F']

    return (
      <div className="space-y-4">
        {rows.map((row, rowIdx) => {
          const questionText = row[0];
          const questionId = start + rowIdx;
          const currentAnswer = userAnswers[questionId] || "";
          const correctAnswer = getCorrectAnswer ? getCorrectAnswer(questionId) : null;
          const isCorrect = showResults && correctAnswer && currentAnswer.toUpperCase() === correctAnswer.toUpperCase();
          const isWrong = showResults && correctAnswer && currentAnswer && currentAnswer.toUpperCase() !== correctAnswer.toUpperCase();

          return (
            <div
              key={`matching-q-${questionId}`}
              className={`p-4 rounded-lg border ${
                showResults
                  ? isCorrect
                    ? "bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-500"
                    : isWrong
                    ? "bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-500"
                    : "border-black/[0.12] dark:border-white/10"
                  : "border-black/[0.12] dark:border-white/10"
              }`}
            >
              <div className="text-sm font-medium text-[#17171A] dark:text-[#F5F5F5] mb-3">
                {questionText}
              </div>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isSelected = currentAnswer.toUpperCase() === option.toUpperCase();
                  return (
                    <button
                      key={`opt-${questionId}-${option}`}
                      type="button"
                      onClick={() => !showResults && handleAnswerChange(questionId, option)}
                      disabled={showResults}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? showResults && isCorrect
                            ? "bg-green-500 text-white border-green-500"
                            : showResults && isWrong
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]"
                          : "bg-white dark:bg-[#141416] text-[#17171A] dark:text-[#F5F5F5] border-black/[0.12] dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/5"
                      } border ${showResults ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {showResults && correctAnswer && currentAnswer && currentAnswer.toUpperCase() !== correctAnswer.toUpperCase() && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  Correct answer: {correctAnswer.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-black/[0.12] dark:border-white/10">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-black/[0.02] dark:bg-slate-800">
            {headers.map((header, idx) => (
              <th
                key={`header-${idx}`}
                className="px-4 py-3 text-left text-sm font-bold text-[#17171A] dark:text-[#F5F5F5] border border-black/[0.12] dark:border-white/10"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={`row-${rowIdx}`} className="bg-white dark:bg-slate-900">
              {row.map((cell, cellIdx) => {
                if (typeof cell === "string") {
                  if (hasInput(cell)) {
                    const keySeed = idCounter.current;
                    return (
                      <td
                        key={`cell-${rowIdx}-${cellIdx}`}
                        className="px-4 py-3 text-sm text-[#17171A] dark:text-[#F5F5F5] border border-black/[0.12] dark:border-white/10 align-top"
                      >
                        {parseTextWithInputs(
                          cell,
                          `table-${rowIdx}-${cellIdx}-${keySeed}`,
                          userAnswers,
                          handleAnswerChange,
                          showResults,
                          getCorrectAnswer,
                          isDark,
                          idCounter,
                        )}
                      </td>
                    );
                  } else {
                    return (
                      <td
                        key={`cell-${rowIdx}-${cellIdx}`}
                        className="px-4 py-3 text-sm text-[#17171A] dark:text-[#F5F5F5] border border-black/[0.12] dark:border-white/10 align-top"
                      >
                        {cell}
                      </td>
                    );
                  }
                } else if (Array.isArray(cell)) {
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className="px-4 py-3 text-sm text-[#17171A] dark:text-[#F5F5F5] border border-black/[0.12] dark:border-white/10 align-top"
                    >
                      <ul className="list-disc pl-4 space-y-1">
                        {cell.map((item, itemIdx) => {
                          if (hasInput(item)) {
                            const keySeed = idCounter.current;
                            return (
                              <li key={`item-${rowIdx}-${cellIdx}-${itemIdx}`}>
                                {parseTextWithInputs(
                                  item,
                                  `table-li-${rowIdx}-${cellIdx}-${itemIdx}-${keySeed}`,
                                  userAnswers,
                                  handleAnswerChange,
                                  showResults,
                                  getCorrectAnswer,
                                  isDark,
                                  idCounter,
                                )}
                              </li>
                            );
                          } else {
                            return (
                              <li key={`item-${rowIdx}-${cellIdx}-${itemIdx}`}>
                                {item}
                              </li>
                            );
                          }
                        })}
                      </ul>
                    </td>
                  );
                } else {
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className="px-4 py-3 text-sm text-[#17171A] dark:text-[#F5F5F5] border border-black/[0.12] dark:border-white/10 align-top"
                    >
                      {cell}
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableGroupBlock;
