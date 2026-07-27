// layout/HRSystemLayout.jsx
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
  VideoCameraOutlined,
  FilePdfOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import active from "../assets/active.png";

const { Sider, Content } = Layout;

export const HRSystemLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Проверка авторизации
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setInitialized(true);
    }
  }, [navigate]);

  // Определяем openKeys на основе текущего пути
  useEffect(() => {
    if (!initialized) return;

    const path = location.pathname;
    const newOpenKeys = [];

    if (
      ["/department", "/position", "/subdepartment", "/employee"].includes(path)
    ) {
      newOpenKeys.push("administration");
    }

    if (["/announcement", "/video-lessons", "/documentation"].includes(path)) {
      newOpenKeys.push("announcement");
    }

    setOpenKeys(newOpenKeys);
  }, [location.pathname, initialized]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const roles = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  }, []);

  // Формируем пункты меню
  const menuItems = useMemo(() => {
    const items = [];

    if (roles.includes("Admin") || roles.includes("SuperAdmin")) {
      items.push(
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
              key: "/video-lessons",
              icon: <VideoCameraOutlined />,
              label: "ВидеоУрок",
            },
            {
              key: "/documentation",
              icon: <FilePdfOutlined />,
              label: "Документация",
            },
          ],
        },
        {
          key: "/test",
          icon: <FormOutlined />,
          label: "Тесты",
        },
        {
          key: "/surveys",
          icon: <BarsOutlined />,
          label: "Опросы",
        },
        {
          key: "/test-taking",
          icon: <CheckSquareOutlined />,
          label: "Результаты",
        },
      );
    }

    if (
      roles.includes("Basic") &&
      !roles.includes("Admin") &&
      !roles.includes("SuperAdmin")
    ) {
      items.push(
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
            {
              key: "/video-lessons",
              icon: <VideoCameraOutlined />,
              label: "ВидеоУрок",
            },
            {
              key: "/documentation",
              icon: <FilePdfOutlined />,
              label: "Документация",
            },
          ],
        },
        {
          key: "/test",
          icon: <FormOutlined />,
          label: "Тесты",
        },
        {
          key: "/surveys",
          icon: <BarsOutlined />,
          label: "Опросы",
        },
        {
          key: "/test-taking",
          icon: <CheckSquareOutlined />,
          label: "Результаты",
        },
      );
    }

    return items;
  }, [roles]);

  // Обработчик изменения открытых ключей
  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // Обработчик клика по пункту меню
  const handleMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      navigate(key);
    }
  };

  if (!initialized) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#4b0000" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <h2 style={{ color: "#fff" }}>Загрузка...</h2>
        </div>
      </Layout>
    );
  }

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
          position: "sticky",
          top: 15,
          alignSelf: "flex-start",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 90,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              padding: "0 18px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <img
              src={active}
              style={{
                width: 45,
                height: 45,
                borderRadius: "50%",
              }}
              alt="Logo"
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
                margin: 10,
                position: "relative",
                left: 15,
                flexShrink: 0,
              }}
            />
          )}

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              paddingBottom: 20,
            }}
          >
            <Menu
              theme="dark"
              mode="inline"
              items={menuItems}
              selectedKeys={[location.pathname]}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              onClick={handleMenuClick}
              style={{
                background: "transparent",
                border: "none",
                height: "100%",
              }}
            />
          </div>
        </div>
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
            minHeight: "calc(100vh - 120px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};