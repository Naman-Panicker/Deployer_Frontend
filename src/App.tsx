import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/src/context/AuthContext";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import LoginPage from "@/src/pages/LoginPage";
import SignupPage from "@/src/pages/SignupPage";
import DashboardPage from "@/src/pages/DashboardPage";
import NewProjectPage from "@/src/pages/NewProjectPage";
import ProjectDetailPage from "@/src/pages/ProjectDetailPage";
import DeploymentLogsPage from "@/src/pages/DeploymentLogsPage";
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <NewProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/deployments/:dId"
          element={
            <ProtectedRoute>
              <DeploymentLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Default / Fallback Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;