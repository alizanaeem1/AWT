import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getVideosApi } from "../api/videoApi";
import VideoCard from "../components/VideoCard";
import LoaderSkeleton from "../components/LoaderSkeleton";

function HomePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const categories = ["All", "Entertainment", "Education", "Gaming", "Technology", "Music", "Sports", "News", "Vlog"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getVideosApi(q, selectedCategory);
        setVideos(res.data);
      } catch {
        setError("Failed to load feed. Make sure the backend is running on port 5000.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q, selectedCategory]);

  if (loading) {
    return (
      <div className="home-stack">
        <h1 className="page-heading">Recommended for you</h1>
        <LoaderSkeleton />
      </div>
    );
  }

  return (
    <div className="home-stack">
      <div className="category-bar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255,255,255,0.08)',
              background: selectedCategory === c ? 'var(--text-primary)' : 'var(--bg-elevated)',
              color: selectedCategory === c ? 'var(--bg-base)' : 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="home-header">
        <h1 className="page-heading">{q ? `Results for "${q}"` : "Recommended for you"}</h1>
      </div>
      {error && <p className="text-error">{error}</p>}
      {!error && !videos.length && (
        <p className="text-secondary">{q ? "No search results." : "No videos yet. Be the first to upload."}</p>
      )}
      {!error && videos.length > 0 && (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
