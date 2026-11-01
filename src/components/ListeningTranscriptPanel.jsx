import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faLightbulb } from "@fortawesome/free-solid-svg-icons";
const ListeningTranscriptPanel = ({
  isDark,
  transcriptVisible,
  setTranscriptVisible,
  guidedMode,
  setGuidedMode,
  audioscriptNodes,
  transcriptRef,
  handleTextSelection,
  handleAnnotatedClick,
}) => {
  if (!transcriptVisible) return null;

  return (
    <div
      className="w-full md:w-1/2 overflow-y-auto md:border-r p-4 md:p-6 qz-anim-fade-in md:transition-[width] duration-300 ease-in-out"
      style={{ borderRightColor: isDark ? "#334155" : "#e5e7eb" }}
      ref={transcriptRef}
      onMouseUp={handleTextSelection}
      onClick={handleAnnotatedClick}
    >
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2
          className={`text-lg font-semibold ${isDark ? "text-white/50" : "text-black/50"}`}
        >
          {"Transcript"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTranscriptVisible(false)}
            className="qz-icon-btn p-2 rounded-full hover:bg-black/[0.08] dark:hover:bg-white/10"
            title={"Hide"}
          >
            <FontAwesomeIcon icon={faEyeSlash} />
          </button>
          <button
            onClick={() => setGuidedMode((prev) => !prev)}
            className={`qz-btn flex items-center gap-1 px-3 py-1 rounded text-sm ${guidedMode ? "bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] dark:hover:text-white hover:bg-black" : "bg-black/[0.08] dark:bg-white/10 text-black/50 dark:text-white/70 hover:bg-black/[0.12]"}`}
          >
            <FontAwesomeIcon icon={faLightbulb} />{" "}
            {guidedMode ? "Guided On" : "Guided Off"}
          </button>
        </div>
      </div>
      <div className="space-y-0 leading-relaxed">{audioscriptNodes}</div>
    </div>
  );
};

export default ListeningTranscriptPanel;
