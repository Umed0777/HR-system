import { create } from "zustand";
import {
  getChats,
  getChatById,
  createChat,
  deleteChat,
  markChatAsRead,
  searchUsers,
} from "../services/api.service.chat";

export const useChatStore = create((set, get) => ({
  chats: [],
  currentChat: null,
  activeChatId: null,
  loading: false,
  error: null,

  userResults: [],
  userSearchLoading: false,
  userSearchError: null,

  fetchChats: async () => {
    set({ loading: true, error: null });

    try {
      const response = await getChats();

      let chatsData = [];
      if (Array.isArray(response)) {
        chatsData = response;
      } else if (response && Array.isArray(response.data)) {
        chatsData = response.data;
      } else {
        chatsData = [];
      }

      set({
        chats: chatsData,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchChatById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await getChatById(id);
      set({ currentChat: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  selectChat: async (chat) => {
    // мгновенно показываем то, что было в списке (без задержки)
    // в selectChat, после set({ currentChat: fullChat })
    set({ currentChat: chat, activeChatId: chat?.id ?? null });

    if (!chat?.id) return;

    try {
      const res = await getChatById(chat.id);
      const fullChat = res?.data ?? res;
      // подстраховка: если пользователь уже кликнул на другой чат, пока грузился этот — не перетираем
      if (get().activeChatId === chat.id) {
        set({ currentChat: fullChat });
      }
    } catch (err) {
      console.log(err);
    }
  },

  addChat: async (newData) => {
    try {
      const res = await createChat(newData);
      await get().fetchChats();
      return res.data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  removeChat: async (id) => {
    try {
      await deleteChat(id);
      if (get().activeChatId === id) {
        set({ currentChat: null, activeChatId: null });
      }
      await get().fetchChats();
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  markAsRead: async (id) => {
    try {
      await markChatAsRead(id);
      set({
        chats: get().chats.map((chat) =>
          chat.id === id ? { ...chat, unread_count: 0 } : chat,
        ),
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  // --- новое: поиск пользователей ---
  searchUsersByQuery: async (query) => {
    if (!query?.trim()) {
      set({ userResults: [] });
      return;
    }

    set({ userSearchLoading: true, userSearchError: null });
    try {
      const response = await searchUsers(query);

      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && Array.isArray(response.data)) {
        usersData = response.data;
      } else {
        usersData = [];
      }

      set({ userResults: usersData, userSearchLoading: false });
    } catch (err) {
      console.log(err);
      set({ userSearchError: err.message, userSearchLoading: false });
    }
  },
  updateChatLastMessage: (chatId, message) => {
  set({
    chats: get().chats.map((chat) =>
      chat.id === chatId ? { ...chat, last_message: message } : chat
    ),
  });
},

  clearUserResults: () => set({ userResults: [] }),
}));
