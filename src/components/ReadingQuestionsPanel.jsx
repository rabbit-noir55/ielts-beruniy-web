import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEraser, faHighlighter } from "@fortawesome/free-solid-svg-icons";
import NoteGroupBlock from "./blocks/NoteGroupBlock";
import ChoiceGroupBlock from "./blocks/ChoiceGroupBlock";
import ListGroupBlock from "./blocks/ListGroupBlock";
import DiagramGroupBlock from "./blocks/DiagramGroupBlock";
import TrueFalseGroupBlock from "./blocks/TrueFalseGroupBlock";
import SummarySelectGroupBlock from "./blocks/SummarySelectGroupBlock";
import SectionHeadingMatchBlock from "./blocks/SectionHeadingMatchBlock";
import MatchingGroupBlock from "./blocks/MatchingGroupBlock";

const useIsMobile = () => {
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  return isMobile;
};

const COMPONENT_MAP = {
  "input-note": NoteGroupBlock,
  "input-form": NoteGroupBlock,
  "input-sentence": NoteGroupBlock,
  "input-flowchart": NoteGroupBlock,
  "input-summary": NoteGroupBlock,
  "input-answer": NoteGroupBlock,

  "option-abc": ChoiceGroupBlock,
  checkbox: ChoiceGroupBlock,
  mcq: ChoiceGroupBlock,

  "select-given-list": ListGroupBlock,
  "select-flowchart-given-list": ListGroupBlock,
  "select-section": ListGroupBlock,

  "select-section-given-list": SectionHeadingMatchBlock,

  "select-summary-given-list": SummarySelectGroupBlock,

  "option-true-false": TrueFalseGroupBlock,
  "option-yes-no": TrueFalseGroupBlock,
  "tf-yn": TrueFalseGroupBlock,

  "select-given-diagram": DiagramGroupBlock,
  "input-diagram": DiagramGroupBlock,

  matching: MatchingGroupBlock,
};

// Normalize block data for new format compatibility
const normalizeBlock = (block) => {
  const b = { ...block };

  // tf-yn: items are { question_num, text } — extract text strings
  if (b.type === "tf-yn" && Array.isArray(b.body?.items)) {
    b.body = {
      ...b.body,
      items: b.body.items.map((item) =>
        typeof item === "object" && item !== null ? item.text : item
      ),
    };
  }

  // mcq: options have letter prefix like "A to attract fish." — strip it
  if (b.type === "mcq" && Array.isArray(b.body?.items)) {
    b.body = {
      ...b.body,
      items: b.body.items.map((item) => {
        if (typeof item !== "object" || !Array.isArray(item.options)) return item;
        return {
          ...item,
          options: item.options.map((opt) => opt.replace(/^[A-Z]\s*/, "")),
        };
      }),
    };
  }

  return b;
};

const ReadingQuestionsPanel = ({
  questions = [],
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
  isDark,
  containerRef,
  onMouseUp,
  onClick,
  onClearAnswers,
  onClearAnnotations,
  widthPercent = 50,
}) => {
  const isMobile = useIsMobile();

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-6 text-black/40 dark:text-white/40">
        {"Questions not loaded..."}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseUp={onMouseUp}
      onClick={onClick}
      style={{ width: isMobile ? "100%" : `${widthPercent}%` }}
      className={`md:overflow-y-auto p-4 md:p-6 select-text bg-white dark:bg-[#0A0A0B] transition-colors duration-300 w-full md:h-full`}
    >
      {(onClearAnswers || onClearAnnotations) && (
        <div className="w-full flex justify-end gap-2 mb-4">
          {onClearAnswers && (
            <button
              onClick={onClearAnswers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.12] dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-[#141416] transition cursor-pointer"
              title={"Clear all answers"}
            >
              <FontAwesomeIcon icon={faEraser} size="sm" /> {"Clear answers"}
            </button>
          )}
          {onClearAnnotations && (
            <button
              onClick={onClearAnnotations}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.12] dark:border-white/10 text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-[#141416] transition cursor-pointer"
              title={"Clear all highlights and notes"}
            >
              <FontAwesomeIcon icon={faHighlighter} size="sm" /> {"Clear marks"}
            </button>
          )}
        </div>
      )}

      <div className="w-full space-y-8">
        {questions.map((block, index) => {
          const normalized = normalizeBlock(block);
          const TargetComponent = COMPONENT_MAP[normalized.type];

          if (!TargetComponent) {
            console.warn(`Unknown question type: ${normalized.type}`);
            return null;
          }

          return (
            <div
              key={`${normalized.type}-${index}`}
              className="p-5 border border-black/[0.08] dark:border-white/5 rounded-2xl bg-[#F6F5F2] dark:bg-[#141416]/60 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {normalized.desc?.constraint && (
                <div className="mb-3 inline-block bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                  {normalized.desc.constraint}
                </div>
              )}

              <TargetComponent
                type={normalized.type}
                body={normalized.body}
                start={normalized.start}
                end={normalized.end}
                userAnswers={userAnswers}
                handleAnswerChange={handleAnswerChange}
                showResults={showResults}
                getCorrectAnswer={getCorrectAnswer}
                isDark={isDark}
                desc={normalized.desc}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadingQuestionsPanel;
