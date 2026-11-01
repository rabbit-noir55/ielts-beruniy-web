import { useParams, useNavigate } from "react-router-dom";
import { loadResult } from "../utils/ieltsBand";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";

function BandBadge({ label, band, color }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-black/[0.08] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#141416]">
      <span className="text-xs font-bold uppercase tracking-wide text-black/40 dark:text-white/40">{label}</span>
      <span className={`mt-1 text-3xl font-extrabold ${color}`}>{band ?? "\u2014"}</span>
    </div>
  );
}

function skillColor(band) {
  if (band == null) return "text-black/30 dark:text-white/30";
  if (band >= 7) return "text-green-600 dark:text-green-400";
  if (band >= 5.5) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function QuestionDetails({ partDetails }) {
  if (!partDetails || Object.keys(partDetails).length === 0) return null;
  const sortedQids = Object.keys(partDetails).sort(
    (a, b) => Number(a) - Number(b),
  );
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {sortedQids.map((qid) => {
        const row = partDetails[qid];
        return (
          <div
            key={qid}
            className={`flex items-center gap-3 p-3 rounded-xl border transition ${
              row.isCorrect
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                row.isCorrect
                  ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
              }`}
            >
              {row.isCorrect ? <FontAwesomeIcon icon={faCircleCheck} size="lg" /> : <FontAwesomeIcon icon={faCircleXmark} size="lg" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-black/40 dark:text-white/40">
                Q{qid}
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-sm">
                <span
                  className={
                    row.isCorrect
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }
                >
                  {row.userAns}
                </span>
                {!row.isCorrect && (
                  <>
                    <span className="text-black/30 dark:text-white/30">&rarr;</span>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {row.correctAns}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div
              className={`text-xs font-bold ${
                row.isCorrect
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {row.isCorrect ? "\u2713" : "\u2717"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkillCard({ title, raw, band, partDetails, isDark }) {
  const hasDetails = partDetails && Object.keys(partDetails).length > 0;
  const allQids = hasDetails
    ? Object.values(partDetails)
        .flatMap((part) => Object.keys(part))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => Number(a) - Number(b))
    : [];
  const totalQ = allQids.length;
  const correctQ = hasDetails
    ? Object.values(partDetails).flatMap((part) =>
        Object.values(part).filter((r) => r.isCorrect),
      ).length
    : 0;

  return (
    <div
      className={`mt-4 rounded-xl border p-5 shadow-sm ${
        isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {hasDetails && (
          <span className="text-sm text-black/40 dark:text-white/40">
            {correctQ}/{totalQ} correct
          </span>
        )}
      </div>
      <div className="mt-1 text-sm text-black/40 dark:text-white/40">
        Raw Score: {raw}/40 &middot; Band:{" "}
        <span className={`font-bold ${skillColor(band)}`}>{band}</span>
      </div>
      {hasDetails && (
        <QuestionDetails partDetails={partDetails} />
      )}
    </div>
  );
}

export default function TestResults({ theme }) {
  const { series, testNum } = useParams();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const result = loadResult(parseInt(series), parseInt(testNum));

  if (!result) {
    return (
      <div className="flex min-h-[calc(100vh-112px)] items-center justify-center px-4 pt-28">
        <div className="text-center">
          <p className="text-lg text-black/40 dark:text-white/40">
            No results found for IELTS {series} Test {testNum}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-bold text-white dark:bg-[var(--accent)] dark:text-[var(--accent-contrast)]"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { listening, reading, writing, speaking, overall, details } = result;

  return (
    <div
      className={`min-h-screen px-4 pt-28 pb-12 ${
        isDark ? "bg-[#0A0A0B] text-[#F5F5F5]" : "bg-[#F6F5F2] text-[#17171A]"
      }`}
    >
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
        >
          &larr; Back
        </button>

        <h1 className="text-2xl font-bold">
          IELTS {series} &middot; Academic &middot; Test {testNum}
        </h1>

        <div className="mt-6 grid grid-cols-5 gap-3">
          <BandBadge label="Overall" band={overall} color={skillColor(overall)} />
          <BandBadge
            label="Listening"
            band={listening?.band}
            color={skillColor(listening?.band)}
          />
          <BandBadge
            label="Reading"
            band={reading?.band}
            color={skillColor(reading?.band)}
          />
          <BandBadge
            label="Writing"
            band={writing?.band}
            color={skillColor(writing?.band)}
          />
          <BandBadge
            label="Speaking"
            band={speaking?.band}
            color={skillColor(speaking?.band)}
          />
        </div>

        {listening && (
          <SkillCard
            title="Listening"
            raw={listening.raw}
            band={listening.band}
            partDetails={details?.listening}
            isDark={isDark}
          />
        )}
        {reading && (
          <SkillCard
            title="Reading"
            raw={reading.raw}
            band={reading.band}
            partDetails={details?.reading}
            isDark={isDark}
          />
        )}
        {writing && (
          <div
            className={`mt-4 rounded-xl border p-5 shadow-sm ${
              isDark
                ? "border-white/10 bg-[#141416]"
                : "border-black/[0.08] bg-white"
            }`}
          >
            <h2 className="text-lg font-bold">Writing</h2>
            <div className="mt-2 space-y-1 text-sm text-black/50 dark:text-white/50">
              <p>
                Task 1:{" "}
                <span className={`font-bold ${skillColor(writing.task1)}`}>
                  {writing.task1 ?? "\u2014"}
                </span>
              </p>
              <p>
                Task 2:{" "}
                <span className={`font-bold ${skillColor(writing.task2)}`}>
                  {writing.task2 ?? "\u2014"}
                </span>
              </p>
              {writing.band != null && (
                <p className="pt-1">
                  Overall:{" "}
                  <span className={`font-bold ${skillColor(writing.band)}`}>
                    {writing.band}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
        {speaking && (
          <div
            className={`mt-4 rounded-xl border p-5 shadow-sm ${
              isDark
                ? "border-white/10 bg-[#141416]"
                : "border-black/[0.08] bg-white"
            }`}
          >
            <h2 className="text-lg font-bold">Speaking</h2>
            <p className="mt-2 text-sm text-black/50 dark:text-white/50">
              Band:{" "}
              <span className={`font-bold ${skillColor(speaking.band)}`}>
                {speaking.band}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
