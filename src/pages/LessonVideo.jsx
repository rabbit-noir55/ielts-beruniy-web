import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  ThumbsUp,
  Trash2,
  Video,
} from "lucide-react";
import LessonPlayer from "../components/LessonPlayer";
import {
  addVideoComment,
  deleteVideoComment,
  fetchLessonVideo,
  fetchVideoComments,
  hideVideoComment,
  toggleVideoLike,
} from "../utils/lessonsApi";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function LessonVideo({ theme }) {
  const { id } = useParams();
  const isDark = theme === "dark";
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [videoResponse, commentResponse] = await Promise.all([
        fetchLessonVideo(id),
        fetchVideoComments(id),
      ]);
      setData(videoResponse);
      setComments(commentResponse.comments || []);
      setCommentsEnabled(Boolean(commentResponse.enabled));
    } catch (err) {
      setError(err.message || "Videoni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleLike = async () => {
    if (!data?.video || likeBusy) return;
    setLikeBusy(true);
    try {
      const result = await toggleVideoLike(data.video.id);
      setData((prev) => ({
        ...prev,
        video: { ...prev.video, liked: result.liked, likes: result.likes },
      }));
    } catch (err) {
      setError(err.message || "Laykni o'zgartirib bo'lmadi.");
    } finally {
      setLikeBusy(false);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || commentBusy) return;
    setCommentBusy(true);
    setCommentError("");
    try {
      const result = await addVideoComment(data.video.id, text);
      setComments((prev) => [result.comment, ...prev]);
      setCommentText("");
      setData((prev) => ({
        ...prev,
        video: { ...prev.video, comments: (prev.video.comments || 0) + 1 },
      }));
    } catch (err) {
      setCommentError(err.message || "Izohni yuborib bo'lmadi.");
    } finally {
      setCommentBusy(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await deleteVideoComment(commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
    } catch (err) {
      setCommentError(err.message || "Izohni o'chirib bo'lmadi.");
    }
  };

  const toggleHidden = async (comment) => {
    try {
      const result = await hideVideoComment(comment.id, !comment.is_hidden);
      setComments((prev) =>
        prev.map((item) =>
          item.id === comment.id ? { ...item, is_hidden: result.is_hidden } : item
        )
      );
    } catch (err) {
      setCommentError(err.message || "Izohni yashirib bo'lmadi.");
    }
  };

  const muted = isDark ? "text-white/45" : "text-black/45";
  const card = isDark
    ? "border-white/10 bg-white/[0.03]"
    : "border-black/[0.08] bg-white";
  const inputCls = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
    isDark
      ? "border-white/10 bg-[#0A0A0B] text-white placeholder:text-white/25 focus:ring-white/60"
      : "border-black/12 bg-[#F6F5F2] text-black placeholder:text-black/25 focus:ring-black/60"
  }`;

  if (loading) {
    return (
      <div className={`min-h-screen px-4 pt-24 ${isDark ? "bg-[#0A0A0B]" : "bg-[#F6F5F2]"}`}>
        <div className="mx-auto max-w-6xl">
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-black/20" />
          <div className={`mt-4 h-7 w-2/3 animate-pulse rounded ${isDark ? "bg-white/[0.07]" : "bg-black/[0.05]"}`} />
          <div className={`mt-3 h-4 w-1/3 animate-pulse rounded ${isDark ? "bg-white/[0.05]" : "bg-black/[0.04]"}`} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`min-h-screen px-4 pt-24 ${isDark ? "bg-[#0A0A0B] text-white" : "bg-[#F6F5F2] text-black"}`}>
        <div className="mx-auto max-w-3xl">
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-500">
            {error}
          </div>
          <Link to="/lessons" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
            <ArrowLeft size={15} /> Darslarga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const video = data?.video;
  const playlist = data?.playlist;
  const siblings = data?.siblings || [];

  return (
    <div
      className={`min-h-screen px-4 pb-20 pt-24 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          to={playlist ? `/lessons/playlist/${playlist.id}` : "/lessons"}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-bold transition ${
            isDark ? "text-white/55 hover:bg-white/5" : "text-black/55 hover:bg-black/[0.04]"
          }`}
        >
          <ArrowLeft size={14} /> {playlist?.title || "Darslarga qaytish"}
        </Link>

        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0">
            <LessonPlayer
              url={video.video_url}
              poster={video.thumbnail_url}
              title={video.title}
            />

            <h1 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">
              {video.title}
            </h1>
            <div className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold ${muted}`}>
              <span>{playlist?.group?.name || "Barcha guruhlar"}</span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={12} /> {video.comments} izoh
              </span>
              {video.is_published === false && <span className="text-amber-500">Qoralama</span>}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleLike}
                disabled={likeBusy}
                aria-pressed={Boolean(video.liked)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition disabled:opacity-50 ${
                  video.liked
                    ? "border-[var(--accent)]/50 bg-[var(--accent)]/12 text-[var(--accent)]"
                    : isDark
                      ? "border-white/15 text-white/65 hover:bg-white/5"
                      : "border-black/15 text-black/60 hover:bg-black/[0.04]"
                }`}
              >
                <ThumbsUp size={16} fill={video.liked ? "currentColor" : "none"} />
                {video.liked ? "Yoqdi" : "Yoqish"}
                <span className="tabular-nums opacity-60">{video.likes}</span>
              </button>
              {video.description && (
                <p className={`text-sm ${muted}`}>{video.description}</p>
              )}
            </div>

            <section className={`mt-6 rounded-2xl border ${card}`}>
              <header className={`flex items-center justify-between gap-3 border-b px-5 py-3.5 ${
                isDark ? "border-white/10" : "border-black/10"
              }`}>
                <h2 className="text-sm font-extrabold">
                  Izohlar <span className={`ml-1 font-normal ${muted}`}>{comments.length}</span>
                </h2>
                {!commentsEnabled && (
                  <span className={`text-[11px] font-bold ${muted}`}>O'chirilgan</span>
                )}
              </header>

              <div className="p-4 sm:p-5">
                {commentError && (
                  <div role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                    {commentError}
                  </div>
                )}

                {commentsEnabled ? (
                  <form onSubmit={submitComment} className="mb-5">
                    <textarea
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value.slice(0, 1500))}
                      rows={3}
                      placeholder="Fikringizni yozing…"
                      aria-label="Izoh matni"
                      className={inputCls}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[11px] ${muted}`}>{commentText.length}/1500</span>
                      <button
                        type="submit"
                        disabled={commentBusy || !commentText.trim()}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-xs font-bold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-40"
                      >
                        <Send size={13} /> {commentBusy ? "Yuborilmoqda…" : "Yuborish"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className={`mb-4 rounded-xl border border-dashed px-4 py-3 text-sm ${
                    isDark ? "border-white/12 text-white/45" : "border-black/12 text-black/45"
                  }`}>
                    Ustoz bu videoda izohlarni o'chirib qo'ygan.
                  </p>
                )}

                {comments.length === 0 ? (
                  <p className={`py-6 text-center text-sm ${muted}`}>
                    Hozircha izohlar yo'q — birinchi bo'lib yozing.
                  </p>
                ) : (
                  <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                    {comments.map((comment) => (
                      <li key={comment.id} className={`flex gap-3 py-4 ${comment.is_hidden ? "opacity-50" : ""}`}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/12 text-xs font-extrabold text-[var(--accent)]">
                          {comment.user?.initial || "?"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold">{comment.user?.name}</span>
                            <span className={`text-[10px] ${muted}`}>{formatDate(comment.created_at)}</span>
                            {comment.is_mine && (
                              <span className={`rounded-full px-1.5 text-[9px] font-bold ${isDark ? "bg-white/10" : "bg-black/[0.06]"}`}>
                                Siz
                              </span>
                            )}
                            {comment.is_hidden && (
                              <span className="rounded-full bg-amber-500/15 px-1.5 text-[9px] font-bold text-amber-500">
                                Yashirilgan
                              </span>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{comment.text}</p>
                        </div>
                        <div className="flex shrink-0 items-start gap-1">
                          {comment.can_hide && (
                            <button
                              type="button"
                              onClick={() => toggleHidden(comment)}
                              aria-label={comment.is_hidden ? "Izohni ko'rsatish" : "Izohni yashirish"}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                                isDark ? "text-white/40 hover:bg-white/5" : "text-black/40 hover:bg-black/5"
                              }`}
                            >
                              {comment.is_hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                          )}
                          {comment.can_delete && (
                            <button
                              type="button"
                              onClick={() => removeComment(comment.id)}
                              aria-label="Izohni o'chirish"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className={`overflow-hidden rounded-2xl border ${card}`}>
              <div className={`flex items-center gap-2 border-b px-4 py-3 ${isDark ? "border-white/10" : "border-black/10"}`}>
                <Video size={14} className="text-[var(--accent)]" />
                <Link
                  to={playlist ? `/lessons/playlist/${playlist.id}` : "/lessons"}
                  className="truncate text-xs font-extrabold hover:underline"
                >
                  {playlist?.title || "Pleylist"}
                </Link>
              </div>
              {siblings.length === 0 ? (
                <p className={`px-4 py-6 text-center text-xs ${muted}`}>Boshqa videolar yo'q.</p>
              ) : (
                <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
                  {siblings.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/lessons/video/${item.id}`}
                        className={`flex items-center gap-2.5 px-3 py-2.5 transition ${
                          isDark ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.03]"
                        }`}
                      >
                        <span className="relative block h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--accent)]/10">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[var(--accent)]">
                              <Video size={14} />
                            </span>
                          )}
                        </span>
                        <span className="line-clamp-2 text-xs font-semibold">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
