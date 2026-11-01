
const ChoiceGroupBlock = ({
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

  const renderOption = (qid, optionText, index, isCheckbox) => {
    const letter = String.fromCharCode(65 + index);
    const currentAnswer = userAnswers[qid] || "";
    const selectedLetters = currentAnswer ? currentAnswer.split("|") : [];
    const isSelected = selectedLetters.includes(letter);

    let correctAnswerStr = "";
    if (showResults) {
      if (isCheckbox) {
        correctAnswerStr = Array.from({ length: end - start + 1 }, (_, i) =>
          getCorrectAnswer(start + i),
        )
          .filter(Boolean)
          .join("|");
      } else {
        correctAnswerStr = getCorrectAnswer(qid);
      }
    }
    const correctLetters = correctAnswerStr ? correctAnswerStr.split("|") : [];
    const isCorrectOption = correctLetters.includes(letter);

    let ringClasses = "border-black/[0.2] dark:border-white/20";
    let dotClasses = "";
    let textClasses = "text-[#17171A] dark:text-[#F5F5F5]";

    if (showResults) {
      if (isSelected && isCorrectOption) {
        ringClasses = "border-green-600 dark:border-green-500";
        dotClasses = "bg-green-600 dark:bg-green-500";
        textClasses = "text-green-700 dark:text-green-400 font-medium";
      } else if (isSelected && !isCorrectOption) {
        ringClasses = "border-red-600 dark:border-red-500";
        dotClasses = "bg-red-600 dark:bg-red-500";
        textClasses = "text-red-700 dark:text-red-400 font-medium";
      } else if (!isSelected && isCorrectOption) {
        ringClasses = "border-green-600 dark:border-green-500 border-dashed";
        textClasses = "text-green-700 dark:text-green-400";
      } else {
        ringClasses = "border-black/[0.12] dark:border-white/10";
        textClasses = "text-black/40 dark:text-white/40";
      }
    } else if (isSelected) {
      ringClasses = "border-[var(--accent)] dark:border-white";
      dotClasses = "bg-[var(--accent)] dark:bg-[var(--accent)]";
    }

    const handleClick = () => {
      if (showResults) return;
      if (type === "option-abc" || type === "mcq") {
        handleAnswerChange(qid, letter);
      } else if (type === "checkbox") {
        let newSelected;
        if (isSelected) {
          newSelected = selectedLetters.filter((l) => l !== letter);
        } else {
          newSelected = [...selectedLetters, letter];
        }
        newSelected.sort();
        handleAnswerChange(qid, newSelected.join("|"));
      }
    };

    const shapeClasses = isCheckbox ? "rounded-[4px]" : "rounded-full";
    const innerShapeClasses = isCheckbox ? "rounded-[2px]" : "rounded-full";

    return (
      <div
        key={letter}
        className={`flex items-center gap-3 py-1.5 ${
          showResults ? "cursor-default" : "cursor-pointer group"
        }`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        aria-disabled={showResults}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 shrink-0 border-2 ${shapeClasses} ${ringClasses} transition-colors ${
            !showResults
              ? "group-hover:border-black/50 dark:group-hover:border-white/50"
              : ""
          }`}
        >
          {dotClasses && (
            <span
              className={`w-2.5 h-2.5 ${innerShapeClasses} ${dotClasses}`}
            />
          )}
        </span>
        <span className={`text-sm ${textClasses}`}>
          <span className="font-medium mr-1">{letter}.</span>
          {optionText}
        </span>
        {showResults && !isSelected && isCorrectOption && (
          <span className="text-xs text-green-700 dark:text-green-400 ml-1">
            (correct)
          </span>
        )}
      </div>
    );
  };

  if (type === "mcq" && body.items && Array.isArray(body.items)) {
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
          {body.items.map((item, idx) => {
            const qid = item.question_num ?? start + idx;
            return (
              <div key={qid}>
                <p className="font-semibold mb-1.5 text-[#17171A] dark:text-[#F5F5F5]">
                  <span className="mr-1">{qid}</span>
                </p>
                <div className="pl-1">
                  {item.options.map((opt, optIdx) =>
                    renderOption(qid, opt, optIdx, false),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "option-abc" && body.items && Array.isArray(body.items)) {
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
          {body.items.map((item, idx) => {
            const qid = start + idx;
            return (
              <div key={qid}>
                <p className="font-semibold mb-1.5 text-[#17171A] dark:text-[#F5F5F5]">
                  <span className="mr-1">{qid}</span>
                  {item.title}
                </p>
                <div className="pl-1">
                  {item.options.map((opt, optIdx) =>
                    renderOption(qid, opt, optIdx, false),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === "checkbox" && body.options && Array.isArray(body.options)) {
    const qid = start;
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
        <div className="pl-1">
          {body.options.map((opt, idx) => renderOption(qid, opt, idx, true))}
        </div>
      </div>
    );
  }

  return null;
};

export default ChoiceGroupBlock;
