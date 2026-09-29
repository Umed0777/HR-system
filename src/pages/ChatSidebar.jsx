import { useEffect, useMemo, useState } from "react";
import { Avatar, Badge, Input, Segmented, Spin, Button } from "antd";
import { SearchOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { useChatStore } from "../store/useChat";
import { useDebounce } from "../hooks/useDebounce";
import { createChat } from "../services/api.service.chat";
import { avatarSrc, getLogin } from "../services/chat.config";
import {
  formatChatTime,
  getPeer,
  filterChatsByName,
  getExistingPeerUsernames,
  filterNewUsers,
  getMessagePreview,
} from "../utils/chat.utils";
import UserHeader from "./UserHeader";
import CreateGroupModal from "./CreateGroupModal";

export default function ChatSidebar({
  currentUsername = getLogin(),
  selectedChatId,
  onSelectChat,
}) {
  const {
    chats,
    loading,
    error,
    chatType,
    onlineUserIds,
    fetchChats,
    selectChat,
    markAsRead,
    userResults,
    userSearchLoading,
    searchUsersByQuery,
    clearUserResults,
  } = useChatStore();

  const [search, setSearch] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    fetchChats(chatType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredChats = useMemo(
    () => filterChatsByName(chats, search),
    [chats, search],
  );

  const existingPeerUsernames = useMemo(
    () => getExistingPeerUsernames(chats, currentUsername),
    [chats, currentUsername],
  );

  useEffect(() => {
    if (debouncedSearch.trim()) {
      searchUsersByQuery(debouncedSearch);
    } else {
      clearUserResults();
    }
  }, [debouncedSearch, searchUsersByQuery, clearUserResults]);

  const newUserResults = useMemo(
    () => filterNewUsers(userResults, existingPeerUsernames),
    [userResults, existingPeerUsernames],
  );

  const handleSelect = (chat) => {
    selectChat(chat);
    if (chat.unread_count > 0) markAsRead(chat.id, chat.last_message?.id);
    onSelectChat?.(chat);
  };

  const handleSelectUser = async (user) => {
    try {
      const newChat = await createChat({
        type: "direct",
        member_ids: [user.id],
      });
      setSearch("");
      clearUserResults();
      await fetchChats();
      handleSelect(newChat);
    } catch (err) {
      console.log(err);
    }
  };

  const handleGroupCreated = async (newChat) => {
    await fetchChats();
    handleSelect(newChat);
  };

  const isSearching = search.trim().length > 0;

  return (
    <div className="w-full shrink-0 border-r border-gray-200 bg-white md:w-[350px] lg:w-[390px]">
      <div className="border-b border-gray-100 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Сообщения</h1>
            <p className="mt-1 text-sm text-gray-400">
              {chats.length} диалогов
            </p>
          </div>
          <UserHeader currentUsername={currentUsername} />
        </div>

        <div className="flex items-center gap-2">
          <Input
            size="large"
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Поиск чатов или сотрудников..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl"
            allowClear
          />
          <Button
            size="large"
            icon={<UsergroupAddOutlined />}
            onClick={() => setGroupModalOpen(true)}
          />
        </div>

        <div className="mt-5">
          <Segmented
            block
            className="mt-3"
            value={chatType}
            onChange={(val) => fetchChats(val)}
            options={[
              { label: "Личные", value: "direct" },
              { label: "Группы", value: "group" },
            ]}
          />
        </div>
      </div>

      <div className="h-[calc(100%-145px)] overflow-y-auto">
        {loading && (
          <div className="flex h-40 items-center justify-center text-gray-400">
            Загрузка...
          </div>
        )}

        {!loading && error && (
          <div className="flex h-40 items-center justify-center px-5 text-center text-sm text-red-500">
            Не удалось загрузить чаты: {error}
          </div>
        )}

        {!loading &&
          !error &&
          filteredChats.map((chat) => {
            const peer = getPeer(chat, currentUsername);
            const peerId = peer?.id ?? peer?.user_id;
            const isOnline = peerId != null && onlineUserIds.includes(peerId);
            const avatarUrl = peer?.avatar_url || chat.avatar_url;
            const preview = getMessagePreview(chat.last_message);

            return (
              <div
                key={chat.id}
                onClick={() => handleSelect(chat)}
                className={`flex cursor-pointer items-center gap-3 px-5 py-4 transition-all hover:bg-gray-50 ${
                  selectedChatId === chat.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar size={54} src={avatarSrc(avatarUrl)}>
                    {!avatarUrl && chat.name?.slice(0, 1)?.toUpperCase()}
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-gray-900">
                      {chat.name}
                    </h3>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatChatTime(
                        chat.last_message?.created_at || chat.updated_at,
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-gray-500">{preview}</p>
                    {chat.unread_count > 0 && (
                      <Badge count={chat.unread_count} size="small" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {isSearching && (
          <div className="border-t border-gray-100 mt-1 pt-2">
            <p className="px-5 pb-1 text-xs font-semibold uppercase text-gray-400">
              Сотрудники
            </p>

            {userSearchLoading && (
              <div className="flex justify-center py-3">
                <Spin size="small" />
              </div>
            )}

            {!userSearchLoading && newUserResults.length === 0 && (
              <p className="px-5 py-2 text-sm text-gray-400">
                Никого не найдено
              </p>
            )}

            {!userSearchLoading &&
              newUserResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-gray-50"
                >
                  <div className="relative shrink-0">
                    <Avatar size={44} src={avatarSrc(user.avatar_url)}>
                      {!user.avatar_url &&
                        user.username?.slice(0, 1)?.toUpperCase()}
                    </Avatar>
                    {onlineUserIds.includes(user.id) && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium text-gray-900">
                      {user.full_name || user.username}
                    </h4>
                    <p className="truncate text-xs text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {!loading && !error && !isSearching && filteredChats.length === 0 && (
          <div className="flex h-40 items-center justify-center text-gray-400">
            Ничего не найдено
          </div>
        )}
      </div>

      <CreateGroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onCreated={handleGroupCreated}
        currentUsername={currentUsername}
      />
    </div>
  );
}