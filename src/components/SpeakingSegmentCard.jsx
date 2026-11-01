import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faMicrophone, faStop, faTrash } from "@fortawesome/free-solid-svg-icons";
const SpeakingSegmentCard = ({
  segment,
  isDark,
  isPlaying,
  isRecording,
  hasRecording,
  recordedBlobUrl,
  transcript,
  interimText,
  liveTranscript,
  canRecord,
  onPlay,
  onStartRecord,
  onStopRecord,
  onDelete,
  onToggleLiveTranscript,
}) => {
  const bgColor = isDark ? "bg-[#141416]" : "bg-white";
  const borderColor = isDark ? "border-white/10" : "border-black/[0.08]";
  const textNote = isDark ? "text-white/40" : "text-black/35";
  const newspaperBg = isDark ? "bg-[#0A0A0B]/40" : "bg-black/[0.03]";

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={onToggleLiveTranscript}
          className={`inline-flex items-center gap-1 rounded-full border ${borderColor} px-2 py-0.5 text-xs font-medium italic transition-opacity hover:opacity-70 ${
            liveTranscript
              ? "bg-[var(--accent)] text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)]"
              : `${newspaperBg} ${textNote}`
          }`}
        >
          {"Live Transcript"}
        </button>
      </div>

      <div className="mb-2">
        <button
          onClick={() => onPlay(segment.id, segment.audioUrl)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? "bg-[var(--accent)] text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)]"
              : "bg-black/[0.05] text-black/50 hover:bg-black/[0.1] dark:bg-white/[0.08] dark:text-white/50 dark:hover:bg-white/[0.12]"
          }`}
        >
          {isPlaying ? <FontAwesomeIcon icon={faPause} className="text-sm" /> : <FontAwesomeIcon icon={faPlay} className="text-sm" />}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {!canRecord && !isRecording && (
          <div
            className={`flex flex-col items-center justify-center gap-2 py-4 ${textNote}`}
          >
            <div className="text-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
                <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
            </div>
            <div className="text-center text-sm">
              {"Listen to the examiner first"}
            </div>
          </div>
        )}

        <div
          className={`w-full min-h-[3rem] max-h-[320px] overflow-y-auto p-3 border ${borderColor} rounded-md ${newspaperBg} my-1 text-sm leading-relaxed`}
        >
          {transcript && <span>{transcript} </span>}
          {interimText && (
            <span className="text-black/50 dark:text-white/50">
              {interimText}
            </span>
          )}
          {!transcript && !interimText && <span>&nbsp;</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {canRecord && !isRecording && (
          <button
            onClick={() => onStartRecord(segment.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              hasRecording
                ? "bg-[var(--accent)] text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] hover:opacity-90 dark:hover:opacity-90"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            <FontAwesomeIcon icon={faMicrophone} className="w-4 h-4" />
            {hasRecording ? "Re-record" : "Record"}
          </button>
        )}
        {isRecording && (
          <button
            onClick={onStopRecord}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 animate-pulse"
          >
            <FontAwesomeIcon icon={faStop} className="w-4 h-4" />
            {"Stop"}
          </button>
        )}

        {hasRecording && recordedBlobUrl && (
          <>
            <audio controls src={recordedBlobUrl} className="h-8 max-w-[140px]" />
            <button
              onClick={() => onDelete(segment.id)}
              className="text-black/35 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400 transition p-1"
              title={"Delete"}
            >
              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SpeakingSegmentCard;
