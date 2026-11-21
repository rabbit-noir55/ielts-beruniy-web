import { Navigate, useLocation } from "react-router-dom";
import { getUser, isAuthenticated } from "../utils/api";

export default function RequireAuth({ children, skipNameCheck = false }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!skipNameCheck && getUser()?.needs_name) {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }
  return children;
}
