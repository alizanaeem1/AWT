import { useEffect, useState } from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import AuthPage from "./pages/AuthPage";
import UploadPage from "./pages/UploadPage";
import ChannelPage from "./pages/ChannelPage";
import { useAuth } from "./context/AuthContext";
import LikedVideosPage from "./pages/LikedVideosPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import YouPage from "./pages/YouPage";
import MyChannelPage from "./pages/MyChannelPage";
import HistoryPage from "./pages/HistoryPage";
import LoaderSkeleton from "./components/LoaderSkeleton";

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthRoute = location.pathname === "/auth";
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    // Desktop: show sidebar. Mobile/tablet: hide sidebar by default.
    return window.innerWidth > 1200;
  });

  useEffect(() => {
    const onResize = () => {
      setSidebarOpen(window.innerWidth > 1200);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isAuthRoute) {
    return (
      <main className="main-content auth-only">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
    );
  }

  if (loading && !user) {
    return (
      <main className="main-content auth-only">
        <LoaderSkeleton />
      </main>
    );
  }

  return (
    <>
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className={`layout ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/watch/:id" element={<VideoPlayerPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/upload" element={user ? <UploadPage /> : <Navigate to="/auth" replace />} />
            <Route path="/subscriptions" element={user ? <SubscriptionsPage /> : <Navigate to="/auth" replace />} />
            <Route path="/liked" element={user ? <LikedVideosPage /> : <Navigate to="/auth" replace />} />
            <Route path="/you" element={user ? <YouPage /> : <Navigate to="/auth" replace />} />
            <Route path="/my-channel" element={user ? <MyChannelPage /> : <Navigate to="/auth" replace />} />
            <Route path="/history" element={user ? <HistoryPage /> : <Navigate to="/auth" replace />} />
            <Route path="/channel/:id" element={<ChannelPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
