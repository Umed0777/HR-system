import { useLocation, useNavigate } from "react-router-dom";

export const useGoBack = (fallback) => {
  const navigate = useNavigate();
  const location = useLocation();

  return () => (location.key !== "default" ? navigate(-1) : navigate(fallback));
};