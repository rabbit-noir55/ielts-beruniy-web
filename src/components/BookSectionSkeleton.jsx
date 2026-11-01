function BookSectionSkeleton({ isDark }) {
  return (
    <section
      className={`w-full rounded-2xl border p-5 sm:p-6 ${
        isDark
          ? "border-white/10 bg-[#141416]"
          : "border-black/[0.08] bg-white"
      }`}
    >
      {/* Sarlavha o'rnini bosuvchi skeleton */}
      <div className="mb-5 flex justify-center">
        <div className="lib-skeleton h-6 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((testNum) => (
          <div
            key={testNum}
            className={`rounded-xl border p-3 ${
              isDark
                ? "border-white/10 bg-[#0A0A0B]/40"
                : "border-black/[0.08] bg-white"
            }`}
          >
            <div
              className={`mb-2 border-b pb-2 ${
                isDark ? "border-white/10" : "border-black/[0.08]"
              }`}
            >
              <div className="lib-skeleton h-4 w-14" />
            </div>

            <div className="flex flex-col gap-3 py-1">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-3 px-1">
                  <div className="lib-skeleton h-3.5 w-3.5 shrink-0 rounded-full" />
                  <div className="lib-skeleton h-3.5 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BookSectionSkeleton;
