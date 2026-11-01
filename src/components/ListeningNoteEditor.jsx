import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useDelayedUnmount } from "../utils/helpers";

const ListeningNoteEditor = ({
  editingNote,
  setEditingNote,
  saveNote,
  deleteAnnotation,
  noteTextareaRef,
}) => {
  const shouldRender = useDelayedUnmount(!!editingNote, 150);
  if (!shouldRender || !editingNote) return null;

  return (
    <div
      className={`fixed bg-white dark:bg-[#141416] rounded-lg shadow-xl border border-black/[0.08] dark:border-white/10 p-4 ${
        editingNote ? "qz-anim-pop-in" : "qz-anim-pop-out"
      }`}
      style={{
        zIndex: 110,
        minWidth: 280,
        maxWidth: 350,
        left: Math.max(10, Math.min(editingNote.x, window.innerWidth - 360)),
        top: Math.max(
          10,
          Math.min(editingNote.y - 120, window.innerHeight - 280),
        ),
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm dark:text-white">
          📝 Add Note
        </h3>
        <button
          onClick={() => setEditingNote(null)}
          className="qz-icon-btn p-1 text-black/40 hover:text-black/50"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="text-xs text-black/40 dark:text-white/40 mb-2 bg-black/[0.02] dark:bg-white/10 p-2 rounded">
        "{editingNote.text.substring(0, 80)}"
      </div>
      <textarea
        ref={noteTextareaRef}
        value={editingNote.note}
        onChange={(e) =>
          setEditingNote((prev) => ({ ...prev, note: e.target.value }))
        }
        placeholder="Note text..."
        rows="3"
        className="w-full border rounded p-2 text-sm dark:bg-white/10 dark:border-white/15 transition-shadow focus:shadow-md"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={() => setEditingNote(null)}
          className="qz-btn px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            saveNote(editingNote.id, editingNote.note);
            setEditingNote(null);
          }}
          className="qz-btn px-3 py-1 text-sm bg-[var(--accent)] text-white dark:text-[var(--accent-contrast)] dark:hover:text-white rounded hover:bg-black"
        >
          Save
        </button>
        <button
          onClick={() => {
            if (window.confirm("Delete?")) {
              deleteAnnotation(editingNote.id);
              setEditingNote(null);
            }
          }}
          className="qz-btn px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          <FontAwesomeIcon icon={faTrash} /> Delete
        </button>
      </div>
    </div>
  );
};

export default ListeningNoteEditor;
