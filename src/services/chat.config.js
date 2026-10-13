export const CHAT_BASE = import.meta.env.VITE_CHAT_API;

export const SERVER_URL = CHAT_BASE.replace(/\/api\/?$/, "");

export const getLogin = () => {
  try {
    return (JSON.parse(localStorage.getItem("user"))?.userName ?? "").trim();
  } catch {
    return "";
  }
};

export const avatarSrc = (url) =>
  url
    ? url.startsWith("http")
      ? url
      : `${SERVER_URL}${url}`
    : undefined;