import { App } from "antd";
import { useChatStore } from "../store/useChat";
import { updateChat } from "../services/api.service.chat";

export function useChatActions({ chat }) {
  const { message: messageApi, modal } = App.useApp();
  const removeChat = useChatStore((s) => s.removeChat);
  const fetchChats = useChatStore((s) => s.fetchChats);

  const rename = async (newName) => {
    try {
      await updateChat(chat.id, { name: newName });
      await fetchChats();
    } catch (err) {
      console.error(err);
      messageApi.error("Не удалось переименовать группу");
      throw err;
    }
  };

  const remove = () => {
    modal.confirm({
      title: chat.type === "group" ? "Удалить группу?" : "Удалить чат?",
      content: "Это действие нельзя отменить.",
      okText: "Удалить",
      okButtonProps: { danger: true },
      cancelText: "Отмена",
      onOk: async () => {
        try {
          await removeChat(chat.id);
        } catch (err) {
          console.error(err);
          messageApi.error("Не удалось удалить чат");
        }
      },
    });
  };

  return { rename, remove };
}