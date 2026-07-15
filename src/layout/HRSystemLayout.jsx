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

  const location = useLocation();

  const navigate = useNavigate();

  // Проверка авторизации

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Выход

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("roles");

    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // ============================
  // Получаем роли пользователя
  // ============================

  const roles = JSON.parse(localStorage.getItem("roles") || "[]");

  console.log("USER ROLES:", roles);

  const menuItems = [];

  // =====================================
  // ADMIN + SUPERADMIN
  // =====================================

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

  // =====================================
  // BASIC только свои страницы
  // =====================================

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

  console.log("MENU:", menuItems);

  return (
    <Layout
      style={{
        minHeight: "100vh",

        background:
          "linear-gradient(135deg,#4b0000 0%,#8b0000 35%,#c1121f 70%,#ff4d4f 100%)",
      }}
    >
      <Sider
        collapsed={collapsed}
        trigger={null}
        width={270}
        style={{
          margin: 15,

          borderRadius: 20,

          overflow: "hidden",

          background: "rgba(255,255,255,.08)",

          backdropFilter: "blur(20px)",

          border: "1px solid rgba(255,255,255,.15)",

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
            alt="logo"
            style={{
              width: 45,

              height: 45,

              borderRadius: "50%",
            }}
          />

          {!collapsed && (
            <Button
              type="text"
              icon={
                <MenuFoldOutlined
                  style={{
                    color: "#fff",
                  }}
                />
              }
              onClick={() => setCollapsed(true)}
            />
          )}
        </div>

        {collapsed && (
          <Button
            type="text"
            icon={
              <MenuUnfoldOutlined
                style={{
                  color: "#fff",
                  marginLeft: 15
                }}
              />
            }
            onClick={() => setCollapsed(false)}
            style={{
              margin: 15,
            }}
          />
        )}

        <Menu
          className="custom-sidebar-menu"
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: "transparent",

            borderRight: "none",
          }}
        />
      </Sider>

      <Layout
        style={{
          height: "100vh",

          overflow: "hidden",
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
          <h2
            style={{
              color: "#fff",
            }}
          >
            HR Management System
          </h2>

          <Button danger icon={<UserOutlined />} onClick={handleLogout}>
            Выйти
          </Button>
        </div>

        <Content
          style={{
            margin: "0 15px 15px",

            borderRadius: 25,

            padding: 25,

            background: "rgba(255,255,255,.10)",

            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
