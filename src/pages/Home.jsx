import { useEffect, useState } from "react";
import BookSection from "../components/BookSection";
import BookSectionSkeleton from "../components/BookSectionSkeleton";
import LibraryAnimations from "../components/LibraryAnimations";

function Home({ theme = "dark" }) {
  const isDark = theme === "dark";
  const [books, setBooks] = useState(null);

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

  const isLoading = books === null;

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
