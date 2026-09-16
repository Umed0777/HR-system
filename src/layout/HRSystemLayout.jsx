import {
  Button,
  Layout,
  Menu,
  Modal,
  Collapse,
  Typography,
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
} from "@ant-design/icons";

import { useEffect, useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import active from "../assets/active.png";

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

export const HRSystemLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);
  const [initialized, setInitialized] = useState(false);

  
  const [faqOpen, setFaqOpen] = useState(false);

  
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "ru"
  );

  const navigate = useNavigate();
  const location = useLocation();

  

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

      news: "Новости",
      myArticles: "Мои статьи",
      chat: "Чат",

      logout: "Выйти",

      faq: "FAQ",
      faqTitle: "Руководство по базе знаний Банка",
      close: "Закрыть",

      faqQuestions: [
        {
          question: "Что такое База знаний (БЗ)?",
          answer:
            "Это единая цифровая библиотека нашего Банка. Здесь хранятся все актуальные инструкции, регламенты, шаблоны документов, ответы на частые вопросы и полезные материалы для работы."
        },
        {
          question: "Зачем мне ею пользоваться?",
          answer:
            "Чтобы экономить время. Вместо того чтобы искать документы на общих дисках или отвлекать коллег вопросами в чатах, вы можете найти проверенную и актуальную информацию самостоятельно за пару кликов."
        },
        {
          question: "Как войти в систему? ",
          answer:
            "Для входа вам не нужно придумывать новый пароль или проходить регистрацию. Вход в систему осуществляется через логин и пароль от вашего рабочего компьютера (ваша доменная учетная запись)."
        },
        {
          question: "Я нашел ошибку или устаревшую информацию в Базе Знаний. Что делать?",
          answer:
            "Напишите по адресу OKevorkova@activbank.tj"
        },
        {
          question: "Я хочу добавить новую статью или полезную инструкцию. Как это сделать?",
          answer:
            "Мы приветствуем инициативу! Если у вас есть материал, которым стоит поделиться с командой, вышлите его в Службу по управлению человеческими ресурсами по адресу: OKevorkova@activbank.tj"
        },
        {
          question: "Можно ли делиться ссылками на Базу знаний с клиентами или друзьями?",
          answer:
            "База знаний содержит конфиденциальную информацию и коммерческую тайну Банка. Доступ к ней открыт только для действующих сотрудников."
        },
        {
          question: "Что находится в разделе «ВидеоУрок»?",
          answer:
            "В этом подразделе собраны обучающие видеоролики, записи вебинаров и видеоинструкции по работе с нашими программами и внутренними процессами. Это самый быстрый способ визуально освоить новый навык."
        },
        {
          question: "Что искать в разделе «Документация»?",
          answer:
            "Здесь хранятся текстовые файлы, регламенты, инструкции, которые вы можете скачать или изучить онлайн."
        },
        {
          question: "Будет ли работать База знаний, если отключится интернет?",
          answer:
            "Да, система работает локально внутри нашей сети, поэтому она будет доступна даже при отсутствии внешнего интернета. Главное — находиться на рабочем месте и быть подключенным к локальной сети Банка."
        },
        {
          question: "Можно ли зайти в Базу знаний из дома или с личного телефона?",
          answer:
            "Нет, так как система развернута на внутреннем сервере Банка, доступ к ней возможен только с рабочих компьютеров в офисе."
        },
        {
          question: "Как каждый раз не вводить цифры адреса в браузере? ",
          answer:
            "Чтобы не потерять систему и заходить на нее в один клик, обязательно сохраните страницу в закладки вашего браузера при первом входе."
        },
        {
          question: "Что значат красные звёздочки * возле некоторых полей? ",
          answer:
            "Это знак обязательного поля. Его нельзя оставлять пустым. Обязательно введите туда информацию, иначе система не позволит сохранить форму или отправить результат."
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

      news: "Хабарҳо",
      myArticles: "Мақолаҳои ман",
      chat: "Чат",

      logout: "Баромадан",

      faq: "FAQ",
      faqTitle: "Роҳнамо оид ба Пойгоҳи донишҳои Бонк",
      close: "Пӯшидан",

      faqQuestions: [
        {
          question: "Пойгоҳи дониш (ПД) чист? ",
          answer:
            "Ин китобхонаи ягонаи рақамии Бонки мо мебошад. Дар он ҳамаи дастурҳои амалкунанда, қоидаву тартибот, қолабҳои ҳуҷҷатҳо, ҷавобҳо ба саволҳои маъмул ва маводи муфид барои кор нигоҳ дошта мешаванд."
        },
        {
          question: "Чаро ман бояд аз он истифода барам? ",
          answer:
            "Барои сарфа кардани вақт. Ба ҷойи ҷустуҷӯи ҳуҷҷатҳо дар дискҳои умумӣ ё халалдор кардани кори ҳамкорон бо саволҳо дар чатҳою мактубҳо, шумо метавонед маълумоти санҷидашуда ва навтаринро мустақилона бо ҳамагӣ ду пахши мушак пайдо кунед."
        },
        {
          question: "Чӣ тавр ба система ворид шудан мумкин аст?",
          answer:
            "Барои ворид шудан ба шумо рамзи нав сохтан ё аз қайд гузаштан лозим нест. Воридшавӣ ба система тавассути логин ва рамзи компютери кории шумо, яъне ҳисоби домении шумо сурат мегирад."
        },
        {
          question: "Ман дар Пойгоҳи донишҳо хато ё маълумоти кӯҳнашударо пайдо кардам. Чӣ кор кунам? ",
          answer:
            "Ба суроғаи OKevorkova@activbank.tj хабар фиристед."
        },
        {
          question: "Мехоҳам ҳуҷҷати нав ё дастури муфид илова кунам. Чӣ тавр ин корро анҷом диҳам? ",
          answer:
            "Мо ташаббуси шуморо дастгирӣ мекунем! Агар маводе дошта бошед, ки онро бо гурӯҳ мубодила кардан лозим бошад, онро ба Хадамоти идоракунии захираҳои инсонӣ тавассути суроғаи OKevorkova@activbank.tj ирсол намоед."
        },
        {
          question: "Оё ман метавонам Пойгоҳи донишҳоро бо муштариён ё дӯстонам дастрас кунам? ",
          answer:
            "Пойгоҳи донишҳо дорои маълумоти махфӣ ва сирри тиҷоратии Бонк мебошад. Дастрасӣ ба он танҳо барои кормандони ҳозираи Бонк иҷозат дода шудааст."
        },
        {
          question: "Дар бахши «Видео Дарс» чӣ мавод ҷой дода шудааст? ",
          answer:
            "Дар ин зербахш наворҳои омӯзишӣ, сабтҳои вебинарҳо ва дастурҳои видеоӣ оид ба кор бо барномаҳо ва равандҳои дохилии мо ҷамъ оварда шудаанд. Ин роҳи зудтарини аз худ кардани малакаи нав ба таври аёнӣ мебошад."
        },
        {
          question: "Дар бахши «Ҳуҷҷатгузорӣ» чиро бояд ҷустуҷӯ кард?  ",
          answer:
            "Дар ин бахш ҳуҷҷатҳо, қоидаву тартибот ва дастурҳо нигоҳ дошта мешаванд, ки шумо метавонед онҳоро зеркашӣ кунед ё мустақиман онлайн омӯзед."
        },
        {
          question: "Агар интернет қатъ шавад, пойгоҳи донишҳо кор мекунад?  ",
          answer:
            "Бале, система дар дохили шабакаи локалии мо фаъолият мекунад, бинобар ин ҳатто дар сурати набудани интернети беруна низ дастрас хоҳад буд. Муҳим он аст, ки шумо дар ҷойи кори худ бошед ва ба шабакаи маҳаллии Бонк пайваст шуда бошед."
        },
        {
          question: "Оё аз хона ё телефони шахсӣ ба Пойгоҳи донишҳо ворид шудан мумкин аст?",
          answer:
            "Не, азбаски система дар сервери дохилии Бонк ҷойгир шудааст, дастрасӣ ба он танҳо аз компютерҳои кории дохили идора имконпазир аст."
        },
        {
          question: "Чӣ кор кунам, то ҳар дафъа рақами суроғаро дар браузер ворид накунам?  ",
          answer:
            "Барои он ки система гум нашавад ва шумо тавонед бо як пахш ба он ворид шавед, ҳангоми воридшавии аввал ҳатман саҳифаро дар хатчӯбҳои (bookmarks) браузери худ нигоҳ доред."
        },
        {
          question: "Ситорачаҳои сурхи * дар назди баъзе майдонҳо чӣ маъно доранд?",
          answer:
            "Ин нишонаи майдони ҳатмӣ мебошад. Яъне, чунин майдонро холӣ гузоштан мумкин нест. Ба он ҳатман маълумоти заруриро ворид кунед, вагарна система ба шумо имкон намедиҳад, ки шаклро захира кунед ё натиҷаро ирсол намоед."
        },
      ],
    },
  };

  const t = translations[language];

  
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
    } else {
      setInitialized(true);
    }
  }, [navigate]);

  

  useEffect(() => {
    if (!initialized) return;

    const path = location.pathname;
    const newOpenKeys = [];

    if (
      [
        "/department",
        "/position",
        "/subdepartment",
        "/employee",
      ].includes(path)
    ) {
      newOpenKeys.push("administration");
    }

    if (
      [
        "/announcement",
        "/video-lessons",
        "/documentation",
      ].includes(path)
    ) {
      newOpenKeys.push("announcement");
    }

    if (
      [
        "/test",
        "/test-taking",
        "/surveys",
        "/survey-results",
      ].includes(path)
    ) {
      newOpenKeys.push("testing");
    }

    setOpenKeys(newOpenKeys);
  }, [location.pathname, initialized]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };


  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);

  };


  const handleFAQ = () => {
    setFaqOpen(true);
  };


  const roles = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  }, []);


  const menuItems = useMemo(() => {
    const items = [];


    if (
      roles.includes("Admin") ||
      roles.includes("SuperAdmin")
    ) {
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
          ],
        },

        {
          key: "/article",
          icon: <ReadOutlined />,
          label: t.news,
        },

        {
          key: "/my-articles",
          icon: <UserOutlined />,
          label: t.myArticles,
        },

        {
          key: "/chat",
          icon: <MessageOutlined />,
          label: t.chat,
        }
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
        }
      );
    }

    return items;
  }, [roles, t]);

  

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  

  const handleMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      navigate(key);
    }
  };


  if (!initialized) {
    return (
      <Layout
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg,#4b0000,#8b0000,#c1121f)",
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

          background:
            "linear-gradient(135deg,#4b0000,#8b0000,#c1121f)",
        }}
      >

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

            background:
              "linear-gradient(180deg,#8b0000 0%,#650000 100%)",

            boxShadow:
              "0 20px 40px rgba(0,0,0,.35)",

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

                justifyContent: collapsed
                  ? "center"
                  : "space-between",

                padding: "0 18px",

                borderBottom:
                  "1px solid rgba(255,255,255,0.1)",
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

            <div
              style={{
                display: "flex",
                justifyContent: "end",
                flexShrink: 0,

                padding: collapsed
                  ? "8px"
                  : "10px 15px",

                borderTop:
                  "1px solid rgba(255,255,255,0.12)",
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

        <Layout
          style={{
            background:
              "linear-gradient(135deg,#f8f8f8 0%,#e2e2e2 50%,#cfcfcf 100%)",

            borderRadius: 20,

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >

          <div
            style={{
              height: 75,
              margin: 15,
              borderRadius: 20,

              background:
                "rgba(255,255,255,.75)",

              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",

              padding: "0 20px",

              boxShadow:
                "0 5px 20px rgba(0,0,0,.08)",
            }}
          >
            

            <h2
              style={{
                margin: 0,
                color: "#ef4444",
                fontWeight: 800,
              }}
            >
              {t.systemTitle}
            </h2>


            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Button
                danger
                style={{
                  borderRadius: 16,
                  fontWeight:
                    language === "ru" ? 700 : 400,
                }}
                icon={<GlobalOutlined />}
                type={
                  language === "ru"
                    ? "primary"
                    : "default"
                }
                onClick={() =>
                  handleLanguageChange("ru")
                }
              >
                RU
              </Button>

              <Button
                danger
                style={{
                  borderRadius: 16,
                  fontWeight:
                    language === "tj" ? 700 : 400,
                }}
                icon={<GlobalOutlined />}
                type={
                  language === "tj"
                    ? "primary"
                    : "default"
                }
                onClick={() =>
                  handleLanguageChange("tj")
                }
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
            </div>
          </div>


          <Content
            style={{
              margin: "0 15px 15px",

              borderRadius: 25,

              padding: 25,

              background: "#fff",

              overflow: "auto",

              minHeight:
                "calc(100vh - 120px)",
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
            {t.faqQuestions.map(
              (item, index) => (
                <Panel
                  key={index}
                  header={
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}.{" "}
                      {item.question}
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
              )
            )}
          </Collapse>
        </div>
      </Modal>
    </>
  );
};
