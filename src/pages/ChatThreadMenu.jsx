import { Dropdown } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

export default function ChatThreadMenu({ isGroup, onRename, onDelete }) {
  const items = [
    ...(isGroup ? [{ key: "rename", label: "Переименовать", icon: <EditOutlined /> }] : []),
    { type: "divider" },
    {
      key: "delete",
      label: <span style={{ color: "#ff4d4f" }}>Удалить чат</span>,
      icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
    },
  ];

  const handleClick = ({ key }) => {
    if (key === "rename") onRename();
    if (key === "delete") onDelete();
  };

  return (
    <Dropdown menu={{ items, onClick: handleClick }} trigger={["click"]} placement="bottomRight">
      <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  );
}