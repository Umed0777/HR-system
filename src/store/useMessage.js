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
import { sendSocket } from "../services/chat.socket";
import { useChatStore } from "./useChat";

export const useMessagesStore = create((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  sending: false,

  // сообщение из сокета или REST: только если это открытый чат и такого id ещё нет
  addMessage: (msg) => {
    if (msg.chat_id !== useChatStore.getState().activeChatId) return;
    set((state) =>
      state.messages.some((m) => m.id === msg.id)
        ? state
        : { messages: [...state.messages, msg] },
    );
  },

  applyUpdated: (msg) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === msg.id ? { ...m, ...msg } : m,
      ),
    })),

  applyDeleted: ({ message_id }) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== message_id),
    })),

  // у пользователя одна реакция на сообщение: старую убираем всегда
  applyReaction: ({ message_id, user_id, reaction, action }) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== message_id) return m;
        const rest = (m.reactions || []).filter((r) => r.user_id !== user_id);
        return {
          ...m,
          reactions:
            action === "added"
              ? [
                  ...rest,
                  { id: `ws-${message_id}-${user_id}`, message_id, user_id, reaction },
                ]
              : rest,
        };
      }),
    })),

  fetchMessages: async (chatId, options = {}) => {
    const { silent = false } = options;
    if (!silent) set({ loading: true, error: null });

    try {
      const response = await getMessages(chatId);
      const data = Array.isArray(response) ? response : (response?.data ?? []);

      // пользователь уже мог перейти в другой чат: тогда ответ устарел
      if (useChatStore.getState().activeChatId === chatId) {
        set({ messages: data });
      }
      if (!silent) set({ loading: false });
    } catch (err) {
      if (!silent) set({ error: err.message, loading: false });
      else console.log("Ошибка загрузки сообщений:", err);
    }
  },

  sendNewMessage: async (chatId, text) => {
    // основной путь: через сокет, сообщение появится по событию new_message
    if (sendSocket("send_message", { chat_id: chatId, content: text })) return;

    // запасной путь: сокет закрыт (идёт переподключение), шлём по REST
    set({ sending: true });
    try {
      const res = await sendMessage(chatId, text);
      const newMessage = res?.data ?? res;

      get().addMessage(newMessage);
      set({ sending: false });

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
      get().addMessage(message);
      set({ sending: false });
      return message;
    } catch (err) {
      set({ sending: false });
      throw err;
    }
  },

  editMessage: async (messageId, content) => {
    const response = await updateMessage(messageId, content);
    const updated = response?.data ?? response;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, ...updated } : m,
      ),
    }));
    return updated;
  },

  deleteMessage: async (messageId) => {
    await deleteMessageApi(messageId);
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  toggleReaction: async (messageId, reaction, alreadyReacted) => {
    const prevMessages = get().messages;
    const me = useChatStore.getState().me;

    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;
        const rest = (m.reactions || []).filter((r) => r.user_id !== me?.id);
        return {
          ...m,
          reactions: alreadyReacted
            ? rest
            : [
                ...rest,
                {
                  id: `temp-${Date.now()}`,
                  message_id: messageId,
                  reaction,
                  user_id: me?.id,
                  user: { username: me?.username },
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
      set({ messages: prevMessages });
    }
  },

  clearMessages: () => set({ messages: [] }),
}));