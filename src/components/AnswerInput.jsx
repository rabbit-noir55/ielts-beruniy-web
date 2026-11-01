import React, { useCallback, useRef } from "react";

const AnswerInput = React.memo(function AnswerInput({
  qid,
  value,
  onChange,
  disabled,
  correct,
  showResult,
  isDark: _isDark,
  ...inputProps
}) {
  const inputRef = useRef(null);

  const handleBadgeClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const resultClass = showResult
    ? correct
      ? "bg-green-50 border-green-500 dark:bg-green-950 dark:border-green-500"
      : "bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-500"
    : "bg-white border-black/[0.12] dark:bg-[#141416] dark:border-white/15";

  return (
    <span className="answer-input-group inline-flex items-center gap-1.5 mx-1 align-middle group">
      <button
        type="button"
        onClick={handleBadgeClick}
        className="answer-badge flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-medium shrink-0 cursor-pointer transition-all duration-200 border-black/20 dark:border-white/20 text-black/50 dark:text-white/50 hover:scale-110 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] hover:border-[var(--accent)]"
      >
        {qid}
      </button>

      <input
        ref={inputRef}
        type="text"
        placeholder="..."
        value={value}
        onChange={(e) => onChange(qid, e.target.value)}
        disabled={disabled}
        data-qid={qid}
        {...inputProps}
        className={`border rounded px-2 py-1 w-28 text-sm text-[#17171A] dark:text-[#F5F5F5] placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:scale-105 transition-all duration-150 ${showResult ? "qz-anim-pop-in" : ""} ${resultClass}`}
      />
    </span>
  );
});

export default AnswerInput;
