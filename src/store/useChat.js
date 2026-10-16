import { create } from "zustand";
import { getLogin } from "../services/chat.config";
import {
  getChats,
  getChatById,
  createChat,
  deleteChat,
  markChatAsRead,
  searchUsers,
  getMe,
  updateMe,
} from "../services/api.service.chat";

const normalize = (c) => ({ ...c, unread_count: c.unread_count ?? 0 });

// таймеры автосброса «печатает…»
const typingTimers = new Map();

export const useChatStore = create((set, get) => ({
  me: null, 
  chats: [],
  currentChat: null,
  activeChatId: null,
  chatType: "direct",
  loading: false,
  error: null,

  onlineUserIds: [], // из события online_users
  typingByChat: {}, // { [chatId]: [userId, ...] }

  userResults: [],
  userSearchLoading: false,
  userSearchError: null,

  loadMe: async () => {
    try {
      const res = await getMe();
      let me = res?.data ?? res;
      set({ me });

      // имя/фамилию отправляем только если их ещё нет на сервере
      if (me && (!me.first_name || !me.last_name)) {
        const user = JSON.parse(localStorage.getItem("user")) ?? {};
        const first_name = (user.firstName ?? "").trim();
        const last_name = (user.lastName ?? "").trim();
        if (first_name || last_name) {
          const upd = await updateMe({ first_name, last_name });
          me = upd?.data ?? { ...me, first_name, last_name };
          set({ me });
        }
      }
    } catch (err) {
      console.log(err);
    }
  },

  setOnlineUsers: (users) =>
    set({ onlineUserIds: (users ?? []).map((u) => u.user_id) }),

  setTyping: ({ chat_id, user_id, is_typing }) => {
    const key = `${chat_id}:${user_id}`;
    clearTimeout(typingTimers.get(key));
    typingTimers.delete(key);

    set((s) => {
      const cur = s.typingByChat[chat_id] ?? [];
      const next = is_typing
        ? cur.includes(user_id)
          ? cur
          : [...cur, user_id]
        : cur.filter((id) => id !== user_id);
      return { typingByChat: { ...s.typingByChat, [chat_id]: next } };
    });

    // если is_typing:false так и не пришло (закрыл вкладку), сбрасываем сами
    if (is_typing) {
      typingTimers.set(
        key,
        setTimeout(
          () => get().setTyping({ chat_id, user_id, is_typing: false }),
          6000,
        ),
      );
    }
  },

  // прочитали с другой вкладки/устройства: обнуляем счётчик
  handleReadReceipt: ({ chat_id, user_id }) => {
    if (user_id !== get().me?.id) return;
    set({
      chats: get().chats.map((c) =>
        c.id === chat_id ? { ...c, unread_count: 0 } : c,
      ),
    });
  },

  fetchChats: async (type) => {
    const t = type ?? get().chatType;
    set({ chatType: t });
    try {
      const res = await getChats(t);
      const raw = res?.data ?? res;
      const list = Array.isArray(raw) ? raw : [];
      set({ chats: list.map(normalize) });
    } catch (err) {
      console.log(err);
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
    set({ currentChat: chat, activeChatId: chat?.id ?? null });

    if (!chat?.id) return;

    try {
      const res = await getChatById(chat.id);
      const fullChat = res?.data ?? res;
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

  updateChatName: (id, name) => {
    set({
      chats: get().chats.map((chat) =>
        chat.id === id ? { ...chat, name } : chat,
      ),
      currentChat:
        get().currentChat?.id === id
          ? { ...get().currentChat, name }
          : get().currentChat,
    });
  },

  // lastMessageId: id последнего сообщения, которое пользователь увидел
  markAsRead: async (id, lastMessageId) => {
    if (!lastMessageId) return;
    try {
      await markChatAsRead(id, lastMessageId);
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

  // входящее сообщение из сокета: обновляет список чатов
  handleIncomingMessage: (msg) => {
    const { chats, activeChatId, me } = get();

    // человек отправил сообщение, значит, печатать перестал
    get().setTyping({
      chat_id: msg.chat_id,
      user_id: msg.sender_id,
      is_typing: false,
    });

    // чата нет в текущем списке (новый чат или другая вкладка): перезапросим
    if (!chats.some((c) => c.id === msg.chat_id)) {
      get().fetchChats();
      return;
    }

    const isMine = me
      ? msg.sender_id === me.id
      : [msg.sender?.username, msg.sender?.email].includes(getLogin());
    const isOpen = activeChatId === msg.chat_id && !document.hidden;

    const updated = chats.map((c) =>
      c.id === msg.chat_id
        ? {
            ...c,
            last_message: msg,
            updated_at: msg.created_at,
            unread_count:
              isMine || isOpen ? (c.unread_count ?? 0) : (c.unread_count ?? 0) + 1,
          }
        : c,
    );

    // поднимаем этот чат наверх списка
    const target = updated.find((c) => c.id === msg.chat_id);
    set({ chats: [target, ...updated.filter((c) => c.id !== msg.chat_id)] });

    // чат открыт и сообщение чужое: сразу отмечаем прочитанным
    if (isOpen && !isMine) {
      get().markAsRead(msg.chat_id, msg.id).catch(console.log);
    }
  },

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
        chat.id === chatId ? { ...chat, last_message: message } : chat,
      ),
    });
  },

  clearUserResults: () => set({ userResults: [] }),
}));