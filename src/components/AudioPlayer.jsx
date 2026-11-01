import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep,
  faVolumeHigh,
  faVolumeXmark,
  faGrip,
  faArrowsRotate,
  faSpinner,
  faTriangleExclamation,
  faHeadphones,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatTime } from "../utils/helpers";

const AudioPlayer = React.memo(function AudioPlayer({
  audioRef,
  audioSrc,
  position,
  dragHandleRef,
  onDragStart,
  isPlaying,
  togglePlay,
  skip,
  volume,
  isMuted,
  toggleMute,
  onVolumeChange,
  currentTime,
  duration,
  onSeek,
  autoScrollEnabled,
  setAutoScrollEnabled,
  mockMode,
  mockTimeLeft,
  startMockTest,
  exitMockMode,
  playbackRate,
  setPlaybackRate,
  audioLoading,
  audioError,
  onAudioLoadStart,
  onAudioCanPlay,
  onAudioError,
  onAudioEnded,
}) {
  const [visible, setVisible] = useState(true);
  const RATES = [0.75, 1, 1.25, 1.5, 2];
  const cycleRate = () => {
    const idx = RATES.indexOf(playbackRate);
    setPlaybackRate(RATES[(idx + 1) % RATES.length]);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Toggle button — always visible
  const ToggleBtn = (
    <button
      onClick={() => setVisible((v) => !v)}
      className={`fixed z-[1000] md:hidden flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all active:scale-90 ${
        visible
          ? "top-28 md:top-auto bg-red-500/90 text-white"
          : "top-28 md:top-auto bg-black/80 dark:bg-white/15 text-white dark:text-white/80"
      }`}
      style={{ right: "12px" }}
    >
      <FontAwesomeIcon icon={visible ? faXmark : faHeadphones} size="sm" />
    </button>
  );

  // ── Mock mode ──────────────────────────────────────────────────────────
  if (mockMode) {
    return (
      <>
        {ToggleBtn}
        {visible && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 safe-area-pb">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs font-mono text-yellow-400 shrink-0">{formatTime(mockTimeLeft)}</span>
              <div className="flex-1 relative h-4 flex items-center">
                <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-[width] duration-100" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
              <button onClick={exitMockMode} className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-semibold shrink-0">Exit</button>
            </div>
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => skip(-10)} className="text-white/50 hover:text-white p-1"><FontAwesomeIcon icon={faBackwardStep} size="xs" /></button>
              <button onClick={togglePlay} className="w-7 h-7 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center">
                {audioLoading ? <FontAwesomeIcon icon={faSpinner} size="xs" className="animate-spin" /> : isPlaying ? <FontAwesomeIcon icon={faPause} size="xs" /> : <FontAwesomeIcon icon={faPlay} size="xs" />}
              </button>
              <button onClick={() => skip(10)} className="text-white/50 hover:text-white p-1"><FontAwesomeIcon icon={faForwardStep} size="xs" /></button>
            </div>
          </div>
        )}
        {/* Desktop mock player */}
        <div className="hidden md:block fixed z-[999] bg-[#0A0A0B] text-white rounded-lg shadow-xl p-3 w-80 qz-anim-scale-in transition-shadow hover:shadow-2xl" style={{ left: position.x, top: position.y }}>
          <div className="flex items-center gap-2 mb-2">
            <div ref={dragHandleRef} className="qz-icon-btn cursor-grab active:cursor-grabbing text-white/40 hover:text-white" onMouseDown={onDragStart}>
              <FontAwesomeIcon icon={faGrip} size="sm" />
            </div>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-yellow-400">{formatTime(mockTimeLeft)}</span>
              </div>
              <span className="text-[10px] text-white/30">Remaining time</span>
            </div>
            <button onClick={exitMockMode} className="qz-btn bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">Exit</button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-white/40 w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 relative h-5 flex items-center group">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-[width] duration-100" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
            <span className="text-[11px] text-white/40 w-10">{formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="qz-icon-btn text-white/50 hover:text-white">
              {isMuted ? <FontAwesomeIcon icon={faVolumeXmark} size="sm" /> : <FontAwesomeIcon icon={faVolumeHigh} size="sm" />}
            </button>
            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={onVolumeChange} className="flex-1 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer" />
            <button onClick={cycleRate} title="Playback speed" className="qz-btn w-10 h-6 text-[11px] font-semibold bg-white/10 hover:bg-white/20 rounded">{playbackRate}x</button>
          </div>
          {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" onLoadStart={onAudioLoadStart} onCanPlay={onAudioCanPlay} onError={onAudioError} onEnded={onAudioEnded} />}
        </div>
      </>
    );
  }

  // ── Normal mode ────────────────────────────────────────────────────────
  return (
    <>
      {ToggleBtn}
      {/* ===== MOBILE: bottom bar player ===== */}
      {visible && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-white/10 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 relative h-4 flex items-center">
              <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-[width] duration-100" style={{ width: `${progressPercent}%` }} />
              </div>
              <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={onSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => skip(-10)} className="text-white/50 hover:text-white p-1.5"><FontAwesomeIcon icon={faBackwardStep} size="sm" /></button>
              <button onClick={togglePlay} disabled={audioLoading} className="w-9 h-9 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center disabled:opacity-50">
                {audioLoading ? <FontAwesomeIcon icon={faSpinner} size="sm" className="animate-spin" /> : isPlaying ? <FontAwesomeIcon icon={faPause} size="sm" /> : <FontAwesomeIcon icon={faPlay} size="sm" className="ml-0.5" />}
              </button>
              <button onClick={() => skip(10)} className="text-white/50 hover:text-white p-1.5"><FontAwesomeIcon icon={faForwardStep} size="sm" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white/50 hover:text-white p-1">
                {isMuted ? <FontAwesomeIcon icon={faVolumeXmark} size="xs" /> : <FontAwesomeIcon icon={faVolumeHigh} size="xs" />}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={onVolumeChange} className="w-14 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer" />
              <button onClick={cycleRate} className="text-[10px] font-semibold bg-white/10 hover:bg-white/20 rounded px-1.5 py-0.5">{playbackRate}x</button>
              <button onClick={() => setAutoScrollEnabled((p) => !p)} className={autoScrollEnabled ? "text-green-400 p-1" : "text-white/40 p-1"}>
                <FontAwesomeIcon icon={faArrowsRotate} size="xs" />
              </button>
            </div>
          </div>
          {audioError && (
            <div className="mt-1 flex items-center gap-1 text-red-400 text-[10px]">
              <FontAwesomeIcon icon={faTriangleExclamation} size="xs" />
              <span>{audioError}</span>
            </div>
          )}
          <div className="flex justify-center mt-1.5">
            <button onClick={startMockTest} disabled={audioLoading} className="bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] text-[11px] px-3 py-1 rounded-lg hover:opacity-80 disabled:opacity-50 transition-opacity">
              Mock Test
            </button>
          </div>
        </div>
      )}

      {/* ===== DESKTOP: floating draggable player ===== */}
      <div
        className="hidden md:block fixed z-[999] bg-[#0A0A0B] text-white rounded-lg shadow-xl p-3 w-[26rem] qz-anim-scale-in transition-shadow hover:shadow-2xl"
        style={{ left: position.x, top: position.y }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div ref={dragHandleRef} className="qz-icon-btn cursor-grab active:cursor-grabbing text-white/40 hover:text-white" onMouseDown={onDragStart}>
            <FontAwesomeIcon icon={faGrip} size="sm" />
          </div>
          <button onClick={togglePlay} disabled={mockMode || audioLoading} className="qz-btn w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center disabled:opacity-50">
            {audioLoading ? <FontAwesomeIcon icon={faSpinner} size="sm" className="animate-spin" /> : isPlaying ? <FontAwesomeIcon icon={faPause} size="sm" /> : <FontAwesomeIcon icon={faPlay} size="sm" />}
          </button>
          <button onClick={() => skip(-10)} disabled={mockMode || audioLoading} className="qz-icon-btn text-white/50 hover:text-white disabled:opacity-50">
            <FontAwesomeIcon icon={faBackwardStep} size="sm" />
          </button>
          <button onClick={() => skip(10)} disabled={mockMode || audioLoading} className="qz-icon-btn text-white/50 hover:text-white disabled:opacity-50">
            <FontAwesomeIcon icon={faForwardStep} size="sm" />
          </button>
          <button onClick={toggleMute} disabled={mockMode || audioLoading} className="qz-icon-btn text-white/50 hover:text-white disabled:opacity-50">
            {isMuted ? <FontAwesomeIcon icon={faVolumeXmark} size="sm" /> : <FontAwesomeIcon icon={faVolumeHigh} size="sm" />}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={onVolumeChange} disabled={mockMode || audioLoading} className="w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer disabled:opacity-50 transition-opacity" />
          <button onClick={cycleRate} disabled={mockMode || audioLoading} title="Playback speed" className="qz-btn w-10 h-6 text-[11px] font-semibold bg-white/10 hover:bg-white/20 rounded disabled:opacity-50">
            {playbackRate}x
          </button>
          <button onClick={() => setAutoScrollEnabled((p) => !p)} className={`qz-icon-btn ml-auto ${autoScrollEnabled ? "text-green-400" : "text-white/40"}`} title="Auto scroll">
            <FontAwesomeIcon icon={faArrowsRotate} size="sm" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/40 w-10 text-right">{formatTime(currentTime)}</span>
          <div className="flex-1 relative h-5 flex items-center group">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-[width] duration-100" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={onSeek} disabled={mockMode || audioLoading} className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-default" />
            <div className="absolute w-3 h-3 bg-green-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ left: `calc(${progressPercent}% - 6px)` }} />
          </div>
          <span className="text-xs text-white/40 w-10">{formatTime(duration)}</span>
        </div>

        {audioError && (
          <div className="mt-2 flex items-center gap-2 text-red-400 text-xs qz-anim-fade-in">
            <FontAwesomeIcon icon={faTriangleExclamation} size="sm" />
            <span>{audioError}</span>
          </div>
        )}

        <div className="mt-2 flex justify-center">
          <button onClick={startMockTest} disabled={audioLoading} className="qz-btn bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] px-3 py-1 rounded-lg text-sm hover:opacity-80 disabled:opacity-50 transition-opacity">
            Mock Test
          </button>
        </div>
      </div>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" crossOrigin="anonymous" onLoadStart={onAudioLoadStart} onCanPlay={onAudioCanPlay} onError={onAudioError} onEnded={onAudioEnded} />
      )}
    </>
  );
});

export default AudioPlayer;
