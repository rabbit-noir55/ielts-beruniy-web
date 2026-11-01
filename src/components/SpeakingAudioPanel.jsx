import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPaperPlane, faClock } from "@fortawesome/free-solid-svg-icons";
import SpeakingSegmentCard from "./SpeakingSegmentCard";

const SpeakingAudioPanel = ({
  isDark,
  currentSegment,
  segments,
  playingId,
  recordingId,
  recordedBlobs,
  transcripts,
  interimText,
  liveTranscripts,
  audioPlayed,
  onPlay,
  onStartRecord,
  onStopRecord,
  onDelete,
  onClearAll,
  onToggleLiveTranscript,
  recordedCount,
  totalCount,
  currentIdx,
  onSubmitFeedback,
  feedbackLoading,
  feedbackError,
  feedbackCountToday,
  aiLimit,
}) => {
  const hasAudio = currentSegment && !!currentSegment.audioUrl;
  const audioListened = currentSegment && audioPlayed[currentSegment.id];
  const canRecord = !hasAudio || audioListened;
  const textNote = isDark ? "text-white/40" : "text-black/35";

  return (
    <div className="w-1/2 overflow-y-auto p-6 flex flex-col">
      {recordedCount > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors text-black/40 hover:bg-black/[0.03] dark:text-white/40 dark:hover:bg-white/[0.06]"
          >
            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" /> {"Clear"}
          </button>
        </div>
      )}

      <div className="flex-1">
        {!currentSegment && (
          <p className={`text-sm ${textNote}`}>
            {"No questions for this part."}
          </p>
        )}

        {currentSegment && totalCount > 1 && (
          <div className="flex justify-center mb-4">
            <span className={`text-xs font-medium ${textNote}`}>
              {currentIdx + 1} / {totalCount}
            </span>
          </div>
        )}

        {currentSegment && (
          <SpeakingSegmentCard
            segment={currentSegment}
            isDark={isDark}
            isPlaying={playingId === currentSegment.id}
            isRecording={recordingId === currentSegment.id}
            hasRecording={!!recordedBlobs[currentSegment.id]}
            recordedBlobUrl={recordedBlobs[currentSegment.id] || null}
            transcript={transcripts[currentSegment.id] || ""}
            interimText={
              recordingId === currentSegment.id ? interimText : ""
            }
            liveTranscript={!!liveTranscripts[currentSegment.id]}
            canRecord={canRecord}
            onPlay={onPlay}
            onStartRecord={onStartRecord}
            onStopRecord={onStopRecord}
            onDelete={onDelete}
            onToggleLiveTranscript={() =>
              onToggleLiveTranscript(currentSegment.id)
            }
          />
        )}
      </div>

      {recordedCount > 0 && (
        <div className={`mt-6 space-y-3 border-t pt-4 ${textNote}`}>
          <p className="text-xs font-semibold uppercase tracking-wide">
            {"All your answers"}
          </p>
          {segments.map((seg) => {
            const t = transcripts[seg.id];
            if (!t) return null;
            return (
              <div
                key={seg.id}
                className={`rounded-lg border p-3 text-sm ${
                  isDark
                    ? "border-white/10 bg-[#0A0A0B]/30"
                    : "border-black/[0.06] bg-black/[0.02]"
                }`}
              >
                <p className="text-xs font-medium text-black/40 dark:text-white/40 mb-1">
                  {seg.label}
                </p>
                <p className="text-[#17171A] dark:text-[#F5F5F5]">{t}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col items-end gap-2">
        {feedbackCountToday !== undefined && aiLimit > 0 && (
          <span className="text-xs font-semibold text-black/40 dark:text-white/40">
            AI checks today: {feedbackCountToday}/{aiLimit}
          </span>
        )}
        <button
          onClick={onSubmitFeedback}
          disabled={recordedCount === 0 || feedbackLoading}
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold text-sm dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)] dark:hover:opacity-90"
        >
          {feedbackLoading ? <FontAwesomeIcon icon={faClock} className="w-4 h-4" /> : <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />}
          {feedbackLoading ? "Analyzing..." : "AI Feedback"}
        </button>
      </div>

      {feedbackLoading && (
        <div className="mt-4 flex flex-col items-center gap-3 py-6 qz-anim-fade-in">
          <div className="w-8 h-8 border-4 border-[var(--accent)] dark:border-white border-t-transparent rounded-full qz-spinner" />
          <p className={textNote}>{"AI is analyzing your answer..."}</p>
        </div>
      )}

      {feedbackError && (
        <div
          className={`mt-4 p-4 rounded-xl border text-sm qz-anim-scale-in ${
            isDark
              ? "bg-red-900/30 border-red-800 text-red-400"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {feedbackError}
        </div>
      )}
    </div>
  );
};

export default SpeakingAudioPanel;
