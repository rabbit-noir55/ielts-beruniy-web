import { useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import SkillItem from "./SkillItem";
import { loadAllResults } from "../utils/ieltsBand";

function BookSection({ book, isDark, baseDelay = 0 }) {
  const allResults = useMemo(() => loadAllResults(), []);
  const bookResults = useMemo(
    () => allResults.filter((r) => String(r.series) === String(book.id)),
    [allResults, book.id]
  );
  const getTestResult = (testNum) =>
    bookResults.find((r) => String(r.testNum) === String(testNum));

  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card || window.innerWidth < 640) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 4;
    const rotateX = ((centerY - y) / centerY) * 4;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
  }, []);

  if (!book || !book.id) {
    console.error("BookSection: book prop is missing or invalid", book);
    return (
      <div className="mx-auto w-full max-w-7xl rounded-2xl border border-red-500/30 p-5 text-center text-red-500">
        {"Data not loaded"}
      </div>
    );
  }

  return (
    <section
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`lib-book-open w-full rounded-2xl border p-3 transition-[transform,box-shadow] duration-300 ease-out sm:p-4 ${
        isDark
          ? "border-white/10 bg-[#141416] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]"
          : "border-black/[0.08] bg-white hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
      }`}
      style={{ animationDelay: `${baseDelay}ms` }}
    >
      {/* Title */}
      <h2
        className={`lib-wipe mb-3 text-center text-lg font-bold sm:mb-5 sm:text-xl ${
          isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
        }`}
        style={{ animationDelay: `${baseDelay + 100}ms` }}
      >
        IELTS {book.id}
        <span className={`ml-2 text-sm font-normal ${
          isDark ? "text-white/40" : "text-black/40"
        }`}>
          {book.year}
        </span>
      </h2>

      {/* Mobile: 2x2 grid, bigger cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
        {[1, 2, 3, 4].map((testNum) => {
          const r = getTestResult(testNum);
          const overallColor =
            !r || r.overall == null
              ? ""
              : r.overall >= 7
              ? "bg-green-500 text-white"
              : r.overall >= 5.5
              ? "bg-amber-500 text-white"
              : "bg-red-500 text-white";
          return (
            <div
              key={testNum}
              className={`lib-cascade flex flex-col gap-1.5 rounded-xl border p-2.5 shadow-sm transition-shadow sm:hover:shadow-lg ${
                isDark
                  ? "border-white/10 bg-[#141416]"
                  : "border-black/[0.08] bg-white"
              }`}
              style={{ animationDelay: `${baseDelay + 150 + testNum * 80}ms` }}
            >
              {/* Test header */}
              <div className="flex items-center justify-between gap-1">
                <Link
                  to={`/results/${book.id}/${testNum}`}
                  className="text-xs font-bold sm:text-sm sm:hover:underline"
                >
                  Test {testNum}
                </Link>
                {r?.overall != null && (
                  <span className={`shrink-0 rounded px-1.5 py-px text-[10px] font-bold ${overallColor}`}>
                    {r.overall.toFixed(1)}
                  </span>
                )}
              </div>
              {/* Skills: 4 rows, 1 per row */}
              <div className="flex flex-col gap-0.5">
                <SkillItem
                  label="Listening"
                  type="listening"
                  bookId={book.id}
                  testNum={testNum}
                  partNum="1"
                  isDark={isDark}
                  animDelay={baseDelay + 160 + testNum * 60}
                  band={r?.listening?.band}
                />
                <SkillItem
                  label="Reading"
                  type="reading"
                  bookId={book.id}
                  testNum={testNum}
                  partNum="1"
                  isDark={isDark}
                  animDelay={baseDelay + 200 + testNum * 60}
                  band={r?.reading?.band}
                />
                <SkillItem
                  label="Writing"
                  type="writing"
                  bookId={book.id}
                  testNum={testNum}
                  partNum="1"
                  isDark={isDark}
                  animDelay={baseDelay + 240 + testNum * 60}
                  band={r?.writing?.band}
                />
                <SkillItem
                  label="Speaking"
                  type="speaking"
                  bookId={book.id}
                  testNum={testNum}
                  partNum="1"
                  isDark={isDark}
                  animDelay={baseDelay + 280 + testNum * 60}
                  band={r?.speaking?.band}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BookSection;
