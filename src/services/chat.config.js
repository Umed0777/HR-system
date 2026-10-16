export const SERVER_URL = (import.meta.env.VITE_API_Chat ?? "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");
export const CHAT_BASE = `${SERVER_URL}/api`;

export const getLogin = () => {
  try {
    return (JSON.parse(localStorage.getItem("user"))?.userName ?? "").trim();
  } catch {
    return "";
  }
};

export const avatarSrc = (url) =>
  url ? (url.startsWith("http") ? url : `${SERVER_URL}${url}`) : undefined;