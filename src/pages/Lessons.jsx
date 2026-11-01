import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWifi, faClock } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../utils/LanguageContext";

const MODES = [
  {
    key: "online",
    icon: faWifi,
    title: (t) => t("Onlayn darslar", "Online Lessons"),
    desc: (t) =>
      t(
        "Zoom/orqa ekran orqali jonli darslar, interaktiv mashg'ulotlar.",
        "Live lessons via Zoom/backdrop, interactive sessions.",
      ),
  },
  {
    key: "offline",
    icon: faClock,
    title: (t) => t("Oflayn darslar", "Offline Lessons"),
    desc: (t) =>
      t(
        "Markazda yuzma-yuz darslar, guruh va individual mashg'ulotlar.",
        "Face-to-face lessons at the centre, group and individual.",
      ),
  },
];

export default function Lessons({ theme }) {
  const isDark = theme === "dark";
  const { lang } = useLang();
  const t = (uz, en) => (lang === "uz" ? uz : en);

  return (
    <div
      className={`min-h-screen px-4 pt-28 pb-16 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-extrabold">{t("Darslar", "Lessons")}</h1>
        <p className="mt-1 text-sm text-black/40 dark:text-white/40">
          {t(
            "Online va oflayn dars bo'limlari — tez orada.",
            "Online and offline lesson sections — coming soon.",
          )}
        </p>

        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {MODES.map((m) => (
            <div
              key={m.key}
              className={`flex flex-col rounded-2xl border p-6 ${
                isDark
                  ? "border-white/10 bg-white/5"
                  : "border-black/10 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg ${
                    isDark
                      ? "bg-white/10 text-[var(--accent)]"
                      : "bg-black/5 text-[var(--accent)]"
                  }`}
                >
                   <FontAwesomeIcon icon={m.icon} />
                </div>
                <h2 className="text-lg font-bold">{m.title(t)}</h2>
              </div>
              <p className="mt-3 text-sm text-black/45 dark:text-white/45">
                {m.desc(t)}
              </p>
              <div className="mt-auto pt-6">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                    isDark
                      ? "bg-white/5 text-white/50"
                      : "bg-black/5 text-black/50"
                  }`}
                >
                   <FontAwesomeIcon icon={faClock} className="text-[var(--accent)]" />
                  {t("Coming soon", "Coming soon")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}