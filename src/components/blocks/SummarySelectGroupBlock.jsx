import { parseTextWithInputs } from "../../utils/questionParser";

const SummarySelectGroupBlock = ({
  body,
  start,
  end,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
}) => {
  const rangeLabel =
    end > start ? `Questions ${start}–${end}` : `Question ${start}`;

  const selectOptions = body.list
    ? body.list.map((_, idx) => String.fromCharCode(65 + idx))
    : [];

  const idCounter = { current: start };

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

      {body.list && (
        <div className="mb-4 rounded-md border border-black/[0.12] bg-black/[0.02] p-4 dark:border-white/10 dark:bg-slate-800">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {body.list.map((option, idx) => (
              <div
                key={idx}
                className="text-sm text-[#17171A] dark:text-[#F5F5F5]"
              >
                <span className="font-bold mr-1">{selectOptions[idx]}.</span>
                {option.trim()}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-[#17171A] dark:text-[#F5F5F5] leading-relaxed space-y-3">
        {body.items.map((para, pIdx) => (
          <p key={pIdx}>
            {parseTextWithInputs(
              para,
              `summary-select-${pIdx}`,
              userAnswers,
              handleAnswerChange,
              showResults,
              getCorrectAnswer,
              isDark,
              idCounter,
              selectOptions,
            )}
          </p>
        ))}
      </div>
    </div>
  );
};

export default SummarySelectGroupBlock;
