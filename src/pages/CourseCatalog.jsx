import { Flex, Typography } from "antd";
import { ArrowUpRight, BookOpen, GraduationCap } from "lucide-react";
import Lerna from "../assets/Lerna.png";

const { Title, Text } = Typography;

const courses = [
  {
    id: 1,
    name: "OSBP",
    subtitle: "Образование и профессиональное развитие",
    description:
      "Изучайте образовательные программы, развивайте профессиональные навыки и открывайте новые возможности.",
    image:
      "https://www.osbp-ca.org/images/ksep/logo/osbp-logo-transparent.png",
    url: "https://www.osbp-ca.org/",
    accent: "#ff4d4f",
    tag: "Образовательная платформа",
  },
  {
    id: 2,
    name: "Lerna",
    subtitle: "Курсы и новые знания",
    description:
      "Ознакомьтесь с доступными курсами, выберите интересующее направление и начните изучать новое.",
    image: Lerna,
    url: "https://www.lerna.tj/courses/",
    accent: "#8b5cf6",
    tag: "Каталог курсов",
  },
];

export default function CourseCatalog() {
  return (
    <section className="min-h-screen w-full bg-gradient-to-b from-white via-rose-50/40 to-white px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-red-500 shadow-sm">
            <GraduationCap size={18} />
            ОБРАЗОВАНИЕ И РАЗВИТИЕ
          </span>

          <Title
            level={1}
            className="!mb-4 !mt-3"
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              color: "#1f2937",
            }}
          >
            Каталог образовательных платформ
          </Title>

          <Text
            style={{
              display: "block",
              maxWidth: 620,
              margin: "0 auto",
              color: "#6b7280",
              fontSize: 16,
              lineHeight: 1.8,
            }}
          >
            Выберите интересующую платформу, нажмите на карточку и
            узнайте больше о доступных образовательных возможностях.
          </Text>
        </div>

        {/* Карточки */}
        <Flex
          align="stretch"
          justify="center"
          gap={28}
          wrap="wrap"
        >
          {courses.map((course) => (
            <a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Перейти на сайт ${course.name}`}
              className="group block w-full max-w-[480px] overflow-hidden rounded-3xl border border-gray-100 bg-white no-underline shadow-[0_8px_35px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-red-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]"
            >
              {/* Верхняя часть карточки */}
              <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-white p-8">
                <div
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150"
                  style={{ backgroundColor: course.accent }}
                />

                <div
                  className="absolute left-5 top-5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    color: course.accent,
                    backgroundColor: `${course.accent}12`,
                  }}
                >
                  {course.tag}
                </div>

                <img
                  src={course.image}
                  alt={`${course.name} logo`}
                  loading="lazy"
                  className="relative z-10 max-h-36 w-4/5 object-contain transition-transform duration-500 group-hover:scale-110"
                />

                <div
                  className="absolute bottom-5 right-5 flex h-10 w-10 items-center justify-center rounded-full text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ backgroundColor: course.accent }}
                >
                  <ArrowUpRight size={22} />
                </div>
              </div>

              {/* Нижняя часть карточки */}
              <div className="p-7">
                <Flex align="center" gap={3} className="mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      color: course.accent,
                      backgroundColor: `${course.accent}12`,
                    }}
                  >
                    <BookOpen size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Title
                      level={3}
                      className="!mb-1 !mt-0"
                      style={{
                        fontSize: 24,
                        fontWeight: 750,
                        color: "#1f2937",
                      }}
                    >
                      {course.name}
                    </Title>

                    <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                      {course.subtitle}
                    </Text>
                  </div>
                </Flex>

                <p className="mb-6 min-h-[72px] text-sm leading-6 text-gray-500">
                  {course.description}
                </p>

                <div
                  className="flex items-center justify-between border-t border-gray-100 pt-5 font-semibold transition-colors duration-300"
                  style={{ color: course.accent }}
                >
                  <span>Перейти на платформу</span>

                  <ArrowUpRight
                    size={20}
                    className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </a>
          ))}
        </Flex>

        {/* Нижняя информация */}
        <div className="mt-12 text-center">
          <Text style={{ color: "#9ca3af", fontSize: 13 }}>
            Выберите платформу, чтобы перейти на официальный сайт
          </Text>
        </div>
      </div>
    </section>
  );
}
