import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

function youtubeId(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1];
  }
  return "";
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Dars video pleyeri: YouTube yoki MP4.
 * MP4 uchun klaviatura: Space/K — play, ←/→ — 5s, M — mute, F — fullscreen.
 */
export default function LessonPlayer({ url, poster, title }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const embedId = youtubeId(url);

  useEffect(() => {
    const player = videoRef.current;
    if (player) player.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [url]);

  if (embedId) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-black">
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
            title={title || "Video dars"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/40 text-sm text-white/40">
        Video havolasi kiritilmagan
      </div>
    );
  }

  const toggle = () => {
    const player = videoRef.current;
    if (!player) return;
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  };

  const seekBy = (delta) => {
    const player = videoRef.current;
    if (!player) return;
    player.currentTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + delta));
  };

  const toggleMute = () => {
    const player = videoRef.current;
    if (!player) return;
    player.muted = !player.muted;
    setMuted(player.muted);
  };

  const goFullscreen = () => {
    const node = wrapperRef.current;
    if (!node) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else node.requestFullscreen?.();
  };

  const onKeyDown = (event) => {
    const key = event.key.toLowerCase();
    if (key === " " || key === "k") {
      event.preventDefault();
      toggle();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      seekBy(5);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekBy(-5);
    } else if (key === "m") {
      toggleMute();
    } else if (key === "f") {
      goFullscreen();
    }
  };

  const percent = duration ? (progress / duration) * 100 : 0;

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="group relative w-full overflow-hidden rounded-2xl bg-black outline-none ring-[var(--accent)]/60 focus-visible:ring-2"
      aria-label={title || "Video dars"}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster || undefined}
        preload="metadata"
        playsInline
        className="aspect-video w-full bg-black"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onClick={toggle}
      />

      {!playing && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Ijro etish"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 via-black/10 to-transparent"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-2xl transition hover:scale-105">
            <Play size={26} fill="currentColor" />
          </span>
        </button>
      )}

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10">
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-[var(--accent)]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-white">
          <button type="button" onClick={toggle} aria-label={playing ? "Pauza" : "Ijro etish"} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15">
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button type="button" onClick={() => seekBy(-10)} aria-label="10 soniya orqaga" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15">
            <RotateCcw size={16} />
          </button>
          <button type="button" onClick={toggleMute} aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15">
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <span className="text-[11px] font-bold tabular-nums text-white/70">
            {Math.floor(progress / 60)}:{String(Math.floor(progress % 60)).padStart(2, "0")}
            {" / "}
            {Math.floor((duration || 0) / 60)}:{String(Math.floor((duration || 0) % 60)).padStart(2, "0")}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              aria-label="Ijro tezligi"
              className="h-8 rounded-lg bg-black/50 px-2 text-[11px] font-bold text-white outline-none"
            >
              {SPEEDS.map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
            <button type="button" onClick={goFullscreen} aria-label="To'liq ekran" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15">
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
