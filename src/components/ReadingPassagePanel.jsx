import { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faLightbulb } from "@fortawesome/free-solid-svg-icons";
import WordDefinitionPopup from "./WordDefinitionPopup";

const useIsMobile = () => {
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  return isMobile;
};
const collectSentences = (node, out) => {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectSentences(n, out));
    return;
  }
  if (typeof node === "object") {
    if (typeof node.sentence_raw === "string") {
      out.push(node);
      return;
    }
    if (Array.isArray(node.items)) collectSentences(node.items, out);
  }
};

// Har bir "item" alohida paragraf hisoblanadi. Ma'lumotda bitta section
// ichida bir nechta paragraf-item bo'lishi mumkin, shuning uchun ularni
// section emas, balki item darajasida ajratamiz.
const buildParagraphs = (sections) => {
  let globalIdx = 0;
  const paragraphs = [];

  (sections || []).forEach((section, sIdx) => {
    const rawItems = Array.isArray(section.items)
      ? section.items
      : [{ items: section.items }];

    rawItems.forEach((item, pIdx) => {
      const sentences = [];
      collectSentences(item, sentences);

      const renderedSentences = sentences.map((s, senIdx) => {
        const wordNodes =
          Array.isArray(s.items) && s.items.length > 0
            ? s.items.filter((w) => w && typeof w.span === "string")
            : null;

        const words = wordNodes
          ? wordNodes.map((w) => ({ text: w.span, idx: globalIdx++ }))
          : String(s.sentence_raw || "")
              .split(/\s+/)
              .filter(Boolean)
              .map((t) => ({ text: t, idx: globalIdx++ }));

        return {
          key: `${sIdx}-${pIdx}-${senIdx}`,
          words,
          question_ids: s.question_ids,
        };
      });

      if (renderedSentences.length === 0) return;
      paragraphs.push({
        key: `${sIdx}-${pIdx}`,
        title: item.title || section.title || "",
        sentences: renderedSentences,
      });
    });
  });

  return paragraphs;
};

const ReadingPassagePanel = ({
  isDark,
  passageVisible,
  setPassageVisible,
  guidedMode,
  setGuidedMode,
  title,
  subtitle,
  sections,
  passageRef,
  handleTextSelection,
  handleAnnotatedClick,
  allQuestionIdsSet,
  widthPercent = 50,
  skimActive = false,
  skimWordIndex = 0,
  mockMode = false,
}) => {
  const [defPopup, setDefPopup] = useState(null);
  const isMobile = useIsMobile();

  const handleDoubleClick = useCallback(
    () => {
      if (mockMode) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (!text || text.split(/\s+/).length > 2) return;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setDefPopup({
        word: text.replace(/[.,!?;:'"()]/g, ""),
        x: rect.left,
        y: rect.bottom,
      });
    },
    [mockMode]
  );

  if (!passageVisible) return null;

  const paragraphs = buildParagraphs(sections);

  return (
    <div
      className={`relative md:overflow-y-auto md:border-r p-4 md:p-6 qz-anim-fade-in w-full md:h-full`}
      style={{
        width: isMobile ? "100%" : `${widthPercent}%`,
        borderRightColor: isDark ? "#334155" : "#e5e7eb",
      }}
      ref={passageRef}
      onMouseUp={handleTextSelection}
      onClick={handleAnnotatedClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2
          className={`text-lg font-semibold ${isDark ? "text-white/50" : "text-black/50"}`}
        >
          {"Reading Passage"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPassageVisible(false)}
            className="qz-icon-btn p-2 rounded-full hover:bg-black/[0.08] dark:hover:bg-white/10"
            title={"Hide"}
          >
            <FontAwesomeIcon icon={faEyeSlash} size="sm" />
          </button>
          <button
            onClick={() => setGuidedMode((prev) => !prev)}
            title={
              guidedMode ? "Guided Mode: on" : "Guided Mode: off"
            }
            className={`qz-btn flex items-center gap-1 px-3 py-1 rounded text-sm ${guidedMode ? "bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] dark:hover:text-white hover:bg-black" : "bg-black/[0.08] dark:bg-white/10 text-black/50 dark:text-white/70 hover:bg-black/[0.12]"}`}
          >
            <FontAwesomeIcon icon={faLightbulb} size="sm" />
          </button>
        </div>
      </div>

      {title && (
        <h1 className="text-xl font-bold text-center mb-1 text-[#17171A] dark:text-white">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-sm font-semibold italic text-center mb-6 text-black/50 dark:text-white/50">
          {subtitle}
        </p>
      )}

      <div className="space-y-4 leading-relaxed text-base text-[#17171A] dark:text-[#F5F5F5]">
        {paragraphs.map((para) => (
          <p key={para.key} id={`para-${para.key}`}>
            {para.title && (
              <span className="font-bold mr-2 text-[#17171A] dark:text-white">
                {para.title}
              </span>
            )}
            {para.sentences.map((s) => {
              const guidedQids =
                guidedMode && s.question_ids
                  ? s.question_ids
                      .map(String)
                      .filter((q) => allQuestionIdsSet.has(q))
                  : [];
              const hasGuided = guidedQids.length > 0;

              return (
                <span
                  key={s.key}
                  className={`transition-colors duration-150 rounded px-0.5 ${
                    hasGuided ? "bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)]" : ""
                  }`}
                >
                  {s.words.map((w) => (
                    <span
                      key={w.idx}
                      className="transition-opacity duration-300 ease-out"
                      style={{
                        opacity: skimActive && w.idx < skimWordIndex ? 0 : 1,
                      }}
                    >
                      {w.text}{" "}
                    </span>
                  ))}
                  {guidedQids.length > 0 && (
                    <span className="mx-0.5 px-1 py-0.5 text-xs bg-black/[0.04] dark:bg-white/10 text-[#17171A] dark:text-white/70 rounded font-mono font-semibold">
                      Q{guidedQids.join(", ")}
                    </span>
                  )}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {defPopup && (
        <WordDefinitionPopup
          word={defPopup.word}
          position={{ x: defPopup.x, y: defPopup.y }}
          isDark={isDark}
          onClose={() => setDefPopup(null)}
        />
      )}
    </div>
  );
};

export default ReadingPassagePanel;
