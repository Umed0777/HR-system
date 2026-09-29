import { useEffect, useRef, useState } from "react";
import { Avatar, Input, Spin, Button, Popover } from "antd";
import {
  SettingOutlined,
  SmileOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  SendOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useMessagesStore } from "../store/useMessage";
import { useChatStore } from "../store/useChat";
import { useChatSocket } from "../hooks/useChatSocket";
import { useMessageActions } from "../hooks/useMessageActions";
import { useChatActions } from "../hooks/useChatActions";
import { sendSocket } from "../services/chat.socket";
import { avatarSrc, getLogin } from "../services/chat.config";
import { formatChatTime, getPeer } from "../utils/chat.utils";
import MessageItem from "./MessageItem";
import ChatThreadMenu from "./ChatThreadMenu";
import RenameChatModal from "./RenameChatModal";
import ChatMembersModal from "./ChatMembersModal";
import EmojiPicker from "emoji-picker-react";

function groupMessagesByDate(messages) {
  const groups = [];
  let lastDateKey = null;

  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (dateKey !== lastDateKey) {
      groups.push({ dateLabel: formatChatTime(msg.created_at), items: [] });
      lastDateKey = dateKey;
    }
    groups[groups.length - 1].items.push(msg);
  });

  return groups;
}

export default function ChatThread({
  chat,
  currentUsername = getLogin(),
  onBack,
  visibleOnMobile = false,
}) {
  const {
    messages,
    loading,
    fetchMessages,
    sendNewMessage,
    sendFileMessage,
    clearMessages,
    sending,
  } = useMessagesStore();

  const me = useChatStore((s) => s.me);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const typingIds = useChatStore((s) => s.typingByChat[chat?.id]);

  const actions = useMessageActions(currentUsername);
  const chatActions = useChatActions({ chat });

  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const prevLastIdRef = useRef(null);
  const typingRef = useRef({ active: false, timer: null });

  useChatSocket();

  useEffect(() => {
    if (chat?.id) {
      clearMessages();
      fetchMessages(chat.id);
    }
  }, [chat?.id, fetchMessages, clearMessages]);

  useEffect(() => {
    const chatId = chat?.id;
    return () => {
      clearTimeout(typingRef.current.timer);
      if (typingRef.current.active && chatId) {
        sendSocket("typing", { chat_id: chatId, is_typing: false });
      }
      typingRef.current.active = false;
    };
  }, [chat?.id]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage?.id ?? null;

    if (lastId !== null && lastId !== prevLastIdRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevLastIdRef.current = lastId;
  }, [messages]);

  useEffect(() => {
    return () => {
      attachedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const isGroup = chat?.type === "group";

  const stopTyping = () => {
    clearTimeout(typingRef.current.timer);
    if (typingRef.current.active && chat?.id) {
      sendSocket("typing", { chat_id: chat.id, is_typing: false });
    }
    typingRef.current.active = false;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (!chat?.id) return;

    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (!typingRef.current.active) {
      sendSocket("typing", { chat_id: chat.id, is_typing: true });
      typingRef.current.active = true;
    }
    clearTimeout(typingRef.current.timer);
    typingRef.current.timer = setTimeout(stopTyping, 3000);
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || !chat?.id) return;

    stopTyping();

    const text = input;
    const filesToSend = attachedFiles;

    setInput("");
    setAttachedFiles([]);

    try {
      if (text.trim()) {
        await sendNewMessage(chat.id, text);
      }
      for (const item of filesToSend) {
        await sendFileMessage(chat.id, item.file);
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    } catch (err) {
      console.log(err);
      setInput(text);
      setAttachedFiles(filesToSend);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map((file) => ({
      file,
      previewUrl:
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : null,
    }));

    setAttachedFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleRemoveAttachment = (index) => {
    setAttachedFiles((prev) => {
      const item = prev[index];
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const wrapperVisibility = visibleOnMobile ? "flex" : "hidden md:flex";

  if (!chat) {
    return (
      <div
        className={`h-full min-h-0 min-w-0 flex-1 items-center justify-center text-gray-400 ${wrapperVisibility}`}
      >
        Выберите чат, чтобы начать переписку
      </div>
    );
  }

  const peer = getPeer(chat, currentUsername);
  const peerId = peer?.id ?? peer?.user_id;
  const isPeerOnline = peerId != null && onlineUserIds.includes(peerId);
  const headerName = peer?.username || chat.name;
  const headerAvatar = peer?.avatar_url || chat.avatar_url;
  const groupedMessages = groupMessagesByDate(messages);

  const typingNames = (typingIds ?? [])
    .filter((id) => id !== me?.id)
    .map(
      (id) =>
        chat.members?.find((m) => (m.user_id ?? m.user?.id) === id)?.user
          ?.username,
    )
    .filter(Boolean);
  const typingText =
    typingNames.length === 0
      ? ""
      : typingNames.length === 1
        ? `${typingNames[0]} печатает…`
        : `${typingNames.join(", ")} печатают…`;

  return (
    <div
      className={`h-full min-h-0 min-w-0 flex-1 flex-col bg-white ${wrapperVisibility}`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            className="md:hidden"
            onClick={onBack}
          />

          <div className="relative shrink-0">
            <Avatar size={40} src={avatarSrc(headerAvatar)}>
              {!headerAvatar && headerName?.slice(0, 1)?.toUpperCase()}
            </Avatar>
            {isPeerOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-gray-900">
              {headerName}
            </h3>
            {peer && (
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isPeerOnline ? "bg-green-500" : "bg-gray-300"}`}
                />
                {isPeerOnline ? "В сети" : "Не в сети"}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          

          {isGroup && (
            <button
              onClick={() => setMembersOpen(true)}
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 sm:flex"
            >
              <SettingOutlined />
            </button>
          )}

          <ChatThreadMenu
            isGroup={isGroup}
            onRename={() => setRenameOpen(true)}
            onDelete={chatActions.remove}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Spin />
          </div>
        )}

        {!loading &&
          groupedMessages.map((group, gi) => (
            <div key={gi}>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs text-gray-400">{group.dateLabel}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {group.items.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  currentUsername={currentUsername}
                  actions={actions}
                />
              ))}
            </div>
          ))}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 shrink-0 px-4 text-xs text-gray-400 md:px-6">
        {typingText}
      </div>

      {attachedFiles.length > 0 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-gray-100 px-3 pt-3 md:px-6">
          {attachedFiles.map((item, index) => {
            const isVideo = item.file.type.startsWith("video/");
            const isImage = item.file.type.startsWith("image/");

            return (
              <div
                key={index}
                className="relative shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-1"
              >
                {isImage ? (
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ) : isVideo ? (
                  <video
                    src={item.previewUrl}
                    className="h-16 w-16 rounded-md object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 text-gray-500">
                    <FileTextOutlined className="text-xl" />
                    <span className="max-w-[56px] truncate text-[10px]">
                      {item.file.name}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[10px] text-white hover:bg-gray-900"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`flex shrink-0 items-center gap-2 px-3 py-3 md:gap-3 md:px-6 md:py-4 ${
          attachedFiles.length > 0 ? "" : "border-t border-gray-100"
        }`}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onPressEnter={handleSend}
          placeholder="Введите сообщение..."
          disabled={sending}
          className="rounded-full border-gray-200 bg-gray-50 px-4 py-2"
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        <Popover
          content={
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={300}
              height={400}
              autoFocusSearch={false}
            />
          }
          trigger="click"
          open={emojiOpen}
          onOpenChange={setEmojiOpen}
          placement="topRight"
        >
          <button className="hidden text-lg text-gray-400 hover:text-gray-600 sm:block">
            <SmileOutlined />
          </button>
        </Popover>

        <button
          onClick={handleAttachClick}
          disabled={sending}
          className="hidden text-lg text-gray-400 hover:text-gray-600 sm:block disabled:opacity-50"
        >
          <PaperClipOutlined />
        </button>

        <button
          onClick={handleSend}
          disabled={sending || (!input.trim() && attachedFiles.length === 0)}
          className="flex items-center gap-2 rounded-full bg-[#ff4b2b] px-4 py-2 text-white disabled:opacity-50 md:px-5"
        >
          <span className="hidden sm:inline">Отправить</span> <SendOutlined />
        </button>
      </div>

      <RenameChatModal
        open={renameOpen}
        initialName={chat.name}
        onClose={() => setRenameOpen(false)}
        onSubmit={chatActions.rename}
      />

      <ChatMembersModal
        open={membersOpen}
        chatId={chat.id}
        currentUsername={currentUsername}
        onClose={() => setMembersOpen(false)}
      />
    </div>
  );
}