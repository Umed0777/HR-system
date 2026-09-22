import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_Chat,
    headers: {
        "Login": "amin", // TODO: заменить на реального пользователя, когда будет готова авторизация
    },
});

export const getChats = async () => {
    try {
        const res = await API.get(`/chats`);
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
        return res.data;
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
        return res.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const markChatAsRead = async (id) => {
    try {
        const res = await API.post(`/chats/${id}/read`);
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
