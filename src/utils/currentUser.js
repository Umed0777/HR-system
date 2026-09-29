export const getCurrentUsername = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.userName ?? null;
  } catch {
    return null;
  }
};