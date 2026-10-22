import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ExcelJS from "exceljs";
import {
  Button,
  Modal,
  Card,
  Typography,
  Tag,
  Spin,
  Row,
  Col,
  message,
  Progress,
  Radio,
  Input,
  Alert,
  Descriptions,
  Badge,
  Divider,
  Tooltip,
  Avatar,
  Table,
  Statistic,
  Empty,
  List,
  Space,
  Pagination,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FlagOutlined,
  UserOutlined,
  BookOutlined,
  HourglassOutlined,
  SaveOutlined,
  StarOutlined,
  FileDoneOutlined,
  HistoryOutlined,
  CrownOutlined,
  TeamOutlined,
  FileExcelOutlined,
  EyeOutlined,
  ReloadOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useTestSessionStore } from "../store/useTestSession";
import { useTestStore } from "../store/useTest";
import { useEmployeeStore } from "../store/useEmployee";

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE = "http://10.65.10.22:8525/api";

const getNumericType = (type) => {
  if (type === 1 || type === "MultipleChoice") return 1;
  if (type === 2 || type === "OpenEnded" || type === "Manual") return 2;
  if (type === 3 || type === "Rating") return 3;
  return 1;
};

const getStatusNum = (status) => {
  if (status === null || status === undefined) return null;
  const s = String(status).toLowerCase().trim();
  if (
    s === "1" ||
    s === "inprogress" ||
    s === "in_progress" ||
    s === "pending" ||
    s === "active"
  )
    return 1;
  if (
    s === "2" ||
    s === "completed" ||
    s === "finished" ||
    s === "done" ||
    s === "passed"
  )
    return 2;
  if (
    s === "0" ||
    s === "notstarted" ||
    s === "not_started" ||
    s === "new" ||
    s === "created"
  )
    return 0;
  if (s === "3" || s === "cancelled" || s === "canceled" || s === "expired")
    return 3;
  return null;
};

const getEmployeeFio = (emp) => {
  if (!emp) return "";
  const lastName = emp.lastName || "";
  const firstName = emp.firstName || "";
  const middleName =
    emp.middleName || emp.patronymic || emp.otchestvo || emp.surName || "";
  return `${lastName} ${firstName} ${middleName}`.replace(/\s+/g, " ").trim();
};

const makeDepartmentResolver = (departments) => (id) => {
  if (id === null || id === undefined) return "";
  const dep = departments.find((d) => Number(d.id) === Number(id));
  return dep?.name || dep?.title || dep?.nameRu || dep?.nameTj || "";
};

// ==================== ТАЙМЕР ====================
const Timer = ({
  minutes,
  onTimeEnd,
  isActive,
  onTick,
  startTimestamp,
  onRemainingChange,
}) => {
  const [displayTime, setDisplayTime] = useState(minutes * 60);
  const intervalRef = useRef(null);
  const initialStartTimestampRef = useRef(startTimestamp);

  useEffect(() => {
    if (startTimestamp) initialStartTimestampRef.current = startTimestamp;
  }, [startTimestamp]);

  useEffect(() => {
    if (minutes && !isActive) setDisplayTime(minutes * 60);
  }, [minutes, isActive]);

  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatElapsed = (seconds) => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}м ${secs}с`;
    return `${secs}с`;
  };

  const getTimerColor = () => {
    if (displayTime <= 60) return "#ff4d4f";
    if (displayTime <= 300) return "#faad14";
    return "#52c41a";
  };

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const startTs = initialStartTimestampRef.current;
      if (!startTs) return;
      const elapsedSecondsFromStart = Math.max(
        0,
        Math.floor((now - startTs) / 1000),
      );
      const remaining = Math.max(0, minutes * 60 - elapsedSecondsFromStart);
      setDisplayTime(remaining);
      if (onRemainingChange) onRemainingChange(remaining);
      if (onTick) onTick(elapsedSecondsFromStart);
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onTimeEnd) onTimeEnd();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, minutes, onTimeEnd, onTick, onRemainingChange]);

  return (
    <div>
      <Row gutter={16} align="middle">
        <Col flex="auto">
          <Progress
            percent={Math.round(
              Math.min(
                100,
                Math.max(
                  0,
                  ((minutes * 60 - displayTime) / (minutes * 60)) * 100,
                ),
              ),
            )}
            status={displayTime <= 60 ? "exception" : "active"}
            strokeColor={getTimerColor()}
            size={["100%", 16]}
            railColor="#f0f0f0"
          />
        </Col>
        <Col>
          <Badge
            count={formatTime(displayTime)}
            style={{
              backgroundColor: getTimerColor(),
              fontSize: 24,
              fontWeight: "bold",
              padding: "8px 16px",
              borderRadius: 12,
              minWidth: 120,
              textAlign: "center",
            }}
          />
        </Col>
      </Row>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Text type="secondary" style={{ fontSize: 14 }}>
          <HourglassOutlined /> Отработано:{" "}
          {formatElapsed(minutes * 60 - displayTime)}
        </Text>
        <Text type="secondary" style={{ fontSize: 14 }}>
          <ClockCircleOutlined /> Всего: {minutes} минут
        </Text>
      </div>
      {displayTime <= 300 && displayTime > 0 && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Text type="warning" strong style={{ fontSize: 16 }}>
            <WarningOutlined /> Осталось менее 5 минут!
          </Text>
        </div>
      )}
    </div>
  );
};

// ==================== КАРТОЧКА ВОПРОСА ====================
const QuestionCard = ({
  question,
  index,
  total,
  selectedOption,
  onSelectOption,
  manualAnswer,
  onManualAnswerChange,
  ratingValue,
  onRatingChange,
  lang,
}) => {
  const t = {
    ru: {
      question: "Вопрос",
      of: "из",
      yourAnswer: "Ваш ответ",
      selectOption: "Выберите вариант ответа",
      textAnswer: "Введите текстовый ответ",
      selectRating: "Выберите рейтинг (1-10)",
      rating: "Рейтинг",
    },
    tj: {
      question: "Савол",
      of: "аз",
      yourAnswer: "Ҷавоби шумо",
      selectOption: "Варианти ҷавобро интихоб кунед",
      textAnswer: "Ҷавоби матниро ворид кунед",
      selectRating: "Баҳоро интихоб кунед (1-10)",
      rating: "Баҳо",
    },
  };

  const getQuestionText = (q) => {
    if (!q) return "—";
    if (lang === "ru") return q.contentRu || q.content || "—";
    return q.contentTj || q.content || "—";
  };

  const getOptionText = (option) => {
    if (!option) return "—";
    if (lang === "ru") return option.textRu || option.text || "—";
    return option.textTj || option.text || "—";
  };

  const qType = getNumericType(question?.type);

  return (
    <Card
      className="question-card"
      style={{ marginBottom: 24, borderRadius: 12 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Badge
          count={`${t[lang].question} ${index + 1} ${t[lang].of} ${total}`}
          style={{
            backgroundColor: "#ff4b2b",
            fontSize: 14,
            padding: "4px 12px",
          }}
        />
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 24 }}>
        {getQuestionText(question)}
      </div>
      <Divider orientation="left" style={{ fontSize: 14, margin: "16px 0" }}>
        <Text type="secondary">{t[lang].yourAnswer}</Text>
      </Divider>

      {qType === 1 && (
        <>
          {!question?.options || question.options.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="У этого вопроса нет вариантов ответа"
              description="Возможно, вопрос был сохранён некорректно. Обратитесь к администратору."
            />
          ) : (
            <Radio.Group
              value={selectedOption}
              onChange={(e) => onSelectOption(e.target.value)}
              style={{ width: "100%" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {question.options.map((option, idx) => {
                  const optionKey =
                    option.id !== undefined && option.id !== null
                      ? option.id
                      : idx;
                  const isSelected = selectedOption === optionKey;
                  return (
                    <div
                      key={optionKey}
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        backgroundColor: isSelected ? "#e6f7ff" : "#fafafa",
                        border: isSelected
                          ? "2px solid #1890ff"
                          : "1px solid #d9d9d9",
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                      onClick={() => onSelectOption(optionKey)}
                    >
                      <Radio value={optionKey}>
                        <Text style={{ fontSize: 15 }}>
                          {getOptionText(option)}
                        </Text>
                      </Radio>
                    </div>
                  );
                })}
              </div>
            </Radio.Group>
          )}
        </>
      )}

      {qType === 2 && (
        <TextArea
          placeholder={t[lang].textAnswer}
          value={manualAnswer || ""}
          onChange={(e) => onManualAnswerChange(e.target.value)}
          rows={5}
          size="large"
          style={{ fontSize: 15, borderRadius: 8 }}
          autoComplete="off"
        />
      )}

      {qType === 3 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            {t[lang].selectRating}
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const active = ratingValue === num;
              return (
                <div
                  key={num}
                  onClick={() => onRatingChange(num)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 15,
                    transition: "0.3s",
                    background: active
                      ? "linear-gradient(135deg, #ff4d4f, #ff7875)"
                      : "rgba(255,255,255,0.9)",
                    color: active ? "#fff" : "#333",
                    border: active ? "3px solid #ffd6d6" : "1px solid #e8e8e8",
                    boxShadow: active
                      ? "0 8px 20px rgba(255, 77, 79, 0.35)"
                      : "0 2px 6px rgba(0,0,0,0.08)",
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>
          {ratingValue && (
            <div style={{ marginTop: 12 }}>
              <Tag color="orange" style={{ fontSize: 14, padding: "4px 12px" }}>
                {t[lang].rating}: {ratingValue}/10
              </Tag>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ⭐ МОДАЛКА РЕЗУЛЬТАТА УБРАНА — компонент TestResultsModal удалён полностью

// ==================== РЕЙТИНГ СОТРУДНИКОВ ====================
const EmployeeRanking = ({
  sessions,
  employees,
  tests,
  lang,
  getDepartmentName,
}) => {
  const t = {
    ru: {
      title: "Рейтинг сотрудников",
      employee: "Сотрудник",
      testsPassed: "Пройдено тестов",
      avgScore: "Средний балл",
      bestResult: "Лучший результат",
      department: "Отдел",
      rank: "Место",
    },
    tj: {
      title: "Рейтинги кормандон",
      employee: "Корманд",
      testsPassed: "Тестҳои супоридашуда",
      avgScore: "Балли миёна",
      bestResult: "Натиҷаи беҳтарин",
      department: "Шуъба",
      rank: "Ҷой",
    },
  };

  const employeeStats = employees
    .map((employee) => {
      const employeeSessions = sessions.filter(
        (s) =>
          Number(s.employeeId) === Number(employee.id) &&
          getStatusNum(s.status) === 2 &&
          s.score !== null,
      );
      const completedTests = employeeSessions.length;
      const avgScore =
        completedTests > 0
          ? employeeSessions.reduce((sum, s) => sum + (s.score || 0), 0) /
            completedTests
          : 0;
      const bestScore =
        completedTests > 0
          ? Math.max(...employeeSessions.map((s) => s.score || 0))
          : 0;
      return {
        ...employee,
        completedTests,
        avgScore: Math.round(avgScore),
        bestScore,
      };
    })
    .filter((emp) => emp.completedTests > 0)
    .sort((a, b) => b.avgScore - a.avgScore);

  const getRankIcon = (index) => {
    if (index === 0)
      return <CrownOutlined style={{ color: "#ffd700", fontSize: 20 }} />;
    if (index === 1)
      return <TrophyOutlined style={{ color: "#c0c0c0", fontSize: 20 }} />;
    if (index === 2)
      return <TrophyOutlined style={{ color: "#cd7f32", fontSize: 20 }} />;
    return null;
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarOutlined style={{ color: "#ffd700" }} />
          <span>{t[lang].title}</span>
        </div>
      }
      style={{ borderRadius: 12, marginTop: 24 }}
    >
      {employeeStats.length === 0 ? (
        <Empty description="Нет данных для рейтинга" />
      ) : (
        <List
          dataSource={employeeStats}
          renderItem={(emp, index) => {
            const depName = getDepartmentName?.(emp.departmentId);
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <div style={{ minWidth: 50, textAlign: "center" }}>
                      {getRankIcon(index)}
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: index < 3 ? "#ff4b2b" : "#666",
                        }}
                      >
                        #{index + 1}
                      </div>
                    </div>
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <Avatar
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#ff4b2b" }}
                      />
                      <Text strong>
                        {getEmployeeFio(emp) || `ID: ${emp.id}`}
                      </Text>
                      <Tag color="blue">{depName || t[lang].department}</Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title={t[lang].testsPassed}
                            value={emp.completedTests}
                            valueStyle={{ fontSize: 16 }}
                            prefix={<CheckCircleOutlined />}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title={t[lang].avgScore}
                            value={emp.avgScore}
                            suffix="%"
                            valueStyle={{
                              fontSize: 16,
                              color: emp.avgScore >= 70 ? "#52c41a" : "#ff4d4f",
                            }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title={t[lang].bestResult}
                            value={emp.bestScore}
                            suffix="%"
                            valueStyle={{ fontSize: 16, color: "#faad14" }}
                          />
                        </Col>
                      </Row>
                      <Progress
                        percent={emp.avgScore}
                        size="small"
                        strokeColor={
                          emp.avgScore >= 70
                            ? "#52c41a"
                            : emp.avgScore >= 50
                              ? "#faad14"
                              : "#ff4d4f"
                        }
                        showInfo={false}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

// ==================== МОДАЛКА ДЕТАЛЕЙ СЕССИИ ====================
const SessionDetailsModal = ({
  visible,
  session,
  onClose: onModalClose,
  tests: testsProp,
  employees: employeesProp,
  lang: langProp,
  getDepartmentName,
}) => {
  const [activeTab, setActiveTab] = useState("info");
  const test = testsProp.find((t) => Number(t.id) === Number(session?.testId));
  const employee = employeesProp.find(
    (e) => Number(e.id) === Number(session?.employeeId),
  );

  const getQuestionText = (questionId) => {
    const question = test?.questions?.find((q) => q.id === questionId);
    if (!question) return "—";
    return langProp === "ru"
      ? question.contentRu || question.content
      : question.contentTj || question.content;
  };

  const getAnswerText = (answer) => {
    const question = test?.questions?.find((q) => q.id === answer.questionId);
    const qType = getNumericType(question?.type);
    if (answer.optionId !== null && qType === 3)
      return `Рейтинг: ${answer.optionId}/10`;
    if (answer.optionId !== null && question?.options) {
      const option = question.options.find((o) => o.id === answer.optionId);
      return langProp === "ru"
        ? option?.textRu || option?.text
        : option?.textTj || option?.text;
    }
    if (answer.textAnswer) return answer.textAnswer;
    return "—";
  };

  return (
    <Modal
      title="Детали тестирования"
      open={visible}
      onCancel={onModalClose}
      footer={[
        <Button key="close" onClick={onModalClose}>
          Закрыть
        </Button>,
      ]}
      width={700}
    >
      {session && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Button
              type={activeTab === "info" ? "primary" : "default"}
              onClick={() => setActiveTab("info")}
              style={
                activeTab === "info"
                  ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                  : {}
              }
            >
              Информация
            </Button>
            <Button
              type={activeTab === "answers" ? "primary" : "default"}
              onClick={() => setActiveTab("answers")}
              style={
                activeTab === "answers"
                  ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                  : {}
              }
            >
              Ответы ({session.answers?.length || 0})
            </Button>
          </div>

          {activeTab === "info" && (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ID сессии">
                {session.id}
              </Descriptions.Item>
              <Descriptions.Item label="Сотрудник">
                {employee
                  ? getEmployeeFio(employee) || `ID: ${employee.id}`
                  : `ID: ${session.employeeId}`}
              </Descriptions.Item>
              <Descriptions.Item label="Отдел">
                {employee
                  ? getDepartmentName?.(employee.departmentId) || "—"
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Тест">
                {langProp === "ru"
                  ? test?.titleRu || test?.title
                  : test?.titleTj || test?.title}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                {getStatusNum(session.status) === 1 ? "В процессе" : "Завершен"}
              </Descriptions.Item>
              <Descriptions.Item label="Дата начала">
                {session.startedAt
                  ? new Date(session.startedAt).toLocaleString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Дата окончания">
                {session.finishedAt
                  ? new Date(session.finishedAt).toLocaleString()
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Длительность">
                {session.durationMinutes
                  ? `${Math.floor(session.durationMinutes)} мин ${Math.round((session.durationMinutes % 1) * 60)} сек`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Результат">
                {session.score !== null ? (
                  <Badge
                    count={`${session.score}%`}
                    style={{
                      backgroundColor:
                        session.score >= 70 ? "#52c41a" : "#ff4d4f",
                    }}
                  />
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Правильные ответы">
                {session.correctAnswersCount || 0}/
                {session.totalQuestionsCount || 0}
              </Descriptions.Item>
            </Descriptions>
          )}

          {activeTab === "answers" && (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {session.answers && session.answers.length > 0 ? (
                session.answers.map((answer, idx) => {
                  const question = test?.questions?.find(
                    (q) => q.id === answer.questionId,
                  );
                  const qType = getNumericType(question?.type);
                  return (
                    <Card
                      key={idx}
                      size="small"
                      style={{ marginBottom: 12, borderRadius: 8 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <Badge
                          count={idx + 1}
                          style={{
                            backgroundColor:
                              qType === 3
                                ? "#faad14"
                                : answer.isCorrect
                                  ? "#52c41a"
                                  : "#ff4d4f",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <Text strong>
                            {getQuestionText(answer.questionId)}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">Ответ: </Text>
                            <Text>{getAnswerText(answer)}</Text>
                          </div>
                          {qType !== 3 && (
                            <div style={{ marginTop: 4 }}>
                              {answer.isCorrect ? (
                                <Tag
                                  color="success"
                                  icon={<CheckCircleOutlined />}
                                >
                                  Правильно
                                </Tag>
                              ) : (
                                <Tag
                                  color="error"
                                  icon={<CloseCircleOutlined />}
                                >
                                  Неправильно
                                </Tag>
                              )}
                            </div>
                          )}
                          {qType === 3 && (
                            <div style={{ marginTop: 4 }}>
                              <Tag color="orange" icon={<StarOutlined />}>
                                Рейтинг сохранен
                              </Tag>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Empty description="Нет ответов" />
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
export const TestSession = ({ testData, onClose }) => {
  const {
    sessions = [],
    currentSession: storeCurrentSession,
    loading,
    startSession,
    submitAnswer,
    finishSession,
    fetchSessions,
    setCurrentSession,
    clearCurrentSession,
  } = useTestSessionStore();

  const { tests = [], fetchTests } = useTestStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();

 const [lang, setLang] = useState(
  () =>
    localStorage.getItem("test_manager_lang") ||
    localStorage.getItem("language") ||
    "ru"
);

useEffect(() => {
  const syncLang = () => {
    const newLang =
      localStorage.getItem("test_manager_lang") ||
      localStorage.getItem("language") ||
      "ru";
    setLang(newLang);
  };
  window.addEventListener("app-language-change", syncLang);
  window.addEventListener("storage", syncLang);
  window.addEventListener("focus", syncLang);
  return () => {
    window.removeEventListener("app-language-change", syncLang);
    window.removeEventListener("storage", syncLang);
    window.removeEventListener("focus", syncLang);
  };
}, []);

  const [showRanking, setShowRanking] = useState(() => {
    const saved = localStorage.getItem("testsession_show_ranking");
    return saved === null ? true : saved === "true";
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [manualAnswer, setManualAnswer] = useState("");
  const [ratingValue, setRatingValue] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [answersHistory, setAnswersHistory] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [currentSessionLocal, setCurrentSessionLocal] = useState(null);
  const [isTestActive, setIsTestActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState(
    Date.now(),
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedTestDuration, setSelectedTestDuration] = useState(5);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [extraEmployees, setExtraEmployees] = useState([]);
  const [departmentsLocal, setDepartmentsLocal] = useState([]);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const scrollRef = useRef(null);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter(
      (s) => getStatusNum(s.status) === 2,
    ).length;
    const inProgress = sessions.filter(
      (s) => getStatusNum(s.status) === 1,
    ).length;
    const completedWithScore = sessions.filter(
      (s) =>
        getStatusNum(s.status) === 2 &&
        s.score !== null &&
        s.score !== undefined,
    );
    const averageScore =
      completedWithScore.length > 0
        ? Math.round(
            completedWithScore.reduce((sum, s) => sum + (s.score || 0), 0) /
              completedWithScore.length,
          )
        : 0;
    return { total, completed, inProgress, averageScore };
  }, [sessions]);

  const paginatedSessions = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return sessions.slice(start, start + historyPageSize);
  }, [sessions, historyPage, historyPageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sessions.length / historyPageSize));
    if (historyPage > maxPage) setHistoryPage(maxPage);
  }, [sessions.length, historyPageSize, historyPage]);

  const getDepartmentName = useMemo(
    () => makeDepartmentResolver(departmentsLocal),
    [departmentsLocal],
  );

  const allEmployees = useMemo(() => {
    const map = new Map();
    [...employees, ...extraEmployees].forEach((e) => {
      if (e && e.id !== undefined) map.set(Number(e.id), e);
    });
    return [...map.values()];
  }, [employees, extraEmployees]);

  const getAttemptInfo = useCallback(
    (employeeId, testId) => {
      const completedSessions = sessions.filter(
        (s) =>
          Number(s.employeeId) === Number(employeeId) &&
          Number(s.testId) === Number(testId) &&
          getStatusNum(s.status) === 2,
      );
      const completedCount = completedSessions.length;
      const maxAttempts = 2;
      const remainingAttempts = Math.max(0, maxAttempts - completedCount);
      return {
        completed: completedCount,
        remaining: remainingAttempts,
        max: maxAttempts,
        current: Math.min(completedCount + 1, maxAttempts),
        canStart: completedCount < maxAttempts,
        isLastAttempt: completedCount === maxAttempts - 1,
        isCompleted: completedCount >= maxAttempts,
      };
    },
    [sessions],
  );

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchSessions(1, 1000),
          fetchTests(1, 1000, lang),
          fetchEmployee(1, 1000),
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }

      try {
        const res = await fetch(
          `${API_BASE}/Department?pageNumber=1&pageSize=1000`,
        );
        if (res.ok) {
          const data = await res.json();
          const arr = data?.data || data;
          setDepartmentsLocal(Array.isArray(arr) ? arr : []);
        }
      } catch (e) {
        console.warn("Не удалось загрузить отделы:", e);
      }
    };
    loadAllData();
  }, []);

  // при смене языка бэк отдаёт тесты на этом языке — перезапрашиваем
  const langMounted = useRef(false);
  useEffect(() => {
    if (!langMounted.current) {
      langMounted.current = true;
      return;
    }
    fetchTests(1, 1000, lang);
  }, [lang]);

  useEffect(() => {
    if (!dataLoaded || !sessions.length) return;
    const knownIds = new Set(
      [...employees, ...extraEmployees].map((e) => Number(e.id)),
    );
    const missingIds = [
      ...new Set(
        sessions
          .map((s) => Number(s.employeeId))
          .filter((id) => id && !knownIds.has(id)),
      ),
    ];
    if (missingIds.length === 0) return;

    let cancelled = false;
    const fetchMissing = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          const urls = [
            `${API_BASE}/Employee/${id}`,
            `${API_BASE}/Employee/GetById/${id}`,
          ];
          for (const url of urls) {
            try {
              const res = await fetch(url);
              if (res.ok) {
                const data = await res.json();
                const emp = data?.data || data;
                if (emp && (emp.id || emp.firstName || emp.lastName))
                  return emp;
              }
            } catch (e) {
              /* next url */
            }
          }
          return null;
        }),
      );
      if (cancelled) return;
      const valid = results.filter(Boolean);
      if (valid.length > 0) {
        setExtraEmployees((prev) => {
          const map = new Map();
          [...prev, ...valid].forEach((e) => map.set(Number(e.id), e));
          return [...map.values()];
        });
      }
    };
    fetchMissing();
    return () => {
      cancelled = true;
    };
  }, [dataLoaded, sessions.length, employees.length, extraEmployees.length]);

  const loadSavedAnswerForQuestion = useCallback(
    (questionIndex) => {
      const question = sessionQuestions[questionIndex];
      if (!question) return;
      setSelectedOptionId(null);
      setManualAnswer("");
      setRatingValue(null);
      const savedAnswer = currentSessionLocal?.answers?.find(
        (a) => a.questionId === question.id,
      );
      const qType = getNumericType(question.type);
      if (savedAnswer) {
        if (qType === 3) setRatingValue(savedAnswer.optionId);
        else if (
          savedAnswer.optionId !== null &&
          savedAnswer.optionId !== undefined
        )
          setSelectedOptionId(savedAnswer.optionId);
        else if (savedAnswer.textAnswer)
          setManualAnswer(savedAnswer.textAnswer);
      }
    },
    [sessionQuestions, currentSessionLocal],
  );

  const resetTestState = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setManualAnswer("");
    setRatingValue(null);
    setSessionQuestions([]);
    setAnswersHistory([]);
    setElapsedSeconds(0);
    setRemainingSeconds(0);
    setSessionComplete(false);
    setIsTestActive(false);
    setCurrentSessionLocal(null);
    setShowConfirmFinish(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (
        isTestActive &&
        currentSessionLocal &&
        !sessionComplete &&
        !isFinished
      ) {
        e.preventDefault();
        e.returnValue =
          "Вы проходите тестирование. Прогресс будет потерян. Вы уверены?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isTestActive, currentSessionLocal, sessionComplete, isFinished]);

  useEffect(() => {
    if (
      storeCurrentSession &&
      !sessionComplete &&
      !isTestActive &&
      !isFinished
    ) {
      setCurrentSessionLocal(storeCurrentSession);
      setIsTestActive(true);
      const elapsedTime = storeCurrentSession.elapsedSeconds || 0;
      setSessionStartTimestamp(Date.now() - elapsedTime * 1000);
      const duration =
        storeCurrentSession.durationMinutes || selectedTestDuration || 5;
      setSelectedTestDuration(duration);
      setRemainingSeconds(duration * 60 - elapsedTime);
    }
  }, [
    storeCurrentSession,
    sessionComplete,
    isTestActive,
    isFinished,
    selectedTestDuration,
  ]);

  useEffect(() => {
    if (!dataLoaded) return;
    const startNewTest = async () => {
      if (
        testData &&
        testData.action === "start" &&
        !isTestActive &&
        !sessionComplete &&
        !isFinished
      ) {
        try {
          const { testId, employeeId, duration, subDepartmentId } = testData;
          const session = await startSession(
            Number(testId),
            Number(employeeId),
            Number(duration) || 5,
            subDepartmentId ? Number(subDepartmentId) : null,
          );
          const test = tests.find((t) => Number(t.id) === Number(testId));
          if (test && test.questions) {
            setSessionQuestions(test.questions);
            setAnswersHistory(new Array(test.questions.length).fill(false));
          }
          setSelectedOptionId(null);
          setManualAnswer("");
          setRatingValue(null);
          setSessionComplete(false);
          setIsTestActive(true);
          setCurrentSessionLocal(session);
          setSessionStartTimestamp(Date.now());
          setElapsedSeconds(0);
          setRemainingSeconds(duration * 60);
          setSelectedTestDuration(duration);
          message.success(
            `Тест начат! Время: ${duration} минут. Желаем успеха!`,
          );
          await fetchSessions();
          if (scrollRef.current)
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
          console.error("Ошибка начала теста:", error);
          message.error(
            error?.response?.data?.message || "Ошибка при начале теста",
          );
        }
      }
    };
    startNewTest();
  }, [
    testData,
    dataLoaded,
    isTestActive,
    sessionComplete,
    isFinished,
    startSession,
    tests,
    fetchSessions,
  ]);

  const handleSubmitAnswer = async () => {
    if (!currentSessionLocal) {
      message.error("Сессия не найдена");
      return;
    }
    if (submitting) return;
    const currentQ = sessionQuestions[currentQuestionIndex];
    if (!currentQ) {
      message.error("Вопрос не найден");
      return;
    }
    const qType = getNumericType(currentQ.type);
    let optionId = null;
    let textAnswer = "";

    if (qType === 1) {
      if (selectedOptionId === null || selectedOptionId === undefined) {
        message.warning("Выберите вариант ответа");
        return;
      }
      optionId = selectedOptionId;
    } else if (qType === 2) {
      const trimmedAnswer = manualAnswer?.trim();
      if (!trimmedAnswer) {
        message.warning("Введите ответ");
        return;
      }
      textAnswer = trimmedAnswer;
    } else if (qType === 3) {
      if (ratingValue === null || ratingValue === undefined) {
        message.warning("Выберите рейтинг");
        return;
      }
      optionId = ratingValue;
      textAnswer = `Рейтинг: ${ratingValue}/10`;
    } else {
      message.error("Неизвестный тип вопроса");
      return;
    }

    setSubmitting(true);
    try {
      await submitAnswer(
        currentSessionLocal.id,
        currentQ.id,
        optionId,
        textAnswer,
      );
      const newHistory = [...answersHistory];
      newHistory[currentQuestionIndex] = true;
      setAnswersHistory(newHistory);
      const updatedSession = { ...currentSessionLocal };
      if (!updatedSession.answers) updatedSession.answers = [];
      const existingAnswerIndex = updatedSession.answers.findIndex(
        (a) => a.questionId === currentQ.id,
      );
      const newAnswer = {
        questionId: currentQ.id,
        optionId,
        textAnswer,
        answeredAt: new Date().toISOString(),
      };
      if (existingAnswerIndex !== -1)
        updatedSession.answers[existingAnswerIndex] = newAnswer;
      else updatedSession.answers.push(newAnswer);
      setCurrentSessionLocal(updatedSession);

      if (currentQuestionIndex + 1 >= sessionQuestions.length)
        setShowConfirmFinish(true);
      else {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setSelectedOptionId(null);
        setManualAnswer("");
        setRatingValue(null);
        setTimeout(() => loadSavedAnswerForQuestion(nextIndex), 50);
      }
      await fetchSessions();
      message.success("Ответ сохранен");
    } catch (error) {
      message.error(
        error.response?.data?.message || "Ошибка при отправке ответа",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ⭐ ЗАВЕРШЕНИЕ — без показа результата и без сообщений
  const handleFinishSession = async () => {
    if (!currentSessionLocal) return;
    setSubmitting(true);
    try {
      await finishSession(
        currentSessionLocal.id,
        currentSessionLocal.employeeId,
      );
      setSessionComplete(true);
      setShowConfirmFinish(false);
      setIsTestActive(false);
      setIsFinished(true);

      await fetchSessions();
      clearCurrentSession();
      resetTestState();

      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    } catch (error) {
      message.error(
        error.response?.data?.message || "Ошибка при завершении сессии",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const handleRetakeTest = async (testId, employeeId) => {
    try {
      const attemptInfo = getAttemptInfo(employeeId, testId);
      if (attemptInfo.isCompleted) {
        message.error("Вы уже использовали все 2 попытки.");
        return;
      }
      resetTestState();
      setIsFinished(false);
      const fullDuration = 10;
      const existingSessionForRetake = sessions.find(
        (s) =>
          Number(s.employeeId) === Number(employeeId) &&
          Number(s.testId) === Number(testId),
      );
      const subDepartmentIdForRetake =
        existingSessionForRetake?.subDepartmentId || null;
      const session = await startSession(
        testId,
        employeeId,
        fullDuration,
        subDepartmentIdForRetake,
      );
      const test = tests.find((t) => Number(t.id) === Number(testId));
      if (test && test.questions) {
        setSessionQuestions(test.questions);
        setAnswersHistory(new Array(test.questions.length).fill(false));
      }
      setCurrentQuestionIndex(0);
      setSelectedOptionId(null);
      setManualAnswer("");
      setRatingValue(null);
      setSessionComplete(false);
      setIsTestActive(true);
      setCurrentSessionLocal(session);
      setSessionStartTimestamp(Date.now());
      setElapsedSeconds(0);
      setRemainingSeconds(fullDuration * 60);
      setSelectedTestDuration(fullDuration);
      message.success(
        `Тест начат заново! Попытка ${attemptInfo.current + 1} из ${attemptInfo.max}.`,
      );
      await fetchSessions();
      if (scrollRef.current)
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      message.error(error.response?.data?.message || "Ошибка при начале теста");
    }
  };

  const handleContinueSession = useCallback(
    (session) => {
      setCurrentSession(session);
      setCurrentSessionLocal(session);
      const test = tests.find((t) => Number(t.id) === Number(session.testId));
      if (test && test.questions) {
        setSessionQuestions(test.questions);
        const answeredCount = session.answers?.length || 0;
        setCurrentQuestionIndex(answeredCount);
        const newHistory = new Array(test.questions.length).fill(false);
        session.answers?.forEach((answer) => {
          const qIndex = test.questions.findIndex(
            (q) => q.id === answer.questionId,
          );
          if (qIndex !== -1) newHistory[qIndex] = true;
        });
        setAnswersHistory(newHistory);
        setSelectedOptionId(null);
        setManualAnswer("");
        setRatingValue(null);
        setSessionComplete(false);
        setIsTestActive(true);
        const duration = session.durationMinutes || selectedTestDuration || 5;
        setSelectedTestDuration(duration);
        const elapsedSecondsSaved = session.elapsedSeconds || 0;
        const remaining = duration * 60 - elapsedSecondsSaved;
        setRemainingSeconds(remaining > 0 ? remaining : 0);
        setSessionStartTimestamp(Date.now() - elapsedSecondsSaved * 1000);
        setElapsedSeconds(elapsedSecondsSaved);
        if (answeredCount < test.questions.length)
          setTimeout(() => loadSavedAnswerForQuestion(answeredCount), 100);
        message.info(`Продолжение теста.`);
      }
    },
    [
      tests,
      selectedTestDuration,
      loadSavedAnswerForQuestion,
      setCurrentSession,
    ],
  );

  useEffect(() => {
    if (
      testData &&
      testData.action === "continue" &&
      testData.session &&
      !isTestActive &&
      !sessionComplete &&
      !isFinished &&
      dataLoaded
    ) {
      handleContinueSession(testData.session);
    }
  }, [
    testData,
    dataLoaded,
    isTestActive,
    sessionComplete,
    isFinished,
    handleContinueSession,
  ]);

  const handleQuestionNavigate = (index) => {
    if (submitting) return;
    setCurrentQuestionIndex(index);
    setSelectedOptionId(null);
    setManualAnswer("");
    setRatingValue(null);
    loadSavedAnswerForQuestion(index);
  };

  const handleRemainingChange = useCallback(
    (remaining) => setRemainingSeconds(remaining),
    [],
  );

  const handleRowClick = (record) => {
    setSelectedSessionForModal(record);
    setSessionModalVisible(true);
  };
  const answeredCount = answersHistory.filter((a) => a).length;
  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("testsession_lang", newLang);
  };

  const toggleRanking = () => {
    setShowRanking((prev) => {
      const next = !prev;
      localStorage.setItem("testsession_show_ranking", String(next));
      return next;
    });
  };

  // ============================================================
  // ЭКСПОРТ В EXCEL — ОБЩИЙ ОТЧЁТ
  // ============================================================
  const exportAllToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "HR System";
      workbook.created = new Date();

      const summarySheet = workbook.addWorksheet("Сводка", {
        properties: { tabColor: { argb: "FF4B2B" } },
      });
      summarySheet.addRow(["Отчёт по тестированиям"]);
      summarySheet.mergeCells("A1:C1");
      const titleRow = summarySheet.getRow(1);
      titleRow.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      titleRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4B2B" },
      };
      titleRow.alignment = { horizontal: "center", vertical: "middle" };
      summarySheet.getRow(1).height = 40;
      summarySheet.addRow([]);
      const statsData = [
        ["Показатель", "Значение"],
        ["Всего сессий", stats.total],
        ["Завершено", stats.completed],
        ["В процессе", stats.inProgress],
        ["Средний балл", `${stats.averageScore}%`],
      ];
      statsData.forEach((row) => {
        const r = summarySheet.addRow(row);
        r.font = { size: 12 };
        if (row[0] === "Показатель") {
          r.font = { bold: true };
          r.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE6E6E6" },
          };
        }
      });
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 20;

      const detailSheet = workbook.addWorksheet("Детали", {
        properties: { tabColor: { argb: "FF1890FF" } },
      });
      const headerRow = detailSheet.addRow([
        "ID",
        "Тест",
        "Сотрудник",
        "Отдел",
        "Email",
        "Статус",
        "Дата начала",
        "Дата завершения",
        "Длительность (мин)",
        "Результат",
        "Правильные ответы",
        "Всего вопросов",
      ]);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4B2B" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 28;

      sessions.forEach((session) => {
        const test = tests.find((t) => Number(t.id) === Number(session.testId));
        const employee = allEmployees.find(
          (e) => Number(e.id) === Number(session.employeeId),
        );
        const depName = employee
          ? getDepartmentName(employee.departmentId) || "—"
          : "—";

        const row = detailSheet.addRow([
          session.id,
          lang === "ru"
            ? test?.titleRu || test?.title || ""
            : test?.titleTj || test?.title || "",
          employee ? getEmployeeFio(employee) : `ID: ${session.employeeId}`,
          depName,
          employee?.email || "",
          getStatusNum(session.status) === 1 ? "В процессе" : "Завершен",
          session.startedAt ? new Date(session.startedAt).toLocaleString() : "",
          session.finishedAt
            ? new Date(session.finishedAt).toLocaleString()
            : "",
          session.durationMinutes || "",
          session.score !== null ? `${session.score}%` : "",
          session.correctAnswersCount || 0,
          session.totalQuestionsCount || 0,
        ]);
        row.alignment = { horizontal: "center", vertical: "middle" };
        row.height = 24;
      });

      detailSheet.getColumn(1).width = 8;
      detailSheet.getColumn(2).width = 30;
      detailSheet.getColumn(3).width = 30;
      detailSheet.getColumn(4).width = 28;
      detailSheet.getColumn(5).width = 28;
      detailSheet.getColumn(6).width = 15;
      detailSheet.getColumn(7).width = 22;
      detailSheet.getColumn(8).width = 22;
      detailSheet.getColumn(9).width = 15;
      detailSheet.getColumn(10).width = 15;
      detailSheet.getColumn(11).width = 18;
      detailSheet.getColumn(12).width = 16;
      detailSheet.autoFilter = { from: "A1", to: `L${sessions.length + 1}` };

      if (showRanking) {
        const rankingSheet = workbook.addWorksheet("Рейтинг", {
          properties: { tabColor: { argb: "FFFAAD14" } },
        });
        const employeeStats = allEmployees
          .map((emp) => {
            const empSessions = sessions.filter(
              (s) =>
                Number(s.employeeId) === Number(emp.id) &&
                getStatusNum(s.status) === 2 &&
                s.score !== null,
            );
            const completed = empSessions.length;
            const avgScore =
              completed > 0
                ? empSessions.reduce((sum, s) => sum + (s.score || 0), 0) /
                  completed
                : 0;
            const bestScore =
              completed > 0
                ? Math.max(...empSessions.map((s) => s.score || 0))
                : 0;
            return {
              ...emp,
              completed,
              avgScore: Math.round(avgScore),
              bestScore,
            };
          })
          .filter((emp) => emp.completed > 0)
          .sort((a, b) => b.avgScore - a.avgScore);

        if (employeeStats.length > 0) {
          const rankHeader = rankingSheet.addRow(["Рейтинг сотрудников"]);
          rankingSheet.mergeCells("A1:F1");
          rankHeader.font = {
            size: 16,
            bold: true,
            color: { argb: "FFFFFFFF" },
          };
          rankHeader.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAAD14" },
          };
          rankHeader.alignment = { horizontal: "center", vertical: "middle" };
          rankingSheet.getRow(1).height = 36;
          rankingSheet.addRow([]);

          const rankCols = rankingSheet.addRow([
            "Место",
            "Сотрудник",
            "Отдел",
            "Пройдено тестов",
            "Средний балл",
            "Лучший результат",
          ]);
          rankCols.font = { bold: true, color: { argb: "FFFFFFFF" } };
          rankCols.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4B2B" },
          };
          rankCols.alignment = { horizontal: "center", vertical: "middle" };
          rankCols.height = 28;

          employeeStats.forEach((emp, idx) => {
            const row = rankingSheet.addRow([
              idx + 1,
              getEmployeeFio(emp) || `ID: ${emp.id}`,
              getDepartmentName(emp.departmentId) || "—",
              emp.completed,
              `${emp.avgScore}%`,
              `${emp.bestScore}%`,
            ]);
            const placeCell = row.getCell(1);
            if (idx === 0)
              placeCell.font = {
                color: { argb: "FFFFD700" },
                bold: true,
                size: 14,
              };
            else if (idx === 1)
              placeCell.font = {
                color: { argb: "FFC0C0C0" },
                bold: true,
                size: 14,
              };
            else if (idx === 2)
              placeCell.font = {
                color: { argb: "FFCD7F32" },
                bold: true,
                size: 14,
              };
            row.alignment = { horizontal: "center", vertical: "middle" };
            row.height = 24;
          });

          rankingSheet.getColumn(1).width = 10;
          rankingSheet.getColumn(2).width = 30;
          rankingSheet.getColumn(3).width = 28;
          rankingSheet.getColumn(4).width = 18;
          rankingSheet.getColumn(5).width = 18;
          rankingSheet.getColumn(6).width = 20;
        } else {
          rankingSheet.addRow(["Нет данных для рейтинга"]);
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `test_sessions_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      message.success("Excel файл успешно создан!");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Ошибка при создании Excel файла");
    }
  };

  const exportSingleSessionToExcel = async (session) => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "HR System";
      const sheet = workbook.addWorksheet("Сессия", {
        properties: { tabColor: { argb: "FF4B2B" } },
      });
      sheet.addRow(["Отчёт по тестированию"]);
      sheet.mergeCells("A1:C1");
      const titleRow = sheet.getRow(1);
      titleRow.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      titleRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4B2B" },
      };
      titleRow.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 40;
      sheet.addRow([]);

      const test = tests.find((t) => Number(t.id) === Number(session.testId));
      const employee = allEmployees.find(
        (e) => Number(e.id) === Number(session.employeeId),
      );
      const depName = employee
        ? getDepartmentName(employee.departmentId) || "—"
        : "—";

      const infoData = [
        ["ID сессии", session.id],
        [
          "Сотрудник",
          employee ? getEmployeeFio(employee) : `ID: ${session.employeeId}`,
        ],
        ["Отдел", depName],
        ["Email", employee?.email || "—"],
        [
          "Тест",
          lang === "ru"
            ? test?.titleRu || test?.title || ""
            : test?.titleTj || test?.title || "",
        ],
        [
          "Статус",
          getStatusNum(session.status) === 1 ? "В процессе" : "Завершен",
        ],
        [
          "Дата начала",
          session.startedAt
            ? new Date(session.startedAt).toLocaleString()
            : "—",
        ],
        [
          "Дата завершения",
          session.finishedAt
            ? new Date(session.finishedAt).toLocaleString()
            : "—",
        ],
        [
          "Длительность",
          session.durationMinutes
            ? `${Math.floor(session.durationMinutes)} мин ${Math.round((session.durationMinutes % 1) * 60)} сек`
            : "—",
        ],
        ["Результат", session.score !== null ? `${session.score}%` : "—"],
        [
          "Правильные ответы",
          `${session.correctAnswersCount || 0}/${session.totalQuestionsCount || 0}`,
        ],
      ];

      infoData.forEach((row) => {
        const r = sheet.addRow(row);
        r.font = { size: 12 };
        r.getCell(1).font = { bold: true };
        r.alignment = { vertical: "middle" };
        r.height = 24;
      });
      sheet.getColumn(1).width = 30;
      sheet.getColumn(2).width = 45;

      if (session.answers && session.answers.length > 0) {
        const answerSheet = workbook.addWorksheet("Ответы", {
          properties: { tabColor: { argb: "FF52C41A" } },
        });
        const ansHeader = answerSheet.addRow([
          "№",
          "Вопрос",
          "Ответ",
          "Результат",
        ]);
        ansHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
        ansHeader.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF52C41A" },
        };
        ansHeader.alignment = { horizontal: "center", vertical: "middle" };
        ansHeader.height = 28;

        session.answers.forEach((answer, idx) => {
          const question = test?.questions?.find(
            (q) => q.id === answer.questionId,
          );
          const questionText =
            lang === "ru"
              ? question?.contentRu || question?.content || "—"
              : question?.contentTj || question?.content || "—";
          const qType = getNumericType(question?.type);
          let answerText = "—";
          if (answer.optionId !== null && qType === 3) {
            answerText = `Рейтинг: ${answer.optionId}/10`;
          } else if (answer.optionId !== null && question?.options) {
            const opt = question.options.find((o) => o.id === answer.optionId);
            answerText =
              lang === "ru"
                ? opt?.textRu || opt?.text
                : opt?.textTj || opt?.text;
          } else if (answer.textAnswer) {
            answerText = answer.textAnswer;
          }
          const isCorrect =
            answer.isCorrect !== undefined ? answer.isCorrect : null;
          answerSheet.addRow([
            idx + 1,
            questionText,
            answerText,
            qType === 3
              ? "Рейтинг"
              : isCorrect
                ? "✅ Правильно"
                : "❌ Неправильно",
          ]);
        });

        answerSheet.getColumn(1).width = 8;
        answerSheet.getColumn(2).width = 50;
        answerSheet.getColumn(3).width = 40;
        answerSheet.getColumn(4).width = 20;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `session_${session.id}_${employee?.firstName || ""}_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      message.success("Excel файл с деталями успешно создан!");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Ошибка при создании Excel файла");
    }
  };

  const historyColumns = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Тест",
      key: "test",
      render: (_, record) => {
        const test = tests.find((t) => Number(t.id) === Number(record.testId));
        if (!test) return `Тест ${record.testId}`;
        return lang === "ru"
          ? test.titleRu || test.title || `Тест ${record.testId}`
          : test.titleTj || test.title || `Тест ${record.testId}`;
      },
    },
    {
      title: "Сотрудник",
      key: "employee",
      render: (_, record) => {
        let emp = record.employee;
        if (!emp)
          emp = allEmployees.find(
            (e) =>
              Number(e.id) === Number(record.employeeId) ||
              String(e.id) === String(record.employeeId),
          );
        if (!emp) return <Text type="secondary">ID: {record.employeeId}</Text>;
        const fio = getEmployeeFio(emp) || `ID: ${emp.id}`;
        const depName = getDepartmentName(emp.departmentId);
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{fio}</div>
            {emp.email && (
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>{emp.email}</div>
            )}
            {depName && (
              <Tag color="blue" style={{ marginTop: 2, fontSize: 11 }}>
                {depName}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      render: (status) => {
        const s = getStatusNum(status);
        if (s === 1)
          return (
            <Tag color="processing" icon={<ClockCircleOutlined />}>
              В процессе
            </Tag>
          );
        if (s === 2)
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Завершен
            </Tag>
          );
        if (s === 0) return <Tag color="default">Не начат</Tag>;
        if (s === 3) return <Tag color="error">Отменен</Tag>;
        return <Tag color="warning">{String(status)}</Tag>;
      },
    },
    {
      title: "Длительность",
      dataIndex: "durationMinutes",
      render: (minutes) => {
        if (!minutes && minutes !== 0) return "—";
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${mins} мин ${secs} сек`;
      },
    },
    {
      title: "Начало",
      dataIndex: "startedAt",
      render: (date) => (date ? new Date(date).toLocaleString() : "—"),
    },
    {
      title: "Окончание",
      dataIndex: "finishedAt",
      render: (date) => (date ? new Date(date).toLocaleString() : "—"),
    },
    {
      title: "Результат",
      key: "score",
      render: (_, record) => {
        if (record.score !== null && record.score !== undefined) {
          return (
            <Badge
              count={`${record.score}%`}
              style={{
                backgroundColor: record.score >= 70 ? "#52c41a" : "#ff4d4f",
              }}
            />
          );
        }
        return "—";
      },
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => {
        const attemptInfo = getAttemptInfo(record.employeeId, record.testId);
        const isCompleted = attemptInfo.isCompleted;
        const statusNum = getStatusNum(record.status);
        return (
          <Space>
            {statusNum === 1 && (
              <Button
                size="small"
                type="primary"
                onClick={() => handleContinueSession(record)}
                style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              >
                Продолжить
              </Button>
            )}
            {statusNum === 2 && !isCompleted && (
              <Tooltip
                title={`Осталось ${attemptInfo.remaining} попыток из ${attemptInfo.max}`}
              >
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    handleRetakeTest(record.testId, record.employeeId)
                  }
                  danger
                >
                  Пройти снова
                </Button>
              </Tooltip>
            )}
            {statusNum === 2 && isCompleted && (
              <Tooltip title="Все 2 попытки использованы">
                <Button size="small" disabled>
                  Пройти снова
                </Button>
              </Tooltip>
            )}
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(record);
              }}
            >
              Детали
            </Button>
            <Button
              size="small"
              icon={<FileExcelOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                exportSingleSessionToExcel(record);
              }}
            >
              Экспорт
            </Button>
          </Space>
        );
      },
    },
  ];

  const t = {
    ru: {
      title: "Тестирование сотрудников",
      finish: "Завершить",
      next: "Следующий",
      previous: "Предыдущий",
      questionNavigation: "Навигация по вопросам",
      questionNumber: "Вопрос",
      answered: "Отвечен",
      unanswered: "Не отвечен",
      current: "Текущий",
      yourProgress: "Ваш прогресс",
      questionsAnswered: "вопросов отвечено",
      testInfo: "Информация о тесте",
      questionsCount: "Количество вопросов",
      estimatedTime: "Примерное время",
      confirmFinish: "Завершить тестирование?",
      confirmFinishText: "Вы уверены, что хотите завершить тестирование?",
      yes: "Да",
      no: "Нет",
      minutes: "минут",
      loading: "Загрузка...",
      totalSessions: "Всего сессий",
      completedSessions: "Завершено",
      inProgressSessions: "В процессе",
      averageScore: "Средний балл",
      noSessions: "Нет сессий тестирования",
      exportAll: "Экспорт всех",
      details: "Детали",
      ranking: "Рейтинг сотрудников",
      viewDetails: "Детали",
      history: "История тестирований",
      attempt: "Попытка",
      of: "из",
      retake: "Пройти снова",
      attemptsLeft: "Осталось попыток",
      hideRanking: "Скрыть рейтинг",
      showRanking: "Показать рейтинг",
    },
    tj: {
      title: "Тестировании кормандон",
      finish: "Анҷом додан",
      next: "Баъдӣ",
      previous: "Қаблӣ",
      questionNavigation: "Навигатсияи саволҳо",
      questionNumber: "Савол",
      answered: "Ҷавоб дода шудааст",
      unanswered: "Ҷавоб дода нашудааст",
      current: "Ҷорӣ",
      yourProgress: "Пешрафти шумо",
      questionsAnswered: "саволҳо ҷавоб дода шуданд",
      testInfo: "Маълумот дар бораи тест",
      questionsCount: "Миқдори саволҳо",
      estimatedTime: "Вақти тахминӣ",
      confirmFinish: "Тестированиро анҷом додан?",
      confirmFinishText: "Шумо боварӣ доред?",
      yes: "Ҳа",
      no: "Не",
      minutes: "дақиқа",
      loading: "Боркунӣ...",
      totalSessions: "Ҳамагӣ сессияҳо",
      completedSessions: "Анҷомёфта",
      inProgressSessions: "Дар раванд",
      averageScore: "Балли миёна",
      noSessions: "Сессияҳои тестирование нестанд",
      exportAll: "Содироти ҳама",
      details: "Тафсилот",
      ranking: "Рейтинги кормандон",
      viewDetails: "Тафсилот",
      history: "Таърихи тестирование",
      attempt: "Кӯшиш",
      of: "аз",
      retake: "Аз нав супоридан",
      attemptsLeft: "Кӯшишҳои боқимонда",
      hideRanking: "Пинҳон кардани рейтинг",
      showRanking: "Нишон додани рейтинг",
    },
  };

  if (loading && sessions.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 50,
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spin size="small" tip={t[lang].loading} />
      </div>
    );
  }

  const attemptInfo = currentSessionLocal
    ? getAttemptInfo(currentSessionLocal.employeeId, currentSessionLocal.testId)
    : { current: 1, max: 2 };

  return (
    <div
      ref={scrollRef}
      style={{ padding: 30, background: "#f0f2f5", minHeight: "100vh" }}
    >
      <style>{`
        .red-pagination .ant-pagination-item-active {
          background: #ff4b2b !important;
          border-color: #ff4b2b !important;
        }
        .red-pagination .ant-pagination-item-active a {
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .red-pagination .ant-pagination-item:hover {
          border-color: #ff4b2b !important;
        }
        .red-pagination .ant-pagination-item:hover a {
          color: #ff4b2b !important;
        }
        .red-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
        .red-pagination .ant-pagination-next:hover .ant-pagination-item-link {
          color: #ff4b2b !important;
          border-color: #ff4b2b !important;
        }
      `}</style>

      {/* ⭐ TestResultsModal УБРАН */}

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, color: "#ff4b2b" }}>
              <BookOutlined /> {t[lang].title}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Всего {tests.length} тестов • Всего {sessions.length} сессий
            </Text>
          </div>
          <Space>
            <Button
              type={lang === "ru" ? "primary" : "default"}
              onClick={() => handleSetLang("ru")}
              style={
                lang === "ru"
                  ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                  : {}
              }
            >
              RU
            </Button>
            <Button
              type={lang === "tj" ? "primary" : "default"}
              onClick={() => handleSetLang("tj")}
              style={
                lang === "tj"
                  ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                  : {}
              }
            >
              TJ
            </Button>

            <Tooltip
              title={showRanking ? t[lang].hideRanking : t[lang].showRanking}
            >
              <Button
                icon={showRanking ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={toggleRanking}
              >
                {showRanking ? t[lang].hideRanking : t[lang].showRanking}
              </Button>
            </Tooltip>

            <Button icon={<FileExcelOutlined />} onClick={exportAllToExcel}>
              {t[lang].exportAll}
            </Button>
          </Space>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card style={{ borderRadius: 12 }}>
          <Statistic
            title={t[lang].totalSessions}
            value={stats.total}
            prefix={<FileDoneOutlined />}
            valueStyle={{ color: "#3f8600" }}
          />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic
            title={t[lang].completedSessions}
            value={stats.completed}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic
            title={t[lang].inProgressSessions}
            value={stats.inProgress}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic
            title={t[lang].averageScore}
            value={stats.averageScore}
            suffix="%"
            prefix={<TrophyOutlined />}
            valueStyle={{ color: "#faad14" }}
          />
        </Card>
      </div>

      {isTestActive &&
        currentSessionLocal &&
        !sessionComplete &&
        !isFinished &&
        sessionQuestions.length > 0 && (
          <>
            <Card
              style={{
                marginBottom: 16,
                borderRadius: 12,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Row gutter={16} align="middle">
                <Col>
                  <Avatar
                    icon={<BookOutlined />}
                    style={{ backgroundColor: "#fff", color: "#667eea" }}
                  />
                </Col>
                <Col flex="auto">
                  <div>
                    <Text strong style={{ color: "#fff", fontSize: 16 }}>
                      {lang === "ru"
                        ? tests.find(
                            (t) =>
                              Number(t.id) ===
                              Number(currentSessionLocal.testId),
                          )?.titleRu || "Тест"
                        : tests.find(
                            (t) =>
                              Number(t.id) ===
                              Number(currentSessionLocal.testId),
                          )?.titleTj || "Тест"}
                    </Text>
                    <br />
                    <Text style={{ color: "#fff", opacity: 0.9 }}>
                      {(() => {
                        const emp =
                          currentSessionLocal?.employee ||
                          allEmployees.find(
                            (e) =>
                              Number(e.id) ===
                              Number(currentSessionLocal?.employeeId),
                          );
                        if (!emp)
                          return `ID: ${currentSessionLocal?.employeeId || ""}`;
                        return getEmployeeFio(emp) || `ID: ${emp.id}`;
                      })()}
                    </Text>
                  </div>
                </Col>
                <Col>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 28,
                        fontWeight: "bold",
                      }}
                    >
                      {answeredCount}/{sessionQuestions.length}
                    </Text>
                    <br />
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      {t[lang].questionsAnswered}
                    </Text>
                  </div>
                </Col>
                <Col>
                  <div style={{ textAlign: "center" }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      {Math.floor(remainingSeconds / 60)}:
                      {Math.floor(remainingSeconds % 60)
                        .toString()
                        .padStart(2, "0")}
                    </Text>
                    <br />
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      осталось
                    </Text>
                  </div>
                </Col>
              </Row>
              <Progress
                percent={Math.round(
                  (answeredCount / sessionQuestions.length) * 100,
                )}
                strokeColor="#fff"
                railColor="rgba(255,255,255,0.3)"
                showInfo={false}
                style={{ marginTop: 12 }}
              />
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 320px",
                gap: 24,
              }}
            >
              <div>
                <Card style={{ borderRadius: 12 }}>
                  <Timer
                    minutes={selectedTestDuration}
                    onTimeEnd={handleFinishSession}
                    isActive={true}
                    onTick={setElapsedSeconds}
                    onRemainingChange={handleRemainingChange}
                    startTimestamp={sessionStartTimestamp}
                  />
                  <Divider />
                  <QuestionCard
                    question={sessionQuestions[currentQuestionIndex]}
                    index={currentQuestionIndex}
                    total={sessionQuestions.length}
                    selectedOption={selectedOptionId}
                    onSelectOption={setSelectedOptionId}
                    manualAnswer={manualAnswer}
                    onManualAnswerChange={setManualAnswer}
                    ratingValue={ratingValue}
                    onRatingChange={setRatingValue}
                    lang={lang}
                  />
                  <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                    <Button
                      size="large"
                      icon={<ArrowLeftOutlined />}
                      onClick={() => {
                        if (currentQuestionIndex > 0) {
                          const newIndex = currentQuestionIndex - 1;
                          setCurrentQuestionIndex(newIndex);
                          setSelectedOptionId(null);
                          setManualAnswer("");
                          setRatingValue(null);
                          loadSavedAnswerForQuestion(newIndex);
                        }
                      }}
                      disabled={currentQuestionIndex === 0 || submitting}
                      style={{ flex: 1 }}
                    >
                      {t[lang].previous}
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={
                        currentQuestionIndex + 1 === sessionQuestions.length ? (
                          <FlagOutlined />
                        ) : (
                          <ArrowRightOutlined />
                        )
                      }
                      onClick={handleSubmitAnswer}
                      style={{
                        flex: 1,
                        background: "#ff4b2b",
                        borderColor: "#ff4b2b",
                      }}
                      loading={submitting}
                    >
                      {currentQuestionIndex + 1 === sessionQuestions.length
                        ? t[lang].finish
                        : t[lang].next}
                    </Button>
                  </div>
                </Card>
              </div>
              <div>
                <Card title={t[lang].yourProgress} style={{ borderRadius: 12 }}>
                  <Progress
                    percent={Math.round(
                      (answeredCount / sessionQuestions.length) * 100,
                    )}
                    status="active"
                    strokeColor="#ff4b2b"
                    size={["100%", 12]}
                  />
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {answeredCount} из {sessionQuestions.length}{" "}
                    {t[lang].questionsAnswered}
                  </Text>
                </Card>
                <Card
                  title={t[lang].questionNavigation}
                  style={{ marginTop: 16, borderRadius: 12 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: 8,
                    }}
                  >
                    {sessionQuestions.map((_, idx) => (
                      <Tooltip
                        key={idx}
                        title={`${t[lang].questionNumber} ${idx + 1} - ${answersHistory[idx] ? t[lang].answered : t[lang].unanswered}`}
                      >
                        <Button
                          size="small"
                          type={
                            currentQuestionIndex === idx ? "primary" : "default"
                          }
                          style={{
                            backgroundColor: answersHistory[idx]
                              ? "#52c41a"
                              : undefined,
                            borderColor:
                              currentQuestionIndex === idx
                                ? "#ff4b2b"
                                : undefined,
                            color:
                              answersHistory[idx] &&
                              currentQuestionIndex !== idx
                                ? "white"
                                : undefined,
                          }}
                          onClick={() => handleQuestionNavigate(idx)}
                          disabled={submitting}
                        >
                          {idx + 1}
                          {answersHistory[idx] && (
                            <CheckCircleOutlined
                              style={{ fontSize: 10, marginLeft: 2 }}
                            />
                          )}
                        </Button>
                      </Tooltip>
                    ))}
                  </div>
                  <Divider />
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      justifyContent: "center",
                    }}
                  >
                    <div>
                      <Badge color="#52c41a" text={t[lang].answered} />
                    </div>
                    <div>
                      <Badge color="#d9d9d9" text={t[lang].unanswered} />
                    </div>
                    <div>
                      <Badge color="#ff4b2b" text={t[lang].current} />
                    </div>
                  </div>
                </Card>
                <Card
                  title={t[lang].testInfo}
                  style={{ marginTop: 16, borderRadius: 12 }}
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={t[lang].questionsCount}>
                      {sessionQuestions.length}
                    </Descriptions.Item>
                    <Descriptions.Item label={t[lang].estimatedTime}>
                      {selectedTestDuration} {t[lang].minutes}
                    </Descriptions.Item>
                    <Descriptions.Item label="Попытка">
                      {attemptInfo.current} из {attemptInfo.max}
                    </Descriptions.Item>
                    {attemptInfo.remaining > 0 && (
                      <Descriptions.Item label="Осталось попыток">
                        {attemptInfo.remaining}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </div>
            </div>
          </>
        )}

      {!isTestActive && showRanking && (
        <EmployeeRanking
          sessions={sessions}
          employees={allEmployees}
          tests={tests}
          lang={lang}
          getDepartmentName={getDepartmentName}
        />
      )}

      {(!isTestActive || sessionComplete) && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HistoryOutlined />
              <span>{t[lang].history}</span>
              {sessions.length > 0 && (
                <Tag color="red" style={{ marginLeft: 8, borderRadius: 20 }}>
                  {sessions.length}
                </Tag>
              )}
            </div>
          }
          style={{ borderRadius: 12, marginTop: !isTestActive ? 24 : 0 }}
        >
          {!sessions || sessions.length === 0 ? (
            <Empty description={t[lang].noSessions} />
          ) : (
            <>
              <Table
                dataSource={paginatedSessions}
                columns={historyColumns}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1400 }}
                loading={loading}
              />
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Pagination
                  className="red-pagination"
                  current={historyPage}
                  pageSize={historyPageSize}
                  total={sessions.length}
                  showSizeChanger={false}
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} из ${total} сессий`
                  }
                  onChange={(page, size) => {
                    if (size !== historyPageSize) {
                      setHistoryPageSize(size);
                      setHistoryPage(1);
                    } else {
                      setHistoryPage(page);
                    }
                  }}
                />
              </div>
            </>
          )}
        </Card>
      )}

      <SessionDetailsModal
        visible={sessionModalVisible}
        session={selectedSessionForModal}
        onClose={() => {
          setSessionModalVisible(false);
          setSelectedSessionForModal(null);
        }}
        tests={tests}
        employees={allEmployees}
        lang={lang}
        getDepartmentName={getDepartmentName}
      />

      <Modal
        title={t[lang].confirmFinish}
        open={showConfirmFinish}
        onOk={handleFinishSession}
        onCancel={() => setShowConfirmFinish(false)}
        okText={t[lang].yes}
        cancelText={t[lang].no}
        okButtonProps={{ danger: true }}
      >
        <Alert message={t[lang].confirmFinishText} type="warning" showIcon />
      </Modal>
    </div>
  );
};

export default TestSession;
