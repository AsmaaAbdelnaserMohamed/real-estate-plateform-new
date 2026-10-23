import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../utils/auth";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

  useEffect(() => {
    const syncAuth = () => setAuthenticated(isAuthenticated());
    window.addEventListener("authchange", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("authchange", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
