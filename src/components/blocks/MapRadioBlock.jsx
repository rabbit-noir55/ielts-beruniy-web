const MapRadioBlock = ({
  body,
  userAnswers,
  handleAnswerChange,
  showResults,
  getCorrectAnswer,
}) => {
  if (!body || !body.items || body.items.length === 0) {
    return (
      <div className="text-black/40 dark:text-white/40">No map data</div>
    );
  }

  const [rangeStart, rangeEnd] = body.desc?.optionRange || ["A", "I"];
  const letters = Array.from(
    { length: rangeEnd.charCodeAt(0) - rangeStart.charCodeAt(0) + 1 },
    (_, i) => String.fromCharCode(rangeStart.charCodeAt(0) + i),
  );

  return (
    <div className="w-full">
      {body.img && (
        <img
          src={body.img}
          alt="Map"
          className="w-full max-w-xl mx-auto rounded-md border border-black/[0.12] dark:border-white/10 mb-4"
          loading="lazy"
        />
      )}

      <div className="space-y-3">
        {body.items.map((item) => {
          const qid = String(item.qid);
          const userVal = String(userAnswers[qid] ?? "").toUpperCase();
          const correctVal = String(getCorrectAnswer(qid) ?? "")
            .toUpperCase()
            .trim();

          return (
            <div
              key={qid}
              className="flex flex-wrap items-center gap-2 text-sm text-[#17171A] dark:text-[#F5F5F5]"
            >
              <span className="font-semibold min-w-[24px]">{qid}</span>
              <span className="mr-1">{item.text}</span>
              <div className="flex items-center gap-1 flex-wrap">
                {letters.map((letter) => {
                  const isSelected = userVal === letter;
                  const isCorrect =
                    showResults && userVal === correctVal && correctVal !== "";
                  const isWrong =
                    showResults &&
                    isSelected &&
                    correctVal !== "" &&
                    userVal !== correctVal;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() =>
                        handleAnswerChange &&
                        handleAnswerChange(qid, letter)
                      }
                      className={`w-8 h-8 rounded-md border text-sm font-semibold transition-colors ${
                        isWrong
                          ? "bg-red-500 text-white border-red-500"
                          : isCorrect
                            ? "bg-green-500 text-white border-green-500"
                            : isSelected
                              ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                              : "border-black/[0.15] dark:border-white/15 text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapRadioBlock;