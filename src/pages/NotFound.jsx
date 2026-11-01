import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

function NotFound({ theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  return (
    <div
      className={`flex min-h-[calc(100vh-112px)] flex-col items-center justify-center px-4 pt-28 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="text-center">
        <h1
          className={`text-8xl font-extrabold ${
            isDark ? "text-white/10" : "text-black/10"
          }`}
        >
          404
        </h1>
        <p className="mt-2 text-lg font-semibold">{"Page not found"}</p>
        <p className="mt-1 text-sm text-black/40 dark:text-white/40">
          {"The page you are looking for does not exist or has been moved."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 dark:text-[var(--accent-contrast)]"
        >
          <FontAwesomeIcon icon={faHome} />
          {"Back to Home"}
        </button>
      </div>
    </div>
  );
}

export default NotFound;