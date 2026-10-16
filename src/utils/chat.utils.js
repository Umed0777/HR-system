export function formatChatTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

// «Имя Фамилия», если есть, иначе логин
export function getDisplayName(user) {
  if (!user) return "";
  const full =
    user.full_name?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return full || user.username || "";
}

// для личного чата — имя собеседника, для группы — название
export function getChatTitle(chat, currentUsername) {
  const peer = getPeer(chat, currentUsername);
  return peer ? getDisplayName(peer) || chat.name : chat.name;
}

export function getPeer(chat, currentUsername) {
  if (chat.type !== "direct") return null;
  return chat.members?.find((m) => m.user?.username !== currentUsername)?.user;
}

export function filterChatsByName(chats, search, currentUsername) {
  const q = search.toLowerCase();
  return chats.filter((chat) =>
    [getChatTitle(chat, currentUsername), chat.name].some((s) =>
      s?.toLowerCase().includes(q),
    ),
  );
}

export function getExistingPeerUsernames(chats, currentUsername) {
  return new Set(
    chats
      .map((chat) => getPeer(chat, currentUsername)?.username)
      .filter(Boolean)
  );
}

export function filterNewUsers(userResults, existingUsernames) {
  return userResults.filter((u) => !existingUsernames.has(u.username));
}

export function formatMessageTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}


export function getMessagePreview(message) {
  if (!message) return "Нет сообщений";
  if (message.is_deleted) return "Сообщение удалено";
  if (message.content) return message.content;
  return "📎 Вложение";
}
export const getSender = (msg, chat) => {
  const id = msg.sender_id ?? msg.sender?.id ?? msg.user_id;
  const member = chat?.members?.find(
    (m) => (m.user_id ?? m.user?.id) === id,
  )?.user;
  const s = msg.sender ?? member;

  return {
    key: id ?? s?.username ?? msg.sender_username,
    username: s?.username ?? msg.sender_username,
    avatar_url: s?.avatar_url,
  };
};