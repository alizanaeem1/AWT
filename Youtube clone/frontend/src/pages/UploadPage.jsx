import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideoApi } from "../api/videoApi";

function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Entertainment");
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("category", category);
    fd.append("video", video);
    if (thumbnail) fd.append("thumbnail", thumbnail);
    try {
      setUploading(true);
      await uploadVideoApi(fd);
      navigate("/");
    } catch (err) {
      const message = err?.response?.data?.message || "Upload failed. Please make sure backend server is running.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <section>
      <h2>Upload Video</h2>
      <form onSubmit={submit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
        <select value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid rgba(255, 255, 255, 0.1)", font: "inherit", background: "#0f1423", color: "var(--text-primary)" }}>
          <option value="Entertainment">Entertainment</option>
          <option value="Education">Education</option>
          <option value="Gaming">Gaming</option>
          <option value="Technology">Technology</option>
          <option value="Music">Music</option>
          <option value="Sports">Sports</option>
          <option value="News">News</option>
          <option value="Vlog">Vlog</option>
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={4} />
        <label htmlFor="videoFile">Add Video</label>
        <input id="videoFile" type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} required />
        <small className="text-secondary">{video ? video.name : "No video selected yet."}</small>

        <label htmlFor="thumbnailFile">Add Thumbnail</label>
        <input id="thumbnailFile" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files[0])} />
        <small className="text-secondary">{thumbnail ? thumbnail.name : "No thumbnail selected yet."}</small>
        {error && <p className="text-error">{error}</p>}
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </section>
  );
}

export default UploadPage;
