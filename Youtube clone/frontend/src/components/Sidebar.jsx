import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Icon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      );
    case "shorts":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 17h16" />
          <path d="M9 7v10" />
          <path d="M15 7v10" />
        </svg>
      );
    case "subs":
      return (
        <svg {...common}>
          <path d="M4 4h16v14H5a1 1 0 0 1-1-1V4z" />
          <path d="M8 10h8M8 14h6" />
          <path d="M6 20l2-2" />
        </svg>
      );
    case "you":
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M4 20h16" />
        </svg>
      );
    case "liked":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-9-8.5C1 9.5 2.7 7 5.5 7c1.6 0 3 .9 3.8 2 0.8-1.1 2.2-2 3.8-2C15.8 7 17.5 9.5 16.9 12.5c-2 4-4.9 8.5-4.9 8.5z" />
        </svg>
      );
    default:
      return null;
  }
}

function Sidebar({ onItemClick }) {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar-item" onClick={onItemClick}>
        <span className="sidebar-icon">
          <Icon name="home" />
        </span>
        <span className="sidebar-label">Home</span>
      </NavLink>

      {user && (
        <NavLink to="/subscriptions" className="sidebar-item" onClick={onItemClick}>
          <span className="sidebar-icon">
            <Icon name="subs" />
          </span>
          <span className="sidebar-label">Subscriptions</span>
        </NavLink>
      )}

      {user && (
        <NavLink to="/liked" className="sidebar-item" onClick={onItemClick}>
          <span className="sidebar-icon">
            <Icon name="liked" />
          </span>
          <span className="sidebar-label">Liked videos</span>
        </NavLink>
      )}

      {user && (
        <NavLink to="/you" className="sidebar-item" onClick={onItemClick}>
          <span className="sidebar-icon">
            <Icon name="you" />
          </span>
          <span className="sidebar-label">You</span>
        </NavLink>
      )}

      {/* Upload option removed from sidebar (top navbar still has Upload). */}
    </aside>
  );
}

export default Sidebar;
