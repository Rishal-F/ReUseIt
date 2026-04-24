/**
 * ProtectedRoute wrapper component.
 * Redirects unauthenticated users to the login page.
 */
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
