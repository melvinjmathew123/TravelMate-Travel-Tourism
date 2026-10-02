import { Navigate, Outlet } from "react-router-dom";
import { useTravel } from "../context/TravelContext";
export default function ProtectedRoute({ admin=false }) {
  const { user } = useTravel();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}
