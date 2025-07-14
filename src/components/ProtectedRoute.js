import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, userType }) => {
  const user = localStorage.getItem("user");
  const professor = localStorage.getItem("professorId");
  const student = localStorage.getItem("studentId");

  const currentType = user
    ? "user"
    : professor
    ? "professorId"
    : student
    ? "studentId"
    : null;

  const allowed =
    Array.isArray(userType)
      ? userType.includes(currentType)
      : currentType === userType;

  return allowed ? children : <Navigate to="/LoginAs" replace />;
};

export default ProtectedRoute;
