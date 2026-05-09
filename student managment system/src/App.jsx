import React, { useState } from "react";
import { useApp } from "./context/AppContext";
import { useDueTodayNotifications } from "./hooks/useDueTodayNotifications";
import { useTimetableNotifications } from "./hooks/useTimetableNotifications";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ToastStack from "./components/ToastStack";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SubjectsPage from "./pages/SubjectsPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import CalendarPage from "./pages/CalendarPage";
import FilesPage from "./pages/FilesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import CourseDetailsPage from "./pages/CourseDetailsPage";
import SemestersPage from "./pages/SemestersPage";
import NotificationsPage from "./pages/NotificationsPage";
import DailyProgressPage from "./pages/DailyProgressPage";

export default function App() {
  const { user, loading, theme, activeSemester, dataVersion, pushNotification, pushToast } = useApp();
  useDueTodayNotifications({
    activeSemester,
    dataVersion,
    pushNotification,
    pushToast
  });
  useTimetableNotifications({
    user,
    activeSemester,
    dataVersion,
    pushNotification,
    pushToast
  });
  const pageShellClass =
    theme === "dark"
      ? "rounded-2xl border border-white/[0.06] bg-app-card p-5 shadow-card"
      : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [assignmentSubjectFilter, setAssignmentSubjectFilter] = useState(null);
  const [assignmentListOnly, setAssignmentListOnly] = useState(false);
  const [fileSubjectFilter, setFileSubjectFilter] = useState(null);
  const [courseDetailsSubject, setCourseDetailsSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg text-slate-400">Loading…</div>
    );
  }

  if (!user) return <LoginPage />;

  const pageMap = {
    Dashboard: <DashboardPage />,
    Semesters: <SemestersPage externalSearch={searchQuery} />,
    Courses: (
      <SubjectsPage
        externalSearch={searchQuery}
        onManageSubject={(subject) => {
          setAssignmentSubjectFilter(subject.id);
          setAssignmentListOnly(false);
          setActiveNav("Assignments & Quiz");
        }}
        onViewCourseFiles={(subject) => {
          setFileSubjectFilter(subject.id);
          setActiveNav("Files");
        }}
        onViewDetails={(subject) => {
          setCourseDetailsSubject(subject);
          setActiveNav("Course Details");
        }}
      />
    ),
    "Course Details": (
      <CourseDetailsPage
        subject={courseDetailsSubject}
        onBack={() => setActiveNav("Courses")}
      />
    ),
    "Assignments & Quiz": (
      <AssignmentsPage
        externalSearch={searchQuery}
        listOnly={assignmentListOnly}
        initialSubjectId={assignmentSubjectFilter}
        onClearInitialSubject={() => setAssignmentSubjectFilter(null)}
      />
    ),
    Calendar: <CalendarPage />,
    Files: (
      <FilesPage
        externalSearch={searchQuery}
        filterSubjectId={fileSubjectFilter}
        onClearFileSubjectFilter={() => setFileSubjectFilter(null)}
      />
    ),
    Analytics: <AnalyticsPage />,
    "Daily Progress": <DailyProgressPage />,
    Notifications: <NotificationsPage />,
    Settings: <SettingsPage />
  };

  return (
    <div
      className={`h-screen overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-app-bg" : "bg-slate-100"
      }`}
    >
      {theme === "dark" ? (
        <>
          <div className="pointer-events-none fixed -right-20 top-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="pointer-events-none fixed bottom-0 left-1/4 h-80 w-80 rounded-full bg-violet-600/5 blur-3xl" />
        </>
      ) : null}
      <div className="flex h-full">
        <Sidebar
          active={activeNav}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelect={(name) => {
            if (name === "Files") setFileSubjectFilter(null);
            if (name === "Assignments & Quiz") setAssignmentListOnly(false);
            if (name !== "Course Details") setCourseDetailsSubject(null);
            setActiveNav(name);
            setSidebarOpen(false);
          }}
        />
        <main
          className={`h-full flex-1 overflow-y-auto p-4 transition-all duration-300 md:p-6 ${
            theme === "dark" ? "text-slate-200" : "text-slate-800"
          }`}
        >
          <Topbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onGoSettings={() => setActiveNav("Settings")}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          />
          <div key={activeNav} className="page-animate">
            {pageMap[activeNav]}
          </div>
        </main>
      </div>
      <ToastStack />
    </div>
  );
}
