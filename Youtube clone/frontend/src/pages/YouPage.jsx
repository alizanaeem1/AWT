import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import LoaderSkeleton from "../components/LoaderSkeleton";
import { useAuth } from "../context/AuthContext";
import { getWatchHistory } from "../api/historyApi";
import { Link } from "react-router-dom";
import { getChannelApi } from "../api/interactionApi";
import { resolveMediaUrl } from "../utils/media";

function YouPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const myId = user?.id || user?._id;

  useEffect(() => {
    const run = async () => {
      if (!myId) return;
      setLoading(true);
      setError("");
      try {
        const [profileRes, historyRes] = await Promise.all([
          getChannelApi(myId), 
          getWatchHistory()
        ]);
        setProfile(profileRes.data.channel);
        setHistory(historyRes.slice(0, 10)); // show top 10 recent
      } catch {
        setError("Failed to load your channel.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [myId]);

  if (loading) return <LoaderSkeleton />;
  if (error) return <p className="text-error">{error}</p>;

  return (
    <div className="home-stack">
      <div className="profile-top">
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-elevated)', flexShrink: 0 }}>
          {profile?.avatar ? (
            <img src={resolveMediaUrl(profile.avatar)} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold' }}>
              {profile?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="page-heading" style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>{profile?.name || "Your profile"}</h1>
          <div className="text-secondary" style={{ marginBottom: '6px', fontSize: '0.9rem' }}>
            <span>@{profile?.name?.replace(/\s+/g, '')?.toLowerCase()}-vid</span>
          </div>
          <Link to="/my-channel" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>View channel</span>
          </Link>
        </div>
      </div>

      {/* History Section */}
      <div className="home-header" style={{ marginBottom: 16 }}>
        <h2 className="page-heading" style={{ margin: 0, fontSize: "1.2rem" }}>History</h2>
        {history.length > 0 && (
          <Link to="/history">
            <button className="btn-ghost" style={{ borderRadius: "100px", padding: "4px 14px", height: "32px", fontSize: "0.85rem", fontWeight: "600", border: '1px solid rgba(128,128,128,0.2)' }}>
              View all
            </button>
          </Link>
        )}
      </div>
      
      {!history.length ? (
        <p className="text-secondary">No watch history yet.</p>
      ) : (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
          {history.map((video) => (
            <div key={video._id} style={{ minWidth: '220px', flex: '0 0 220px' }}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YouPage;

