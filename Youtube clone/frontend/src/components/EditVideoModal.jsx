import { useEffect, useState } from "react";

function EditVideoModal({ video, open, saving, error, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("Entertainment");

  useEffect(() => {
    if (!video) return;
    setTitle(video.title || "");
    setDescription(video.description || "");
    setThumbnailUrl(video.thumbnailUrl || "");
    setCategory(video.category || "Entertainment");
  }, [video]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit video</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ title, description, thumbnailUrl, category });
          }}
        >
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)",
                border: "1px solid rgba(255, 255, 255, 0.1)", font: "inherit",
                background: "#0f1423", color: "var(--text-primary)", marginTop: "8px"
              }}
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Education">Education</option>
              <option value="Gaming">Gaming</option>
              <option value="Technology">Technology</option>
              <option value="Music">Music</option>
              <option value="Sports">Sports</option>
              <option value="News">News</option>
              <option value="Vlog">Vlog</option>
            </select>
          </label>

          <label>
            Thumbnail URL (optional)
            <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="/uploads/... or https://..." />
          </label>

          {error ? <p className="text-error">{error}</p> : null}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-signin" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditVideoModal;

