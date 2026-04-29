import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getChannelApi,
  getSubscriptionStatusApi,
  toggleSubscriptionApi
} from "../api/interactionApi";
import { getChannelVideosApi } from "../api/videoApi";
import VideoCard from "../components/VideoCard";
import LoaderSkeleton from "../components/LoaderSkeleton";
import { resolveMediaUrl } from "../utils/media";

function ChannelPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const channelRes = await getChannelApi(id);
      setData(channelRes.data);
      const vidsRes = await getChannelVideosApi(id);
      setVideos(vidsRes.data);

      const myId = user?.id || user?._id;
      const self = myId ? String(myId) === String(id) : false;
      setIsSelf(self);

      if (!self && myId) {
        const statusRes = await getSubscriptionStatusApi(id);
        setIsSubscribed(Boolean(statusRes.data.subscribed));
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load channel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, user?.id, user?._id]);

  const onToggleSubscribe = async () => {
    if (!id) return;
    await toggleSubscriptionApi(id).then((res) => {
      setIsSubscribed(Boolean(res.data.subscribed));
      // No need to refetch the whole channel; but keep in sync.
      load();
    });
  };

  if (loading) return <LoaderSkeleton />;
  if (error) return <p className="text-error">{error}</p>;
  if (!data) return <p>Loading channel...</p>;

  return (
    <div className="home-stack" style={{ maxWidth: '1040px', margin: '0 auto', paddingTop: '10px' }}>
      <div className="profile-header">
        <div className="profile-top">
          <div className="profile-avatar">
            {data.channel.avatar ? (
              <img src={resolveMediaUrl(data.channel.avatar)} alt={data.channel.name} />
            ) : (
              <div className="profile-avatar-placeholder" />
            )}
          </div>

          <div className="profile-info">
            <h1 className="page-heading profile-title">{data.channel.name}</h1>
            <div className="profile-stats text-secondary">
              <span>
                {data.channel.subscribersCount} subscribers • {data.videosCount} videos
              </span>
            </div>
            <p className="text-secondary" style={{ marginTop: '8px', fontSize: '0.95rem', maxWidth: '600px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: '3', overflow: 'hidden' }}>
              {data.channel.bio || "No bio yet"}
            </p>
          </div>
        </div>

        <div className="profile-actions">
          {!isSelf ? (
            <button type="button" className="btn-signin" onClick={onToggleSubscribe} disabled={!user} aria-disabled={!user}>
              {isSubscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          ) : (
            <button type="button" className="btn-signin" disabled>
              Your channel
            </button>
          )}
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 24 }}>
        Videos
      </h2>

      {!videos.length ? (
        <p className="text-secondary">No videos uploaded yet.</p>
      ) : (
        <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))' }}>
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ChannelPage;
