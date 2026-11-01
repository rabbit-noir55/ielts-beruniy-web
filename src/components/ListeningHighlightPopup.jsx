import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useDelayedUnmount } from "../utils/helpers";
import { HIGHLIGHT_COLORS, getHighlightColor } from "../utils/highlightColors";

const ListeningHighlightPopup = ({
  editingHighlight,
  setEditingHighlight,
  deleteAnnotation,
  recolorHighlight,
}) => {
  const shouldRender = useDelayedUnmount(!!editingHighlight, 150);
  if (!shouldRender || !editingHighlight) return null;

  const color = getHighlightColor(editingHighlight.color).color;

  return (
    <div
      className={`fixed highlight-popup bg-white dark:bg-[#141416] rounded-lg shadow-xl border border-black/[0.08] dark:border-white/10 p-3 ${
        editingHighlight ? "qz-anim-pop-in" : "qz-anim-pop-out"
      }`}
      style={{
        zIndex: 110,
        minWidth: 220,
        left: Math.max(
          10,
          Math.min(editingHighlight.x, window.innerWidth - 240),
        ),
        top: Math.max(
          10,
          Math.min(editingHighlight.y - 90, window.innerHeight - 150),
        ),
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm dark:text-white">🖊 Highlight</h3>
        <button
          onClick={() => setEditingHighlight(null)}
          className="qz-icon-btn p-1 text-black/40 hover:text-black/50"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div
        className="text-xs text-black/70 dark:text-white/70 mb-3 p-2 rounded border-l-2"
        style={{ backgroundColor: `${color}59`, borderColor: color }}
      >
        "{editingHighlight.text.substring(0, 80)}
        {editingHighlight.text.length > 80 ? "…" : ""}"
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        {HIGHLIGHT_COLORS.map(({ id, name, color: c }) => (
          <button
            key={id}
            onClick={() => recolorHighlight(editingHighlight.id, id)}
            title={name}
            aria-label={`Recolor ${name}`}
            className="w-5 h-5 rounded border border-black/10 dark:border-white/25 hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <button
        onClick={() => {
          deleteAnnotation(editingHighlight.id);
          setEditingHighlight(null);
        }}
        className="qz-btn w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600"
      >
        <FontAwesomeIcon icon={faTrash} /> Delete Highlight
      </button>
    </div>
  );
};

export default ListeningHighlightPopup;
