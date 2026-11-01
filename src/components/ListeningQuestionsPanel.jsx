import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEraser, faHighlighter } from "@fortawesome/free-solid-svg-icons";
import NoteGroupBlock from "./blocks/NoteGroupBlock";
import ChoiceGroupBlock from "./blocks/ChoiceGroupBlock";
import ListGroupBlock from "./blocks/ListGroupBlock";
import TableGroupBlock from "./blocks/TableGroupBlock";
import DiagramGroupBlock from "./blocks/DiagramGroupBlock";
import MapRadioBlock from "./blocks/MapRadioBlock";
import MatchingGroupBlock from "./blocks/MatchingGroupBlock";
import TrueFalseGroupBlock from "./blocks/TrueFalseGroupBlock";
import SummarySelectGroupBlock from "./blocks/SummarySelectGroupBlock";

const COMPONENT_MAP = {
  "input-note": NoteGroupBlock,
  "input-form": NoteGroupBlock,
  "input-sentence": NoteGroupBlock,
  "input-flowchart": NoteGroupBlock,
  "input-summary": NoteGroupBlock,
  "input-answer": NoteGroupBlock,

  "option-abc": ChoiceGroupBlock,
  "option-true-false": TrueFalseGroupBlock,
  "option-yes-no": TrueFalseGroupBlock,
  "tf-yn": TrueFalseGroupBlock,
  checkbox: ChoiceGroupBlock,

  "select-given-list": ListGroupBlock,
  "select-flowchart-given-list": ListGroupBlock,
  "select-section": ListGroupBlock,
  "select-summary-given-list": SummarySelectGroupBlock,

  "input-table": TableGroupBlock,
  "radio-table": MapRadioBlock,

  "select-given-diagram": DiagramGroupBlock,
  matching: MatchingGroupBlock,
};

const ListeningQuestionsPanel = ({
  questions = [],
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,

  containerRef,
  onMouseUp,
  onClick,
  transcriptVisible = true,
  onClearAnswers,
  onClearAnnotations,
}) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-6 text-black/40 dark:text-white/40">
        Questions not loaded...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseUp={onMouseUp}
      onClick={onClick}
      className={`${
        transcriptVisible ? "w-full md:w-1/2" : "w-full"
      } overflow-y-auto p-4 md:p-6 select-text bg-white dark:bg-[#0A0A0B] transition-colors duration-300`}
    >
      {(onClearAnswers || onClearAnnotations) && (
        <div className="w-full flex justify-end gap-2 mb-4">
          {onClearAnswers && (
            <button
              onClick={onClearAnswers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.12] dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-[#141416] transition"
              title="Clear all answers"
            >
              <FontAwesomeIcon icon={faEraser} /> Clear answers
            </button>
          )}
          {onClearAnnotations && (
            <button
              onClick={onClearAnnotations}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.12] dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-[#141416] transition"
              title="Clear all highlights and notes"
            >
              <FontAwesomeIcon icon={faHighlighter} /> Clear marks
            </button>
          )}
        </div>
      )}

      <div className="w-full space-y-8">
        {questions.map((block, index) => {
          const TargetComponent = COMPONENT_MAP[block.type];

          if (!TargetComponent) {
            console.warn(`Unknown question type: ${block.type}`);
            return null;
          }

          return (
            <div
              key={`${block.type}-${index}`}
              className="p-5 border border-black/[0.08] dark:border-white/5 rounded-2xl bg-[#F6F5F2] dark:bg-[#141416]/60 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {block.desc?.constraint && (
                <div className="mb-3 inline-block bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider">
                  {block.desc.constraint}
                </div>
              )}

              <TargetComponent
                type={block.type}
                body={block.body}
                start={block.start}
                end={block.end}
                userAnswers={userAnswers}
                handleAnswerChange={handleAnswerChange}
                showResults={showResults}
                getCorrectAnswer={getCorrectAnswer}
                isDark={isDark}
                wide={!transcriptVisible}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListeningQuestionsPanel;
