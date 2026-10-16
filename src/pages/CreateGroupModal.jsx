import { useEffect, useMemo, useState } from "react";
import { Modal, Input, Avatar, Spin } from "antd";
import { SearchOutlined, CheckOutlined } from "@ant-design/icons";
import { useChatStore } from "../store/useChat";
import { useDebounce } from "../hooks/useDebounce";
import { createChat } from "../services/api.service.chat";
import { avatarSrc } from "../services/chat.config";
import { getDisplayName } from "../utils/chat.utils";

const ACCENT = "#ff4b2b";
const MIN_MEMBERS = 2;

export default function CreateGroupModal({
  open,
  onClose,
  onCreated,
  currentUsername,
}) {
  const {
    userResults,
    userSearchLoading,
    searchUsersByQuery,
    clearUserResults,
  } = useChatStore();

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (debouncedSearch.trim()) searchUsersByQuery(debouncedSearch);
    else clearUserResults();
  }, [debouncedSearch]);

  const filteredResults = useMemo(
    () => userResults.filter((u) => u.username !== currentUsername),
    [userResults, currentUsername],
  );

  const toggleUser = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length < MIN_MEMBERS) return;
    setSubmitting(true);
    try {
      const newChat = await createChat({
        type: "group",
        name: name.trim(),
        member_ids: selected.map((u) => u.id),
      });
      onCreated?.(newChat);
      handleClose();
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSearch("");
    setSelected([]);
    clearUserResults();
    onClose();
  };

  const canSubmit = name.trim() && selected.length >= MIN_MEMBERS;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={handleClose}
      footer={null}
      closable={false}
      className="rounded-2xl"
    >
      <div className="pb-1">
        <h2 className="text-lg font-semibold text-gray-900">Новая группа</h2>
        <p className="mt-0.5 text-sm text-gray-400">
          Придумайте название и добавьте участников
        </p>
      </div>

      <Input
        placeholder="Название группы"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-4 rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5"
      />

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <div
              key={u.id}
              style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
              className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-sm"
            >
              <Avatar size={20} src={avatarSrc(u.avatar_url)}>
                {!u.avatar_url && getDisplayName(u)?.[0]?.toUpperCase()}
              </Avatar>
              <span>{getDisplayName(u)}</span>
              <button
                onClick={() => toggleUser(u)}
                style={{ color: ACCENT }}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {selected.length > 0 && selected.length < MIN_MEMBERS && (
        <p className="mt-1.5 text-xs text-gray-400">
          Нужно ещё {MIN_MEMBERS - selected.length}{" "}
          {MIN_MEMBERS - selected.length === 1 ? "участника" : "участников"}{" "}
          (минимум {MIN_MEMBERS})
        </p>
      )}

      <Input
        prefix={<SearchOutlined className="text-gray-400" />}
        placeholder="Найти сотрудника..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-3 rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5"
        allowClear
      />

      <div className="mt-2 max-h-60 min-h-[40px] overflow-y-auto">
        {userSearchLoading && (
          <div className="flex justify-center py-4">
            <Spin size="small" />
          </div>
        )}

        {!userSearchLoading &&
          search.trim() &&
          filteredResults.length === 0 && (
            <p className="px-1 py-3 text-center text-sm text-gray-400">
              Никого не найдено
            </p>
          )}

        {!userSearchLoading &&
          filteredResults.map((user) => {
            const isSelected = selected.some((u) => u.id === user.id);
            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user)}
                style={
                  isSelected ? { backgroundColor: `${ACCENT}0d` } : undefined
                }
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="relative shrink-0 ">
                  <Avatar size={38} src={avatarSrc(user.avatar_url)}>
                    {!user.avatar_url &&
                      getDisplayName(user)?.slice(0, 1)?.toUpperCase()}
                  </Avatar>
                  {user.is_online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1 ">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {getDisplayName(user)}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    @{user.username}
                  </p>
                </div>

                <div
                  style={
                    isSelected
                      ? {
                          borderColor: ACCENT,
                          backgroundColor: ACCENT,
                          color: "#fff",
                        }
                      : undefined
                  }
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "" : "border-gray-200"
                  }`}
                >
                  {isSelected && <CheckOutlined className="text-[10px]" />}
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={handleClose}
          className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          onClick={handleCreate}
          disabled={!canSubmit || submitting}
          style={{ backgroundColor: ACCENT }}
          className="flex-1 rounded-full py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? <Spin size="small" /> : "Создать"}
        </button>
      </div>
    </Modal>
  );
}
