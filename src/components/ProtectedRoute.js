import { Navigate } from "react-router-dom";
import { useInactivityLogout } from "../hooks/useInactivityLogout";

const ProtectedRoute = ({ children, userType, allowedRoles }) => {
  const user = localStorage.getItem("user");
  const userRole = localStorage.getItem("userRole");
  const professor = localStorage.getItem("professorId");
  const student = localStorage.getItem("studentId");

  const currentType = user
    ? "user"
    : professor
    ? "professorId"
    : student
    ? "studentId"
    : null;

  useInactivityLogout(currentType === "user", "/AdminLogin", userRole);

  const allowed =
    Array.isArray(userType)
      ? userType.includes(currentType)
      : currentType === userType;

  if (!allowed) return <Navigate to="/LoginAs" replace />;
  if (
    currentType === "user" &&
    Array.isArray(allowedRoles) &&
    !allowedRoles.includes(userRole)
  ) {
    return <Navigate to="/CreateCourse" replace />;
  }

  return children;
};

export default ProtectedRoute;
