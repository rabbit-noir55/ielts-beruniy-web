import { parseTextWithInputs } from "../../utils/questionParser";

const NoteGroupBlock = ({
  body,
  start,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
}) => {
  const idCounter = { current: start };

  const renderNode = (node, key, depth = 0) => {
    if (node === null || node === undefined) return null;

    if (typeof node === "string") {
      return (
        <div
          key={key}
          className="ml-6 my-1 text-sm text-black/50 dark:text-white/50"
        >
          {parseTextWithInputs(
            node,
            key,
            userAnswers,
            handleAnswerChange,
            showResults,
            getCorrectAnswer,
            isDark,
            idCounter,
          )}
        </div>
      );
    }

    if (Array.isArray(node)) {
      return (
        <div key={key} className="ml-6 my-1 space-y-1">
          {node.map((sub, i) => renderNode(sub, `${key}-${i}`, depth + 1))}
        </div>
      );
    }

    if (typeof node === "object") {
      const { title, prefix, items } = node;

      return (
        <div key={key} className={title ? "ml-4 my-3" : "ml-6 my-1"}>
          {title && (
            <h3 className="text-sm font-bold text-[#17171A] dark:text-[#F5F5F5] mb-1">
              {parseTextWithInputs(
                title,
                `${key}-title`,
                userAnswers,
                handleAnswerChange,
                showResults,
                getCorrectAnswer,
                isDark,
                idCounter,
              )}
            </h3>
          )}

          {prefix && (
            <div className="text-sm font-medium text-black/50 dark:text-white/50 mb-1">
              {parseTextWithInputs(
                prefix,
                `${key}-prefix`,
                userAnswers,
                handleAnswerChange,
                showResults,
                getCorrectAnswer,
                isDark,
                idCounter,
              )}
            </div>
          )}

          {Array.isArray(items) && (
            <div className={title || prefix ? "ml-4 space-y-1" : "space-y-1"}>
              {items.map((sub, i) =>
                renderNode(sub, `${key}-item-${i}`, depth + 1),
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="text-[#17171A] dark:text-[#F5F5F5]">
      {body.title && (
        <h2 className="text-base font-bold mb-3 text-[#17171A] dark:text-[#F5F5F5]">
          {body.title}
        </h2>
      )}

      <div className="space-y-1">
        {Array.isArray(body.items) &&
          body.items.map((item, idx) => renderNode(item, `root-${idx}`))}
      </div>
    </section>
  );
};

export default NoteGroupBlock;
