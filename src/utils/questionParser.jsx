import React from "react";
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

export const renderRecursiveTree = (
  node,
  keyPrefix,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
  idCounter,
  selectOptions = null,
) => {
  if (node === null || node === undefined) return null;

  if (typeof node === "string") {
    return parseTextWithInputs(
      node,
      keyPrefix,
      userAnswers,
      handleAnswerChange,
      showResults,
      getCorrectAnswer,
      isDark,
      idCounter,
      selectOptions,
    );
  }

  if (Array.isArray(node)) {
    return (
      <ul
        key={`${keyPrefix}-ul`}
        className="list-disc list-outside ml-5 space-y-1"
      >
        {node.map((child, idx) => {
          const childKey = `${keyPrefix}-${idx}`;
          return (
            <li key={childKey} className="text-base">
              {renderRecursiveTree(
                child,
                childKey,
                userAnswers,
                handleAnswerChange,
                showResults,
                getCorrectAnswer,
                isDark,
                idCounter,
                selectOptions,
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  if (typeof node === "object") {
    const { title, prefix, items, content, ...rest } = node;

    const titleNode = title
      ? renderRecursiveTree(
          title,
          `${keyPrefix}-title`,
          userAnswers,
          handleAnswerChange,
          showResults,
          getCorrectAnswer,
          isDark,
          idCounter,
          selectOptions,
        )
      : null;

    const prefixNode = prefix
      ? renderRecursiveTree(
          prefix,
          `${keyPrefix}-prefix`,
          userAnswers,
          handleAnswerChange,
          showResults,
          getCorrectAnswer,
          isDark,
          idCounter,
          selectOptions,
        )
      : null;

    const itemsNode = items
      ? renderRecursiveTree(
          items,
          `${keyPrefix}-items`,
          userAnswers,
          handleAnswerChange,
          showResults,
          getCorrectAnswer,
          isDark,
          idCounter,
          selectOptions,
        )
      : null;

    const contentNode = content
      ? renderRecursiveTree(
          content,
          `${keyPrefix}-content`,
          userAnswers,
          handleAnswerChange,
          showResults,
          getCorrectAnswer,
          isDark,
          idCounter,
          selectOptions,
        )
      : null;

    const restNodes = Object.entries(rest).map(([key, value]) =>
      renderRecursiveTree(
        value,
        `${keyPrefix}-${key}`,
        userAnswers,
        handleAnswerChange,
        showResults,
        getCorrectAnswer,
        isDark,
        idCounter,
        selectOptions,
      ),
    );

    return (
      <div key={`${keyPrefix}-obj`} className="mt-1">
        {titleNode && (
          <div className="font-semibold text-[#17171A] dark:text-white text-lg">
            {titleNode}
          </div>
        )}
        {prefixNode && (
          <div className="font-medium text-sm text-black/50 dark:text-white/50 mt-1 mb-1">
            {prefixNode}
          </div>
        )}
        {itemsNode && <div className="ml-3 mt-1">{itemsNode}</div>}
        {contentNode && <div className="ml-3 mt-1">{contentNode}</div>}
        {restNodes.length > 0 && (
          <div className="ml-3 mt-1">
            {restNodes.map((n, idx) => (
              <React.Fragment key={`${keyPrefix}-rest-${idx}`}>
                {n}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span key={`${keyPrefix}-other`}>{String(node)}</span>;
};

export const renderBlocks = (
  textBlock,
  userAnswers = {},
  handleAnswerChange = () => {},
  showResults = false,
  getCorrectAnswer = () => "",
  isDark = false,
  startId = 1,
  selectOptions = null,
) => {
  if (!textBlock) return null;

  const idCounter = { current: startId };

  let rootData = textBlock;
  if (typeof textBlock === "object" && textBlock.body_smart) {
    rootData = textBlock.body_smart;
  } else if (typeof textBlock === "object" && textBlock.body) {
    rootData = textBlock.body;
  }

  return (
    <div className="my-4 p-4 border rounded-lg bg-white border-black/[0.08] dark:bg-[#141416] dark:border-white/10">
      {renderRecursiveTree(
        rootData,
        "root",
        userAnswers,
        handleAnswerChange,
        showResults,
        getCorrectAnswer,
        isDark,
        idCounter,
        selectOptions,
      )}
    </div>
  );
};

export default renderBlocks;
