import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookSection from "../components/BookSection";
import BookSectionSkeleton from "../components/BookSectionSkeleton";
import LibraryAnimations from "../components/LibraryAnimations";
import { fetchCambridgeMocks } from "../utils/lessonsApi";
import { isRoundUpGroup } from "../utils/api";

function Home({ theme = "dark" }) {
  const isDark = theme === "dark";
  const [books, setBooks] = useState(null);
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const all = [];
      for (let id = 20; id >= 10; id--) {
        all.push({ id, year: 2005 + id });
      }
      setBooks(all);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchCambridgeMocks()
      .then((response) => {
        if (alive) setUploads(Array.isArray(response?.items) ? response.items : []);
      })
      .catch(() => {
        if (alive) setUploads([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const isLoading = books === null;

  if (isRoundUpGroup()) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl opacity-25">🔒</div>
        <h1 className="text-xl font-extrabold">Mocklar faqat IELTS guruhlari uchun</h1>
        <p className={`text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>
          Round Up guruhi uchun PDF kitoblar va video darslar Lessons bo'limida.
        </p>
        <Link
          to="/lessons"
          className="mt-2 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-contrast)]"
        >
          Lessons'ga o'tish
        </Link>
      </div>
    );
  }

  return (
    <>
      <div data-ai="home-page" data-ai-label="Cambridge Mock Tests sahifasi" className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6 px-3 py-4 sm:px-6 sm:py-10">
        <LibraryAnimations />

        {uploads.length > 0 && (
          <section
            className={`rounded-2xl border p-4 sm:p-5 ${
              isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.08] bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold sm:text-base">
                  Ustoz yuklagan Cambridge mocklar
                </h2>
                <p className={`mt-0.5 text-[11px] ${isDark ? "text-white/40" : "text-black/40"}`}>
                  Ushbu testlar Cambridge bo'limida ochiladi.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isDark ? "bg-white/[0.06] text-white/50" : "bg-black/[0.05] text-black/45"
                }`}
              >
                {uploads.length} ta
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {uploads.map((item) => (
                <Link
                  key={`${item.id}-${item.skill}`}
                  to={`/academic/${item.series}/${item.test_num}/${item.skill}/1`}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold capitalize transition hover:border-[var(--accent)]/50 hover:text-[var(--accent)] ${
                    isDark ? "border-white/12 text-white/65" : "border-black/10 text-black/60"
                  }`}
                >
                  Cambridge {item.series} · Test {item.test_num} · {item.skill}
                </Link>
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <BookSectionSkeleton key={n} isDark={isDark} />
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            {/* Mobile: simple list, no 3D scene. Desktop: scene-3d with perspective */}
            <div className="grid grid-cols-1 gap-4 sm:scene-3d sm:grid-cols-2 sm:gap-6">
              {books.map((book, index) => (
                <div key={book.id}>
                  <BookSection book={book} isDark={isDark} baseDelay={index * 120} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-10 text-center">{"No data found."}</div>
        )}
      </div>
    </>
  );
}

export default Home;
