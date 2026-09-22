import { create } from "zustand";
import {
  addReactionApi,
  deleteMessageApi,
  getMessages,
  removeReactionApi,
  sendFile,
  sendMessage,
  updateMessage,
} from "../services/api.ervice.message";
import { useChatStore } from "./useChat";

export const useMessagesStore = create((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  sending: false,

  fetchMessages: async (chatId, options = {}) => {
    const { silent = false } = options;
    if (!silent) set({ loading: true, error: null });

    try {
      const response = await getMessages(chatId);
      const data = Array.isArray(response) ? response : (response?.data ?? []);

      const current = get().messages;
      if (data.length !== current.length) {
        set({ messages: data });
      }
      if (!silent) set({ loading: false });
    } catch (err) {
      if (!silent) set({ error: err.message, loading: false });
      else console.log("Ошибка поллинга сообщений:", err);
    }
  },

  sendNewMessage: async (chatId, text) => {
    set({ sending: true });
    try {
      const res = await sendMessage(chatId, text); // твой API-вызов
      const newMessage = res?.data ?? res;

      set({ messages: [...get().messages, newMessage], sending: false });

      // 👇 вот этого не хватает
      useChatStore.getState().updateChatLastMessage(chatId, newMessage);
    } catch (err) {
      set({ sending: false });
      throw err;
    }
  },
  sendNewMessage: async (chatId, text) => {
    set({ sending: true });
    try {
      const res = await sendMessage(chatId, text); // твой API-вызов
      const newMessage = res?.data ?? res;

      set({ messages: [...get().messages, newMessage], sending: false });

      useChatStore.getState().updateChatLastMessage(chatId, newMessage);
    } catch (err) {
      set({ sending: false });
      throw err;
    }
  },
  sendFileMessage: async (chatId, file) => {
    set({ sending: true });
    try {
      const response = await sendFile(chatId, file);
      const message = response?.data ?? response;
      set((state) => ({
        messages: [...state.messages, message],
        sending: false,
      }));
      return message;
    } catch (err) {
      set({ sending: false });
      throw err;
    }
  },
  editMessage: async (messageId, content) => {
    try {
      const response = await updateMessage(messageId, content);
      const updated = response?.data ?? response;
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, ...updated } : m,
        ),
      }));
      return updated;
    } catch (err) {
      throw err;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await deleteMessageApi(messageId);
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    } catch (err) {
      throw err;
    }
  },

  toggleReaction: async (messageId, reaction, alreadyReacted) => {
    const prevMessages = get().messages;

    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;

        if (alreadyReacted) {
          return {
            ...m,
            reactions: (m.reactions || []).filter(
              (r) => !(r.reaction === reaction && r.user_id === m.sender_id),
            ),
          };
        }

        return {
          ...m,
          reactions: [
            ...(m.reactions || []),
            {
              id: `temp-${Date.now()}`,
              message_id: messageId,
              reaction,
              user_id: get().currentUserId,
              user: { username: get().currentUsername },
              created_at: new Date().toISOString(),
            },
          ],
        };
      }),
    }));

    try {
      if (alreadyReacted) {
        await removeReactionApi(messageId, reaction);
      } else {
        await addReactionApi(messageId, reaction);
      }
    } catch (err) {
      console.error(err);
      // откатываем изменения при ошибке
      set({ messages: prevMessages });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
