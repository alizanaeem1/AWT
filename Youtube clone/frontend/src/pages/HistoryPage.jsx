import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import LoaderSkeleton from "../components/LoaderSkeleton";
import { getWatchHistory, clearWatchHistory } from "../api/historyApi";
import { useAuth } from "../context/AuthContext";

function HistoryPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getWatchHistory();
        setVideos(res);
      } catch {
        setError("Failed to load watch history.");
      } finally {
        setLoading(false);
      }
    };
    if (user) run();
    else setLoading(false);
  }, [user]);

  const confirmClearHistory = async () => {
    setClearLoading(true);
    try {
      await clearWatchHistory();
      setVideos([]);
      setShowClearModal(false);
    } catch {
      alert("Failed to clear history.");
    } finally {
      setClearLoading(false);
    }
  };

  if (loading) return <LoaderSkeleton />;
  if (error) return <p className="text-error">{error}</p>;

  return (
    <section>
      <div className="home-header" style={{ marginBottom: "20px" }}>
        <h2 className="page-heading" style={{ margin: 0 }}>Watch history</h2>
        {videos.length > 0 && (
          <button className="btn-ghost" onClick={() => setShowClearModal(true)} style={{ color: "var(--error)", borderColor: "var(--error)" }}>
            Clear all
          </button>
        )}
      </div>

      {!videos.length ? (
        <p className="text-secondary">No watch history found.</p>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}

      {showClearModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Clear Watch History</h2>
            </div>
            <div className="modal-form">
              <p className="text-secondary" style={{ marginTop: 0 }}>
                Are you sure you want to clear your watch history? This action cannot be undone.
              </p>
              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button 
                  className="btn-ghost" 
                  onClick={() => setShowClearModal(false)}
                  disabled={clearLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-signin" 
                  style={{ background: 'var(--error)', boxShadow: 'none' }}
                  onClick={confirmClearHistory}
                  disabled={clearLoading}
                >
                  {clearLoading ? "Clearing..." : "Clear history"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HistoryPage;
