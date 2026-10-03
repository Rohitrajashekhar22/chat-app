import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
const user = JSON.parse(sessionStorage.getItem("user"));
  // ✅ check token also
  if (!user || !user.token) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;