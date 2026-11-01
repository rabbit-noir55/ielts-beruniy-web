const PART_DESCRIPTIONS = {
  1: "Introduction and Interview (4-5 minutes)",
  2: "Individual Long Turn (3-4 minutes, including 1 minute preparation)",
  3: "Two-way Discussion (4-5 minutes)",
};

import SpeakingFeedbackPanel from "./SpeakingFeedbackPanel";

const SpeakingQuestionPanel = ({ currentPart, topics, title, isDark, feedbackResult }) => {
  return (
    <div
      className="w-1/2 overflow-y-auto border-r p-6"
      style={{ borderRightColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }}
    >
      <h1 className="text-2xl font-bold mb-1">{"Speaking"} Part {currentPart}</h1>
      <p className="text-sm mb-4 text-black/40 dark:text-white/40">
        {PART_DESCRIPTIONS[currentPart] || ""}
      </p>

      <div className="space-y-4">
        {topics.map((topic, ti) => (
          <div
            key={ti}
            className={`rounded-lg border p-4 ${
              isDark
                ? "border-white/10 bg-[#141416]/60"
                : "border-black/[0.08] bg-black/[0.02]"
            }`}
          >
            {currentPart !== 2 && (
              <p className="text-xs font-bold uppercase tracking-wide text-black/40 dark:text-white/40 mb-2">
                {currentPart === 1 ? title : topic.title}
              </p>
            )}
            {currentPart === 2 && (
              <p className="font-semibold mb-1">{topic.title}</p>
            )}
            {currentPart === 2 && (topic.items || []).length > 0 && (
              <ul className="list-disc list-inside text-sm space-y-1 mt-1 text-black/50 dark:text-white/50">
                {(topic.items || []).map((item, ii) => (
                  <li key={ii}>{item}</li>
                ))}
              </ul>
            )}
            {currentPart !== 2 && (
              <ul className="space-y-3">
                {(topic.items || []).map((q, qi) => (
                  <li key={qi} className="text-base leading-relaxed">
                    {qi + 1}. {q}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {feedbackResult && <SpeakingFeedbackPanel isDark={isDark} result={feedbackResult} />}
    </div>
  );
};

export default SpeakingQuestionPanel;
