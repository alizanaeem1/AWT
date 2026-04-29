import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import LoaderSkeleton from "../components/LoaderSkeleton";
import { getLikedVideosApi } from "../api/feedApi";

function LikedVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getLikedVideosApi();
        setVideos(res.data);
      } catch {
        setError("Failed to load liked videos. Please login again if you see this repeatedly.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <LoaderSkeleton />;
  if (error) return <p className="text-error">{error}</p>;
  if (!videos.length) return <p className="text-secondary">No liked videos yet.</p>;

  return (
    <div className="video-grid">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}

export default LikedVideosPage;

