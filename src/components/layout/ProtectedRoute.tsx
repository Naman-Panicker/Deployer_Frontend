import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/src/context/AuthContext";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
