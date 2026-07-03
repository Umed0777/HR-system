import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const expire = localStorage.getItem("tokenExpire");

  if (!token || !expire || Date.now() > Number(expire)) {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpire");
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;