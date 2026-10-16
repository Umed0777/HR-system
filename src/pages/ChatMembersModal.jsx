// components/ChatMembersModal.jsx
import { useEffect, useMemo, useState } from "react";
import { Modal, Avatar, Spin, Dropdown, Input, App } from "antd";
import {
  DownOutlined,
  DeleteOutlined,
  SearchOutlined,
  CloseOutlined,
  CrownOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  getChatMembers,
  updateMemberRole,
  removeMember,
} from "../services/api.service.chat";
import AddMembersModal from "./AddMembersModal";
import { avatarSrc } from "../services/chat.config";
import { getDisplayName } from "../utils/chat.utils";

const ACCENT = "#ff4b2b";

const ROLE_LABELS = {
  owner: "Владелец",
  admin: "Админ",
  member: "Участник",
};

const ROLE_BADGE_STYLES = {
  owner: { backgroundColor: ACCENT, color: "#fff" },
  admin: { backgroundColor: "#eff6ff", color: "#2563eb" },
  member: { backgroundColor: "#f3f4f6", color: "#6b7280" },
};

export default function ChatMembersModal({
  open,
  chatId,
  currentUsername,
  onClose,
}) {
  const { message: messageApi, modal } = App.useApp();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [addMembersOpen, setAddMembersOpen] = useState(false);

  useEffect(() => {
    if (!open || !chatId) return;
    loadMembers();
  }, [open, chatId]);

  const loadMembers = () => {
    setLoading(true);
    getChatMembers(chatId)
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const currentMember = members.find(
    (m) => m.user?.username === currentUsername,
  );
  const isCurrentUserOwner = currentMember?.role === "owner";
  const isCurrentUserAdmin = currentMember?.role === "admin";
  const canAddMembers = isCurrentUserOwner || isCurrentUserAdmin;

  const existingUsernames = useMemo(
    () => members.map((m) => m.user?.username).filter(Boolean),
    [members],
  );

  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        [getDisplayName(m.user), m.user?.username].some((s) =>
          s?.toLowerCase().includes(search.trim().toLowerCase()),
        ),
      ),
    [members, search],
  );

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      await updateMemberRole(chatId, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)),
      );
    } catch (err) {
      console.error(err);
      messageApi.error("Не удалось изменить роль");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMember = (member) => {
    modal.confirm({
      title: `Удалить ${getDisplayName(member.user)} из группы?`,
      okText: "Удалить",
      okButtonProps: { danger: true },
      cancelText: "Отмена",
      onOk: async () => {
        setUpdatingUserId(member.user_id);
        try {
          await removeMember(chatId, member.user_id);
          setMembers((prev) =>
            prev.filter((m) => m.user_id !== member.user_id),
          );
        } catch (err) {
          console.error(err);
          messageApi.error("Не удалось удалить участника");
        } finally {
          setUpdatingUserId(null);
        }
      },
    });
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return (
    <>
      <Modal
        title={null}
        open={open}
        onCancel={handleClose}
        footer={null}
        closable={false}
        className="rounded-2xl"
      >
        <div className="flex items-start justify-between pb-1">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Участники</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              {members.length} человек
            </p>
          </div>
          <div className="flex items-center gap-1">
            {canAddMembers && (
              <button
                onClick={() => setAddMembersOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <UserAddOutlined />
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {members.length > 4 && (
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Найти участника..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3 rounded-xl border-gray-200 bg-gray-50 px-4 py-2"
            allowClear
          />
        )}

        <div className="mt-2 max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <Spin size="small" />
            </div>
          )}

          {!loading &&
            filteredMembers.map((member) => {
              const isOwnerRow = member.role === "owner";
              const isAdminRow = member.role === "admin";
              const isSelf = member.user?.username === currentUsername;

              const canManage = isCurrentUserOwner
                ? !isOwnerRow && !isSelf
                : isCurrentUserAdmin
                  ? !isOwnerRow && !isAdminRow && !isSelf
                  : false;

              const canChangeRole =
                isCurrentUserOwner && !isOwnerRow && !isSelf;
              const isUpdating = updatingUserId === member.user_id;

              const roleMenuItems = [
                { key: "member", label: "Участник" },
                { key: "admin", label: "Админ" },
              ];

              return (
                <div
                  key={member.user_id}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50"
                >
                  <div className="relative shrink-0">
                    <Avatar size={40} src={avatarSrc(member.user?.avatar_url)}>
                      {!member.user?.avatar_url &&
                        getDisplayName(member.user)?.slice(0, 1)?.toUpperCase()}
                    </Avatar>
                    {member.user?.is_online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {getDisplayName(member.user)}
                      </p>
                      {isOwnerRow && (
                        <CrownOutlined
                          style={{ color: ACCENT }}
                          className="text-xs"
                        />
                      )}
                      {isSelf && (
                        <span className="text-xs text-gray-400">(вы)</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {member.user?.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {isUpdating ? (
                      <Spin size="small" />
                    ) : (
                      <>
                        {canChangeRole ? (
                          <Dropdown
                            menu={{
                              items: roleMenuItems,
                              onClick: ({ key }) =>
                                handleRoleChange(member.user_id, key),
                              selectedKeys: [member.role],
                            }}
                            trigger={["click"]}
                          >
                            <button
                              style={ROLE_BADGE_STYLES[member.role]}
                              className="flex min-w-[92px] items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium hover:opacity-80"
                            >
                              {ROLE_LABELS[member.role]}
                              <DownOutlined className="text-[8px]" />
                            </button>
                          </Dropdown>
                        ) : (
                          <span
                            style={ROLE_BADGE_STYLES[member.role]}
                            className="flex min-w-[92px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium"
                          >
                            {ROLE_LABELS[member.role]}
                          </span>
                        )}
                        {canManage ? (
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          >
                            <DeleteOutlined className="text-xs" />
                          </button>
                        ) : (
                          <div className="h-7 w-7" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          {!loading && filteredMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              {search ? "Никого не найдено" : "Список пуст"}
            </p>
          )}
        </div>
      </Modal>

      <AddMembersModal
        open={addMembersOpen}
        chatId={chatId}
        existingUsernames={existingUsernames}
        onClose={() => setAddMembersOpen(false)}
        onAdded={loadMembers}
      />
    </>
  );
}
