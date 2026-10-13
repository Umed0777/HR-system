import axios from "axios";
import { CHAT_BASE, getLogin } from "./chat.config";

const API = axios.create({ baseURL: CHAT_BASE });

API.interceptors.request.use((config) => {
  config.headers.Login = getLogin();
  return config;
});

export const getMessages = async (chatId, limit = 50) => {
  try {
    const res = await API.get(`/messages`, {
      params: { chat_id: chatId, limit },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const sendMessage = async (chatId, content) => {
  try {
    const res = await API.post(`/messages`, { chat_id: chatId, content });
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const sendFile = async (chatId, file) => {
  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("file", file);

    const res = await API.post(`/messages/file`, formData);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const downloadFile = async (fileId) => {
  const res = await API.get(`/files/${fileId}/download`, {
    responseType: "blob",
  });
  return res.data;
};

export const updateMessage = async (messageId, content) => {
  const res = await API.put(`/messages/${messageId}`, { content });
  return res.data;
};

export const deleteMessageApi = async (messageId) => {
  const res = await API.delete(`/messages/${messageId}`);
  return res.data;
};

export const addReactionApi = async (messageId, reaction) => {
  const res = await API.post(`/messages/${messageId}/reactions`, { reaction });
  return res.data;
};

export const removeReactionApi = async (messageId, reaction) => {
  const res = await API.delete(`/messages/${messageId}/reactions`, {
    data: { reaction },
  });
  return res.data;
};
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await API.post(`/users/avatar`, formData);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
