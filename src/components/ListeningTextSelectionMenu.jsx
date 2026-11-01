import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStickyNote, faHighlighter, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useDelayedUnmount } from "../utils/helpers";
import { HIGHLIGHT_COLORS } from "../utils/highlightColors";

const ListeningTextSelectionMenu = ({
  selectionMenu,
  applyNote,
  applyHighlight,
  hideMenu,
}) => {
  const shouldRender = useDelayedUnmount(!!selectionMenu.visible, 130);
  if (!shouldRender) return null;

  return (
    <div
      className={`selection-menu fixed z-[100] bg-white dark:bg-[#141416] rounded-lg shadow-xl border border-black/[0.08] dark:border-white/10 p-1 flex gap-1 ${
        selectionMenu.visible ? "qz-anim-pop-in" : "qz-anim-pop-out"
      }`}
      style={{
        left: Math.max(10, Math.min(selectionMenu.x, window.innerWidth - 200)),
        top: Math.max(10, selectionMenu.y),
      }}
    >
      <button
        onClick={applyNote}
        className="qz-btn flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] dark:hover:text-white rounded hover:bg-black"
      >
        <FontAwesomeIcon icon={faStickyNote} /> Note
      </button>
      <div className="flex items-center gap-1 px-1" title="Highlight color">
        <FontAwesomeIcon icon={faHighlighter} className="text-sm text-black/40 dark:text-white/40" />
        {HIGHLIGHT_COLORS.map(({ id, name, color }) => (
          <button
            key={id}
            onClick={() => applyHighlight(id)}
            title={name}
            aria-label={`Highlight ${name}`}
            className="w-5 h-5 rounded border border-black/10 dark:border-white/25 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <button
        onClick={hideMenu}
        className="qz-btn flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        <FontAwesomeIcon icon={faXmark} /> Cancel
      </button>
    </div>
  );
};

export default ListeningTextSelectionMenu;
