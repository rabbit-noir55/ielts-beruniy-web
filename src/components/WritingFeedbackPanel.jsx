import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
const CRITERIA = [
  { key: "taskAchievement", label: "Task Achievement / Response" },
  { key: "coherenceCohesion", label: "Coherence and Cohesion" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range and Accuracy" },
];

const bandColor = (band) => {
  if (band >= 7) return "text-green-600 dark:text-green-400";
  if (band >= 5.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const detectColor = (prob) => {
  if (prob >= 0.7) return "text-red-600 dark:text-red-400";
  if (prob >= 0.4) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
};

const detectBarColor = (prob) => {
  if (prob >= 0.7) return "bg-red-500";
  if (prob >= 0.4) return "bg-amber-500";
  return "bg-green-500";
};

const WritingFeedbackPanel = ({ isDark, loading, result, errorMessage, onDismiss }) => {
  if (!loading && !result && !errorMessage) return null;

  return (
    <div
      className={`mt-4 rounded-2xl border qz-anim-fade-in ${
        isDark ? "bg-[#141416] border-white/10 text-[#F5F5F5]" : "bg-white border-black/[0.08] text-[#17171A]"
      }`}
    >
      <div className="flex items-center justify-between border-b px-5 py-3 border-inherit">
        <h2 className="text-base font-bold">{"Writing Feedback"}</h2>
        {!loading && (
          <button
            onClick={onDismiss}
            className={`qz-icon-btn p-1.5 rounded-full ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/[0.04] text-black/40"}`}
            title={"Close"}
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-8 qz-anim-fade-in">
            <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full qz-spinner" />
            <p className={isDark ? "text-white/40" : "text-black/40"}>
              {"AI is analyzing your essay, please wait..."}
            </p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="flex flex-col items-center gap-3 py-6 text-center qz-anim-scale-in">
            <FontAwesomeIcon icon={faTriangleExclamation} className="w-6 h-6 text-3xl text-amber-500" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-5 qz-anim-fade-in">
            {result.degraded && (
              <div className="text-xs px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                ⚠ {"Image not analyzed (score may be random) — evaluated based on text only."}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 py-2">
              <span className="text-sm uppercase tracking-wide text-black/40 dark:text-white/40">
                {"Overall Band"}
              </span>
              <span className={`text-4xl font-extrabold ${bandColor(result.overallBand)}`}>
                {result.overallBand}
              </span>
            </div>

            {result.aiDetection && (
              <div
                className={`rounded-xl border p-3 ${
                  isDark ? "border-white/10 bg-[#141416]/40" : "border-black/[0.08] bg-black/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-black/40 dark:text-white/40">
                    {"AI similarity"}
                  </span>
                  <span
                    className={`font-bold text-sm ${detectColor(result.aiDetection.ai_probability)}`}
                  >
                    {Math.round(result.aiDetection.ai_probability * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${detectBarColor(result.aiDetection.ai_probability)}`}
                    style={{ width: `${Math.round(result.aiDetection.ai_probability * 100)}%` }}
                  />
                </div>
                <p className="text-xs mt-2 text-black/40 dark:text-white/40 italic">
                  {"Approximate estimate — not a final verdict. Essays by non-native speakers are sometimes flagged as AI."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CRITERIA.map((c) => {
                const item = result[c.key];
                if (!item) return null;
                return (
                  <div
                    key={c.key}
                    className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-[#141416]/40" : "border-black/[0.08] bg-black/[0.02]"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-black/40 dark:text-white/40">
                        {c.label}
                      </span>
                      <span className={`font-bold ${bandColor(item.band)}`}>{item.band}</span>
                    </div>
                    <p className="text-sm text-black/50 dark:text-white/50">{item.comment}</p>
                  </div>
                );
              })}
            </div>

            {result.strengths?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-1.5 text-green-700 dark:text-green-400">
                  ✓ {"Strengths"}
                </h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-black/50 dark:text-white/50">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.improvements?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-1.5 text-amber-700 dark:text-amber-400">
                  ↗ {"Areas to improve"}
                </h3>
                <ul className="list-disc list-inside text-sm space-y-1 text-black/50 dark:text-white/50">
                  {result.improvements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.summary && (
              <p className="text-sm italic border-t pt-3 border-black/[0.08] dark:border-white/10 text-black/50 dark:text-white/40">
                {result.summary}
              </p>
            )}

            {result.corrections?.length > 0 && (
              <div className="border-t pt-4 border-black/[0.08] dark:border-white/10">
                <h3 className="text-sm font-bold mb-3 text-[#17171A] dark:text-white/70">
                  ✎ {"Corrections"}
                </h3>
                <div className="space-y-3">
                  {result.corrections.map((c, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-sm ${isDark ? "bg-[#141416]/40" : "bg-[#F6F5F2]"}`}
                    >
                      <p className="text-red-600 dark:text-red-400 line-through decoration-red-400/60 mb-1">
                        {c.original}
                      </p>
                      <p className="text-green-700 dark:text-green-400 font-medium mb-1">
                        → {c.improved}
                      </p>
                      {c.reason && (
                        <p className="text-xs text-black/40 dark:text-white/40 italic">
                          {c.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.optimizedEssay && (
              <div className="border-t pt-4 border-black/[0.08] dark:border-white/10">
                <h3 className="text-sm font-bold mb-3 text-emerald-700 dark:text-emerald-400">
                  ★ {"Optimized version (Band 8-9 style)"}
                </h3>
                <div
                  className={`rounded-lg p-4 text-sm leading-relaxed whitespace-pre-line ${
                    isDark ? "bg-[#141416]/40 text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
                  }`}
                >
                  {result.optimizedEssay}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingFeedbackPanel;
