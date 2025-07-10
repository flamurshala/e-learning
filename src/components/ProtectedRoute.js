import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, userType = "adminId" }) => {
  const isLoggedIn = localStorage.getItem(userType);
  return isLoggedIn ? children : <Navigate to="/LoginAs" replace />;
};

export default ProtectedRoute;
