import { useEffect } from "react";
import { useMessagesStore } from "../store/useMessage";

const POLL_INTERVAL = 3000;

export function useMessagesSync(chatId) {
  const fetchMessages = useMessagesStore((s) => s.fetchMessages);

  useEffect(() => {
    if (!chatId) return;

    const interval = setInterval(() => {
      fetchMessages(chatId, { silent: true }); 
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [chatId, fetchMessages]);
}