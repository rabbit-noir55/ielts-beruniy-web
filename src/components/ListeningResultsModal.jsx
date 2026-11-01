import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useDelayedUnmount } from "../utils/helpers";

const ListeningResultsModal = ({
  showModal,
  setShowModal,
  isDark,
  correctCount,
  totalQuestions,
  resultRows,
  goToPrevPart,
  goToNextPart,
  partNum,
  maxPart = 4,
  series,
  testNum,
  allPartsCompleted,
  isOurMock,
}) => {
  const navigate = useNavigate();
  const shouldRender = useDelayedUnmount(showModal, 300);
  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-end md:items-center justify-center p-0 md:p-4 ${showModal ? "qz-anim-fade-in" : "qz-anim-fade-out"}`}
      style={{ zIndex: 10000 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowModal(false)}
      />

      <div
        className={`relative z-10 w-full md:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden ${
          showModal ? "qz-anim-scale-in" : "qz-anim-scale-out"
        } ${
          /* Mobile: bottom sheet. Desktop: centered card */
          "rounded-t-3xl md:rounded-2xl shadow-2xl"
        } ${isDark ? "bg-[#141416] text-[#F5F5F5]" : "bg-white text-[#17171A]"}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4 ${
          isDark ? "border-white/10" : "border-black/[0.08]"
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile drag handle */}
            <div className={`md:hidden w-10 h-1 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2 ${isDark ? "bg-white/20" : "bg-black/15"}`} />
            <h2 className="text-lg md:text-xl font-bold">Part Results</h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-semibold ${
              correctCount === totalQuestions
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : correctCount >= totalQuestions * 0.7
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              {correctCount} / {totalQuestions}
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className={`p-1.5 md:p-2 rounded-full ${isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-black/[0.04] text-black/40"}`}
          >
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {correctCount === totalQuestions && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center qz-anim-pop-in">
              <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                Perfect! All answers correct!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {resultRows.map((row, i) => (
              <div
                key={row.qid}
                className={`flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl border transition-all ${
                  row.isCorrect
                    ? isDark
                      ? "bg-green-900/10 border-green-800/30"
                      : "bg-green-50 border-green-200"
                    : isDark
                      ? "bg-red-900/10 border-red-800/30"
                      : "bg-red-50 border-red-200"
                }`}
                style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
              >
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  row.isCorrect
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {row.isCorrect
                    ? <FontAwesomeIcon icon={faCircleCheck} className="text-sm text-green-600 dark:text-green-400" />
                    : <FontAwesomeIcon icon={faCircleXmark} className="text-sm text-red-500 dark:text-red-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`font-semibold text-xs md:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>
                    Q{row.qid}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[11px] md:text-xs truncate ${
                      row.userAns === "No answer"
                        ? "italic text-black/30 dark:text-white/30"
                        : row.isCorrect
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400"
                    }`}>
                      {row.userAns}
                    </span>
                    {!row.isCorrect && (
                      <>
                        <span className={`text-[11px] md:text-xs ${isDark ? "text-white/20" : "text-black/20"}`}>→</span>
                        <span className="text-[11px] md:text-xs font-bold text-green-600 dark:text-green-400 truncate">
                          {row.correctAns}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-[10px] md:text-xs font-bold flex-shrink-0 ${
                  row.isCorrect
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {row.isCorrect ? "✓" : "✗"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div className={`border-t px-3 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row gap-2 sm:justify-between items-stretch sm:items-center ${
          isDark ? "border-white/10" : "border-black/[0.08]"
        }`}>
          <div className="flex gap-2 order-2 sm:order-1">
            <button
              onClick={goToPrevPart}
              disabled={parseInt(partNum) <= 1}
              className="flex-1 sm:flex-none bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 text-sm font-medium"
            >
              ← Previous
            </button>
            {isOurMock && allPartsCompleted ? (
              <button
                onClick={() => {
                  setShowModal(false);
                  navigate(`/results/${series}/${testNum}`);
                }}
                className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold text-sm"
              >
                Overall
              </button>
            ) : (
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 sm:flex-none bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] px-4 py-2 rounded-lg hover:opacity-80 text-sm"
              >
                Continue
              </button>
            )}
          </div>
          <button
            onClick={goToNextPart}
            disabled={parseInt(partNum) >= maxPart}
            className="order-1 sm:order-2 bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] px-4 py-2 rounded-lg hover:opacity-80 disabled:opacity-50 text-sm font-medium"
          >
            Next Part →
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ListeningResultsModal;
