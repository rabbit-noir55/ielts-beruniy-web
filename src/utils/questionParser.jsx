import AnswerInput from "../components/AnswerInput";

export const parseTextWithInputs = (
  text,
  keyPrefix,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
  idCounter,
  selectOptions = null,
) => {
  if (typeof text !== "string") return [text];

  const counter = idCounter || { current: 1 };

  const regex = /<input[^>]*>|\[qzone-input-([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`${keyPrefix}-txt-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>,
      );
    }

    let qid = match[1];
    if (!qid) {
      qid = String(counter.current);
      counter.current += 1;
    }
    qid = String(qid).trim();

    const userValue = userAnswers?.[qid] ?? "";
    const correctAnswerRaw = getCorrectAnswer ? getCorrectAnswer(qid) : "";
    const correctAnswerStr =
      correctAnswerRaw === undefined || correctAnswerRaw === null
        ? ""
        : String(correctAnswerRaw);

    const isCorrect =
      showResults &&
      userValue !== "" &&
      correctAnswerStr !== "" &&
      userValue.trim().toLowerCase() === correctAnswerStr.trim().toLowerCase();

    if (selectOptions && selectOptions.length > 0) {
      const selectResultClass = showResults
        ? isCorrect
          ? "bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-500 text-green-800 dark:text-green-200"
          : "bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-500 text-red-800 dark:text-red-200"
        : "bg-white border-black/[0.12] dark:bg-[#141416] dark:border-white/15 text-[#17171A] dark:text-[#F5F5F5]";

      parts.push(
        <span
          key={`${keyPrefix}-sel-wrap-${qid}`}
          className="answer-input-group inline-flex items-center gap-1.5 mx-1 align-middle"
        >
          <button
            type="button"
            onClick={() => document.getElementById(`select-inline-${qid}`)?.focus()}
            className="answer-badge flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-medium shrink-0 cursor-pointer transition-all duration-200 border-black/20 dark:border-white/20 text-black/50 dark:text-white/50 hover:scale-110 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] hover:border-[var(--accent)]"
          >
            {qid}
          </button>
          <select
            id={`select-inline-${qid}`}
            value={userValue}
            onChange={(e) => handleAnswerChange(qid, e.target.value)}
            disabled={showResults}
            className={`border rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all duration-150 ${selectResultClass}`}
          >
            <option value="">--</option>
            {selectOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {showResults && !isCorrect && correctAnswerStr && (
            <span className="text-xs font-semibold text-green-700 dark:text-green-400 ml-1">
              ({correctAnswerStr})
            </span>
          )}
        </span>,
      );
    } else {
      parts.push(
        <AnswerInput
          key={`${keyPrefix}-inp-${qid}`}
          qid={qid}
          value={userValue}
          onChange={handleAnswerChange}
          disabled={showResults}
          correct={isCorrect}
          showResult={showResults}
          isDark={isDark}
        />,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`${keyPrefix}-txt-tail`}>{text.slice(lastIndex)}</span>,
    );
  }

  return parts;
};
