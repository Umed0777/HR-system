import { Avatar } from "antd";

export default function UserHeader({ currentUsername, isOnline = true }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{currentUsername}</p>
        <p className="flex items-center justify-end gap-1 text-xs text-gray-400">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          {isOnline ? "Онлайн" : "Не в сети"}
        </p>
      </div>
      <Avatar size={44}>{currentUsername?.slice(0, 1)?.toUpperCase() ?? "?"}</Avatar>
    </div>
  );
}