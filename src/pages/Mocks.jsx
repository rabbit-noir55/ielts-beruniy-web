import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MockBookSection from "../components/MockBookSection";
import LibraryAnimations from "../components/LibraryAnimations";
import { fetchOurMockList } from "../utils/ourMockApi";

function Mocks({ theme = "dark" }) {
  const isDark = theme === "dark";
  const { hash } = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Ro'yxat backenddan (ustoz qo'shgan mocklar), bo'lmasa statik indexdan
  useEffect(() => {
    let alive = true;
    fetchOurMockList()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 700);
    return () => clearTimeout(timer);
  }, [hash, loaded]);

  return (
    <div data-ai="mocks-page" data-ai-label="Our Mock Tests sahifasi" className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <LibraryAnimations />

      <div id="our-mock" className="scroll-mt-24">
        <div className="lib-fly-down mb-5 flex items-center gap-3">
          <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
          <h2
            className={`text-center text-xl font-bold sm:text-2xl ${
              isDark ? "text-[#F5F5F5]" : "text-[#17171A]"
            }`}
          >
            Our Mock
            <span className={`ml-2 text-sm font-normal ${isDark ? "text-white/40" : "text-black/40"}`}>
              Exclusive Practice Tests
            </span>
          </h2>
          <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
        </div>

        {!loaded || items === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-40 animate-pulse rounded-2xl border ${
                  isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
                }`}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            className={`rounded-2xl border px-6 py-14 text-center ${
              isDark ? "border-white/10 bg-[#141416]" : "border-black/[0.08] bg-white"
            }`}
          >
            <div className="text-4xl opacity-25">📄</div>
            <h3 className={`mt-3 text-lg font-bold ${isDark ? "text-white/80" : "text-black/80"}`}>
              Hozircha mock yo'q
            </h3>
            <p className={`mt-1 text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
              Yangi testlar tez orada qo'shiladi.
            </p>
          </div>
        ) : (
          <div className="scene-3d grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <div key={item.series}>
                <MockBookSection
                  book={{ id: item.series, skills: item.skills, titles: item.titles }}
                  isDark={isDark}
                  baseDelay={(index % 8) * 120}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Mocks;
