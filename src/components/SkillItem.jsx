import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faComments,
  faHeadphones,
  faPenNib,
} from "@fortawesome/free-solid-svg-icons";

const iconMap = {
  listening: faHeadphones,
  reading: faBookOpen,
  speaking: faComments,
  writing: faPenNib,
};

function SkillItem({
  label,
  type = "listening",
  bookId,
  testNum,
  partNum = "1",
  isDark,
  animDelay = 0,
  band,
  comingSoon = false,
  mockRoute = false,
}) {
  const finalPartNum = partNum || "1";
  const icon = iconMap[type] || faHeadphones;

  if (comingSoon) {
    return (
      <div
        className="flex items-center justify-between rounded-lg py-1.5 pl-2 pr-1 text-xs opacity-50"
        style={{ animationDelay: `${animDelay}ms` }}
      >
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={icon} className="w-3 text-[11px]" />
          <span className="font-medium">{label}</span>
        </span>
        <span className="rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold bg-black/10 dark:bg-white/10">
          Coming Soon
        </span>
      </div>
    );
  }

  if (!bookId || !testNum) {
    console.warn(`SkillItem: Missing required props for ${label}`, {
      bookId,
      testNum,
    });
    return (
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs">
          <FontAwesomeIcon icon={icon} className="w-3 opacity-50" />
          {label}
        </span>
      </div>
    );
  }

  const href = mockRoute
    ? `/mock/${bookId}/${testNum}/${type}/${finalPartNum}`
    : `/academic/${bookId}/${testNum}/${type}/${finalPartNum}`;

  const bandColor =
    band == null
      ? ""
      : band >= 7
      ? "bg-green-500 text-white"
      : band >= 5.5
      ? "bg-amber-500 text-white"
      : "bg-red-500 text-white";

  return (
    <Link
      to={href}
      className={`group relative flex items-center gap-1.5 overflow-hidden rounded-lg py-1.5 px-1.5 text-left text-[11px] transition-all duration-200 active:scale-95 sm:active:scale-100 sm:text-xs ${
        /* Mobile: bigger touch area with min-h, pill style */
        "min-h-[32px] sm:min-h-0"
      } ${
        isDark
          ? "hover:bg-white/[0.06] active:bg-white/[0.1]"
          : "hover:bg-black/[0.03] active:bg-black/[0.06]"
      }`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Mobile: left accent bar always visible */}
      <span
        className={`absolute left-0 top-1/2 h-3/5 w-[2.5px] -translate-y-1/2 rounded-r sm:h-0 sm:w-[3px] sm:group-hover:h-4/5 transition-all duration-200 ${
          isDark ? "bg-white/60 sm:bg-white" : "bg-[var(--accent)]/60 sm:bg-[var(--accent)]"
        }`}
      />
      <FontAwesomeIcon
        icon={icon}
        className={`w-3 shrink-0 text-[10px] sm:text-[11px] transition-all duration-200 sm:group-hover:translate-x-0.5 ${
          isDark
            ? "text-white/50 sm:group-hover:text-[var(--accent)]"
            : "text-black/45 sm:group-hover:text-[var(--accent)]"
        }`}
      />
      <span
        className={`truncate font-medium transition-colors duration-200 ${
          isDark ? "text-white/70 sm:group-hover:text-white" : "text-[#17171A] sm:group-hover:text-black"
        }`}
      >
        {label}
      </span>
      {band != null && (
        <span className={`ml-auto shrink-0 rounded px-1 py-px text-[9px] leading-none font-semibold sm:text-[10px] ${bandColor}`}>
          {band.toFixed(1)}
        </span>
      )}
    </Link>
  );
}

export default SkillItem;
