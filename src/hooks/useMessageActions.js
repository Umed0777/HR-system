import { useState } from "react";
import { useMessagesStore } from "../store/useMessage";
import { downloadFile } from "../services/api.ervice.message";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export function useMessageActions() {
  const { editMessage, deleteMessage, toggleReaction } = useMessagesStore();

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startEditing = (msg) => {
    setEditingId(msg.id);
    setEditValue(msg.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEditing = async (messageId) => {
    if (!editValue.trim()) return;
    try {
      await editMessage(messageId, editValue.trim());
      cancelEditing();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDownload = async (file) => {
    try {
      const blob = await downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
    }
  };

  const handleToggleReaction = (messageId, emoji, already) => {
    toggleReaction(messageId, emoji, already);
  };

  return {
    editingId,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    saveEditing,
    handleDelete,
    handleDownload,
    handleToggleReaction,
  };
}