import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Play,
  ThumbsUp,
  Video,
} from "lucide-react";
import { fetchPlaylist } from "../utils/lessonsApi";

function durationLabel(seconds) {
  const total = Number(seconds) || 0;
  if (!total) return "";
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function LessonPlaylist({ theme }) {
  const { id } = useParams();
  const isDark = theme === "dark";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchPlaylist(id)
      .then((response) => {
        if (alive) setData(response);
      })
      .catch((err) => {
        if (alive) setError(err.message || "Pleylistni yuklab bo'lmadi.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const muted = isDark ? "text-white/45" : "text-black/45";
  const card = isDark
    ? "border-white/10 bg-white/[0.03]"
    : "border-black/[0.08] bg-white";
  const playlist = data?.playlist;
  const videos = data?.videos || [];

  return (
    <div
      className={`min-h-screen px-4 pb-20 pt-24 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <Link
          to="/lessons"
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-bold transition ${
            isDark ? "text-white/55 hover:bg-white/5" : "text-black/55 hover:bg-black/[0.04]"
          }`}
        >
          <ArrowLeft size={14} /> Darslarga qaytish
        </Link>

        {loading ? (
          <div className="mt-4 space-y-4">
            <div className={`h-48 animate-pulse rounded-2xl ${isDark ? "bg-white/[0.05]" : "bg-black/[0.04]"}`} />
            <div className={`h-6 w-1/2 animate-pulse rounded ${isDark ? "bg-white/[0.07]" : "bg-black/[0.05]"}`} />
          </div>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-500">
            {error}
          </div>
        ) : (
          <>
            <div className={`mt-4 overflow-hidden rounded-2xl border ${card}`}>
              <div className="relative aspect-[21/8] min-h-40 w-full overflow-hidden bg-gradient-to-br from-[var(--accent)]/30 via-[var(--accent)]/10 to-transparent">
                {playlist.cover_url ? (
                  <img src={playlist.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Video size={42} className="text-[var(--accent)]/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                    {playlist.group?.name || "Barcha guruhlar"}
                  </span>
                  <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">{playlist.title}</h1>
                </div>
              </div>
              <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 border-t px-5 py-3 text-xs font-semibold ${
                isDark ? "border-white/10" : "border-black/10"
              } ${muted}`}>
                <span className="inline-flex items-center gap-1.5">
                  <Play size={13} /> {videos.length} video
                </span>
                {playlist.description && <span className="line-clamp-1">{playlist.description}</span>}
              </div>
            </div>

            {videos.length === 0 ? (
              <div className={`mt-5 rounded-2xl border px-6 py-14 text-center ${card}`}>
                <Video size={28} className={`mx-auto ${isDark ? "text-white/25" : "text-black/25"}`} />
                <h2 className="mt-3 text-base font-bold">Videolar hali qo'shilmagan</h2>
                <p className={`mt-1 text-sm ${muted}`}>
                  Ustoz video qo'shgach, shu yerda ko'rinadi.
                </p>
              </div>
            ) : (
              <ul className={`mt-5 divide-y overflow-hidden rounded-2xl border ${card} ${
                isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"
              }`}>
                {videos.map((video, index) => (
                  <li key={video.id}>
                    <Link
                      to={`/lessons/video/${video.id}`}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.03]"
                      }`}
                    >
                      <span className={`w-6 shrink-0 text-center text-xs font-bold tabular-nums ${muted}`}>
                        {index + 1}
                      </span>
                      <span className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent)]/25 to-transparent sm:h-20 sm:w-36">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[var(--accent)]">
                            <Play size={18} fill="currentColor" />
                          </span>
                        )}
                        {video.duration_seconds > 0 && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {durationLabel(video.duration_seconds)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-bold">{video.title}</span>
                        {video.description && (
                          <span className={`mt-0.5 line-clamp-1 block text-xs ${muted}`}>
                            {video.description}
                          </span>
                        )}
                        <span className={`mt-1 flex items-center gap-3 text-[11px] ${muted}`}>
                          <span className="inline-flex items-center gap-1">
                            <ThumbsUp size={11} /> {video.likes}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle size={11} /> {video.comments}
                          </span>
                          {video.duration_seconds > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} /> {durationLabel(video.duration_seconds)}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
