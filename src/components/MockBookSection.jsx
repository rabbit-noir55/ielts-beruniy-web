import { useMemo } from "react";
import { Link } from "react-router-dom";
import SkillItem from "./SkillItem";
import { loadAllResults } from "../utils/ieltsBand";

function MockBookSection({ book, isDark, baseDelay = 0 }) {
  const allResults = useMemo(() => loadAllResults(), []);
  const bookResults = useMemo(
    () => allResults.filter((r) => String(r.series) === String(book.id)),
    [allResults, book.id]
  );
  const getTestResult = (testNum) =>
    bookResults.find((r) => String(r.testNum) === String(testNum));

  if (!book || !book.id) {
    console.error("MockBookSection: book prop is missing or invalid", book);
    return (
      <div className="mx-auto w-full max-w-7xl rounded-2xl border border-red-500/30 p-5 text-center text-red-500">
        {"Data not loaded"}
      </div>
    );
  }

  const skills = book.skills ?? [];
  // Ikkala skill ham olib tashlangan bo'lsa — bo'lim umuman ko'rsatilmaydi
  if (skills.length === 0) return null;

  const r = getTestResult(1);
  const overallColor =
    !r || r.overall == null
      ? ""
      : r.overall >= 7
      ? "bg-green-500 text-white"
      : r.overall >= 5.5
      ? "bg-amber-500 text-white"
      : "bg-red-500 text-white";

  return (
    <section
      className={`lib-book-open w-full rounded-2xl border p-5 transition-all duration-200 sm:p-6 ${
        isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
      }`}
      style={{ animationDelay: `${baseDelay}ms` }}
    >
      <h2
        className={`lib-wipe mb-5 text-center text-lg font-bold sm:text-xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}
        style={{ animationDelay: `${baseDelay}ms` }}
      >
        Mock {book.id}
        <span
          className={`ml-2 text-sm font-normal ${
            isDark ? "text-white/40" : "text-black/40"
          }`}
        >
          Practice Test
        </span>
      </h2>

      <div
        className={`flex flex-col gap-3 rounded-xl border p-3 shadow-sm ${
          isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
        }`}
      >
        <div className="flex items-center justify-between font-bold">
          <Link to={`/results/${book.id}/1`} className="hover:underline text-sm">
            Test 1
          </Link>
          {r?.overall != null && (
            <span className={`rounded px-1 py-0.5 text-[11px] ${overallColor}`}>
              {r.overall.toFixed(1)}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {skills.includes("listening") && (
            <SkillItem
              label="Listening"
              type="listening"
              bookId={book.id}
              testNum={1}
              partNum="1"
              isDark={isDark}
              animDelay={baseDelay + 160}
              band={r?.listening?.band}
              mockRoute
            />
          )}
          {skills.includes("reading") && (
            <SkillItem
              label="Reading"
              type="reading"
              bookId={book.id}
              testNum={1}
              partNum="1"
              isDark={isDark}
              animDelay={baseDelay + 200}
              band={r?.reading?.band}
              mockRoute
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default MockBookSection;