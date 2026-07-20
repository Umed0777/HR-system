import { Button, Layout, Menu } from "antd";

import {
  ApartmentOutlined,
  CheckSquareOutlined,
  ClusterOutlined,
  FormOutlined,
  IdcardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import active from "../assets/active.png";

const { Sider, Content } = Layout;

export const HRSystemLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]); // <-- Добавляем состояние для openKeys

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, []);

  // Определяем, какие ключи должны быть открыты на основе текущего пути
  useEffect(() => {
    const keys = [];
    
    if (
      ["/department", "/position", "/subdepartment", "/employee"].includes(
        location.pathname,
      )
    ) {
      keys.push("administration");
    }

    if (location.pathname === "/announcement") {
      keys.push("announcement");
    }
    
    setOpenKeys(keys);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const roles = (() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  })();

  const menuItems = [];

  if (roles.includes("Admin") || roles.includes("SuperAdmin")) {
    menuItems.push(
      {
        key: "administration",
        icon: <DashboardOutlined />,
        label: "Администрирование",
        children: [
          {
            key: "/department",
            icon: <ApartmentOutlined />,
            label: "Управление",
          },
          {
            key: "/position",
            icon: <IdcardOutlined />,
            label: "Должность",
          },
          {
            key: "/subdepartment",
            icon: <ClusterOutlined />,
            label: "Отдел",
          },
          {
            key: "/employee",
            icon: <TeamOutlined />,
            label: "Сотрудники",
          },
        ],
      },
      {
        key: "announcement",
        icon: <FileTextOutlined />,
        label: "База знаний",
        children: [
          {
            key: "/announcement",
            icon: <ReadOutlined />,
            label: "Инструкции",
          },
        ],
      },
      {
        key: "/question",
        icon: <QuestionCircleOutlined />,
        label: "Вопросы",
      },
      {
        key: "/test",
        icon: <FormOutlined />,
        label: "Тесты",
      },
      {
        key: "/test-taking",
        icon: <CheckSquareOutlined />,
        label: "Сессии тестирования",
      },
    );
  }

  if (
    roles.includes("Basic") &&
    !roles.includes("Admin") &&
    !roles.includes("SuperAdmin")
  ) {
    menuItems.push(
      {
        key: "announcement",
        icon: <FileTextOutlined />,
        label: "База знаний",
        children: [
          {
            key: "/announcement",
            icon: <ReadOutlined />,
            label: "Инструкции",
          },
        ],
      },
      {
        key: "/question",
        icon: <QuestionCircleOutlined />,
        label: "Вопросы",
      },
      {
        key: "/test",
        icon: <FormOutlined />,
        label: "Тесты",
      },
      {
        key: "/test-taking",
        icon: <CheckSquareOutlined />,
        label: "Сессии тестирования",
      },
    );
  }

  // Обработчик изменения открытых ключей
  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#4b0000,#8b0000,#c1121f)",
      }}
    >
      <Sider
        collapsed={collapsed}
        trigger={null}
        width={270}
        style={{
          margin: 15,
          height: "calc(100vh - 30px)",
          borderRadius: 20,
          overflow: "hidden",
          background: "#8b0000",
          boxShadow: "0 20px 40px rgba(0,0,0,.35)",
        }}
      >
        <div
          style={{
            height: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "0 18px",
          }}
        >
          <img
            src={active}
            style={{
              width: 45,
              height: 45,
              borderRadius: "50%",
            }}
          />

          {!collapsed && (
            <Button
              type="text"
              icon={<MenuFoldOutlined style={{ color: "#fff" }} />}
              onClick={() => setCollapsed(true)}
            />
          )}
        </div>

        {collapsed && (
          <Button
            type="text"
            icon={<MenuUnfoldOutlined style={{ color: "#fff" }} />}
            onClick={() => setCollapsed(false)}
            style={{
              margin: 15,
            }}
          />
        )}

        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={[location.pathname]}
          openKeys={openKeys} // <-- Используем состояние openKeys
          onOpenChange={handleOpenChange} // <-- Добавляем обработчик
          onClick={({ key }) => {
            if (key.startsWith("/")) {
              navigate(key);
            }
          }}
          style={{
            background: "transparent",
            border: "none",
          }}
        />
      </Sider>

      <Layout
        style={{
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            height: 75,
            margin: 15,
            borderRadius: 20,
            background: "rgba(255,255,255,.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
          }}
        >
          <h2 style={{ color: "#fff" }}>HR Management System</h2>

          <Button danger icon={<UserOutlined />} onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        <Content
          style={{
            margin: "0 15px 15px",
            borderRadius: 25,
            padding: 25,
            background: "#fff",
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};