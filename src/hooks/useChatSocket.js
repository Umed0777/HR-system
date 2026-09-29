import { useEffect } from "react";
import { message as toast } from "antd";
import { createChatSocket } from "../services/chat.socket";
import { useMessagesStore } from "../store/useMessage";
import { useChatStore } from "../store/useChat";

export function useChatSocket() {
  useEffect(() => {
    const chat = () => useChatStore.getState();
    const msgs = () => useMessagesStore.getState();

    chat().loadMe();

    const socket = createChatSocket({
      // при каждом подключении: пока сокета не было, события не сохранялись
      onReconnect: () => {
        chat().fetchChats();
        const { activeChatId } = chat();
        if (activeChatId) msgs().fetchMessages(activeChatId, { silent: true });
      },

      new_message: (msg) => {
        msgs().addMessage(msg);
        chat().handleIncomingMessage(msg);
      },
      message_updated: (msg) => {
        msgs().applyUpdated(msg);
        const c = chat().chats.find((x) => x.id === msg.chat_id);
        if (c?.last_message?.id === msg.id) {
          chat().updateChatLastMessage(msg.chat_id, msg);
        }
      },
      message_deleted: (p) => {
        msgs().applyDeleted(p);
        const c = chat().chats.find((x) => x.id === p.chat_id);
        // удалили последнее сообщение: превью в списке нужно обновить
        if (c?.last_message?.id === p.message_id) chat().fetchChats();
      },
      reaction_updated: (p) => msgs().applyReaction(p),

      online_users: (p) => chat().setOnlineUsers(p.users),
      user_typing: (p) => chat().setTyping(p),
      read_receipt: (p) => chat().handleReadReceipt(p),

      error: (err) => {
        toast.error(err.message);
        useMessagesStore.setState({ sending: false });
      },
    });

    return () => socket.close();
  }, []);
}