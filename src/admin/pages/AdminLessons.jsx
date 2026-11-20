import { useCallback, useEffect, useState } from "react";
import {
  adminLessonAction,
  adminLessonComments,
  adminLessonDetail,
  adminLessons,
  adminUpload,
} from "../adminApi";
import { Badge, Btn, Empty, ErrorBox, Field, Modal, PageHeader, Panel, SkeletonRows, Th } from "../ui";
import { inputCls } from "../formStyles";

const EMPTY_PLAYLIST = {
  id: null,
  title: "",
  description: "",
  group: "",
  cover_url: "",
  order: 0,
  is_published: true,
};

const EMPTY_VIDEO = {
  id: null,
  title: "",
  description: "",
  video_url: "",
  thumbnail_url: "",
  duration_seconds: 0,
  order: 0,
  is_published: true,
  allow_comments: true,
};

function coverStyle(item) {
  return item.cover_url
    ? { backgroundImage: `url(${item.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;
}

export default function AdminLessons({ isDark }) {
  const [data, setData] = useState({ playlists: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [playlistForm, setPlaylistForm] = useState(null);
  const [videosFor, setVideosFor] = useState(null);
  const [videoForm, setVideoForm] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadNote, setUploadNote] = useState("");

  const load = useCallback((group = "") => {
    setLoading(true);
    return adminLessons(group)
      .then((response) => setData(response))
      .catch((err) => setError(err.message || "Darslarni yuklab bo'lmadi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const muted = isDark ? "text-white/40" : "text-black/40";

  const savePlaylist = async () => {
    if (!playlistForm) return;
    if (!playlistForm.title.trim()) {
      setError("Pleylist nomi kerak.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminLessonAction({
        action: "save",
        id: playlistForm.id || undefined,
        title: playlistForm.title,
        description: playlistForm.description,
        group: playlistForm.group || "",
        cover_url: playlistForm.cover_url,
        order: Number(playlistForm.order) || 0,
        is_published: Boolean(playlistForm.is_published),
      });
      setPlaylistForm(null);
      await load(groupFilter);
    } catch (err) {
      setError(err.message || "Saqlab bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  const deletePlaylist = async (playlist) => {
    if (!window.confirm(`«${playlist.title}» o'chirilsinmi?`)) return;
    try {
      await adminLessonAction({ action: "delete", id: playlist.id });
      await load(groupFilter);
    } catch (err) {
      setError(err.message || "O'chirib bo'lmadi.");
    }
  };

  const openVideos = async (playlist) => {
    setError("");
    setVideosFor({ loading: true, playlist, videos: [] });
    try {
      const response = await adminLessonDetail(playlist.id);
      setVideosFor({ loading: false, playlist: response.playlist, videos: response.videos });
    } catch (err) {
      setVideosFor(null);
      setError(err.message || "Videolarni yuklab bo'lmadi.");
    }
  };

  const refreshVideos = async () => {
    if (!videosFor?.playlist) return;
    const response = await adminLessonDetail(videosFor.playlist.id);
    setVideosFor({ loading: false, playlist: response.playlist, videos: response.videos });
  };

  const saveVideo = async () => {
    if (!videoForm || !videosFor?.playlist) return;
    if (!videoForm.title.trim()) {
      setError("Video nomi kerak.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminLessonAction({
        action: "save_video",
        id: videoForm.id || undefined,
        playlist: videosFor.playlist.id,
        title: videoForm.title,
        description: videoForm.description,
        video_url: videoForm.video_url,
        thumbnail_url: videoForm.thumbnail_url,
        duration_seconds: Number(videoForm.duration_seconds) || 0,
        order: Number(videoForm.order) || 0,
        is_published: Boolean(videoForm.is_published),
        allow_comments: Boolean(videoForm.allow_comments),
      });
      setVideoForm(null);
      await refreshVideos();
      await load(groupFilter);
    } catch (err) {
      setError(err.message || "Saqlab bo'lmadi.");
    } finally {
      setBusy(false);
    }
  };

  const videoAction = async (action, id, value) => {
    try {
      await adminLessonAction({ action, id, value });
      await refreshVideos();
    } catch (err) {
      setError(err.message || "Amal bajarilmadi.");
    }
  };

  const deleteVideo = async (video) => {
    if (!window.confirm(`«${video.title}» o'chirilsinmi?`)) return;
    await videoAction("delete_video", video.id);
  };

  const openComments = async (video) => {
    setError("");
    setCommentsFor({ loading: true, video, comments: [] });
    try {
      const response = await adminLessonComments(video.id);
      setCommentsFor({ loading: false, video: response.video, comments: response.comments });
    } catch (err) {
      setCommentsFor(null);
      setError(err.message || "Izohlarni yuklab bo'lmadi.");
    }
  };

  const commentAction = async (action, comment) => {
    try {
      await adminLessonAction({ action, id: comment.id, value: !comment.is_hidden });
      const response = await adminLessonComments(commentsFor.video.id);
      setCommentsFor({ loading: false, video: response.video, comments: response.comments });
    } catch (err) {
      setError(err.message || "Amal bajarilmadi.");
    }
  };

  const uploadFile = async (file, kind, apply) => {
    if (!file) return;
    setUploadNote("Yuklanmoqda…");
    try {
      const result = await adminUpload(file, kind);
      apply(result.url);
      setUploadNote("Yuklandi");
    } catch (err) {
      setUploadNote("");
      setError(err.message || "Faylni yuklab bo'lmadi.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Onlayn darslar"
        desc="Guruhlar uchun video pleylistlar. Har bir videoda layk, izoh va izohlarni o'chirish boshqaruvi bor."
        actions={
          <>
            <select
              value={groupFilter}
              onChange={(event) => {
                setGroupFilter(event.target.value);
                load(event.target.value);
              }}
              className={`${inputCls(isDark)} w-auto py-2 text-xs`}
              aria-label="Guruh bo'yicha filtrlash"
            >
              <option value="">Barcha guruhlar</option>
              {data.groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <Btn isDark={isDark} variant="primary" onClick={() => setPlaylistForm({ ...EMPTY_PLAYLIST })}>
              + Yangi pleylist
            </Btn>
          </>
        }
      />

      <ErrorBox>{error}</ErrorBox>

      {loading ? (
        <Panel isDark={isDark}><SkeletonRows isDark={isDark} rows={4} cols={3} /></Panel>
      ) : data.playlists.length === 0 ? (
        <Panel isDark={isDark}>
          <Empty isDark={isDark}>Hozircha pleylistlar yo'q. «Yangi pleylist» bilan boshlang.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.playlists.map((playlist) => (
            <article
              key={playlist.id}
              className={`overflow-hidden rounded-2xl border ${isDark ? "border-white/10 bg-white/[0.025]" : "border-black/[0.08] bg-white"}`}
            >
              <div
                className="flex h-28 items-end bg-gradient-to-br from-[var(--accent)]/25 via-[var(--accent)]/10 to-transparent p-3"
                style={coverStyle(playlist)}
              >
                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  {playlist.video_count} video
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-extrabold">{playlist.title}</h2>
                  <Badge isDark={isDark} tone={playlist.is_published ? "green" : "neutral"} dot>
                    {playlist.is_published ? "Faol" : "Yashirin"}
                  </Badge>
                </div>
                <p className={`mt-1 line-clamp-2 text-xs ${muted}`}>
                  {playlist.description || "Tavsif yo'q"}
                </p>
                <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] ${muted}`}>
                  <span>{playlist.group?.name || "Barcha guruhlar"}</span>
                  <span>·</span>
                  <span>{playlist.comments} izoh</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Btn isDark={isDark} variant="soft" onClick={() => openVideos(playlist)}>Videolar</Btn>
                  <Btn isDark={isDark} onClick={() => setPlaylistForm({ ...EMPTY_PLAYLIST, ...playlist, group: playlist.group?.id || "", cover_url: playlist.cover_url || "" })}>
                    Tahrirlash
                  </Btn>
                  <Btn isDark={isDark} variant="danger" onClick={() => deletePlaylist(playlist)}>O'chirish</Btn>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pleylist formasi */}
      <Modal
        isDark={isDark}
        open={Boolean(playlistForm)}
        title={playlistForm?.id ? "Pleylistni tahrirlash" : "Yangi pleylist"}
        onClose={() => setPlaylistForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setPlaylistForm(null)}>Bekor qilish</Btn>
            <Btn isDark={isDark} variant="primary" loading={busy} onClick={savePlaylist}>Saqlash</Btn>
          </>
        }
      >
        {playlistForm && (
          <div className="flex flex-col gap-3">
            <Field isDark={isDark} label="Nomi">
              <input
                value={playlistForm.title}
                onChange={(event) => setPlaylistForm({ ...playlistForm, title: event.target.value })}
                className={inputCls(isDark)}
                placeholder="Masalan: Writing Task 2 asoslari"
              />
            </Field>
            <Field isDark={isDark} label="Guruh">
              <select
                value={playlistForm.group}
                onChange={(event) => setPlaylistForm({ ...playlistForm, group: event.target.value })}
                className={inputCls(isDark)}
              >
                <option value="">Barcha guruhlar</option>
                {data.groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </Field>
            <Field isDark={isDark} label="Tavsif">
              <textarea
                rows={3}
                value={playlistForm.description}
                onChange={(event) => setPlaylistForm({ ...playlistForm, description: event.target.value })}
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Muqova">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={playlistForm.cover_url}
                  onChange={(event) => setPlaylistForm({ ...playlistForm, cover_url: event.target.value })}
                  className={inputCls(isDark)}
                  placeholder="Rasm URL yoki yuklang"
                />
                <label className="cursor-pointer rounded-xl border border-dashed border-[var(--accent)]/40 px-3 py-2 text-xs font-bold text-[var(--accent)]">
                  Yuklash
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      uploadFile(event.target.files?.[0], "image", (url) =>
                        setPlaylistForm((prev) => ({ ...prev, cover_url: url }))
                      )
                    }
                  />
                </label>
              </div>
            </Field>
            {uploadNote && <p className={`text-[11px] ${muted}`}>{uploadNote}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Tartib">
                <input
                  type="number"
                  min="0"
                  value={playlistForm.order}
                  onChange={(event) => setPlaylistForm({ ...playlistForm, order: event.target.value })}
                  className={inputCls(isDark)}
                />
              </Field>
              <label className="flex items-end gap-2 pb-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={playlistForm.is_published}
                  onChange={(event) => setPlaylistForm({ ...playlistForm, is_published: event.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Chop etilgan
              </label>
            </div>
          </div>
        )}
      </Modal>

      {/* Videolar */}
      <Modal
        isDark={isDark}
        open={Boolean(videosFor)}
        title={videosFor?.playlist?.title || "Videolar"}
        desc="Video qo'shing, tartibini va izohlarni boshqaring."
        size="lg"
        onClose={() => {
          setVideosFor(null);
          setVideoForm(null);
        }}
        footer={
          <Btn isDark={isDark} variant="primary" onClick={() => setVideoForm({ ...EMPTY_VIDEO })}>
            + Video qo'shish
          </Btn>
        }
      >
        {videosFor?.loading ? (
          <SkeletonRows isDark={isDark} rows={3} cols={3} />
        ) : videosFor?.videos?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className={isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"}>
                  <Th>Video</Th>
                  <Th>Holat</Th>
                  <Th>Izohlar</Th>
                  <Th className="text-right">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {videosFor.videos.map((video) => (
                  <tr key={video.id} className={`border-t ${isDark ? "border-white/[0.07]" : "border-black/[0.07]"}`}>
                    <td className="max-w-[280px] px-3 py-2.5">
                      <div className="truncate text-xs font-bold">{video.title}</div>
                      <div className={`truncate text-[10px] ${muted}`}>{video.video_url || "URL yo'q"}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge isDark={isDark} tone={video.is_published ? "green" : "neutral"} dot>
                        {video.is_published ? "Faol" : "Yashirin"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => openComments(video)}
                        className="text-xs font-bold text-[var(--accent)] hover:underline"
                      >
                        {video.comments} izoh
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Btn isDark={isDark} variant="soft" onClick={() => setVideoForm({ ...EMPTY_VIDEO, ...video, thumbnail_url: video.thumbnail_url || "" })}>
                          Tahrir
                        </Btn>
                        <Btn isDark={isDark} onClick={() => videoAction("video_publish", video.id, !video.is_published)}>
                          {video.is_published ? "Yashirish" : "Chop etish"}
                        </Btn>
                        <Btn isDark={isDark} variant="danger" onClick={() => deleteVideo(video)}>O'chirish</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty isDark={isDark}>Hozircha videolar yo'q.</Empty>
        )}
      </Modal>

      {/* Video formasi */}
      <Modal
        isDark={isDark}
        open={Boolean(videoForm)}
        title={videoForm?.id ? "Videoni tahrirlash" : "Yangi video"}
        onClose={() => setVideoForm(null)}
        footer={
          <>
            <Btn isDark={isDark} onClick={() => setVideoForm(null)}>Bekor qilish</Btn>
            <Btn isDark={isDark} variant="primary" loading={busy} onClick={saveVideo}>Saqlash</Btn>
          </>
        }
      >
        {videoForm && (
          <div className="flex flex-col gap-3">
            <Field isDark={isDark} label="Nomi">
              <input
                value={videoForm.title}
                onChange={(event) => setVideoForm({ ...videoForm, title: event.target.value })}
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Video URL" hint="MP4 havolasi yoki YouTube linki">
              <input
                value={videoForm.video_url}
                onChange={(event) => setVideoForm({ ...videoForm, video_url: event.target.value })}
                className={inputCls(isDark)}
                placeholder="https://youtube.com/watch?v=… yoki https://…/video.mp4"
              />
            </Field>
            <Field isDark={isDark} label="Tavsif">
              <textarea
                rows={2}
                value={videoForm.description}
                onChange={(event) => setVideoForm({ ...videoForm, description: event.target.value })}
                className={inputCls(isDark)}
              />
            </Field>
            <Field isDark={isDark} label="Thumbnail">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={videoForm.thumbnail_url}
                  onChange={(event) => setVideoForm({ ...videoForm, thumbnail_url: event.target.value })}
                  className={inputCls(isDark)}
                  placeholder="Rasm URL yoki yuklang"
                />
                <label className="cursor-pointer rounded-xl border border-dashed border-[var(--accent)]/40 px-3 py-2 text-xs font-bold text-[var(--accent)]">
                  Yuklash
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      uploadFile(event.target.files?.[0], "image", (url) =>
                        setVideoForm((prev) => ({ ...prev, thumbnail_url: url }))
                      )
                    }
                  />
                </label>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field isDark={isDark} label="Davomiylik (soniya)">
                <input
                  type="number"
                  min="0"
                  value={videoForm.duration_seconds}
                  onChange={(event) => setVideoForm({ ...videoForm, duration_seconds: event.target.value })}
                  className={inputCls(isDark)}
                />
              </Field>
              <Field isDark={isDark} label="Tartib">
                <input
                  type="number"
                  min="0"
                  value={videoForm.order}
                  onChange={(event) => setVideoForm({ ...videoForm, order: event.target.value })}
                  className={inputCls(isDark)}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={videoForm.is_published}
                  onChange={(event) => setVideoForm({ ...videoForm, is_published: event.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Chop etilgan
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={videoForm.allow_comments}
                  onChange={(event) => setVideoForm({ ...videoForm, allow_comments: event.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Izohlarga ruxsat
              </label>
            </div>
          </div>
        )}
      </Modal>

      {/* Izohlar moderatsiyasi */}
      <Modal
        isDark={isDark}
        open={Boolean(commentsFor)}
        title={`Izohlar · ${commentsFor?.video?.title || ""}`}
        size="lg"
        onClose={() => setCommentsFor(null)}
      >
        {commentsFor?.loading ? (
          <SkeletonRows isDark={isDark} rows={3} cols={2} />
        ) : commentsFor?.comments?.length ? (
          <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
            {commentsFor.comments.map((comment) => (
              <li key={comment.id} className={`flex items-start gap-3 py-3 ${comment.is_hidden ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold">{comment.user.name}</span>
                    <span className={`text-[10px] ${muted}`}>{comment.user.email}</span>
                    {comment.is_hidden && <Badge isDark={isDark} tone="amber">Yashirilgan</Badge>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{comment.text}</p>
                </div>
                <div className="flex gap-1.5">
                  <Btn isDark={isDark} variant="soft" onClick={() => commentAction("comment_hide", comment)}>
                    {comment.is_hidden ? "Ko'rsatish" : "Yashirish"}
                  </Btn>
                  <Btn isDark={isDark} variant="danger" onClick={() => commentAction("comment_delete", comment)}>
                    O'chirish
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty isDark={isDark}>Bu videoda izohlar yo'q.</Empty>
        )}
      </Modal>
    </div>
  );
}
