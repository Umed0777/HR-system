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
    <Layout style={{ minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={260}
        style={{
          background: "#fff",
          height: "100vh",
          marginTop: "0",
          marginLeft: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* TOP BAR (лого + кнопка) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "16px",
          }}
        >
          {/* ЛОГО */}
          <img
            src={active}
            alt="logo"
            style={{
              width: collapsed ? 40 : 80,
              borderRadius: "50%",
              transition: "0.3s",
            }}
          />

          {/* КНОПКА */}
          {!collapsed && (
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => setCollapsed(true)}
            />
          )}
        </div>

        {/* КНОПКА когда sidebar закрыт */}
        {collapsed && (
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setCollapsed(false)}
            />
          </div>
        )}

        {/* MENU */}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: "none" }}
          items={[
            {
              key: "/announcement",
              icon: <AppstoreOutlined />,
              label: "Объявление",
              // children:[
              //   {
              //     key: "/announcement",
              //     label: "IT"
              //   },
              //   {
              //     key: "/announcement",
              //     label: "Business"
              //   },
              // ]
            },
            // {
            //   key: "/reply",
            //   icon: <MessageOutlined />,
            //   label: "Отвечать",
            // },
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
              label: "Сессия",
            },
            {
              key: "/employee",
              icon: <TeamOutlined />,
              label: "Сотрудники",
            },
            {
              key: "/select-employee",
              icon: <UserOutlined />,
              label: "Выбрать сотрудника",
            },
          ]}
        />
      </Sider>

      {/* CONTENT */}
      <Layout>
        <div
          style={{
            height: 60,
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingRight: 20,
            boxShadow: "0 2px 5px rgba(0,0,0,.1)",
          }}
        >
          {token ? (
            <Button danger icon={<UserOutlined />} onClick={handleLogout}>
              Выйти
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate("/login")}
            >
              Войти
            </Button>
          )}
        </div>
        <Content
          style={{
            margin: 18,
            marginTop: 20,
            padding: 24,
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            borderRadius: 12,
            boxShadow: "0 0 8px rgba(0,0,0,0.1)",
            maxHeight: "760px",
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
