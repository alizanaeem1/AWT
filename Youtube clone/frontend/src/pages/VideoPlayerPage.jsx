import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dislikeVideoApi, getVideoApi, incrementViewsApi, likeVideoApi } from "../api/videoApi";
import { addToWatchHistory } from "../api/historyApi";
import { getSubscriptionStatusApi, toggleSubscriptionApi } from "../api/interactionApi";
import CommentSection from "../components/CommentSection";
import { resolveMediaUrl } from "../utils/media";
import { useAuth } from "../context/AuthContext";

function VideoPlayerPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [subError, setSubError] = useState("");

  const loadVideo = async () => {
    const res = await getVideoApi(id);
    setVideo(res.data);
  };

  useEffect(() => {
    const run = async () => {
      await loadVideo();
      incrementViewsApi(id);
      if (user) {
        addToWatchHistory(id).catch(() => {});
      }
    };
    run();
  }, [id, user]);

  useEffect(() => {
    if (!video?.owner?._id) return;
    const ownerId = String(video.owner._id);
    const myId = user?.id || user?._id;
    const myIdStr = myId ? String(myId) : "";
    const self = myIdStr && myIdStr === ownerId;
    setIsSelf(Boolean(self));

    // Don't call status API if self; backend treats it as not subscribed.
    if (!myIdStr || self) {
      setIsSubscribed(false);
      return;
    }

    getSubscriptionStatusApi(ownerId)
      .then((res) => setIsSubscribed(Boolean(res.data.subscribed)))
      .catch(() => setIsSubscribed(false));
  }, [video, user]);

  const onToggleSubscribe = async () => {
    if (!video?.owner?._id) return;
    const ownerId = String(video.owner._id);
    setSubError("");
    try {
      const res = await toggleSubscriptionApi(ownerId);
      setIsSubscribed(Boolean(res.data.subscribed));
      await loadVideo();
    } catch (err) {
      setSubError(err?.response?.data?.message || "Subscription failed.");
    }
  };

  if (!video) return <p>Loading...</p>;

  return (
    <section>
      <video src={resolveMediaUrl(video.videoUrl)} controls width="100%" style={{ aspectRatio: '16/9', backgroundColor: '#000', borderRadius: 'var(--radius-md)' }} />
      <div className="video-page">
        <h1 className="video-title-page">{video.title}</h1>
        <div className="video-views-under-title text-secondary">{video.views} views</div>

        <div className="video-channel-controls">
          <div className="video-channel-left">
            <Link to={`/channel/${video.owner._id}`} className="video-channel-avatar">
              {video.owner?.avatar ? (
                <img src={resolveMediaUrl(video.owner.avatar)} alt={video.owner.name} />
              ) : null}
            </Link>

            <div className="video-channel-meta">
              <Link to={`/channel/${video.owner._id}`} className="video-channel-name">
                {video.owner.name}
              </Link>
              <div className="video-channel-sub text-secondary">
                {video.owner?.subscribersCount || 0} subscribers
              </div>
            </div>
          </div>

          <div className="video-channel-middle">
            <button
              type="button"
              className="btn-subscribe"
              onClick={onToggleSubscribe}
              disabled={isSelf}
              aria-disabled={isSelf}
              title={isSelf ? "You cannot subscribe to your own channel" : ""}
            >
              {isSelf ? "Your channel" : isSubscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          </div>

          <div className="video-channel-right">
            <button
              type="button"
              className="btn-ghost reaction-btn reaction-like"
              onClick={() => likeVideoApi(id).then(loadVideo)}
            >
              <span className="reaction-emoji" aria-hidden="true">
                👍
              </span>
              <span className="reaction-count">{video.likes.length}</span>
            </button>
            <button
              type="button"
              className="btn-ghost reaction-btn reaction-dislike"
              onClick={() => dislikeVideoApi(id).then(loadVideo)}
            >
              <span className="reaction-emoji" aria-hidden="true">
                👎
              </span>
              <span className="reaction-count">{video.dislikes.length}</span>
            </button>
          </div>
        </div>

        {subError ? <p className="text-error">{subError}</p> : null}

        <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
          <span style={{ padding: '6px 12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid rgba(139, 92, 246, 0.25)', fontWeight: 'bold' }}>
            {video.category || "Entertainment"}
          </span>
        </div>

        <h3 className="section-title" style={{ marginTop: '16px' }}>Description</h3>
        <p className="video-description">{video.description}</p>

        <div className="video-comments-wrap">
          <CommentSection videoId={id} />
        </div>
      </div>
    </section>
  );
}

export default VideoPlayerPage;
