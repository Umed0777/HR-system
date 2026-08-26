import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Modal,
  Upload,
  message as antMessage,
} from "antd";
import {
  SearchOutlined,
  SendOutlined,
  PaperClipOutlined,
  SmileOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  CheckOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  CloseOutlined,
  FileOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { read } from "xlsx";

const initialChats = [
  {
    id: 1,
    name: "Ali Karimov",
    avatar: "https://i.pravatar.cc/150?img=12",
    online: true,
    lastMessage: "Привет! Как дела?",
    time: "09:24",
    unread: 2,
    messages: [
      {
        id: 1,
        text: "Привет! 👋",
        time: "09:20",
        sender: "other",
        read: true,
      },
      {
        id: 2,
        text: "Привет! Как дела?",
        time: "09:21",
        sender: "me",
        read: true,
      },
      {
        id: 3,
        text: "Всё хорошо, спасибо!",
        time: "09:22",
        sender: "other",
        read: true,
      },
      {
        id: 4,
        text: "Сегодня работаем над новым проектом?",
        time: "09:24",
        sender: "other",
        read: false,
      },
      {
        id: 5,
        text: "Не работаем",
        read: true
      }
    ],
  },
  {
    id: 2,
    name: "Rustam Saidov",
    avatar: "https://i.pravatar.cc/150?img=11",
    online: true,
    lastMessage: "Хорошо 👍",
    time: "08:45",
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Ты уже закончил дизайн?",
        time: "08:40",
        sender: "me",
        read: true,
      },
      {
        id: 2,
        text: "Да, почти закончил.",
        time: "08:42",
        sender: "other",
        read: true,
      },
      {
        id: 3,
        text: "Хорошо 👍",
        time: "08:45",
        sender: "other",
        read: true,
      },
    ],
  },
  {
    id: 3,
    name: "Madina",
    avatar: "https://i.pravatar.cc/150?img=47",
    online: false,
    lastMessage: "До завтра!",
    time: "Вчера",
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Отправила тебе документы.",
        time: "18:30",
        sender: "other",
        read: true,
      },
      {
        id: 2,
        text: "Получил, спасибо!",
        time: "18:35",
        sender: "me",
        read: true,
      },
      {
        id: 3,
        text: "До завтра!",
        time: "18:40",
        sender: "other",
        read: true,
      },
    ],
  },
  {
    id: 4,
    name: "Sadriddin",
    avatar: "https://i.pravatar.cc/150?img=68",
    online: true,
    lastMessage: "Отличная идея",
    time: "Вчера",
    unread: 5,
    messages: [
      {
        id: 1,
        text: "Есть идея по проекту.",
        time: "15:10",
        sender: "other",
        read: true,
      },
      {
        id: 2,
        text: "Рассказывай.",
        time: "15:11",
        sender: "me",
        read: true,
      },
      {
        id: 3,
        text: "Можно добавить онлайн-чат.",
        time: "15:13",
        sender: "other",
        read: true,
      },
      {
        id: 4,
        text: "Отличная идея",
        time: "15:15",
        sender: "other",
        read: true,
      },
    ],
  },
  {
    id: 5,
    name: "Backend Team",
    avatar: "https://i.pravatar.cc/150?img=56",
    online: true,
    lastMessage: "API готов",
    time: "Пн",
    unread: 0,
    messages: [
      {
        id: 1,
        text: "Как там API?",
        time: "14:20",
        sender: "me",
        read: true,
      },
      {
        id: 2,
        text: "API готов 🚀",
        time: "14:25",
        sender: "other",
        read: true,
      },
    ],
  },
];

const Chat = () => {
  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [mobileChat, setMobileChat] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, search]);

  const selectChat = (id) => {
    setSelectedChatId(id);
    setMobileChat(true);

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? {
              ...chat,
              unread: 0,
              messages: chat.messages.map((msg) => ({
                ...msg,
                read: true,
              })),
            }
          : chat
      )
    );
  };

  const sendMessage = () => {
    const value = text.trim();

    if (!value) return;

    const newMessage = {
      id: Date.now(),
      text: value,
      time: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: "me",
      read: true,
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              lastMessage: value,
              time: "сейчас",
              messages: [...chat.messages, newMessage],
            }
          : chat
      )
    );

    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFile = ({ file }) => {
    if (file.status === "done" || file.originFileObj) {
      antMessage.success(`${file.name} выбран`);
    }
  };

  if (!selectedChat) return null;

  return (
    <div className="h-[calc(100vh-32px)] min-h-[600px] bg-[#f5f7fb] p-4 md:p-6">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

        {/* ================= SIDEBAR ================= */}
        <div
          className={`
            w-full shrink-0 border-r border-gray-200 bg-white
            md:w-[350px] lg:w-[390px]
            ${mobileChat ? "hidden md:block" : "block"}
          `}
        >
          {/* Sidebar Header */}
          <div className="border-b border-gray-100 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Сообщения
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  {chats.length} диалогов
                </p>
              </div>

              <Avatar
                size={44}
                src="https://i.pravatar.cc/150?img=33"
              />
            </div>

            {/* Search */}
            <Input
              size="large"
              prefix={
                <SearchOutlined className="text-gray-400" />
              }
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl"
              allowClear
            />
          </div>

          {/* Chat List */}
          <div className="h-[calc(100%-145px)] overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-gray-400">
                Ничего не найдено
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`
                    flex cursor-pointer items-center gap-3 px-5 py-4
                    transition-all hover:bg-gray-50
                    ${
                      selectedChatId === chat.id
                        ? "bg-blue-50"
                        : ""
                    }
                  `}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar
                      size={54}
                      src={chat.avatar}
                    />

                    {chat.online && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-gray-900">
                        {chat.name}
                      </h3>

                      <span className="shrink-0 text-xs text-gray-400">
                        {chat.time}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-gray-500">
                        {chat.lastMessage}
                      </p>

                      {chat.unread > 0 && (
                        <Badge
                          count={chat.unread}
                          size="small"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= CHAT ================= */}
        <div
          className={`
            flex min-w-0 flex-1 flex-col bg-[#f8fafc]
            ${mobileChat ? "flex" : "hidden md:flex"}
          `}
        >
          {/* Chat Header */}
          <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {/* Mobile Back */}
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                className="md:hidden"
                onClick={() => setMobileChat(false)}
              />

              <div className="relative">
                <Avatar
                  size={48}
                  src={selectedChat.avatar}
                />

                {selectedChat.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="truncate font-semibold text-gray-900">
                  {selectedChat.name}
                </h2>

                <p className="text-sm text-gray-400">
                  {selectedChat.online
                    ? "В сети"
                    : "Был(а) недавно"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                type="text"
                shape="circle"
                icon={<PhoneOutlined />}
                className="hidden sm:flex"
              />

              <Button
                type="text"
                shape="circle"
                icon={<VideoCameraOutlined />}
                className="hidden sm:flex"
              />

              <Button
                type="text"
                shape="circle"
                icon={<SearchOutlined />}
              />

              <Button
                type="text"
                shape="circle"
                icon={<MoreOutlined />}
              />
            </div>
          </div>

          {/* ================= MESSAGE AREA ================= */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto flex max-w-[900px] flex-col gap-3">

              {/* Date */}
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-white px-4 py-1.5 text-xs text-gray-400 shadow-sm">
                  Сегодня
                </span>
              </div>

              {selectedChat.messages.map((msg) => {
                const isMe = msg.sender === "me";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        group max-w-[75%] md:max-w-[60%]
                        ${
                          isMe
                            ? "items-end"
                            : "items-start"
                        }
                      `}
                    >
                      <div
                        className={`
                          rounded-2xl px-4 py-3 text-[15px] leading-6 shadow-sm
                          ${
                            isMe
                              ? "rounded-br-md bg-blue-600 text-white"
                              : "rounded-bl-md bg-white text-gray-800"
                          }
                        `}
                      >
                        {msg.text}
                      </div>

                      <div
                        className={`
                          mt-1 flex items-center gap-1 px-1 text-[11px] text-gray-400
                          ${
                            isMe
                              ? "justify-end"
                              : "justify-start"
                          }
                        `}
                      >
                        <span>{msg.time}</span>

                        {isMe && (
                          <>
                            {msg.read ? (
                              <span className="text-blue-500">
                                <CheckCircleFilled />
                              </span>
                            ) : (
                              <CheckOutlined />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing */}
              <div className="mt-2 flex items-center gap-2">
                <Avatar
                  size={28}
                  src={selectedChat.avatar}
                />

                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= INPUT ================= */}
          <div className="border-t border-gray-200 bg-white p-3 md:p-5">
            <div className="mx-auto flex max-w-[900px] items-end gap-2">

              {/* File */}
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleFile}
              >
                <Button
                  type="text"
                  shape="circle"
                  size="large"
                  icon={<PaperClipOutlined />}
                  className="text-gray-500"
                />
              </Upload>

              {/* Image */}
              <Button
                type="text"
                shape="circle"
                size="large"
                icon={<PictureOutlined />}
                className="hidden text-gray-500 sm:flex"
                onClick={() =>
                  setPreviewImage(
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200"
                  )
                }
              />

              {/* Input */}
              <div className="flex min-h-[46px] flex-1 items-end rounded-2xl bg-gray-100 px-3">
                <Input.TextArea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Написать сообщение..."
                  autoSize={{
                    minRows: 1,
                    maxRows: 5,
                  }}
                  variant="borderless"
                  className="!px-1 !py-3"
                />

                <Button
                  type="text"
                  shape="circle"
                  icon={<SmileOutlined />}
                  className="mb-1 hidden text-gray-500 sm:flex"
                />
              </div>

              {/* Send */}
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={<SendOutlined />}
                onClick={sendMessage}
                disabled={!text.trim()}
                className="!h-[46px] !w-[46px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= IMAGE MODAL ================= */}
      <Modal
        open={!!previewImage}
        footer={null}
        closable={false}
        centered
        width={900}
        onCancel={() => setPreviewImage(null)}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <div className="relative">
          <Button
            type="text"
            shape="circle"
            icon={<CloseOutlined />}
            onClick={() => setPreviewImage(null)}
            className="absolute right-3 top-3 z-10 bg-white/80"
          />

          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[80vh] w-full rounded-lg object-contain"
          />
        </div>
      </Modal>
    </div>
  );
};

export default Chat;