// TestSession.jsx - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
import { useEffect, useState, useCallback, useRef } from "react";
import { useTestSessionStore } from "../store/useTestSession";
import { useTestStore } from "../store/useTest";
import { useEmployeeStore } from "../store/useEmployee";
import { useQuestionStore } from "../store/useQuestion";
import { useTestAssignmentStore } from "../store/useTestAssignment";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import * as XLSX from "xlsx";
import {
  Button,
  Modal,
  Select,
  Space,
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
  Table,
  Alert,
  Descriptions,
  Statistic,
  Badge,
  Divider,
  Tooltip,
  Empty,
  Avatar,
  List,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  FileExcelOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  HistoryOutlined,
  HourglassOutlined,
  UserOutlined,
  BookOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  WarningOutlined,
  FlagOutlined,
  StopOutlined,
  StarOutlined,
  TeamOutlined,
  CrownOutlined,
  ReloadOutlined,
  EyeOutlined,
  SaveOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
    if (startTimestamp) {
      initialStartTimestampRef.current = startTimestamp;
    }
  }, [startTimestamp]);

  useEffect(() => {
    if (minutes && !isActive) {
      setDisplayTime(minutes * 60);
    }
  }, [minutes, isActive]);

  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatElapsed = (seconds) => {
    if (seconds < 0) seconds = 0;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}ч ${mins}м ${secs}с`;
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

      if (onRemainingChange) {
        onRemainingChange(remaining);
      }

      if (onTick) {
        onTick(elapsedSecondsFromStart);
      }

      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onTimeEnd) {
          onTimeEnd();
        }
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
            strokeWidth={16}
            trailColor="#f0f0f0"
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

// ==================== ВЫБОР РЕЙТИНГА ====================
const RatingSelector = ({ value, onChange, disabled = false }) => {
  const ratingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: 8 }}
    >
      {ratingOptions.map((num) => {
        const active = value === num;
        return (
          <div
            key={num}
            onClick={() => !disabled && onChange(num)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              cursor: disabled ? "not-allowed" : "pointer",
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
    if (lang === "ru") {
      return q.contentRu || q.content || "—";
    }
    return q.contentTj || q.content || "—";
  };

  const getOptionText = (option) => {
    if (!option) return "—";
    if (lang === "ru") {
      return option.textRu || option.text || "—";
    }
    return option.textTj || option.text || "—";
  };

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

      <Paragraph style={{ fontSize: 18, fontWeight: 500, marginBottom: 24 }}>
        {getQuestionText(question)}
      </Paragraph>

      <Divider orientation="left" style={{ fontSize: 14, margin: "16px 0" }}>
        <Text type="secondary">{t[lang].yourAnswer}</Text>
      </Divider>

      {question?.type === 1 && (
        <Radio.Group
          value={selectedOption}
          onChange={(e) => onSelectOption(e.target.value)}
          style={{ width: "100%" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {question?.options?.map((option, idx) => {
              const isSelected = selectedOption === (option.id || idx);
              return (
                <div
                  key={option.id || idx}
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
                  onClick={() => onSelectOption(option.id || idx)}
                >
                  <Radio value={option.id || idx}>
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

      {question?.type === 2 && (
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

      {question?.type === 3 && (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            {t[lang].selectRating}
          </Text>
          <RatingSelector value={ratingValue} onChange={onRatingChange} />
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

// ==================== РЕЙТИНГ СОТРУДНИКОВ ====================
const EmployeeRanking = ({ sessions, employees, tests, lang }) => {
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
          s.employeeId === employee.id && s.status === 2 && s.score !== null,
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
          renderItem={(emp, index) => (
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
                      {emp.firstName} {emp.lastName}
                    </Text>
                    <Tag color="blue">
                      {emp.department || t[lang].department}
                    </Tag>
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
          )}
        />
      )}
    </Card>
  );
};

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
export const TestSession = () => {
  const {
    sessions = [],
    currentSession: storeCurrentSession,
    loading,
    pagination,
    startSession,
    submitAnswer,
    finishSession,
    fetchSessions,
    setCurrentSession,
    clearCurrentSession,
    getStats,
  } = useTestSessionStore();

  const { tests = [], fetchTests } = useTestStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { questions = [], fetchQuestions } = useQuestionStore();
  
  const { 
    testAssignments = [], 
    fetchTestAssignments,
  } = useTestAssignmentStore();

  const { 
    subdepartments = [], 
    fetchSubDepartments 
  } = useSubDepartmentStore();

  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("testsession_lang");
    return savedLang || "ru";
  });

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedSubDepartmentId, setSelectedSubDepartmentId] = useState(null);
  const [selectedTestDuration, setSelectedTestDuration] = useState(5);
  const [userManuallyChangedDuration, setUserManuallyChangedDuration] =
    useState(false);

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
  const [canStartTest, setCanStartTest] = useState(true);
  const [existingSession, setExistingSession] = useState(null);
  const [currentSessionLocal, setCurrentSessionLocal] = useState(null);
  const [isTestActive, setIsTestActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState(
    Date.now(),
  );
  const [showRanking, setShowRanking] = useState(true);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [finishResultModal, setFinishResultModal] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const scrollRef = useRef(null);
  
  // ============ ПРАВИЛЬНЫЙ URL БЕКЕНДА ============
  const API_BASE = "http://10.65.10.22:8525/api";

  // Группировка сотрудников по отделам
  const groupedEmployees = employees.reduce((groups, employee) => {
    const department = employee.department || "Без отдела";
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(employee);
    return groups;
  }, {});

  const stats = getStats();

  // Функция проверки - можно начать тест если меньше 2 завершенных сессий
  const checkCanStartTest = useCallback(
    (employeeId, testId) => {
      const employeeSessions = sessions.filter(
        (s) =>
          s.employeeId === employeeId && s.testId === testId && s.status === 2,
      );
      return employeeSessions.length < 2;
    },
    [sessions],
  );

  // ============ ФУНКЦИЯ ПОЛУЧЕНИЯ ОТДЕЛЕНИЯ ============
  // Сначала проверяем у сотрудника, если нет - ищем в назначениях
  const getEmployeeSubDepartment = useCallback((employeeId) => {
    // 1. Ищем сотрудника
    const employee = employees.find(e => e.id === employeeId);
    if (employee?.subDepartmentId) {
      return employee.subDepartmentId;
    }
    
    // 2. Если у сотрудника нет - ищем в назначениях
    const assignment = testAssignments.find(a => a.employeeId === employeeId);
    if (assignment?.subDepartmentId) {
      return assignment.subDepartmentId;
    }
    
    return null;
  }, [employees, testAssignments]);

  // Функция получения названия отделения
  const getSubDepartmentName = useCallback((id) => {
    if (!id) return "—";
    const sub = subdepartments.find(s => Number(s.id) === Number(id));
    return sub?.name || `Отделение ${id}`;
  }, [subdepartments]);

  // ============ СОЗДАНИЕ НАЗНАЧЕНИЯ (БЕЗ subDepartmentId) ============
  const createAssignmentViaAPI = useCallback(async (testId, employeeId) => {
    try {
      console.log("📤 СОЗДАНИЕ НАЗНАЧЕНИЯ...");
      console.log("  Test ID:", testId);
      console.log("  Employee ID:", employeeId);
      
      const url = `${API_BASE}/TestAssignment`;
      
      // ВАЖНО: НЕ ПЕРЕДАЕМ subDepartmentId!
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: Number(testId),
          employeeId: Number(employeeId)
        })
      });
      
      console.log("  Status:", response.status);
      
      const text = await response.text();
      console.log("📥 Ответ:", text);
      
      if (response.ok || response.status === 200) {
        console.log("✅ Назначение создано!");
        await fetchTestAssignments(1, 1000);
        return true;
      }
      
      if (response.status === 409) {
        console.log("ℹ️ Назначение уже существует");
        await fetchTestAssignments(1, 1000);
        return true;
      }
      
      console.error("❌ Ошибка:", text);
      return false;
      
    } catch (error) {
      console.error("❌ Ошибка создания:", error);
      return false;
    }
  }, [API_BASE, fetchTestAssignments]);

  // ЗАГРУЗКА ВСЕХ ДАННЫХ
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchSessions(),
          fetchTests(),
          fetchEmployee(),
          fetchQuestions(),
          fetchSubDepartments(),
          fetchTestAssignments(1, 1000),
        ]);
        setDataLoaded(true);
        console.log("✅ Все данные загружены");
        console.log("📋 Сотрудников:", employees.length);
        console.log("📋 Тестов:", tests.length);
        console.log("📋 Отделений:", subdepartments.length);
        console.log("📋 Назначений:", testAssignments.length);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }
    };
    
    loadAllData();
  }, []);

  // ============ ПОЛУЧЕНИЕ ОТДЕЛЕНИЯ ПРИ ВЫБОРЕ СОТРУДНИКА ============
  useEffect(() => {
    if (!dataLoaded) return;
    
    if (selectedEmployeeId) {
      const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);
      
      if (subDeptId) {
        setSelectedSubDepartmentId(subDeptId);
        console.log("✅ Отделение найдено:", subDeptId);
      } else {
        setSelectedSubDepartmentId(null);
        console.log("⚠️ У сотрудника нет отделения");
      }
    } else {
      setSelectedSubDepartmentId(null);
    }
  }, [selectedEmployeeId, dataLoaded, getEmployeeSubDepartment]);

  // Функция загрузки сохраненного ответа для вопроса
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

      if (savedAnswer) {
        if (question.type === 3) {
          setRatingValue(savedAnswer.optionId);
        } else if (
          savedAnswer.optionId !== null &&
          savedAnswer.optionId !== undefined
        ) {
          setSelectedOptionId(savedAnswer.optionId);
        } else if (savedAnswer.textAnswer) {
          setManualAnswer(savedAnswer.textAnswer);
        }
      }
    },
    [sessionQuestions, currentSessionLocal],
  );

  // Функция сохранения состояния теста в localStorage
  const saveTestState = useCallback(() => {
    if (
      !isTestActive ||
      !currentSessionLocal ||
      !sessionQuestions.length ||
      sessionComplete
    )
      return;

    const testState = {
      sessionId: currentSessionLocal.id,
      testId: currentSessionLocal.testId,
      employeeId: currentSessionLocal.employeeId,
      subDepartmentId: currentSessionLocal.subDepartmentId,
      currentQuestionIndex,
      selectedOptionId,
      manualAnswer,
      ratingValue,
      answersHistory,
      elapsedSeconds,
      remainingSeconds,
      sessionStartTimestamp,
      duration: selectedTestDuration,
      answeredCount: answersHistory.filter((a) => a).length,
      savedAt: Date.now(),
    };

    localStorage.setItem("active_test_state", JSON.stringify(testState));
    localStorage.setItem(
      "active_test_session",
      JSON.stringify(currentSessionLocal),
    );
    setLastSaved(new Date());
  }, [
    isTestActive,
    currentSessionLocal,
    sessionQuestions.length,
    sessionComplete,
    currentQuestionIndex,
    selectedOptionId,
    manualAnswer,
    ratingValue,
    answersHistory,
    elapsedSeconds,
    remainingSeconds,
    sessionStartTimestamp,
    selectedTestDuration,
  ]);

  // Функция восстановления состояния теста
  const restoreTestState = useCallback(async () => {
    const savedStateStr = localStorage.getItem("active_test_state");
    const savedSessionStr = localStorage.getItem("active_test_session");

    if (!savedStateStr || !savedSessionStr) return false;

    try {
      const savedState = JSON.parse(savedStateStr);
      const savedSession = JSON.parse(savedSessionStr);

      const timeSinceSave = Date.now() - savedState.savedAt;
      if (timeSinceSave > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("active_test_state");
        localStorage.removeItem("active_test_session");
        return false;
      }

      const sessionExists = sessions.find(
        (s) => s.id === savedState.sessionId && s.status === 1,
      );
      if (!sessionExists) {
        localStorage.removeItem("active_test_state");
        localStorage.removeItem("active_test_session");
        return false;
      }

      const test = tests.find((t) => t.id === savedState.testId);
      if (test && test.questions) {
        setSessionQuestions(test.questions);
      }

      setCurrentSessionLocal(savedSession);
      setCurrentQuestionIndex(savedState.currentQuestionIndex);
      setSelectedOptionId(savedState.selectedOptionId);
      setManualAnswer(savedState.manualAnswer || "");
      setRatingValue(savedState.ratingValue || null);
      setAnswersHistory(savedState.answersHistory);
      setElapsedSeconds(savedState.elapsedSeconds);
      setRemainingSeconds(savedState.remainingSeconds);
      setSessionStartTimestamp(savedState.sessionStartTimestamp);
      setSelectedTestDuration(savedState.duration);
      setIsTestActive(true);
      setSessionComplete(false);

      setTimeout(() => {
        loadSavedAnswerForQuestion(savedState.currentQuestionIndex);
      }, 100);

      message.success(
        `Тест восстановлен! Вопрос ${savedState.currentQuestionIndex + 1} из ${savedState.answersHistory.length}`,
      );
      return true;
    } catch (error) {
      console.error("Ошибка восстановления состояния:", error);
      localStorage.removeItem("active_test_state");
      localStorage.removeItem("active_test_session");
      return false;
    }
  }, [sessions, tests, loadSavedAnswerForQuestion]);

  // ПОЛНАЯ ОЧИСТКА ВСЕХ ДАННЫХ ТЕСТА
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
    setLastSaved(null);
    localStorage.removeItem("active_test_state");
    localStorage.removeItem("active_test_session");
  };

  // Предупреждение при обновлении страницы
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isTestActive && currentSessionLocal && !sessionComplete) {
        saveTestState();
        e.preventDefault();
        e.returnValue =
          "Вы проходите тестирование. Прогресс будет сохранен. Вы уверены?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTestActive, currentSessionLocal, sessionComplete, saveTestState]);

  // Восстановление состояния после загрузки данных
  useEffect(() => {
    const restore = async () => {
      if (
        !isRestoring &&
        !isTestActive &&
        !sessionComplete &&
        sessions.length > 0 &&
        tests.length > 0 &&
        dataLoaded
      ) {
        setIsRestoring(true);
        await restoreTestState();
        setIsRestoring(false);
      }
    };

    restore();
  }, [
    sessions.length,
    tests.length,
    isTestActive,
    sessionComplete,
    restoreTestState,
    dataLoaded,
  ]);

  // Периодическое сохранение состояния
  useEffect(() => {
    if (!isTestActive || !currentSessionLocal || sessionComplete) return;

    const saveInterval = setInterval(() => {
      saveTestState();
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [isTestActive, currentSessionLocal, sessionComplete, saveTestState]);

  // Сохраняем состояние при изменении важных параметров
  useEffect(() => {
    if (isTestActive && currentSessionLocal && !sessionComplete) {
      saveTestState();
    }
  }, [
    currentQuestionIndex,
    answersHistory,
    selectedOptionId,
    manualAnswer,
    ratingValue,
    elapsedSeconds,
    remainingSeconds,
  ]);

  // Обработка storeCurrentSession
  useEffect(() => {
    if (storeCurrentSession && !sessionComplete && !isTestActive) {
      setCurrentSessionLocal(storeCurrentSession);
      setIsTestActive(true);
      const elapsedTime = storeCurrentSession.elapsedSeconds || 0;
      setSessionStartTimestamp(Date.now() - elapsedTime * 1000);
      const duration =
        storeCurrentSession.durationMinutes || selectedTestDuration || 5;
      setSelectedTestDuration(duration);
      setRemainingSeconds(duration * 60 - elapsedTime);
      saveTestState();
    }
  }, [
    storeCurrentSession,
    sessionComplete,
    isTestActive,
    selectedTestDuration,
    saveTestState,
  ]);

  // Проверка возможности начала теста
  useEffect(() => {
    if (selectedEmployeeId && selectedTestId) {
      const canStart = checkCanStartTest(selectedEmployeeId, selectedTestId);
      setCanStartTest(canStart);

      const unfinished = sessions.find(
        (s) =>
          s.employeeId === selectedEmployeeId &&
          s.testId === selectedTestId &&
          s.status === 1,
      );
      setExistingSession(unfinished);
    }
  }, [selectedEmployeeId, selectedTestId, sessions, checkCanStartTest]);

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("testsession_lang", newLang);
  };

  const exportAllToExcel = () => {
    try {
      const exportData = sessions.map((session) => {
        const test = tests.find((t) => t.id === session.testId);
        const employee = employees.find((e) => e.id === session.employeeId);

        let selectiveAnswers = [];
        let manualAnswers = [];
        let ratingAnswers = [];

        if (session.answers && session.answers.length > 0 && test?.questions) {
          session.answers.forEach((answer, idx) => {
            const question = test.questions.find(
              (q) => q.id === answer.questionId,
            );
            const questionText =
              lang === "ru"
                ? question?.contentRu || question?.content || ""
                : question?.contentTj || question?.content || "";

            let answerText = "";
            let answerType = "";

            if (question?.type === 3) {
              answerText = `Рейтинг: ${answer.optionId}/10`;
              answerType = "Рейтинг";
              ratingAnswers.push(
                `${idx + 1}. ${questionText} -> ${answerText}`,
              );
            } else if (answer.optionId !== null && question?.options) {
              const option = question.options.find(
                (o) => o.id === answer.optionId,
              );
              answerText =
                lang === "ru"
                  ? option?.textRu || option?.text || ""
                  : option?.textTj || option?.text || "";
              answerType = "Выборочный";
              selectiveAnswers.push(
                `${idx + 1}. ${questionText} -> ${answerText}${answer.isCorrect ? " ✓" : " ✗"}`,
              );
            } else if (answer.textAnswer) {
              answerText = answer.textAnswer;
              answerType = "Ручной";
              manualAnswers.push(
                `${idx + 1}. ${questionText} -> ${answerText}${answer.isCorrect ? " ✓" : " ✗"}`,
              );
            }
          });
        }

        return {
          ID: session.id,
          "Тест (RU)": test?.titleRu || test?.title || "",
          "Тест (TJ)": test?.titleTj || test?.title || "",
          Сотрудник: employee
            ? `${employee.firstName} ${employee.lastName}`
            : "",
          Email: employee?.email || "",
          Отдел: employee?.department || "",
          Статус: session.status === 1 ? "В процессе" : "Завершен",
          "Дата начала": session.startedAt
            ? new Date(session.startedAt).toLocaleString()
            : "",
          "Дата завершения": session.finishedAt
            ? new Date(session.finishedAt).toLocaleString()
            : "",
          "Длительность (мин)": session.durationMinutes || "",
          "Результат (%)":
            session.score !== null && session.score !== undefined
              ? `${session.score}%`
              : "",
          "Правильные ответы": session.correctAnswersCount || 0,
          "Всего вопросов": session.totalQuestionsCount || 0,
          "Выборочные ответы": selectiveAnswers.join("\n"),
          "Ручные ответы": manualAnswers.join("\n"),
          Рейтинги: ratingAnswers.join("\n"),
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 10 },
        { wch: 50 },
        { wch: 40 },
        { wch: 55 },
        { wch: 35 },
        { wch: 35 },
        { wch: 45 },
        { wch: 40 },
        { wch: 40 },
        { wch: 25 },
        { wch: 35 },
        { wch: 45 },
        { wch: 60 },
        { wch: 60 },
        { wch: 60 },
      ];
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Тестирования");

      const statsData = [
        { Показатель: "Всего сессий", Значение: stats.total },
        { Показатель: "Завершенных сессий", Значение: stats.completed },
        { Показатель: "В процессе", Значение: stats.inProgress },
        { Показатель: "Средний балл", Значение: `${stats.averageScore}%` },
      ];
      const wsStats = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, "Статистика");

      XLSX.writeFile(
        wb,
        `test_sessions_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      message.success("Excel файл успешно создан");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Ошибка при создании Excel файла");
    }
  };

  const exportSingleSessionToExcel = async (session) => {
    try {
      const test = tests.find((t) => t.id === session.testId);
      const employee = employees.find((e) => e.id === session.employeeId);

      const mainData = [
        {
          Параметр: "ID сессии",
          Значение: session.id,
        },
        {
          Параметр: "Сотрудник",
          Значение: employee
            ? `${employee.firstName} ${employee.lastName}`
            : "",
        },
        {
          Параметр: "Тест",
          Значение: test?.titleRu || test?.title || "",
        },
        {
          Параметр: "Статус",
          Значение: session.status === 1 ? "В процессе" : "Завершен",
        },
        {
          Параметр: "Дата начала",
          Значение: session.startedAt
            ? new Date(session.startedAt).toLocaleString()
            : "",
        },
        {
          Параметр: "Дата завершения",
          Значение: session.finishedAt
            ? new Date(session.finishedAt).toLocaleString()
            : "",
        },
        {
          Параметр: "Длительность",
          Значение: session.durationMinutes
            ? `${Math.floor(session.durationMinutes)} мин ${Math.round((session.durationMinutes % 1) * 60)} сек`
            : "",
        },
        {
          Параметр: "Результат",
          Значение: session.score !== null ? `${session.score}%` : "",
        },
        {
          Параметр: "Правильные ответы",
          Значение: `${session.correctAnswersCount || 0}/${session.totalQuestionsCount || 0}`,
        },
      ];

      const wsMain = XLSX.utils.json_to_sheet(mainData);

      let selectiveAnswersData = [];
      let manualAnswersData = [];
      let ratingAnswersData = [];

      if (session.answers && session.answers.length > 0 && test?.questions) {
        session.answers.forEach((answer, idx) => {
          const question = test.questions.find(
            (q) => q.id === answer.questionId,
          );
          const isCorrect = answer.isCorrect || false;

          let answerText = "";
          let answerType = "";

          if (question?.type === 3) {
            answerText = `Рейтинг: ${answer.optionId}/10`;
            answerType = "Рейтинг";
            ratingAnswersData.push({
              "№": idx + 1,
              Вопрос: question?.contentRu || question?.content || "",
              Ответ: answerText,
              "Тип ответа": answerType,
            });
          } else if (answer.optionId !== null && question?.options) {
            const option = question.options.find(
              (o) => o.id === answer.optionId,
            );
            answerText = option?.textRu || option?.text || "";
            answerType = "Выборочный";
            selectiveAnswersData.push({
              "№": idx + 1,
              Вопрос: question?.contentRu || question?.content || "",
              Ответ: answerText,
              "Тип ответа": answerType,
              Правильность: isCorrect ? "Правильно" : "Неправильно",
            });
          } else if (answer.textAnswer) {
            answerText = answer.textAnswer;
            answerType = "Ручной";
            manualAnswersData.push({
              "№": idx + 1,
              Вопрос: question?.contentRu || question?.content || "",
              Ответ: answerText,
              "Тип ответа": answerType,
              Правильность: isCorrect ? "Правильно" : "Неправильно",
            });
          }
        });
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsMain, "Информация");

      if (selectiveAnswersData.length > 0) {
        const wsSelective = XLSX.utils.json_to_sheet(selectiveAnswersData);
        XLSX.utils.book_append_sheet(wb, wsSelective, "Выборочные ответы");
      }

      if (manualAnswersData.length > 0) {
        const wsManual = XLSX.utils.json_to_sheet(manualAnswersData);
        XLSX.utils.book_append_sheet(wb, wsManual, "Ручные ответы");
      }

      if (ratingAnswersData.length > 0) {
        const wsRating = XLSX.utils.json_to_sheet(ratingAnswersData);
        XLSX.utils.book_append_sheet(wb, wsRating, "Рейтинги");
      }

      XLSX.writeFile(
        wb,
        `session_${session.id}_${employee?.firstName || ""}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      message.success("Excel файл успешно создан");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Ошибка при создании Excel файла");
    }
  };

  // ПРИ ПОВТОРНОЙ СДАЧЕ
  const handleRetakeTest = async (testId, employeeId) => {
    try {
      resetTestState();

      const fullDuration = 10;

      const completedSessionsCount = sessions.filter(
        (s) =>
          s.employeeId === employeeId && s.testId === testId && s.status === 2,
      ).length;

      if (completedSessionsCount >= 2) {
        message.error("Доступно только 2 попытки сдачи теста");
        return;
      }

      const existingSessionForRetake = sessions.find(
        (s) => s.employeeId === employeeId && s.testId === testId,
      );
      const subDepartmentIdForRetake =
        existingSessionForRetake?.subDepartmentId || selectedSubDepartmentId;

      const session = await startSession(
        testId,
        employeeId,
        fullDuration,
        subDepartmentIdForRetake,
      );
      const test = tests.find((t) => t.id === testId);

      if (test && test.questions) {
        setSessionQuestions(test.questions);
        const newHistory = new Array(test.questions.length).fill(false);
        setAnswersHistory(newHistory);
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

      saveTestState();

      message.success(
        `Тест начат заново! Время: ${fullDuration} минут. Удачи!`,
      );
      await fetchSessions();

      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Retake session error:", error);
      message.error(error.response?.data?.message || "Ошибка при начале теста");
    }
  };

  // ==================== НАЧАЛО ТЕСТА ====================
  const handleStartSession = async () => {
    if (!selectedTestId || !selectedEmployeeId) {
      message.warning("Выберите тест и сотрудника");
      return;
    }

    // Получаем отделение (сначала из сотрудника, потом из назначений)
    const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);
    
    if (!subDeptId) {
      message.warning("У сотрудника не указано отделение");
      return;
    }

    // Устанавливаем отделение
    setSelectedSubDepartmentId(subDeptId);

    if (!canStartTest) {
      message.error("У сотрудника уже использованы все попытки (максимум 2)");
      return;
    }

    if (existingSession) {
      Modal.confirm({
        title: "Незавершенная сессия",
        content: "У сотрудника есть незавершенная сессия. Продолжить?",
        okText: "Продолжить",
        cancelText: "Отмена",
        onOk: () => {
          handleContinueSession(existingSession);
          setTestModalOpen(false);
        },
      });
      return;
    }

    // ========================================
    // ПРОВЕРКА И СОЗДАНИЕ НАЗНАЧЕНИЯ
    // ========================================
    
    // 1. Проверяем, есть ли назначение в store
    let hasAssignment = testAssignments.some(
      a => a.employeeId === selectedEmployeeId && a.testId === selectedTestId
    );

    // 2. Если нет - создаем через API (БЕЗ subDepartmentId!)
    if (!hasAssignment) {
      setIsCreatingAssignment(true);
      message.loading({ content: "Создание назначения...", key: "creating", duration: 0 });
      
      try {
        const url = `${API_BASE}/TestAssignment`;
        console.log("📤 СОЗДАЮ НАЗНАЧЕНИЕ (БЕЗ SubDepartmentId)...");
        console.log("  URL:", url);
        console.log("  Test ID:", selectedTestId);
        console.log("  Employee ID:", selectedEmployeeId);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testId: Number(selectedTestId),
            employeeId: Number(selectedEmployeeId)
          })
        });
        
        console.log("  Status:", response.status);
        
        const text = await response.text();
        console.log("📥 Ответ:", text);
        
        message.destroy("creating");
        
        if (response.ok || response.status === 200) {
          message.success("✅ Назначение создано!");
          await fetchTestAssignments(1, 1000);
          hasAssignment = true;
        } else if (response.status === 409) {
          message.info("ℹ️ Назначение уже существует");
          await fetchTestAssignments(1, 1000);
          hasAssignment = true;
        } else {
          message.error("❌ Ошибка: " + (text || "Неизвестная ошибка"));
          setIsCreatingAssignment(false);
          return;
        }
        
        setIsCreatingAssignment(false);
        
      } catch (error) {
        console.error("❌ Ошибка создания назначения:", error);
        message.destroy("creating");
        message.error("Ошибка при создании назначения: " + error.message);
        setIsCreatingAssignment(false);
        return;
      }
    }

    // 3. Проверяем финально
    const finalCheck = testAssignments.some(
      a => a.employeeId === selectedEmployeeId && a.testId === selectedTestId
    );

    if (!finalCheck && !hasAssignment) {
      message.error("Назначение не создано. Попробуйте еще раз.");
      return;
    }

    // ========================================
    // НАЧИНАЕМ ТЕСТ
    // ========================================
    
    try {
      const duration = selectedTestDuration || 5;

      console.log("🚀 НАЧИНАЕМ ТЕСТ...");
      console.log("  Сотрудник:", selectedEmployeeId);
      console.log("  Тест:", selectedTestId);
      console.log("  Отделение:", subDeptId);

      resetTestState();

      const session = await startSession(
        selectedTestId,
        selectedEmployeeId,
        duration,
        subDeptId,
      );
      
      const test = tests.find((t) => t.id === selectedTestId);

      if (test && test.questions) {
        setSessionQuestions(test.questions);
        const newHistory = new Array(test.questions.length).fill(false);
        setAnswersHistory(newHistory);
      }

      setTestModalOpen(false);
      setSelectedOptionId(null);
      setManualAnswer("");
      setRatingValue(null);
      setSessionComplete(false);
      setIsTestActive(true);
      setCurrentSessionLocal(session);
      setSessionStartTimestamp(Date.now());
      setElapsedSeconds(0);
      setRemainingSeconds(duration * 60);

      saveTestState();

      message.success(`Тест начат! Время: ${duration} минут. Желаем успеха!`);
      await fetchSessions();

      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("❌ ОШИБКА НАЧАЛА ТЕСТА:", error);
      
      const errorMsg = error?.response?.data?.message || error?.message || "";
      
      if (errorMsg.includes("не назначен") || errorMsg.includes("not assigned")) {
        message.warning("Назначение не найдено. Создаю повторно...");
        
        try {
          const url = `${API_BASE}/TestAssignment`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              testId: Number(selectedTestId),
              employeeId: Number(selectedEmployeeId)
            })
          });
          
          if (response.ok || response.status === 200) {
            message.success("✅ Назначение создано! Нажмите 'Начать тест' еще раз.");
            await fetchTestAssignments(1, 1000);
          } else {
            const text = await response.text();
            message.error("Не удалось создать назначение: " + text);
          }
        } catch (err) {
          console.error("Ошибка:", err);
          message.error("Ошибка при создании назначения");
        }
      } else {
        message.error(
          error?.response?.data?.message || "Ошибка при начале сессии"
        );
      }
    }
  };

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

    let optionId = null;
    let textAnswer = "";

    if (currentQ.type === 1) {
      if (selectedOptionId === null || selectedOptionId === undefined) {
        message.warning("Выберите вариант ответа");
        return;
      }
      optionId = selectedOptionId;
    } else if (currentQ.type === 2) {
      const trimmedAnswer = manualAnswer?.trim();
      if (!trimmedAnswer) {
        message.warning("Введите ответ");
        return;
      }
      textAnswer = trimmedAnswer;
    } else if (currentQ.type === 3) {
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
        optionId: optionId,
        textAnswer: textAnswer,
        answeredAt: new Date().toISOString(),
      };

      if (existingAnswerIndex !== -1) {
        updatedSession.answers[existingAnswerIndex] = newAnswer;
      } else {
        updatedSession.answers.push(newAnswer);
      }

      setCurrentSessionLocal(updatedSession);

      saveTestState();

      if (currentQuestionIndex + 1 >= sessionQuestions.length) {
        setShowConfirmFinish(true);
      } else {
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
      console.error("Submit answer error:", error);
      message.error(
        error.response?.data?.message || "Ошибка при отправке ответа",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishSession = async () => {
    if (!currentSessionLocal) return;

    setSubmitting(true);

    try {
      const finished = await finishSession(
        currentSessionLocal.id,
        currentSessionLocal.employeeId,
      );
      setSessionComplete(true);
      setShowConfirmFinish(false);
      setIsTestActive(false);

      resetTestState();

      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      const passed = (finished.score || 0) >= 70;

      setFinishResultModal({
        score: finished.score || 0,
        correctAnswers: finished.correctAnswersCount || 0,
        totalQuestions: finished.totalQuestionsCount || sessionQuestions.length,
        minutes,
        seconds,
        passed,
      });

      if (passed) {
        message.success(
          `Поздравляем! Тест пройден с результатом ${finished.score}%`,
        );
      } else {
        message.warning(
          `Тест не пройден. Результат: ${finished.score}%. Попробуйте снова!`,
        );
      }

      await fetchSessions();
      clearCurrentSession();
      setCurrentSessionLocal(null);
    } catch (error) {
      console.error("Finish session error:", error);
      message.error(
        error.response?.data?.message || "Ошибка при завершении сессии",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueSession = (session) => {
    setCurrentSession(session);
    setCurrentSessionLocal(session);
    const test = tests.find((t) => t.id === session.testId);
    if (test && test.questions) {
      setSessionQuestions(test.questions);
      const answeredCount = session.answers?.length || 0;
      setCurrentQuestionIndex(answeredCount);
      const newHistory = new Array(test.questions.length).fill(false);
      session.answers?.forEach((answer) => {
        const qIndex = test.questions.findIndex(
          (q) => q.id === answer.questionId,
        );
        if (qIndex !== -1) {
          newHistory[qIndex] = true;
        }
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

      if (answeredCount < test.questions.length) {
        setTimeout(() => loadSavedAnswerForQuestion(answeredCount), 100);
      }

      saveTestState();

      message.info(
        `Продолжение теста. Осталось примерно ${Math.ceil(remaining / 60)} минут`,
      );
    }
  };

  const handleQuestionNavigate = (index) => {
    if (submitting) return;
    setCurrentQuestionIndex(index);
    setSelectedOptionId(null);
    setManualAnswer("");
    setRatingValue(null);
    loadSavedAnswerForQuestion(index);
  };

  const handleRowClick = (record) => {
    setSelectedSessionForModal(record);
    setSessionModalVisible(true);
  };

  const handleRemainingChange = (remaining) => {
    setRemainingSeconds(remaining);
  };

  const answeredCount = answersHistory.filter((a) => a).length;

  const handleDurationChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 480) {
      setSelectedTestDuration(numValue);
      setUserManuallyChangedDuration(true);
    } else if (value === "") {
      setSelectedTestDuration(5);
      setUserManuallyChangedDuration(true);
    }
  };

  // ==================== SESSION DETAILS MODAL ====================
  const SessionDetailsModal = ({
    visible,
    session,
    onClose,
    tests: testsProp,
    employees: employeesProp,
    lang: langProp,
  }) => {
    const [activeTab, setActiveTab] = useState("info");
    const tModal = {
      ru: {
        details: "Детали тестирования",
        info: "Информация",
        answers: "Ответы",
        close: "Закрыть",
      },
      tj: {
        details: "Тафсилоти тестирование",
        info: "Маълумот",
        answers: "Ҷавобҳо",
        close: "Пӯшидан",
      },
    };

    const test = testsProp.find((t) => t.id === session?.testId);
    const employee = employeesProp.find((e) => e.id === session?.employeeId);

    const getQuestionText = (questionId) => {
      const question = test?.questions?.find((q) => q.id === questionId);
      if (!question) return "—";
      return langProp === "ru"
        ? question.contentRu || question.content
        : question.contentTj || question.content;
    };

    const getAnswerText = (answer) => {
      const question = test?.questions?.find((q) => q.id === answer.questionId);
      if (answer.optionId !== null && question?.type === 3) {
        return `Рейтинг: ${answer.optionId}/10`;
      }
      if (answer.optionId !== null && question?.options) {
        const option = question.options.find((o) => o.id === answer.optionId);
        return langProp === "ru"
          ? option?.textRu || option?.text
          : option?.textTj || option?.text;
      }
      if (answer.textAnswer) {
        return answer.textAnswer;
      }
      return "—";
    };

    const getAnswerType = (answer, question) => {
      if (question?.type === 3) return "Рейтинг";
      if (answer.optionId !== null) return "Выборочный";
      if (answer.textAnswer) return "Ручной";
      return "—";
    };

    return (
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EyeOutlined style={{ color: "#ff4b2b" }} />
            <span>{tModal[langProp].details}</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            {tModal[langProp].close}
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
                {tModal[langProp].info}
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
                {tModal[langProp].answers} ({session.answers?.length || 0})
              </Button>
            </div>

            {activeTab === "info" && (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="ID сессии">
                  {session.id}
                </Descriptions.Item>
                <Descriptions.Item label="Сотрудник">
                  {employee
                    ? `${employee.firstName} ${employee.lastName}`
                    : session.employeeId}
                </Descriptions.Item>
                <Descriptions.Item label="Тест">
                  {langProp === "ru"
                    ? test?.titleRu || test?.title
                    : test?.titleTj || test?.title}
                </Descriptions.Item>
                <Descriptions.Item label="Статус">
                  {session.status === 1 ? "В процессе" : "Завершен"}
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
                                question?.type === 3
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
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary">Тип ответа: </Text>
                              <Tag
                                color={
                                  question?.type === 3
                                    ? "orange"
                                    : answer.optionId !== null
                                      ? "blue"
                                      : "green"
                                }
                              >
                                {getAnswerType(answer, question)}
                              </Tag>
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary">Ответ: </Text>
                              <Text>{getAnswerText(answer)}</Text>
                            </div>
                            {question?.type !== 3 && (
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
                            {question?.type === 3 && (
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

  // ==================== ТЕКСТЫ ====================
  const t = {
    ru: {
      title: "Тестирование сотрудников",
      startTest: "Начать тест",
      continue: "Продолжить",
      finish: "Завершить",
      export: "Экспорт",
      exportAll: "Экспорт всех",
      test: "Тест",
      employee: "Сотрудник",
      status: "Статус",
      startedAt: "Начало",
      finishedAt: "Окончание",
      duration: "Длительность",
      score: "Баллы",
      result: "Результат",
      actions: "Действия",
      selectTest: "Выберите тест",
      selectEmployee: "Выберите сотрудника",
      selectTestDuration: "Длительность теста",
      minutes: "минут",
      testingInProgress: "В процессе",
      testingCompleted: "Завершен",
      close: "Закрыть",
      totalSessions: "Всего сессий",
      completedSessions: "Завершено",
      inProgressSessions: "В процессе",
      averageScore: "Средний балл",
      noSessions: "Нет сессий тестирования",
      loading: "Загрузка...",
      exportExcel: "Экспорт в Excel",
      exportExcelSingle: "Экспорт",
      correctAnswers: "Правильные ответы",
      of: "из",
      confirmFinish: "Завершить тестирование?",
      confirmFinishText: "Вы уверены, что хотите завершить тестирование?",
      yes: "Да",
      no: "Нет",
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
      backToSessions: "Назад к сессиям",
      alreadyPassed: "Сотрудник уже использовал все попытки",
      cannotRetake: "Доступно только 2 попытки сдачи теста",
      hasUnfinished: "У сотрудника есть незавершенная сессия",
      continueExisting: "Продолжить существующую сессию",
      retakeNotAllowed: "Повторное прохождение запрещено",
      workTime: "Отработано времени",
      totalTime: "Всего времени",
      timeSpent: "Затраченное время",
      yourResult: "Ваш результат",
      congratulations: "Поздравляем!",
      youCompleted: "Вы завершили тестирование",
      passed: "Пройден",
      failed: "Не пройден",
      details: "Детали тестирования",
      totalQuestions: "Всего вопросов",
      correctCount: "Правильно",
      wrongCount: "Неправильно",
      percentage: "Процент выполнения",
      customDuration: "Своя длительность",
      minutesShort: "мин",
      department: "Отдел",
      ranking: "Рейтинг сотрудников",
      showRanking: "Показать рейтинг",
      hideRanking: "Скрыть рейтинг",
      retake: "Пройти снова",
      viewDetails: "Детали",
      activeTest: "Активное тестирование",
      attemptsLeft: "Осталось попыток",
      of2: "из",
      retakeWarning: "Внимание! При повторной сдаче будет выделено 10 минут",
      presetTimes: "Быстрый выбор:",
      autoSave: "Автосохранение",
      subDepartment: "Отделение",
      selectSubDepartment: "Отделение сотрудника",
      noSubDepartments: "У сотрудника не указано отделение",
      assignmentInfo: "Отделение из данных сотрудника",
      creatingAssignment: "Создание назначения...",
    },
    tj: {
      title: "Тестировании кормандон",
      startTest: "Оғози тест",
      continue: "Давом додан",
      finish: "Анҷом додан",
      export: "Содирот",
      exportAll: "Содироти ҳама",
      test: "Тест",
      employee: "Корманд",
      status: "Ҳолат",
      startedAt: "Оғоз",
      finishedAt: "Анҷом",
      duration: "Давомнокӣ",
      score: "Баллҳо",
      result: "Натиҷа",
      actions: "Амалҳо",
      selectTest: "Тестро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      selectTestDuration: "Давомнокии тест",
      minutes: "дақиқа",
      testingInProgress: "Дар раванд",
      testingCompleted: "Анҷомёфта",
      close: "Пӯшидан",
      totalSessions: "Ҳамагӣ сессияҳо",
      completedSessions: "Анҷомёфта",
      inProgressSessions: "Дар раванд",
      averageScore: "Балли миёна",
      noSessions: "Сессияҳои тестирование нестанд",
      loading: "Боркунӣ...",
      exportExcel: "Содирот ба Excel",
      exportExcelSingle: "Содирот",
      correctAnswers: "Ҷавобҳои дуруст",
      of: "аз",
      confirmFinish: "Тестированиро анҷом додан?",
      confirmFinishText: "Шумо боварӣ доред?",
      yes: "Ҳа",
      no: "Не",
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
      backToSessions: "Бозгашт ба сессияҳо",
      alreadyPassed: "Корманд аллакай ин тестро супоридааст",
      cannotRetake: "Супоридани дубора дастрас нест",
      hasUnfinished: "Корманд сессияи нотамом дорад",
      continueExisting: "Давом додани сессияи мавҷуда",
      retakeNotAllowed: "Супоридани дубора манъ аст",
      workTime: "Вақти коркардшуда",
      totalTime: "Вақти умумӣ",
      timeSpent: "Вақти сарфшуда",
      yourResult: "Натиҷаи шумо",
      congratulations: "Табрик мекунем!",
      youCompleted: "Шумо тестированиро анҷом додед",
      passed: "Гузашт",
      failed: "Нагузашт",
      details: "Тафсилоти тестирование",
      totalQuestions: "Ҳамагӣ саволҳо",
      correctCount: "Дуруст",
      wrongCount: "Нодуруст",
      percentage: "Фоизи иҷро",
      customDuration: "Давомнокии худ",
      minutesShort: "дақ.",
      department: "Шуъба",
      ranking: "Рейтинги кормандон",
      showRanking: "Нишон додани рейтинг",
      hideRanking: "Пинҳон кардани рейтинг",
      retake: "Аз нав супоридан",
      viewDetails: "Тафсилот",
      activeTest: "Тести фаъол",
      attemptsLeft: "Кӯшишҳои боқимонда",
      of2: "аз",
      retakeWarning:
        "Диққат! Ҳангоми аз нав супоридан 10 дақиқа ҷудо карда мешавад",
      presetTimes: "Интихоби зуд:",
      autoSave: "Автоҳифз",
      subDepartment: "Шуъба",
      selectSubDepartment: "Шуъбаи корманд",
      noSubDepartments: "Шуъбаи корманд муайян нашудааст",
      assignmentInfo: "Шуъба аз маълумоти корманд",
      creatingAssignment: "Эҷоди таъинот...",
    },
  };

  // ==================== КОЛОНКИ ТАБЛИЦЫ ====================
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: t[lang].test,
      key: "test",
      render: (_, record) => {
        const test = tests.find((t) => t.id === record.testId);
        if (lang === "ru") {
          return test?.titleRu || test?.title || `Тест ${record.testId}`;
        }
        return test?.titleTj || test?.title || `Тест ${record.testId}`;
      },
    },
    {
      title: t[lang].employee,
      key: "employee",
      render: (_, record) => {
        const emp = employees.find((e) => e.id === record.employeeId);
        return emp
          ? `${emp.firstName} ${emp.lastName}`
          : `ID: ${record.employeeId}`;
      },
    },
    {
      title: t[lang].status,
      dataIndex: "status",
      render: (status) => {
        switch (status) {
          case 1:
            return (
              <Tag color="processing" icon={<ClockCircleOutlined />}>
                {t[lang].testingInProgress}
              </Tag>
            );
          case 2:
            return (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {t[lang].testingCompleted}
              </Tag>
            );
          default:
            return <Tag>Неизвестно</Tag>;
        }
      },
    },
    {
      title: t[lang].workTime,
      dataIndex: "durationMinutes",
      render: (minutes) => {
        if (!minutes && minutes !== 0) return "—";
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${mins} мин ${secs} сек`;
      },
    },
    {
      title: t[lang].startedAt,
      dataIndex: "startedAt",
      render: (date) => (date ? new Date(date).toLocaleString() : "—"),
    },
    {
      title: t[lang].finishedAt,
      dataIndex: "finishedAt",
      render: (date) => (date ? new Date(date).toLocaleString() : "—"),
    },
    {
      title: t[lang].score,
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
      title: t[lang].actions,
      key: "actions",
      render: (_, record) => {
        const completedCount = sessions.filter(
          (s) =>
            s.employeeId === record.employeeId &&
            s.testId === record.testId &&
            s.status === 2,
        ).length;

        return (
          <Space>
            {record.status === 1 && (
              <Button
                size="small"
                type="primary"
                onClick={() => handleContinueSession(record)}
                style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              >
                {t[lang].continue}
              </Button>
            )}
            {record.status === 2 && completedCount === 1 && (
              <Tooltip
                title={`${t[lang].retakeWarning}. ${t[lang].attemptsLeft}: ${2 - completedCount} ${t[lang].of2} 2`}
              >
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() =>
                    handleRetakeTest(record.testId, record.employeeId)
                  }
                  danger
                >
                  {t[lang].retake}
                </Button>
              </Tooltip>
            )}
            {record.status === 2 && completedCount >= 2 && (
              <Tooltip title={t[lang].cannotRetake}>
                <Button size="small" disabled>
                  {t[lang].retake}
                </Button>
              </Tooltip>
            )}
            <Button
              size="small"
              icon={<FileExcelOutlined />}
              onClick={() => exportSingleSessionToExcel(record)}
            >
              {t[lang].exportExcelSingle}
            </Button>
          </Space>
        );
      },
    },
  ];

  // ==================== РЕНДЕР ====================
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

  return (
    <div
      ref={scrollRef}
      style={{ padding: 30, background: "#f0f2f5", minHeight: "100vh" }}
    >
      {/* Верхняя карточка */}
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
              <SafetyOutlined /> {t[lang].title}
            </Title>
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
            <Button
              icon={showRanking ? <StarOutlined /> : <TeamOutlined />}
              onClick={() => setShowRanking(!showRanking)}
            >
              {showRanking ? t[lang].hideRanking : t[lang].showRanking}
            </Button>
            {!isTestActive && (
              <>
                <Button icon={<FileExcelOutlined />} onClick={exportAllToExcel}>
                  {t[lang].exportAll}
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setUserManuallyChangedDuration(false);
                    setTestModalOpen(true);
                  }}
                  icon={<PlayCircleOutlined />}
                  size="large"
                  style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
                >
                  {t[lang].startTest}
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>

      {/* Статистика */}
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

      {/* Активный тест */}
      {isTestActive &&
        currentSessionLocal &&
        !sessionComplete &&
        sessionQuestions.length > 0 && (
          <>
            <div
              style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
            >
              <Tooltip
                title={
                  lastSaved
                    ? `Последнее автосохранение: ${lastSaved.toLocaleTimeString()}`
                    : t[lang].autoSave
                }
              >
                <Badge
                  status="processing"
                  text={
                    <div
                      style={{
                        background: "rgba(0,0,0,0.75)",
                        padding: "6px 12px",
                        borderRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <SaveOutlined style={{ color: "#52c41a" }} />
                      <Text style={{ fontSize: 12, color: "#fff" }}>
                        {t[lang].autoSave}
                      </Text>
                    </div>
                  }
                />
              </Tooltip>
            </div>

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
                    icon={<SafetyOutlined />}
                    style={{ backgroundColor: "#fff", color: "#667eea" }}
                  />
                </Col>
                <Col flex="auto">
                  <div>
                    <Text strong style={{ color: "#fff", fontSize: 16 }}>
                      {lang === "ru"
                        ? tests.find((t) => t.id === currentSessionLocal.testId)
                            ?.titleRu || "Тест"
                        : tests.find((t) => t.id === currentSessionLocal.testId)
                            ?.titleTj || "Тест"}
                    </Text>
                    <br />
                    <Text style={{ color: "#fff", opacity: 0.9 }}>
                      {employees.find(
                        (e) => e.id === currentSessionLocal.employeeId,
                      )?.firstName || ""}{" "}
                      {employees.find(
                        (e) => e.id === currentSessionLocal.employeeId,
                      )?.lastName || ""}
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
                trailColor="rgba(255,255,255,0.3)"
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
                    strokeWidth={12}
                  />
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {answeredCount} {t[lang].of} {sessionQuestions.length}{" "}
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
                      {sessions.filter(
                        (s) =>
                          s.employeeId === currentSessionLocal.employeeId &&
                          s.testId === currentSessionLocal.testId &&
                          s.status === 2,
                      ).length + 1}{" "}
                      из 2
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            </div>
          </>
        )}

      {/* Модалка результата */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {finishResultModal?.passed ? (
              <TrophyOutlined style={{ color: "#ffd700" }} />
            ) : (
              <WarningOutlined style={{ color: "#ff4d4f" }} />
            )}
            <span>
              {finishResultModal?.passed
                ? t[lang].congratulations
                : t[lang].details}
            </span>
          </div>
        }
        open={finishResultModal !== null}
        onCancel={() => setFinishResultModal(null)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setFinishResultModal(null)}
            style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
          >
            {t[lang].close}
          </Button>,
        ]}
        width={500}
      >
        {finishResultModal && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Progress
                type="circle"
                percent={finishResultModal.score}
                format={(percent) => `${percent}%`}
                strokeColor={finishResultModal.passed ? "#52c41a" : "#ff4d4f"}
                width={120}
              />
              <Title
                level={4}
                style={{
                  marginTop: 16,
                  color: finishResultModal.passed ? "#52c41a" : "#ff4d4f",
                }}
              >
                {finishResultModal.passed ? t[lang].passed : t[lang].failed}
              </Title>
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t[lang].result}>
                <Text
                  strong
                  style={{
                    color: finishResultModal.passed ? "#52c41a" : "#ff4d4f",
                    fontSize: 18,
                  }}
                >
                  {finishResultModal.score}%
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t[lang].correctAnswers}>
                {finishResultModal.correctAnswers}/
                {finishResultModal.totalQuestions}
              </Descriptions.Item>
              <Descriptions.Item label={t[lang].timeSpent}>
                {finishResultModal.minutes} мин {finishResultModal.seconds} сек
              </Descriptions.Item>
            </Descriptions>
            {!finishResultModal.passed && finishResultModal.score < 70 && (
              <Alert
                message="Не расстраивайтесь!"
                description="У вас есть еще одна попытка для сдачи этого теста."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Рейтинг */}
      {showRanking && !isTestActive && (
        <EmployeeRanking
          sessions={sessions}
          employees={employees}
          tests={tests}
          lang={lang}
        />
      )}

      {/* История тестирований */}
      {(!isTestActive || sessionComplete) && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HistoryOutlined />
              <span>История тестирований</span>
            </div>
          }
          style={{ borderRadius: 12, marginTop: showRanking ? 24 : 0 }}
        >
          {!sessions || sessions.length === 0 ? (
            <Empty description={t[lang].noSessions} />
          ) : (
            <Table
              dataSource={sessions}
              columns={columns}
              rowKey="id"
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: "pointer" },
              })}
              pagination={{
                current: pagination.pageNumber,
                pageSize: pagination.pageSize,
                total: pagination.totalCount,
                onChange: (page) => fetchSessions(page, pagination.pageSize),
              }}
              scroll={{ x: 1400 }}
              loading={loading}
            />
          )}
        </Card>
      )}

      {/* Модалка деталей сессии */}
      <SessionDetailsModal
        visible={sessionModalVisible}
        session={selectedSessionForModal}
        onClose={() => {
          setSessionModalVisible(false);
          setSelectedSessionForModal(null);
        }}
        tests={tests}
        employees={employees}
        lang={lang}
      />

      {/* МОДАЛЬНОЕ ОКНО НАЧАЛА ТЕСТА */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircleOutlined style={{ color: "#ff4b2b" }} />
            <span>{t[lang].startTest}</span>
          </div>
        }
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setTestModalOpen(false)}>
            {t[lang].close}
          </Button>,
          <Button
            key="start"
            type="primary"
            onClick={handleStartSession}
            style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
            disabled={!canStartTest || !selectedSubDepartmentId || isCreatingAssignment}
            loading={isCreatingAssignment}
          >
            {isCreatingAssignment 
              ? t[lang].creatingAssignment 
              : `${t[lang].startTest} (${selectedTestDuration} мин)`}
          </Button>,
        ]}
        width={650}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Выбор теста */}
          <div>
            <Text strong>{t[lang].test}:</Text>
            <Select
              placeholder={t[lang].selectTest}
              value={selectedTestId}
              onChange={(value) => {
                setSelectedTestId(value);
              }}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              size="large"
            >
              {tests.map((test) => (
                <Select.Option key={test.id} value={test.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <BookOutlined />
                      {lang === "ru"
                        ? test.titleRu || test.title
                        : test.titleTj || test.title}
                    </div>
                    <Tag color="blue">
                      по умолч. {test.durationMinutes || 30} мин
                    </Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Длительность */}
          <div>
            <Text strong>{t[lang].selectTestDuration}:</Text>
            <div style={{ marginTop: 8 }}>
              <Input
                type="number"
                placeholder={t[lang].customDuration}
                value={selectedTestDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                min={1}
                max={480}
                step={1}
                size="large"
                prefix={<HourglassOutlined />}
                suffix={t[lang].minutesShort}
                style={{ width: "100%" }}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t[lang].presetTimes}
              </Text>
              {[5, 10, 15, 20, 30, 45, 60].map((min) => (
                <Button
                  key={min}
                  size="small"
                  type={selectedTestDuration === min ? "primary" : "default"}
                  onClick={() => {
                    setSelectedTestDuration(min);
                    setUserManuallyChangedDuration(true);
                  }}
                  style={
                    selectedTestDuration === min
                      ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                      : {}
                  }
                >
                  {min} мин
                </Button>
              ))}
            </div>
          </div>

          <Alert
            message="Информация"
            description={`На прохождение теста дается ${selectedTestDuration} минут. Вы можете изменить время выше.`}
            type="info"
            showIcon
            icon={<HourglassOutlined />}
          />

          {/* Выбор сотрудника */}
          <div>
            <Text strong>{t[lang].employee}:</Text>
            <Select
              placeholder={t[lang].selectEmployee}
              value={selectedEmployeeId}
              onChange={(value) => {
                setSelectedEmployeeId(value);
                setSelectedSubDepartmentId(null);
              }}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              size="large"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const children = option?.props?.children;
                if (typeof children === "object") {
                  const text =
                    children.props.children[1]?.props?.children || "";
                  return text.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            >
              {Object.entries(groupedEmployees).map(
                ([department, deptEmployees]) => (
                  <Select.OptGroup
                    key={department}
                    label={`${t[lang].department}: ${department}`}
                  >
                    {deptEmployees.map((emp) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <UserOutlined />
                          {emp.firstName} {emp.lastName}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {emp.email}
                          </Text>
                          {emp.subDepartmentId && (
                            <Tag color="green" style={{ marginLeft: 4 }}>
                              <ApartmentOutlined /> {getSubDepartmentName(emp.subDepartmentId)}
                            </Tag>
                          )}
                        </div>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>
                ),
              )}
            </Select>
          </div>

          {/* ВЫБОР ОТДЕЛЕНИЯ - из данных сотрудника */}
          <div>
            <Text strong>{t[lang].subDepartment}:</Text>
            {selectedEmployeeId ? (
              <>
                {selectedSubDepartmentId ? (
                  <Card 
                    size="small" 
                    style={{ 
                      marginTop: 8, 
                      background: "#f6ffed", 
                      borderColor: "#b7eb8f",
                      borderRadius: 8
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ApartmentOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {getSubDepartmentName(selectedSubDepartmentId)}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {(() => {
                            const employee = employees.find(e => e.id === selectedEmployeeId);
                            if (employee?.subDepartmentId) {
                              return "Отделение из данных сотрудника";
                            }
                            const assignment = testAssignments.find(a => a.employeeId === selectedEmployeeId);
                            if (assignment?.subDepartmentId) {
                              return "Отделение из назначения";
                            }
                            return "Отделение";
                          })()}
                        </Text>
                      </div>
                      <Tag color="green" style={{ marginLeft: "auto" }}>
                        <CheckCircleOutlined /> 
                        {(() => {
                          const employee = employees.find(e => e.id === selectedEmployeeId);
                          if (employee?.subDepartmentId) {
                            return "Из сотрудника";
                          }
                          const assignment = testAssignments.find(a => a.employeeId === selectedEmployeeId);
                          if (assignment?.subDepartmentId) {
                            return "Из назначения";
                          }
                          return "Нет";
                        })()}
                      </Tag>
                    </div>
                  </Card>
                ) : (
                  <Alert
                    message="У сотрудника не указано отделение"
                    description="Пожалуйста, укажите отделение в карточке сотрудника или создайте назначение"
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </>
            ) : (
              <div style={{ marginTop: 8 }}>
                <Select
                  placeholder={t[lang].selectSubDepartment}
                  disabled
                  style={{ width: "100%" }}
                >
                  <Select.Option value="">
                    {t[lang].selectEmployee}
                  </Select.Option>
                </Select>
              </div>
            )}
          </div>

          {selectedEmployeeId && selectedTestId && !canStartTest && (
            <Alert
              message={t[lang].alreadyPassed}
              description={t[lang].cannotRetake}
              type="error"
              showIcon
              icon={<StopOutlined />}
            />
          )}

          {selectedEmployeeId && selectedTestId && existingSession && (
            <Alert
              message={t[lang].hasUnfinished}
              description={t[lang].continueExisting}
              type="warning"
              showIcon
              action={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    handleContinueSession(existingSession);
                    setTestModalOpen(false);
                  }}
                >
                  {t[lang].continue}
                </Button>
              }
            />
          )}
        </div>
      </Modal>

      {/* Модалка подтверждения завершения */}
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