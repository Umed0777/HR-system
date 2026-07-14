import { Button, Layout, Menu } from "antd";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  CheckSquareOutlined,
  ClusterOutlined,
  ExperimentOutlined,
  FormOutlined,
  IdcardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import img from "../assets/image8.jpg";
import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import active from "../assets/active.png";

const { Sider, Content } = Layout;

export const HRSystemLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };
  const token = localStorage.getItem("token");

  return (
    <Layout style={{ minHeight: "100vh", background:
      "linear-gradient(135deg,#4b0000 0%,#8b0000 35%,#c1121f 70%,#ff4d4f 100%)", }}>
      {/* SIDEBAR */}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={270}
        style={{
    margin: 15,
    borderRadius: 20,
    overflow: "hidden",
    background: "rgba(255,255,255,.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,.15)",
    boxShadow: "0 20px 40px rgba(0,0,0,.35)",
  }}
      >
        {/* TOP BAR (лого + кнопка) */}
        <div
  style={{
    height: 90,
    display: "flex",
    justifyContent: collapsed ? "center" : "space-between",
    alignItems: "center",
    padding: "0 18px",
    borderBottom: "1px solid rgba(255,255,255,.15)",
  }}
>
  <img
    src={active}
    alt=""
    style={{
      width: collapsed ? 45 : 50,
      height: collapsed ? 45 : 50,
      borderRadius: "50%",
      objectFit: "cover",
      transition: ".4s",
      boxShadow: "0 0 20px rgba(255,80,80,.6)",
    }}
  />

  {!collapsed && (
    <Button
      type="text"
      icon={<MenuFoldOutlined style={{ color: "#fff", fontSize: 16 }} />}
      onClick={() => setCollapsed(true)}
    />
  )}
</div>

        {/* КНОПКА когда sidebar закрыт */}
        {collapsed && (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      margin: "15px 0",
    }}
  >
    <Button
      type="text"
      icon={<MenuUnfoldOutlined style={{ color: "#fff", fontSize: 16 }} />}
      onClick={() => setCollapsed(false)}
    />
  </div>
)}
        {/* MENU */}
        <Menu
        className="custom-sidebar-menu"
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
           style={{
      background: "transparent",
      borderRight: "none",
      color: "#fff",
      fontSize: 15,
      padding: "10px",
      overflowY: "auto", // Включаем скролл
    maxHeight: "calc(100vh - 64px)", // Ограничиваем высоту
    }}
         items={[
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
      }
    ]
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

  // {
  //   key: "/select-employee",
  //   icon: <UserOutlined />,
  //   label: "Выбрать сотрудника",
  // },
]}
        />
      </Sider>

      {/* CONTENT */}
      <Layout>
        <div
  style={{
    height: 75,
    margin: "15px 15px 0",
    borderRadius: 20,
    background: "rgba(255,255,255,.12)",
    backdropFilter: "blur(18px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 30px",
    color: "#fff",
    boxShadow: "0 15px 35px rgba(0,0,0,.2)",
  }}
>
  <h2
    style={{
      color: "#fff",
      margin: 0,
      fontWeight: 700,
      letterSpacing: 1,
    }}
  >
      HR Management System
  </h2>

  <Button
    danger
    size="large"
    icon={<UserOutlined />}
    onClick={handleLogout}
    style={{
      borderRadius: 30,
      paddingInline: 25,
      fontWeight: 600,
    }}
  >
      Выйти
  </Button>
</div>
        <Content
  style={{
    margin: 15,
    marginTop: 15,
    borderRadius: 25,
    overflow: "hidden",
    background: "rgba(255,255,255,.10)",
    backdropFilter: "blur(15px)",
    boxShadow: "0 20px 50px rgba(0,0,0,.3)",
    border: "1px solid rgba(255,255,255,.15)",
    minHeight: "82vh",
  }}
>
  <div
    style={{
      // backgroundImage: `url(${img})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      height: "100%",
      padding: 25,
      overflow: "auto",
      backdropFilter: "brightness(.9)",
    }}
  >
    <Outlet />
  </div>
</Content>
      </Layout>
    </Layout>
  );
};
