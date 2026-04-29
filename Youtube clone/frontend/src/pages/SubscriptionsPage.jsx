import { useEffect, useState } from "react";
import LoaderSkeleton from "../components/LoaderSkeleton";
import { getMySubscriptionsApi } from "../api/interactionApi";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../utils/media";

function SubscriptionsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMySubscriptionsApi();
        setChannels(res.data);
      } catch {
        setError("Failed to load subscriptions. Please login again if you see this repeatedly.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <LoaderSkeleton />;
  if (error) return <p className="text-error">{error}</p>;
  if (!channels.length) return <p className="text-secondary">No subscriptions yet.</p>;

  return (
    <div className="home-stack">
      <h1 className="page-heading">Subscriptions</h1>
      <div className="channel-list">
        {channels.map((channel) => (
          <button
            type="button"
            key={channel._id}
            className="channel-list-item"
            onClick={() => navigate(`/channel/${channel._id}`)}
          >
            <div className="channel-list-avatar">
              {channel.avatar ? (
                <img src={resolveMediaUrl(channel.avatar)} alt={channel.name} />
              ) : (
                <div className="channel-avatar-placeholder" />
              )}
            </div>
            <div className="channel-list-text">
              <div className="channel-list-name">{channel.name}</div>
              <div className="channel-list-subs text-secondary">{channel.subscribersCount || 0} subscribers</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SubscriptionsPage;

