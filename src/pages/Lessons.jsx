import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Play,
  Settings2,
  Video,
} from "lucide-react";
import { fetchLessonsOverview } from "../utils/lessonsApi";

const KIND_META = {
  pdf: { label: "PDF", icon: FileText, tone: "text-rose-500" },
  mock: { label: "Mock", icon: GraduationCap, tone: "text-sky-500" },
  link: { label: "Havola", icon: ExternalLink, tone: "text-violet-500" },
  video: { label: "Video", icon: Video, tone: "text-emerald-500" },
};

function PlaylistCard({ playlist, isDark }) {
  return (
    <Link
      to={`/lessons/playlist/${playlist.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
        isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[var(--accent)]/25 via-[var(--accent)]/10 to-transparent">
        {playlist.cover_url ? (
          <img
            src={playlist.cover_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
              <Play size={22} fill="currentColor" />
            </span>
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {playlist.video_count} video
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-extrabold">{playlist.title}</h3>
        {playlist.description && (
          <p
            className={`mt-1 line-clamp-2 text-xs leading-relaxed ${
              isDark ? "text-white/45" : "text-black/45"
            }`}
          >
            {playlist.description}
          </p>
        )}
        <div
          className={`mt-auto flex items-center justify-between pt-3 text-[11px] font-semibold ${
            isDark ? "text-white/35" : "text-black/35"
          }`}
        >
          <span>{playlist.group?.name || "Barcha guruhlar"}</span>
          <span className="inline-flex items-center gap-1 text-[var(--accent)]">
            Ochish <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ResourceCard({ resource, isDark }) {
  const meta = KIND_META[resource.kind] || KIND_META.link;
  const Icon = meta.icon;
  const body = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isDark ? "bg-white/[0.06]" : "bg-black/[0.04]"
        } ${meta.tone}`}
      >
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold">{resource.title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              isDark ? "bg-white/10 text-white/50" : "bg-black/[0.06] text-black/45"
            }`}
          >
            {meta.label}
          </span>
        </span>
        {resource.description && (
          <span
            className={`mt-0.5 line-clamp-2 block text-xs ${
              isDark ? "text-white/40" : "text-black/45"
            }`}
          >
            {resource.description}
          </span>
        )}
      </span>
      {resource.url && <ExternalLink size={16} className="shrink-0 opacity-40" />}
    </>
  );

  const className = `flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition hover:border-[var(--accent)]/40 ${
    isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
  }`;

  if (!resource.url) return <div className={className}>{body}</div>;
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  );
}

export default function Lessons({ theme }) {
  const isDark = theme === "dark";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("videos");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchLessonsOverview()
      .then((response) => {
        if (alive) setData(response);
      })
      .catch((err) => {
        if (alive) setError(err.message || "Darslarni yuklab bo'lmadi.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const isRoundUp = (data?.group_type || "ielts") === "roundup";
  // Guruhsiz foydalanuvchi ikkalasini ham ko'radi.
  const hasGroup = Boolean(data?.group);
  const showMocks = !hasGroup || !isRoundUp;
  const showPdfs = !hasGroup || isRoundUp;

  const playlists = data?.playlists || [];
  const resources = data?.resources || [];
  const pdfResources = resources.filter((item) => ["pdf", "link"].includes(item.kind));
  const mockResources = resources.filter((item) => ["mock", "link"].includes(item.kind));

  const tabs = [
    { key: "videos", label: "Video darslar", count: playlists.length, icon: Play },
    ...(showMocks
      ? [
          {
            key: "mocks",
            label: "Mock testlar",
            count: mockResources.length,
            icon: GraduationCap,
          },
        ]
      : []),
    ...(showPdfs
      ? [
          {
            key: "pdfs",
            label: "PDF kitoblar",
            count: pdfResources.length,
            icon: BookOpen,
          },
        ]
      : []),
  ];

  const muted = isDark ? "text-white/45" : "text-black/45";
  const card = isDark
    ? "border-white/10 bg-white/[0.03]"
    : "border-black/[0.08] bg-white";

  return (
    <div
      className={`min-h-screen px-4 pb-20 pt-24 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--accent)]">
                <Layers size={12} /> Onlayn darslar
              </span>
              {data?.group && (
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold ${
                    isDark ? "border-white/15 text-white/55" : "border-black/10 text-black/50"
                  }`}
                >
                  {data.group.name} · {isRoundUp ? "Round Up" : "IELTS"}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Onlayn darslar
            </h1>
            <p className={`mt-1 max-w-2xl text-sm ${muted}`}>
              {isRoundUp
                ? "Video darslar va PDF kitoblar — guruhingiz uchun yig'ilgan materiallar."
                : "Video darslar, mock testlar va qo'shimcha materiallar — guruhingiz uchun."}
            </p>
          </div>
          {data?.is_teacher && (
            <Link
              to="/admin/lessons"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--accent)]/40 px-4 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
            >
              <Settings2 size={14} /> Boshqarish
            </Link>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Dars bo'limlari">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-bold transition ${
                  active
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : isDark
                      ? "bg-white/[0.06] text-white/55 hover:bg-white/[0.1]"
                      : "bg-black/[0.05] text-black/55 hover:bg-black/[0.09]"
                }`}
              >
                <Icon size={14} />
                {item.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                    active ? "bg-black/15" : isDark ? "bg-white/10" : "bg-black/10"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`overflow-hidden rounded-2xl border ${card}`}>
                <div className={`aspect-video animate-pulse ${isDark ? "bg-white/[0.05]" : "bg-black/[0.04]"}`} />
                <div className="space-y-2 p-4">
                  <div className={`h-4 w-3/4 animate-pulse rounded ${isDark ? "bg-white/[0.07]" : "bg-black/[0.05]"}`} />
                  <div className={`h-3 w-1/2 animate-pulse rounded ${isDark ? "bg-white/[0.05]" : "bg-black/[0.04]"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : tab === "videos" ? (
          playlists.length ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} isDark={isDark} />
              ))}
            </div>
          ) : (
            <div className={`mt-6 rounded-2xl border px-6 py-14 text-center ${card}`}>
              <Video size={30} className={`mx-auto ${isDark ? "text-white/25" : "text-black/25"}`} />
              <h2 className="mt-3 text-base font-bold">Hozircha video darslar yo'q</h2>
              <p className={`mt-1 text-sm ${muted}`}>
                Ustoz dars qo'shgach, shu yerda paydo bo'ladi.
              </p>
            </div>
          )
        ) : tab === "mocks" ? (
          <div className="mt-6 space-y-4">
            {mockResources.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {mockResources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} isDark={isDark} />
                ))}
              </div>
            ) : (
              <div className={`rounded-2xl border px-6 py-14 text-center ${card}`}>
                <GraduationCap size={30} className={`mx-auto ${isDark ? "text-white/25" : "text-black/25"}`} />
                <h2 className="mt-3 text-base font-bold">Mocklar hali qo'shilmagan</h2>
                <p className={`mt-1 text-sm ${muted}`}>
                  Ustoz mock qo'shgach, shu yerda ko'rinadi.
                </p>
              </div>
            )}
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4 ${card}`}>
              <div>
                <h3 className="text-sm font-extrabold">Cambridge mock testlari</h3>
                <p className={`text-xs ${muted}`}>
                  Cambridge kitoblari va yuklangan mocklar — Mocktest bo'limida.
                </p>
              </div>
              <Link
                to="/"
                className="inline-flex min-h-10 items-center rounded-full bg-[var(--accent)] px-5 text-xs font-bold text-[var(--accent-contrast)]"
              >
                Mocktestga o'tish
              </Link>
            </div>
          </div>
        ) : pdfResources.length ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pdfResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} isDark={isDark} />
            ))}
          </div>
        ) : (
          <div className={`mt-6 rounded-2xl border px-6 py-14 text-center ${card}`}>
            <BookOpen size={30} className={`mx-auto ${isDark ? "text-white/25" : "text-black/25"}`} />
            <h2 className="mt-3 text-base font-bold">PDF kitoblar hali qo'shilmagan</h2>
            <p className={`mt-1 text-sm ${muted}`}>
              Round Up kitoblaringiz ustoz tomonidan shu bo'limga yuklanadi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
