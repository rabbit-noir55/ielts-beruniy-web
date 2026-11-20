import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BookSection from "../components/BookSection";
import BookSectionSkeleton from "../components/BookSectionSkeleton";
import LibraryAnimations from "../components/LibraryAnimations";
import { fetchCambridgeBooks } from "../utils/lessonsApi";
import { isRoundUpGroup } from "../utils/api";

function Home({ theme = "dark" }) {
  const isDark = theme === "dark";
  const [baseBooks, setBaseBooks] = useState(null);
  const [uploadedBooks, setUploadedBooks] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const all = [];
      for (let id = 20; id >= 10; id--) {
        all.push({ id, year: 2005 + id });
      }
      setBaseBooks(all);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchCambridgeBooks()
      .then((response) => {
        if (alive) setUploadedBooks(Array.isArray(response?.items) ? response.items : []);
      })
      .catch(() => {
        if (alive) setUploadedBooks([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const books = useMemo(() => {
    if (baseBooks === null) return null;
    const map = new Map(baseBooks.map((book) => [book.id, { ...book }]));
    uploadedBooks.forEach((item) => {
      const id = Number(item.series);
      if (!id) return;
      const year = Number(item.year) || 2005 + id;
      if (map.has(id)) {
        map.set(id, { ...map.get(id), year, title: item.title });
      } else {
        map.set(id, { id, year, title: item.title, uploaded: true });
      }
    });
    return [...map.values()].sort((a, b) => b.id - a.id);
  }, [baseBooks, uploadedBooks]);

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
