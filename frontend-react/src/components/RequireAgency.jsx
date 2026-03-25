import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RequireAgency({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/agency-login" replace />;
  if (user.role !== "agency") return <Navigate to="/login" replace />;
  return children;
}