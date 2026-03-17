import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function RequireAgency({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/agency-login" replace />;
  if (user.role !== "agency") return <Navigate to="/login" replace />;
  return children;
}
