import { createBrowserRouter, Navigate } from 'react-router-dom'
import DocsTopicPage from './pages/DocsTopicPage.jsx'
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx'
import ProtectedStudentRoute from './components/ProtectedStudentRoute.jsx'
import LectureDetailPage from './pages/LectureDetailPage.jsx'
import LabDetailPage from './pages/LabDetailPage.jsx'
import StudentLayout from './student/StudentLayout.jsx'
import StudentOverviewPage from './student/StudentOverviewPage.jsx'
import StudentLecturesPage from './student/StudentLecturesPage.jsx'
import StudentLabsPage from './student/StudentLabsPage.jsx'
import StudentAnalyticsPage from './student/StudentAnalyticsPage.jsx'
import StudentProfilePage from './student/StudentProfilePage.jsx'
import StudentLectureDetailPage from './student/StudentLectureDetailPage.jsx'
import StudentLabDetailPage from './student/StudentLabDetailPage.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import LectureList from './admin/LectureList.jsx'
import LectureFormPage from './admin/LectureFormPage.jsx'
import LabList from './admin/LabList.jsx'
import LabFormPage from './admin/LabFormPage.jsx'
import ActivitiesPage from './admin/ActivitiesPage.jsx'
import ThemeSettingsPage from './admin/ThemeSettingsPage.jsx'
import MediaPage from './admin/MediaPage.jsx'
import AdminUsersPage from './admin/AdminUsersPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import PublicViewerLayout from './layouts/PublicViewerLayout.jsx'

export const router = createBrowserRouter([
  // Root
  { path: '/', element: <HomePage /> },

  // Student auth
  { path: '/signin', element: <SignInPage /> },
  { path: '/signup', element: <SignUpPage /> },

  // Admin login
  { path: '/admin/login', element: <AdminLogin /> },

  // Admin panel (protected — admin role required)
  {
    path: '/admin',
    element: (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'lectures', element: <LectureList /> },
      { path: 'lectures/add', element: <LectureFormPage /> },
      { path: 'lectures/edit/:id', element: <LectureFormPage mode="edit" /> },
      { path: 'labs', element: <LabList /> },
      { path: 'labs/add', element: <LabFormPage /> },
      { path: 'labs/edit/:id', element: <LabFormPage mode="edit" /> },
      { path: 'activities', element: <ActivitiesPage /> },
      { path: 'theme', element: <ThemeSettingsPage /> },
      { path: 'media', element: <MediaPage /> },
      { path: 'users', element: <AdminUsersPage /> }
    ]
  },

  // Legacy learn routes (public)
  {
    path: '/learn',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/learn/docs/how-to-learn" replace /> },
      { path: 'docs/:slug', element: <DocsTopicPage /> },
      { path: 'lectures/html-introduction', element: <LectureDetailPage /> },
      { path: 'lectures/:slug', element: <DocsTopicPage /> },
      { path: 'labs/:slug', element: <LabDetailPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },

  // Public direct viewer for lectures and labs
  {
    element: <PublicViewerLayout />,
    children: [
      { path: '/lectures/:slug', element: <StudentLectureDetailPage /> },
      { path: '/labs/:slug', element: <StudentLabDetailPage /> }
    ]
  },
  { path: '/docs/:slug', element: <Navigate to="/student" replace /> },

  // Student portal (protected — session required)
  {
    path: '/student',
    element: (
      <ProtectedStudentRoute>
        <StudentLayout />
      </ProtectedStudentRoute>
    ),
    children: [
      { index: true, element: <StudentOverviewPage /> },
      { path: 'lectures', element: <StudentLecturesPage /> },
      { path: 'lectures/:slug', element: <StudentLectureDetailPage /> },
      { path: 'labs', element: <StudentLabsPage /> },
      { path: 'labs/:slug', element: <StudentLabDetailPage /> },
      { path: 'analytics', element: <StudentAnalyticsPage /> },
      { path: 'profile', element: <StudentProfilePage /> }
    ]
  },

  { path: '*', element: <NotFoundPage /> }
])
