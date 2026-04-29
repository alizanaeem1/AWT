import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import LoaderSkeleton from "../components/LoaderSkeleton";
import { useAuth } from "../context/AuthContext";
import { getMyVideosApi } from "../api/feedApi";
import { getChannelApi } from "../api/interactionApi";
import { resolveMediaUrl } from "../utils/media";
import { updateProfileApi, uploadAvatarApi } from "../api/authApi";
import EditVideoModal from "../components/EditVideoModal";
import { deleteVideoApi, updateVideoApi } from "../api/videoApi";

function MyChannelPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const myId = user?.id || user?._id;
  const myIdString = myId ? String(myId) : "";
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState({ name: "", bio: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoError, setVideoError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!myId) return;
      setLoading(true);
      setError("");
      try {
        const [profileRes, videosRes] = await Promise.all([getChannelApi(myId), getMyVideosApi()]);
        setProfile(profileRes.data.channel);
        setVideos(videosRes.data);
      } catch {
        setError("Failed to load your channel.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [myId, reloadSeed]);

  useEffect(() => {
    if (!profile) return;
    setEdit({ name: profile.name || "", bio: profile.bio || "" });
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (edit.name !== profile.name || edit.bio !== profile.bio) {
        await updateProfileApi({ name: edit.name, bio: edit.bio });
      }
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await uploadAvatarApi(fd);
      }
      const [profileRes, videosRes] = await Promise.all([getChannelApi(myId), getMyVideosApi()]);
      setProfile(profileRes.data.channel);
      setVideos(videosRes.data);
      setEditMode(false);
      setAvatarFile(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  const refreshMyVideos = () => setReloadSeed((v) => v + 1);

  const onDeleteVideo = async (videoId) => {
    const ok = window.confirm("Delete this video? This cannot be undone.");
    if (!ok) return;
    setVideoSaving(true);
    setVideoError("");
    try {
      await deleteVideoApi(videoId);
      await refreshMyVideos();
    } catch (err) {
      setVideoError(err?.response?.data?.message || "Failed to delete video.");
    } finally {
      setVideoSaving(false);
    }
  };

  const onEditVideo = (video) => {
    setVideoToEdit(video);
    setVideoModalOpen(true);
    setVideoError("");
  };

  const onSaveVideoEdits = async ({ title, description, thumbnailUrl }) => {
    if (!videoToEdit?._id) return;
    setVideoSaving(true);
    setVideoError("");
    try {
      await updateVideoApi(videoToEdit._id, { title, description, thumbnailUrl });
      setVideoModalOpen(false);
      setVideoToEdit(null);
      refreshMyVideos();
    } catch (err) {
      setVideoError(err?.response?.data?.message || "Failed to update video.");
    } finally {
      setVideoSaving(false);
    }
  };

  if (loading) return <LoaderSkeleton />;
  if (error) return <p className="text-error">{error}</p>;

  return (
    <div className="home-stack" style={{ maxWidth: '1040px', margin: '0 auto', paddingTop: '10px' }}>
      <div className="profile-top">
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-elevated)', flexShrink: 0 }}>
          {profile?.avatar ? (
            <img src={resolveMediaUrl(profile.avatar)} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
              {profile?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="page-heading" style={{ margin: '0 0 5px 0', fontSize: '1.6rem' }}>{profile?.name || "Your channel"}</h1>
          <div className="text-secondary" style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span>@{profile?.name?.replace(/\s+/g, '')?.toLowerCase()}-vid</span>
            <span>•</span>
            <span>{profile?.subscribersCount || 0} subscriber{profile?.subscribersCount !== 1 && 's'}</span>
            <span>•</span>
            <span>{videos.length} video{videos.length !== 1 && 's'}</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '6px', fontSize: '0.9rem', maxWidth: '600px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {profile?.bio || "No bio yet. Edit channel to add one."}
          </p>
        </div>
      </div>

      {!editMode ? (
        <button 
          className="btn-ghost" 
          onClick={() => setEditMode(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', borderRadius: '20px', fontWeight: '600', border: 'none', background: 'var(--accent)', color: '#fff', marginBottom: '24px', fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)' }}
        >
          <svg style={{ width: '18px', height: '18px', marginRight: '8px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Channel
        </button>
      ) : (
        <form className="profile-form" onSubmit={onSave} style={{ marginBottom: '30px', padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginTop: 0 }}>Edit Channel</h3>
          <label>
            Name
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              placeholder="Your name"
              required
            />
          </label>
          <label>
            Bio
            <textarea
              value={edit.bio}
              onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
              placeholder="Write something about your channel"
            />
          </label>
          <label>
            Profile picture
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
          </label>
          {avatarPreview && <img className="avatar-preview-img" src={avatarPreview} alt="Avatar preview" style={{ marginTop: '10px', width: '80px', height: '80px', borderRadius: '50%' }} />}
          
          <div className="profile-form-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-ghost" onClick={() => { setEditMode(false); setAvatarFile(null); }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-signin">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, borderBottom: '2px solid var(--text-primary)', display: 'inline-block', paddingBottom: '12px', paddingRight: '12px', paddingLeft: '4px', fontSize: '1.1rem' }}>Your uploaded videos</h3>
      </div>

      {!videos.length ? (
        <p className="text-secondary" style={{ textAlign: 'center', marginTop: '40px' }}>Upload your first video to see it here.</p>
      ) : (
        <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))' }}>
          {videos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              canManage={video.owner?._id && String(video.owner._id) === myIdString}
              onEdit={onEditVideo}
              onDelete={onDeleteVideo}
            />
          ))}
        </div>
      )}

      <EditVideoModal
        open={videoModalOpen}
        video={videoToEdit}
        saving={videoSaving}
        error={videoError}
        onClose={() => {
          setVideoModalOpen(false);
          setVideoToEdit(null);
          setVideoError("");
        }}
        onSave={onSaveVideoEdits}
      />
    </div>
  );
}

export default MyChannelPage;
