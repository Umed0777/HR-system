import { useState } from "react";
import { Input, Dropdown, Popover } from "antd";
import {
  MoreOutlined,
  SmileOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import EmojiPicker from "emoji-picker-react";
import { formatMessageTime, getDisplayName } from "../utils/chat.utils";
import FileAttachment from "./FileAttachment";
import { QUICK_REACTIONS } from "../hooks/useMessageActions";

export default function MessageItem({ msg, currentUsername, actions }) {
  const {
    editingId,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    saveEditing,
    handleDelete,
    handleDownload,
    handleToggleReaction,
  } = actions;

  const [fullPickerOpen, setFullPickerOpen] = useState(false);

  const isMine = msg.sender?.username === currentUsername;
  const isFileMessage = Boolean(msg.file);
  const isEditing = editingId === msg.id;

  const menuItems = [];

  if (msg.file) {
    menuItems.push({
      key: "download",
      icon: <DownloadOutlined />,
      label: "Скачать",
      onClick: () => handleDownload(msg.file),
    });
  }

  if (isMine) {
    if (!msg.file) {
      menuItems.push({
        key: "edit",
        icon: <EditOutlined />,
        label: "Редактировать",
        onClick: () => startEditing(msg),
      });
    }
    menuItems.push({
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Удалить",
      danger: true,
      onClick: () => handleDelete(msg.id),
    });
  }

  const handleFullPickerEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const already = msg.reactions?.some(
      (item) =>
        item.reaction === emoji && item.user?.username === currentUsername,
    );
    handleToggleReaction(msg.id, emoji, already);
    setFullPickerOpen(false);
  };

  const reactionPopoverContent = (
    <div className="flex items-center gap-1">
      {QUICK_REACTIONS.map((r) => {
        const already = msg.reactions?.some(
          (item) =>
            item.reaction === r && item.user?.username === currentUsername,
        );
        return (
          <button
            key={r}
            onClick={() => handleToggleReaction(msg.id, r, already)}
            className={`rounded-full p-1 text-lg hover:bg-gray-100 ${
              already ? "bg-gray-100" : ""
            }`}
          >
            {r}
          </button>
        );
      })}

      <Popover
        content={
          <div className="w-[280px]">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-medium text-gray-500">
                Выберите эмодзи
              </span>
              <button
                onClick={() => setFullPickerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseOutlined />
              </button>
            </div>
            <EmojiPicker
              onEmojiClick={handleFullPickerEmojiClick}
              width={280}
              height={350}
              autoFocusSearch={false}
            />
          </div>
        }
        trigger="click"
        open={fullPickerOpen}
        onOpenChange={setFullPickerOpen}
        placement="top"
        getPopupContainer={(triggerNode) => triggerNode.parentNode}
      >
        <button className="rounded-full p-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          +
        </button>
      </Popover>
    </div>
  );

  const reactionCounts =
    msg.reactions?.length > 0
      ? Object.entries(
          msg.reactions.reduce((acc, item) => {
            acc[item.reaction] = (acc[item.reaction] || 0) + 1;
            return acc;
          }, {}),
        )
      : [];

  return (
    <div
      className={`mb-4 flex items-start gap-2 ${isMine ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`group relative max-w-[75%] rounded-xl px-4 py-2.5 md:max-w-[65%] ${
          isMine ? "bg-indigo-50" : "bg-gray-50"
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <p
            className={`text-sm font-semibold ${isMine ? "text-indigo-600" : "text-indigo-500"}`}
          >
            {isMine ? "Вы" : getDisplayName(msg.sender)}
          </p>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Popover
              content={reactionPopoverContent}
              trigger="click"
              placement="top"
            >
              <button className="text-gray-400 hover:text-gray-600">
                <SmileOutlined />
              </button>
            </Popover>

            {menuItems.length > 0 && (
              <Dropdown
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreOutlined />
                </button>
              </Dropdown>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              size="small"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onPressEnter={() => saveEditing(msg.id)}
              autoFocus
            />
            <button
              onClick={() => saveEditing(msg.id)}
              className="text-green-600 hover:text-green-700"
            >
              <CheckOutlined />
            </button>
            <button
              onClick={cancelEditing}
              className="text-gray-400 hover:text-gray-600"
            >
              <CloseOutlined />
            </button>
          </div>
        ) : isFileMessage ? (
          <FileAttachment file={msg.file} />
        ) : (
          <p className="text-sm text-gray-700">
            {msg.content}
            {msg.is_edited && (
              <span className="ml-1 text-[10px] text-gray-400">(ред.)</span>
            )}
          </p>
        )}

        {reactionCounts.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {reactionCounts.map(([emoji, count]) => (
              <span
                key={emoji}
                className="rounded-full bg-white px-1.5 py-0.5 text-xs shadow-sm"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}

        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
          <ClockCircleOutlined />
          {formatMessageTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}
