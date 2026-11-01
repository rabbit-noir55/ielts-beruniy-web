const CRITERIA = [
  { key: "fluencyAndCoherence", label: "Fluency & Coherence" },
  { key: "lexicalResource", label: "Lexical Resource" },
  { key: "grammaticalRange", label: "Grammatical Range" },
  { key: "pronunciation", label: "Pronunciation" },
];

const bandColor = (band) => {
  if (band >= 7) return "text-green-600 dark:text-green-400";
  if (band >= 5.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const SpeakingFeedbackPanel = ({ isDark, result }) => {
  if (!result) return null;

  return (
    <div
      className={`mt-6 rounded-2xl border p-5 ${
        isDark
          ? "border-white/10 bg-[#141416]"
          : "border-black/[0.08] bg-white"
      }`}
    >
      <h2 className="text-base font-bold mb-4">{"Speaking Feedback"}</h2>
      <div className="flex items-center justify-center gap-3 py-2 mb-4">
        <span className="text-sm uppercase tracking-wide text-black/40 dark:text-white/40">
          {"Overall Band"}
        </span>
        <span className={`text-4xl font-extrabold ${bandColor(result.overallBand)}`}>
          {result.overallBand}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {CRITERIA.map((c) => {
          const item = result[c.key];
          if (!item) return null;
          return (
            <div
              key={c.key}
              className={`rounded-xl border p-3 ${
                isDark
                  ? "border-white/10 bg-[#0A0A0B]/60"
                  : "border-black/[0.06] bg-black/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-black/40 dark:text-white/40">
                  {c.label}
                </span>
                <span className={`font-bold ${bandColor(item.band)}`}>
                  {item.band}
                </span>
              </div>
              <p className="text-sm text-black/50 dark:text-white/50">
                {item.comment}
              </p>
            </div>
          );
        })}
      </div>
      {result.strengths?.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-bold mb-1.5 text-green-700 dark:text-green-400">
            {"Strengths"}
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-black/50 dark:text-white/50">
            {result.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {result.improvements?.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-bold mb-1.5 text-amber-700 dark:text-amber-400">
            {"Areas to improve"}
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-black/50 dark:text-white/50">
            {result.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {result.summary && (
        <p className="text-sm italic border-t pt-3 border-black/[0.08] dark:border-white/10 text-black/50 dark:text-white/50">
          {result.summary}
        </p>
      )}
    </div>
  );
};

export default SpeakingFeedbackPanel;