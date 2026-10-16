import { useEffect, useRef, useState } from "react";
import { Avatar, App, Spin } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { useChatStore } from "../store/useChat";
import { avatarSrc } from "../services/chat.config";
import { getDisplayName } from "../utils/chat.utils";
import { uploadAvatar } from "../services/api.ervice.message";

const MAX_SIZE_MB = 5;

export default function UserHeader({ currentUsername }) {
  const { message } = App.useApp();
  const me = useChatStore((s) => s.me);
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const name = getDisplayName(me) || currentUsername;
  const isOnline = me ? onlineUserIds.includes(me.id) : false;

  useEffect(() => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [me?.avatar_url]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Выберите изображение");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      message.error(`Файл больше ${MAX_SIZE_MB} МБ`);
      return;
    }

    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      const newUrl = res?.avatar_url ?? res?.user?.avatar_url;

      // 1) мгновенно показываем загруженную картинку
      setPreview(URL.createObjectURL(file));

      // 2) обновляем стор, если бэк вернул URL
      if (newUrl) {
        useChatStore.setState((s) => ({
          me: { ...s.me, avatar_url: newUrl },
        }));
      }

      message.success("Аватар обновлён");
    } catch (err) {
      console.error(err);
      message.error("Не удалось загрузить аватар");
    } finally {
      setUploading(false);
    }
  };

  const src = preview ?? avatarSrc(me?.avatar_url);

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="flex items-center justify-end gap-1 text-xs text-gray-400">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          {isOnline ? "Онлайн" : "Не в сети"}
        </p>
      </div>

      <div className="relative shrink-0">
        <Avatar size={44} src={src}>
          {name?.slice(0, 1)?.toUpperCase() ?? "?"}
        </Avatar>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
            <Spin size="small" />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Сменить аватар"
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#ff4b2b] text-[10px] text-white hover:opacity-90 disabled:opacity-50"
        >
          <CameraOutlined />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}