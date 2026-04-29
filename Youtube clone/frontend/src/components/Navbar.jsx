import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../utils/media";

function Navbar({ sidebarOpen, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { dark, setDark } = useTheme();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <nav className="navbar">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label="Open sidebar"
        aria-expanded={sidebarOpen ? "true" : "false"}
      >
        <span className="hamburger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      <Link to="/" className="brand">
        <span className="brand-logo" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="tg" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#tg)" strokeWidth="2" />
            <path d="M10.2 8.9V15.1L15.4 12L10.2 8.9Z" fill="url(#tg)" />
          </svg>
        </span>
        <span className="brand-text"><span className="brand-accent">Stream</span>Tube</span>
      </Link>
      <form className="navbar-search" onSubmit={onSearch}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos"
          aria-label="Search videos"
        />
        <button type="submit" className="btn-search" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <div className="navbar-actions">
        <button
          type="button"
          className="btn-icon"
          onClick={() => setDark(!dark)}
          title={dark ? "Light mode" : "Dark mode"}
          aria-label="Toggle theme"
        >
          {dark ? "☀" : "☾"}
        </button>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link to="/upload" className="btn-signin">
              Upload
            </Link>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button 
                type="button" 
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  width: '40px', height: '40px', borderRadius: '50%', padding: 0, overflow: 'hidden',
                  border: '1px solid rgba(128,128,128,0.3)', cursor: 'pointer', background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {user.avatar ? (
                  <img src={resolveMediaUrl(user.avatar)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontWeight: 'bold' }}>{user.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </button>
              {profileOpen && (
                <div className="video-more-menu" style={{ position: "absolute", top: "50px", right: 0, zIndex: 100, minWidth: "160px" }}>
                  <Link to="/my-channel" className="video-more-item" style={{ display: "block", textDecoration: "none" }} onClick={() => setProfileOpen(false)}>
                    View your channel
                  </Link>
                  <button className="video-more-item video-more-item-danger" style={{ width: "100%", textAlign: "left" }} onClick={logout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link to="/auth" className="btn-signin">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
