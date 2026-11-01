import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faBackwardStep,
  faForwardStep,
  faVolumeHigh,
  faVolumeXmark,
  faGrip,
  faRotate,
  faSpinner,
  faTriangleExclamation,
  faHeadphones,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatTime } from "../utils/helpers";

const RATES = [0.75, 1, 1.25, 1.5, 2];

const MockAudioPlayer = React.memo(function MockAudioPlayer({
  data,
  testNum,
  series,
  onCheckAnswers,
  autoScrollEnabled,
  setAutoScrollEnabled,
  onTimeUpdate,
  onMockModeChange,
  onMockTimeLeftChange,
  onPlayStateChange,
  onStartMock,
  onExitMock,
}) {
  const audioRef = useRef(null);
  const dragHandleRef = useRef(null);

  const [visible, setVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [mockMode, setMockMode] = useState(() => {
    try {
      return localStorage.getItem(`mock_active_${series}_${testNum}`) === "true";
    } catch {
      return false;
    }
  });
  const [mockTimeLeft, setMockTimeLeft] = useState(null);
  const [position, setPosition] = useState({ x: 20, y: 112 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => { onTimeUpdate?.(currentTime); }, [currentTime, onTimeUpdate]);
  useEffect(() => { onMockModeChange?.(mockMode); }, [mockMode, onMockModeChange]);
  useEffect(() => { onMockTimeLeftChange?.(mockTimeLeft); }, [mockTimeLeft, onMockTimeLeftChange]);
  useEffect(() => { onPlayStateChange?.(isPlaying); }, [isPlaying, onPlayStateChange]);

  const audioSrcRef = useRef(null);
  const currentTest = data?.tests?.[testNum];
  const firstPart = currentTest?.parts?.["1"];
  const textData = firstPart?.text?.test_text || firstPart?.text || {};
  const raw = firstPart?.audio_src || textData.audio_src;
  if (!audioSrcRef.current && raw) {
    if (raw.startsWith("http")) {
      audioSrcRef.current = raw.includes("oss.jumpinto.com")
        ? raw.replace("https://oss.jumpinto.com", "/oss")
        : raw;
    } else {
      audioSrcRef.current = `/oss/${raw.replace(/^\//, "")}`;
    }
  }
  const audioSrc = audioSrcRef.current;

  useEffect(() => {
    let isActive = false;
    try {
      isActive = localStorage.getItem(`mock_active_${series}_${testNum}`) === "true";
      setMockMode(isActive);
    } catch {
      setMockMode(false);
    }
    if (!isActive) {
      setMockTimeLeft(null);
      setIsPlaying(false);
      audioRef.current?.pause();
    }
  }, [series, testNum]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onMeta = () => { if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration); };
    const onDurationChange = () => { if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration); };
    const onTimeUpdate = () => { setCurrentTime(audio.currentTime); };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audioSrc]);

  useEffect(() => {
    if (!mockMode || !audioSrc) return;
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;
    const timer = setTimeout(() => { audio.play().then(() => setIsPlaying(true)).catch((err) => console.warn('Audio autoplay failed:', err.message)); }, 300);
    return () => clearTimeout(timer);
  }, [mockMode]);

  const handleAudioLoadStart = useCallback(() => { setAudioLoading(true); setAudioError(null); }, []);
  const handleAudioCanPlay = useCallback(() => { setAudioLoading(false); }, []);
  const handleAudioError = useCallback(() => { setAudioLoading(false); setAudioError("Audio faylni yuklab bo'lmadi."); }, []);
  const handleAudioEnded = useCallback(() => { setIsPlaying(false); if (mockMode) onCheckAnswers?.(); }, [mockMode, onCheckAnswers]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate; }, [playbackRate, audioSrc]);

  useEffect(() => {
    if (!mockMode) return;
    if (mockTimeLeft !== null) return;
    const d = Number.isFinite(duration) && duration > 0 ? duration : 1800;
    setMockTimeLeft(Math.ceil(d));
  }, [mockMode, duration]);

  useEffect(() => {
    if (!mockMode || mockTimeLeft === null || mockTimeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setMockTimeLeft((prev) => {
        if (prev <= 1) { window.clearInterval(timer); window.setTimeout(() => onCheckAnswers?.(), 0); audioRef.current?.pause(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mockMode, mockTimeLeft]);

  useEffect(() => {
    try { if (mockMode) localStorage.setItem(`mock_active_${series}_${testNum}`, "true"); else localStorage.removeItem(`mock_active_${series}_${testNum}`); } catch (err) { console.warn('localStorage error:', err.message); }
  }, [mockMode, series, testNum]);

  const togglePlay = useCallback(() => { const a = audioRef.current; if (!a) return; if (a.paused) a.play().then(() => setIsPlaying(true)).catch((err) => console.warn('Audio play failed:', err.message)); else { a.pause(); setIsPlaying(false); } }, []);
  const skip = useCallback((s) => { if (audioRef.current) audioRef.current.currentTime += s; }, []);
  const handleSeek = useCallback((e) => { if (audioRef.current) { const t = parseFloat(e.target.value); audioRef.current.currentTime = t; setCurrentTime(t); } }, []);
  const handleVolumeChange = useCallback((e) => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setIsMuted(v === 0); }, []);
  const toggleMute = useCallback(() => { if (!audioRef.current) return; if (isMuted) { audioRef.current.volume = volume; setIsMuted(false); } else { audioRef.current.volume = 0; setIsMuted(true); } }, [isMuted, volume]);
  const startMockTest = useCallback(() => { setMockMode(true); setMockTimeLeft(null); onStartMock?.(); }, [onStartMock]);
  const exitMockMode = useCallback(() => { setMockMode(false); setMockTimeLeft(null); audioRef.current?.pause(); setIsPlaying(false); onExitMock?.(); }, [onExitMock]);
  const cycleRate = useCallback(() => { const idx = RATES.indexOf(playbackRate); setPlaybackRate(RATES[(idx + 1) % RATES.length]); }, [playbackRate]);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleDragStart = useCallback((e) => {
    if (!dragHandleRef.current?.contains(e.target) && e.target !== dragHandleRef.current) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    const move = (e) => { setPosition({ x: Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.x)), y: Math.max(0, Math.min(window.innerHeight - 140, e.clientY - dragOffset.y)) }); };
    const end = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    return () => { document.body.style.userSelect = ""; document.body.style.webkitUserSelect = ""; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", end); };
  }, [isDragging, dragOffset]);

  // Toggle button
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

  const progressPercentMobile = duration > 0 ? (currentTime / duration) * 100 : 0;

  const player = (
    <>
      {ToggleBtn}
      {/* ===== MOBILE: bottom bar ===== */}
      {visible && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-white/10 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {mockMode ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-xs font-mono text-yellow-400 shrink-0">{formatTime(mockTimeLeft)}</span>
                <div className="flex-1 relative h-4 flex items-center">
                  <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-[width] duration-100" style={{ width: `${progressPercentMobile}%` }} />
                  </div>
                  <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
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
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 relative h-4 flex items-center">
                  <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-[width] duration-100" style={{ width: `${progressPercentMobile}%` }} />
                  </div>
                  <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                </div>
              </div>
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
                  <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-14 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer" />
                  <button onClick={cycleRate} className="text-[10px] font-semibold bg-white/10 hover:bg-white/20 rounded px-1.5 py-0.5">{playbackRate}x</button>
                  <button onClick={() => setAutoScrollEnabled((p) => !p)} className={autoScrollEnabled ? "text-green-400 p-1" : "text-white/40 p-1"}>
                    <FontAwesomeIcon icon={faRotate} size="xs" />
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
            </>
          )}
        </div>
      )}

      {/* ===== DESKTOP: floating draggable ===== */}
      <div
        className="hidden md:block fixed z-[999] bg-[#0A0A0B] text-white rounded-lg shadow-xl p-3 qz-anim-scale-in transition-shadow hover:shadow-2xl"
        style={{ left: position.x, top: position.y, width: mockMode ? "20rem" : "26rem" }}
      >
        <div ref={dragHandleRef} className="qz-icon-btn cursor-grab active:cursor-grabbing text-white/40 hover:text-white mb-1 inline-block" onMouseDown={handleDragStart}>
          <FontAwesomeIcon icon={faGrip} style={{ width: 14, height: 14 }} />
        </div>

        {mockMode ? (
          <>
            <div className="flex items-center gap-2 mb-2">
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
                <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
              </div>
              <span className="text-[11px] text-white/40 w-10">{formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} disabled={audioLoading} className="qz-btn w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center disabled:opacity-50">
                {audioLoading ? <FontAwesomeIcon icon={faSpinner} spin style={{ width: 14, height: 14 }} /> : isPlaying ? <FontAwesomeIcon icon={faPause} style={{ width: 14, height: 14 }} /> : <FontAwesomeIcon icon={faPlay} style={{ width: 14, height: 14 }} />}
              </button>
              <button onClick={() => skip(-10)} className="qz-icon-btn text-white/50 hover:text-white"><FontAwesomeIcon icon={faBackwardStep} style={{ width: 14, height: 14 }} /></button>
              <button onClick={() => skip(10)} className="qz-icon-btn text-white/50 hover:text-white"><FontAwesomeIcon icon={faForwardStep} style={{ width: 14, height: 14 }} /></button>
              <button onClick={toggleMute} className="qz-icon-btn text-white/50 hover:text-white">
                {isMuted ? <FontAwesomeIcon icon={faVolumeXmark} style={{ width: 14, height: 14 }} /> : <FontAwesomeIcon icon={faVolumeHigh} style={{ width: 14, height: 14 }} />}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="flex-1 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer" />
              <button onClick={cycleRate} title="Playback speed" className="qz-btn w-10 h-6 text-[11px] font-semibold bg-white/10 hover:bg-white/20 rounded">{playbackRate}x</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button onClick={togglePlay} disabled={audioLoading} className="qz-btn w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center disabled:opacity-50">
                {audioLoading ? <FontAwesomeIcon icon={faSpinner} spin style={{ width: 14, height: 14 }} /> : isPlaying ? <FontAwesomeIcon icon={faPause} style={{ width: 14, height: 14 }} /> : <FontAwesomeIcon icon={faPlay} style={{ width: 14, height: 14 }} />}
              </button>
              <button onClick={() => skip(-10)} className="qz-icon-btn text-white/50 hover:text-white"><FontAwesomeIcon icon={faBackwardStep} style={{ width: 14, height: 14 }} /></button>
              <button onClick={() => skip(10)} className="qz-icon-btn text-white/50 hover:text-white"><FontAwesomeIcon icon={faForwardStep} style={{ width: 14, height: 14 }} /></button>
              <button onClick={toggleMute} className="qz-icon-btn text-white/50 hover:text-white">
                {isMuted ? <FontAwesomeIcon icon={faVolumeXmark} style={{ width: 14, height: 14 }} /> : <FontAwesomeIcon icon={faVolumeHigh} style={{ width: 14, height: 14 }} />}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer transition-opacity" />
              <button onClick={cycleRate} title="Playback speed" className="qz-btn w-10 h-6 text-[11px] font-semibold bg-white/10 hover:bg-white/20 rounded">{playbackRate}x</button>
              <button onClick={() => setAutoScrollEnabled((p) => !p)} className={`qz-icon-btn ml-auto ${autoScrollEnabled ? "text-green-400" : "text-white/40"}`} title="Auto scroll">
                <FontAwesomeIcon icon={faRotate} style={{ width: 14, height: 14 }} />
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
                <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                <div className="absolute w-3 h-3 bg-green-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ left: `calc(${progressPercent}% - 6px)` }} />
              </div>
              <span className="text-xs text-white/40 w-10">{formatTime(duration)}</span>
            </div>
            {audioError && (
              <div className="mt-2 flex items-center gap-2 text-red-400 text-xs qz-anim-fade-in">
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ width: 14, height: 14 }} />
                <span>{audioError}</span>
              </div>
            )}
            <div className="mt-2 flex justify-center">
              <button onClick={startMockTest} disabled={audioLoading} className="qz-btn bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] px-3 py-1 rounded-lg text-sm hover:opacity-80 disabled:opacity-50 transition-opacity">
                Mock Test
              </button>
            </div>
          </>
        )}
      </div>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" onLoadStart={handleAudioLoadStart} onCanPlay={handleAudioCanPlay} onError={handleAudioError} onEnded={handleAudioEnded} />
      )}
    </>
  );

  return createPortal(player, document.body);
});

export default MockAudioPlayer;
