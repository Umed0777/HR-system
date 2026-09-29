import axios from "axios";
import { CHAT_BASE, getLogin } from "./chat.config";

const API = axios.create({ baseURL: CHAT_BASE });

API.interceptors.request.use((config) => {
  config.headers.Login = getLogin();
  return config;
});

export const getChats = async (type) => {
  try {
    const res = await API.get(`/chats`, {
      params: { type },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getChatById = async (id) => {
  try {
    const res = await API.get(`/chats/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createChat = async (data) => {
  try {
    const res = await API.post(`/chats`, data);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteChat = async (id) => {
  try {
    const res = await API.delete(`/chats/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getChatMembers = async (id) => {
  try {
    const res = await API.get(`/chats/${id}/members`);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const markChatAsRead = async (id, lastReadMessageId) => {
  try {
    const res = await API.post(`/chats/${id}/read`, {
      last_read_message_id: lastReadMessageId,
    });
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const searchUsers = async (query) => {
  try {
    const res = await API.get(`/users/search?query=${query}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getMe = async () => {
  try {
    const res = await API.get(`/users/me`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateChat = async (chatId, data) => {
  try {
    const res = await API.patch(`/chats/${chatId}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateMemberRole = async (chatId, userId, role) => {
  try {
    const res = await API.post(`/chats/${chatId}/members/${userId}`, { role });
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const removeMember = async (chatId, userId) => {
  try {
    const res = await API.delete(`/chats/${chatId}/members/${userId}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const addMember = async (chatId, userId) => {
  try {
    const res = await API.post(`/chats/${chatId}/members`, { user_id: userId });
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
