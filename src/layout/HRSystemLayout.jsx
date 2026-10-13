import {
  Button,
  Layout,
  Menu,
  Modal,
  Collapse,
  Typography,
  Badge,
  Dropdown,
  List,
  Avatar,
  Empty,
  Spin,
  Tag,
} from "antd";

import {
  ApartmentOutlined,
  CheckSquareOutlined,
  ClusterOutlined,
  FormOutlined,
  IdcardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReadOutlined,
  TeamOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  FilePdfOutlined,
  BarsOutlined,
  BarChartOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  GlobalOutlined,
  BellOutlined,
  LoginOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

import { useEffect, useState, useMemo, useCallback } from "react";

import { Outlet, useNavigate, useLocation } from "react-router-dom";

import active from "../assets/active.png";

// ==========================================
// ZUSTAND NOTIFICATION STORE
// ==========================================
import { useUserNotificationStore } from "../store/useUserNotification";

const { Sider, Content } = Layout;
const { Paragraph } = Typography;
const { Panel } = Collapse;

export const HRSystemLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const [faqOpen, setFaqOpen] = useState(false);

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  const [notificationOpen, setNotificationOpen] = useState(false);

  // ==========================================
  // ZUSTAND USERS
  // ==========================================
  const {
    users,
    loading: usersLoading,
    fetchUsers,
  } = useUserNotificationStore();

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "ru",
  );

  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // TRANSLATIONS
  // ==========================================

  const translations = {
    ru: {
      loading: "Загрузка...",
      systemTitle: "HR Management System",

      administration: "Администрирование",
      management: "Управление",
      position: "Должность",
      department: "Отдел",
      employees: "Сотрудники",

      knowledgeBase: "База знаний",
      videoLessons: "ВидеоУрок",
      documentation: "Документация",

      testing: "Тестирование",
      tests: "Тесты",
      surveys: "Опросы",
      surveyResults: "Результаты опросов",
      testResults: "Результаты тестов",
      testHistory: "История стажеров",

      news: "Новости",
      myArticles: "Мои статьи",
      chat: "Чат",
      courseCatalog: "Каталог курсов",
      logout: "Выйти",

      faq: "FAQ",
      faqTitle: "Руководство по базе знаний Банка",
      close: "Закрыть",

      loginNotifications: "Пользователи",
      noLoginNotifications: "Пользователей нет",

      user: "Пользователь",
      email: "Email",
      role: "Роль",
      loginTime: "Время входа",

      newLogin: "Пользователь",

      faqQuestions: [
        {
          question: "Что такое База знаний (БЗ)?",
          answer:
            "Это единая цифровая библиотека нашего Банка. Здесь хранятся все актуальные инструкции, регламенты, шаблоны документов, ответы на частые вопросы и полезные материалы для работы.",
        },
        {
          question: "Зачем мне ею пользоваться?",
          answer:
            "Чтобы экономить время. Вместо того чтобы искать документы на общих дисках или отвлекать коллег вопросами в чатах, вы можете найти проверенную и актуальную информацию самостоятельно за пару кликов.",
        },
        {
          question: "Как войти в систему?",
          answer:
            "Для входа вам не нужно придумывать новый пароль или проходить регистрацию. Вход в систему осуществляется через логин и пароль от вашего рабочего компьютера.",
        },
        {
          question:
            "Я нашел ошибку или устаревшую информацию в Базе Знаний. Что делать?",
          answer: "Напишите по адресу OKevorkova@activbank.tj",
        },
        {
          question:
            "Я хочу добавить новую статью или полезную инструкцию. Как это сделать?",
          answer:
            "Если у вас есть материал, которым стоит поделиться с командой, вышлите его в Службу по управлению человеческими ресурсами.",
        },
        {
          question:
            "Можно ли делиться ссылками на Базу знаний с клиентами или друзьями?",
          answer:
            "База знаний содержит конфиденциальную информацию Банка. Доступ к ней открыт только для действующих сотрудников.",
        },
        {
          question: "Что находится в разделе «ВидеоУрок»?",
          answer:
            "В этом подразделе собраны обучающие видеоролики, записи вебинаров и видеоинструкции.",
        },
        {
          question: "Что искать в разделе «Документация»?",
          answer: "Здесь хранятся текстовые файлы, регламенты и инструкции.",
        },
        {
          question: "Будет ли работать База знаний, если отключится интернет?",
          answer: "Да, система работает локально внутри нашей сети.",
        },
        {
          question:
            "Можно ли зайти в Базу знаний из дома или с личного телефона?",
          answer:
            "Нет, доступ к системе возможен только с рабочих компьютеров в офисе.",
        },
        {
          question: "Как каждый раз не вводить цифры адреса в браузере?",
          answer: "Сохраните страницу в закладки браузера.",
        },
        {
          question: "Что значат красные звёздочки * возле некоторых полей?",
          answer: "Это знак обязательного поля.",
        },
      ],
    },

    tj: {
      loading: "Боргир шуда истодааст...",
      systemTitle: "Системаи идоракунии HR",

      administration: "Идоракунӣ",
      management: "Идоракунӣ",
      position: "Вазифа",
      department: "Шуъба",
      employees: "Кормандон",

      knowledgeBase: "Пойгоҳи дониш",
      videoLessons: "Дарсҳои видеоӣ",
      documentation: "Ҳуҷҷатгузорӣ",

      testing: "Санҷиш",
      tests: "Тестҳо",
      surveys: "Пурсишҳо",
      surveyResults: "Натиҷаҳои пурсишҳо",
      testResults: "Натиҷаҳои тестҳо",
      testHistory: "Таърихи супоридан",

      news: "Хабарҳо",
      myArticles: "Мақолаҳои ман",
      chat: "Чат",

      logout: "Баромадан",
      courseCatalog: "Феҳристи курсҳо",
      faq: "FAQ",
      faqTitle: "Роҳнамо оид ба Пойгоҳи донишҳои Бонк",
      close: "Пӯшидан",

      loginNotifications: "Корбарон",
      noLoginNotifications: "Корбарон нестанд",

      user: "Корбар",
      email: "Email",
      role: "Нақш",
      loginTime: "Вақти воридшавӣ",

      newLogin: "Корбар",

      faqQuestions: [
        {
          question: "Пойгоҳи дониш (ПД) чист?",
          answer: "Ин китобхонаи ягонаи рақамии Бонки мо мебошад.",
        },
        {
          question: "Чаро ман бояд аз он истифода барам?",
          answer: "Барои сарфа кардани вақт ва пайдо кардани маълумоти зарурӣ.",
        },
        {
          question: "Чӣ тавр ба система ворид шудан мумкин аст?",
          answer:
            "Воридшавӣ тавассути логин ва рамзи компютери корӣ анҷом дода мешавад.",
        },
        {
          question:
            "Ман дар Пойгоҳи донишҳо хато ё маълумоти кӯҳнашударо пайдо кардам. Чӣ кор кунам?",
          answer: "Ба суроғаи OKevorkova@activbank.tj хабар фиристед.",
        },
        {
          question: "Мехоҳам ҳуҷҷати нав ё дастури муфид илова кунам.",
          answer:
            "Маводро ба Хадамоти идоракунии захираҳои инсонӣ ирсол намоед.",
        },
        {
          question:
            "Оё ман метавонам Пойгоҳи донишҳоро бо муштариён мубодила кунам?",
          answer: "Не, маълумот махфӣ мебошад.",
        },
        {
          question: "Дар бахши «Видео Дарс» чӣ мавод ҷой дода шудааст?",
          answer:
            "Дар ин бахш наворҳои омӯзишӣ ва дастурҳои видеоӣ ҷой дода шудаанд.",
        },
        {
          question: "Дар бахши «Ҳуҷҷатгузорӣ» чиро бояд ҷустуҷӯ кард?",
          answer: "Дар ин бахш ҳуҷҷатҳо ва дастурҳо нигоҳ дошта мешаванд.",
        },
        {
          question: "Агар интернет қатъ шавад, пойгоҳи донишҳо кор мекунад?",
          answer: "Бале, система дар дохили шабакаи локалӣ фаъолият мекунад.",
        },
        {
          question: "Оё аз хона ба Пойгоҳи донишҳо ворид шудан мумкин аст?",
          answer: "Не, дастрасӣ аз шабакаи дохилии Бонк мебошад.",
        },
        {
          question: "Чӣ кор кунам, то ҳар дафъа рақами суроғаро ворид накунам?",
          answer: "Саҳифаро дар bookmarks браузер нигоҳ доред.",
        },
        {
          question: "Ситорачаҳои сурх чӣ маъно доранд?",
          answer: "Ин нишонаи майдони ҳатмӣ мебошад.",
        },
      ],
    },
  };

  const t = translations[language];

<<<<<<< HEAD
=======
  // ==========================================
  // ROLES
  // ==========================================

>>>>>>> 5ca226a400b1e60f6eb826ff09e0c561f038b6af
  const roles = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  }, []);

  const isAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");

  // ==========================================
  // AUTH
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
    } else {
      setInitialized(true);
    }
  }, [navigate]);

  // ==========================================
  // OPEN MENU
  // ==========================================

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

    if (
      [
        "/test",
        "/test-taking",
        "/test-history",
        "/surveys",
        "/survey-results",
      ].includes(path)
    ) {
      newOpenKeys.push("testing");
    }

    setOpenKeys(newOpenKeys);
  }, [location.pathname, initialized]);

  // ==========================================
  // LOAD USERS FOR NOTIFICATIONS
  // ==========================================

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      await fetchUsers();
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
    }
  }, [isAdmin, fetchUsers]);

  // ==========================================
  // LOAD USERS
  // ==========================================

  useEffect(() => {
    if (!initialized || !isAdmin) {
      return;
    }

    loadUsers();

    // Обновляем список пользователей каждые 30 секунд
    const interval = setInterval(() => {
      loadUsers();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [initialized, isAdmin, loadUsers]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  // ==========================================
  // LANGUAGE
  // ==========================================

  const handleLanguageChange = (lang) => {
    setLanguage(lang);

    localStorage.setItem("language", lang);
  };

  // ==========================================
  // FAQ
  // ==========================================

  const handleFAQ = () => {
    setFaqOpen(true);
  };

  // ==========================================
  // MENU
  // ==========================================

  const menuItems = useMemo(() => {
    const items = [];

    // ========================================
    // ADMIN / SUPERADMIN
    // ========================================

    if (isAdmin) {
      items.push(
        {
          key: "administration",
          icon: <DashboardOutlined />,
          label: t.administration,

          children: [
            {
              key: "/department",
              icon: <ApartmentOutlined />,
              label: t.management,
            },

            {
              key: "/position",
              icon: <IdcardOutlined />,
              label: t.position,
            },

            {
              key: "/subdepartment",
              icon: <ClusterOutlined />,
              label: t.department,
            },

            {
              key: "/employee",
              icon: <TeamOutlined />,
              label: t.employees,
            },
          ],
        },

        {
          key: "announcement",
          icon: <FileTextOutlined />,
          label: t.knowledgeBase,

          children: [
            {
              key: "/video-lessons",
              icon: <VideoCameraOutlined />,
              label: t.videoLessons,
            },

            {
              key: "/documentation",
              icon: <FilePdfOutlined />,
              label: t.documentation,
            },
                    {
          key: "/course-catalog",
          icon: <ReadOutlined />,
          label: t.courseCatalog,
        },
          ],
        },

        {
          key: "testing",
          icon: <FormOutlined />,
          label: t.testing,

          children: [
            {
              key: "/test",
              icon: <FormOutlined />,
              label: t.tests,
            },

            {
              key: "/surveys",
              icon: <BarsOutlined />,
              label: t.surveys,
            },

            {
              key: "/survey-results",
              icon: <BarChartOutlined />,
              label: t.surveyResults,
            },

            {
              key: "/test-taking",
              icon: <CheckSquareOutlined />,
              label: t.testResults,
            },

            {
              key: "/test-history",
              icon: <HistoryOutlined />,
              label: t.testHistory,
            },
          ],
        },

        // {
        //   key: "/article",
        //   icon: <ReadOutlined />,
        //   label: t.news,
        // },

        // {
        //   key: "/my-articles",
        //   icon: <UserOutlined />,
        //   label: t.myArticles,
        // },
      );
    }

    // ========================================
    // BASIC
    // ========================================

    if (
      roles.includes("Basic") &&
      !roles.includes("Admin") &&
      !roles.includes("SuperAdmin")
    ) {
      items.push(
        {
          key: "announcement",
          icon: <FileTextOutlined />,
          label: t.knowledgeBase,

          children: [
            {
              key: "/video-lessons",
              icon: <VideoCameraOutlined />,
              label: t.videoLessons,
            },

            {
              key: "/documentation",
              icon: <FilePdfOutlined />,
              label: t.documentation,
            },
<<<<<<< HEAD
            {
  key: "/course-catalog",
  icon: <BookOutlined />,
  label: t.courseCatalog,
},
=======
            
>>>>>>> 5ca226a400b1e60f6eb826ff09e0c561f038b6af
          ],
        },

        {
          key: "testing",
          icon: <FormOutlined />,
          label: t.testing,

          children: [
            {
              key: "/test",
              icon: <FormOutlined />,
              label: t.tests,
            },

            {
              key: "/surveys",
              icon: <BarsOutlined />,
              label: t.surveys,
            },
          ],
        },
      );
      items.push({
      key: "/chat",
      icon: <MessageOutlined />,
      label: t.chat,
    });

    return items;
    }

    return items;
  }, [roles, t, isAdmin]);

  // ==========================================
  // MENU OPEN
  // ==========================================

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // ==========================================
  // MENU CLICK
  // ==========================================

  const handleMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      navigate(key);
    }
  };

  // ==========================================
  // GET USER NAME
  // ==========================================

  const getUserName = (item) => {
    const firstName =
      item?.firstName || item?.FirstName || item?.first_name || "";

    const lastName = item?.lastName || item?.LastName || item?.last_name || "";

    const fullName = item?.fullName || item?.FullName || "";

    const username =
      item?.userName || item?.username || item?.login || item?.name || "";

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    if (fullName) {
      return fullName;
    }

    return username || "Пользователь";
  };

  const getUserEmail = (item) => {
    return item?.email || item?.Email || "Email не указан";
  };

  // ==========================================
  // GET USER ROLE
  // ==========================================

  const getUserRoles = (item) => {
    if (Array.isArray(item?.roles)) {
      return item.roles.join(", ");
    }

    if (Array.isArray(item?.Roles)) {
      return item.Roles.join(", ");
    }

    return item?.role || item?.Role || "Basic";
  };

  // ==========================================
  // GET LOGIN / CREATED DATE
  // ==========================================

  const getLoginTime = (item) => {
    return (
      item?.loginTime ||
      item?.loggedInAt ||
      item?.lastLogin ||
      item?.lastLoginTime ||
      item?.createdAt ||
      item?.created_at ||
      item?.date ||
      null
    );
  };

  // ==========================================
  // NOTIFICATION CONTENT
  // ==========================================

  const notificationContent = (
    <div
      style={{
        width: 430,
        maxHeight: 520,
        overflowY: "auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        padding: 12,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px 14px",
          borderBottom: "1px solid #eeeeee",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
          }}
        >
          <BellOutlined
            style={{
              color: "#ef4444",
              fontSize: 21,
            }}
          />

          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#222",
            }}
          >
            {t.loginNotifications}
          </span>
        </div>

        {users.length > 0 && (
          <Badge
            count={users.length}
            overflowCount={99}
            style={{
              backgroundColor: "#ef4444",
            }}
          />
        )}
      </div>

      {/* LOADING */}

      {usersLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 45,
          }}
        >
          <Spin size="large" />
        </div>
      )}

      {/* EMPTY */}

      {!usersLoading && users.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t.noLoginNotifications}
          style={{
            padding: "30px 0",
          }}
        />
      )}

      {/* USERS */}

      {!usersLoading && users.length > 0 && (
        <List
          dataSource={users}
          split
          renderItem={(item, index) => {
            const userName = getUserName(item);

            const email = getUserEmail(item);

            const userRoles = getUserRoles(item);

            const loginTime = getLoginTime(item);

            return (
              <List.Item
                key={item?.id || item?.Id || index}
                style={{
                  padding: "14px 8px",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={44}
                      style={{
                        background: "linear-gradient(135deg,#ff416c,#ff4b2b)",
                      }}
                      icon={<LoginOutlined />}
                    />
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#222",
                        }}
                      >
                        {userName}
                      </span>

                      <Tag
                        color="red"
                        style={{
                          margin: 0,
                          borderRadius: 6,
                        }}
                      >
                        {userRoles}
                      </Tag>
                    </div>
                  }
                  description={
                    <div
                      style={{
                        marginTop: 6,
                        lineHeight: 1.7,
                      }}
                    >
                      {/* EMAIL */}

                      <div
                        style={{
                          fontSize: 13,
                          color: "#555",
                        }}
                      >
                        <strong>{t.email}:</strong> {email}
                      </div>

                      {/* LOGIN TIME */}

                      {loginTime && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            color: "#999",
                            marginTop: 3,
                          }}
                        >
                          <LoginOutlined />

                          <span>{t.loginTime}:</span>

                          <span>
                            {new Date(loginTime).toLocaleString(
                              language === "tj" ? "tg-TJ" : "ru-RU",
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  // ==========================================
  // INITIAL LOADING
  // ==========================================

  if (!initialized) {
    return (
      <Layout
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#4b0000,#8b0000,#c1121f)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {t.loading}
          </h2>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#4b0000,#8b0000,#c1121f)",
        }}
      >
        {/* ==========================================
            SIDEBAR
        ========================================== */}

        <Sider
          collapsed={collapsed}
          trigger={null}
          width={270}
          collapsedWidth={80}
          style={{
            margin: 15,
            height: "calc(100vh - 30px)",
            borderRadius: 20,
            overflow: "hidden",
            background: "linear-gradient(180deg,#8b0000 0%,#650000 100%)",
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
            {/* LOGO */}

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
                  objectFit: "cover",
                }}
                alt="Logo"
              />

              {!collapsed && (
                <Button
                  type="text"
                  icon={
                    <MenuFoldOutlined
                      style={{
                        color: "#fff",
                        fontSize: 16,
                      }}
                    />
                  }
                  onClick={() => setCollapsed(true)}
                />
              )}
            </div>

            {/* COLLAPSED */}

            {collapsed && (
              <Button
                type="text"
                icon={
                  <MenuUnfoldOutlined
                    style={{
                      color: "#fff",
                      fontSize: 16,
                    }}
                  />
                }
                onClick={() => setCollapsed(false)}
                style={{
                  margin: "10px auto",
                  flexShrink: 0,
                }}
              />
            )}

            {/* MENU */}

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                paddingBottom: 10,
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
                }}
              />
            </div>

            {/* LOGOUT */}

            <div
              style={{
                display: "flex",
                justifyContent: "end",
                flexShrink: 0,
                padding: collapsed ? "8px" : "10px 15px",
                borderTop: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  width: collapsed ? "60px" : "90px",
                  height: "34px",
                  color: "#fff",
                  fontSize: 14,
                  padding: "0 10px",
                }}
              >
                {!collapsed && t.logout}
              </Button>
            </div>
          </div>
        </Sider>

        {/* ==========================================
            MAIN
        ========================================== */}

        <Layout
          style={{
            background:
              "linear-gradient(135deg,#f8f8f8 0%,#e2e2e2 50%,#cfcfcf 100%)",
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          {/* HEADER */}

          <div
            style={{
              height: 75,
              margin: 15,
              borderRadius: 20,
              background: "rgba(255,255,255,.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 20px",
              boxShadow: "0 5px 20px rgba(0,0,0,.08)",
            }}
          >
            {/* TITLE */}

            <h2
              style={{
                margin: 0,
                color: "#ef4444",
                fontWeight: 800,
              }}
            >
              {t.systemTitle}
            </h2>

            {/* HEADER ACTIONS */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {/* RU */}

              <Button
                danger
                style={{
                  borderRadius: 16,
                  fontWeight: language === "ru" ? 700 : 400,
                }}
                icon={<GlobalOutlined />}
                type={language === "ru" ? "primary" : "default"}
                onClick={() => handleLanguageChange("ru")}
              >
                RU
              </Button>

              <Button
                danger
                style={{
                  borderRadius: 16,
                  fontWeight: language === "tj" ? 700 : 400,
                }}
                icon={<GlobalOutlined />}
                type={language === "tj" ? "primary" : "default"}
                onClick={() => handleLanguageChange("tj")}
              >
                TJ
              </Button>

              <Button
                danger
                icon={<QuestionCircleOutlined />}
                onClick={handleFAQ}
              >
                {t.faq}
              </Button>

              {isAdmin && (
                <Dropdown
                  open={notificationOpen}
                  onOpenChange={(open) => {
                    setNotificationOpen(open);

                    if (open) {
                      loadUsers();
                    }
                  }}
                  popupRender={() => notificationContent}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Badge
                    count={users.length}
                    overflowCount={99}
                    size="small"
                    offset={[-2, 2]}
                  >
                    <Button
                      danger
                      shape="circle"
                      icon={
                        <BellOutlined
                          style={{
                            fontSize: 16,
                          }}
                        />
                      }
                      style={{
                        width: 35,
                        height: 35,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    />
                  </Badge>
                </Dropdown>
              )}
            </div>
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

      <Modal
        open={faqOpen}
        onCancel={() => setFaqOpen(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            danger
            onClick={() => setFaqOpen(false)}
            style={{
              borderRadius: 12,
              paddingLeft: 25,
              paddingRight: 25,
            }}
          >
            {t.close}
          </Button>,
        ]}
        width={750}
        centered
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <QuestionCircleOutlined
              style={{
                color: "#ef4444",
                fontSize: 24,
              }}
            />

            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {t.faqTitle}
            </span>
          </div>
        }
      >
        <div
          style={{
            paddingTop: 10,
          }}
        >
          <Collapse
            accordion
            bordered={false}
            style={{
              background: "#fafafa",
              borderRadius: 14,
            }}
          >
            {t.faqQuestions.map((item, index) => (
              <Panel
                key={index}
                header={
                  <span
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}. {item.question}
                  </span>
                }
              >
                <Paragraph
                  style={{
                    marginBottom: 0,
                    color: "#555",
                    lineHeight: 1.7,
                  }}
                >
                  {item.answer}
                </Paragraph>
              </Panel>
            ))}
          </Collapse>
        </div>
      </Modal>
    </>
  );
};

export default HRSystemLayout;
