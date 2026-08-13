import React, { useState, useEffect, useCallback, useRef } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
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
} from "@ant-design/icons";
import { useTestSessionStore } from "../store/useTestSession";
import { useTestStore } from "../store/useTest";
import { useEmployeeStore } from "../store/useEmployee";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ==================== ТАЙМЕР ====================
const Timer = ({ minutes, onTimeEnd, isActive, onTick, startTimestamp, onRemainingChange }) => {
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

      const elapsedSecondsFromStart = Math.max(0, Math.floor((now - startTs) / 1000));
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
            percent={Math.round(Math.min(100, Math.max(0, ((minutes * 60 - displayTime) / (minutes * 60)) * 100)))}
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
      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
        <Text type="secondary" style={{ fontSize: 14 }}>
          <HourglassOutlined /> Отработано: {formatElapsed(minutes * 60 - displayTime)}
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
const QuestionCard = ({ question, index, total, selectedOption, onSelectOption, manualAnswer, onManualAnswerChange, ratingValue, onRatingChange, lang }) => {
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
    <Card className="question-card" style={{ marginBottom: 24, borderRadius: 12 }}>
      <div style={{ marginBottom: 16 }}>
        <Badge
          count={`${t[lang].question} ${index + 1} ${t[lang].of} ${total}`}
          style={{ backgroundColor: "#ff4b2b", fontSize: 14, padding: "4px 12px" }}
        />
      </div>

      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 24 }}>
        {getQuestionText(question)}
      </div>

      <Divider orientation="left" style={{ fontSize: 14, margin: "16px 0" }}>
        <Text type="secondary">{t[lang].yourAnswer}</Text>
      </Divider>

      {question?.type === 1 && (
        <Radio.Group value={selectedOption} onChange={(e) => onSelectOption(e.target.value)} style={{ width: "100%" }}>
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
                    border: isSelected ? "2px solid #1890ff" : "1px solid #d9d9d9",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  onClick={() => onSelectOption(option.id || idx)}
                >
                  <Radio value={option.id || idx}>
                    <Text style={{ fontSize: 15 }}>{getOptionText(option)}</Text>
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
                    background: active ? "linear-gradient(135deg, #ff4d4f, #ff7875)" : "rgba(255,255,255,0.9)",
                    color: active ? "#fff" : "#333",
                    border: active ? "3px solid #ffd6d6" : "1px solid #e8e8e8",
                    boxShadow: active ? "0 8px 20px rgba(255, 77, 79, 0.35)" : "0 2px 6px rgba(0,0,0,0.08)",
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

// ==================== БЕЛОЕ МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ ====================
const TestResultsModal = ({ visible, result, onClose, lang }) => {
  const t = {
    ru: {
      testResults: "Результаты тестирования",
      employee: "Сотрудник",
      testName: "Тест",
      score: "Результат",
      correctAnswers: "Правильные ответы",
      totalQuestions: "Всего вопросов",
      timeSpent: "Затраченное время",
      status: "Статус",
      passed: "Пройден ✅",
      failed: "Не пройден ❌",
      close: "Закрыть",
      congratulations: "Поздравляем! 🎉",
      tryAgain: "Попробуйте еще раз 💪",
    },
    tj: {
      testResults: "Натиҷаҳои тестирование",
      employee: "Корманд",
      testName: "Тест",
      score: "Натиҷа",
      correctAnswers: "Ҷавобҳои дуруст",
      totalQuestions: "Ҳамагӣ саволҳо",
      timeSpent: "Вақти сарфшуда",
      status: "Ҳолат",
      passed: "Гузашт ✅",
      failed: "Нагузашт ❌",
      close: "Пӯшидан",
      congratulations: "Табрик мекунем! 🎉",
      tryAgain: "Боз кӯшиш кунед 💪",
    },
  };

  if (!result) return null;

  const isPassed = result.score >= 70;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isPassed ? (
            <TrophyOutlined style={{ color: "#ffd700", fontSize: 28 }} />
          ) : (
            <WarningOutlined style={{ color: "#ff4d4f", fontSize: 28 }} />
          )}
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {t[lang].testResults}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{
            background: isPassed ? "#52c41a" : "#ff4b2b",
            borderColor: isPassed ? "#52c41a" : "#ff4b2b",
            borderRadius: 12,
            padding: "0 32px",
            height: 44,
            fontWeight: 600,
          }}
        >
          {t[lang].close}
        </Button>,
      ]}
      width={560}
      centered
      styles={{
        header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 16 },
        body: { paddingTop: 24, paddingBottom: 16 },
      }}
    >
      <div>
        {isPassed && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 56, animation: "bounce 1s infinite" }}>🎉</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Progress
            type="circle"
            percent={Math.round(result.score)}
            format={(percent) => (
              <div>
                <div style={{ fontSize: 30, fontWeight: "bold", lineHeight: 1 }}>
                  {percent}%
                </div>
                <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
                  {isPassed ? t[lang].passed : t[lang].failed}
                </div>
              </div>
            )}
            strokeColor={isPassed ? "#52c41a" : "#ff4d4f"}
            trailColor="#f0f0f0"
            width={150}
          />
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: isPassed ? "#52c41a" : "#ff4d4f",
            }}
          >
            {isPassed ? t[lang].congratulations : t[lang].tryAgain}
          </Text>
        </div>

        <div
          style={{
            background: "#f8f9fa",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 16,
          }}
        >
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary">{t[lang].employee}:</Text>
                <Text strong>{result.employeeName || "—"}</Text>
              </div>
            </Col>
            <Col span={24}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary">{t[lang].testName}:</Text>
                <Text strong>{result.testName || "—"}</Text>
              </div>
            </Col>
          </Row>
        </div>

        <Row gutter={[12, 12]}>
          <Col span={12}>
            <div
              style={{
                background: "#f6ffed",
                borderRadius: 10,
                padding: "14px 16px",
                textAlign: "center",
                border: "1px solid #b7eb8f",
                height: "100%",
              }}
            >
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                {t[lang].correctAnswers}
              </div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
                {result.correctAnswers || 0}
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div
              style={{
                background: "#e6f7ff",
                borderRadius: 10,
                padding: "14px 16px",
                textAlign: "center",
                border: "1px solid #91d5ff",
                height: "100%",
              }}
            >
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                {t[lang].totalQuestions}
              </div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
                {result.totalQuestions || 0}
              </div>
            </div>
          </Col>
        </Row>

        {result.timeSpent && (
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              padding: "10px 16px",
              background: "#fff7e6",
              borderRadius: 10,
              border: "1px solid #ffd591",
            }}
          >
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {t[lang].timeSpent}: {result.timeSpent}
            </Text>
          </div>
        )}

        {!isPassed && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message="Не расстраивайтесь!"
              description="У вас есть еще одна попытка для сдачи этого теста. Удачи! 💪"
              type="info"
              showIcon
              style={{ borderRadius: 10 }}
            />
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
        `}
      </style>
    </Modal>
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
        (s) => s.employeeId === employee.id && s.status === 2 && s.score !== null,
      );
      const completedTests = employeeSessions.length;
      const avgScore =
        completedTests > 0
          ? employeeSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedTests
          : 0;
      const bestScore =
        completedTests > 0 ? Math.max(...employeeSessions.map((s) => s.score || 0)) : 0;

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
    if (index === 0) return <CrownOutlined style={{ color: "#ffd700", fontSize: 20 }} />;
    if (index === 1) return <TrophyOutlined style={{ color: "#c0c0c0", fontSize: 20 }} />;
    if (index === 2) return <TrophyOutlined style={{ color: "#cd7f32", fontSize: 20 }} />;
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
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#ff4b2b" }} />
                    <Text strong>
                      {emp.firstName} {emp.lastName}
                    </Text>
                    <Tag color="blue">{emp.department || t[lang].department}</Tag>
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
                        emp.avgScore >= 70 ? "#52c41a" : emp.avgScore >= 50 ? "#faad14" : "#ff4d4f"
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

// ==================== ОСНОВНОЙ КОМПОНЕНТ TEST SESSION ====================
export const TestSession = ({ testData, onClose }) => {
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

  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("testsession_lang");
    return savedLang || "ru";
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
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState(Date.now());
  const [lastSaved, setLastSaved] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedTestDuration, setSelectedTestDuration] = useState(5);
  const [showRanking, setShowRanking] = useState(true);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  
  // ===== БЕЛОЕ МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ =====
  const [testResultModalVisible, setTestResultModalVisible] = useState(false);
  const [testResultData, setTestResultData] = useState(null);
  
  // ===== ФЛАГ ДЛЯ ПРЕДОТВРАЩЕНИЯ ПОВТОРНОГО ОТКРЫТИЯ =====
  const [isFinished, setIsFinished] = useState(false);

  const scrollRef = useRef(null);
  const stats = getStats();

  // ===== ФУНКЦИЯ ПРОВЕРКИ - 2 ПОПЫТКИ =====
  const checkCanStartTest = useCallback((employeeId, testId) => {
    const completedSessions = sessions.filter(
      (s) => s.employeeId === employeeId && s.testId === testId && s.status === 2
    );
    return completedSessions.length < 2;
  }, [sessions]);

  // ===== ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПОПЫТКАХ =====
  const getAttemptInfo = useCallback((employeeId, testId) => {
    const completedSessions = sessions.filter(
      (s) => s.employeeId === employeeId && s.testId === testId && s.status === 2
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
  }, [sessions]);

  // ===== ЗАГРУЗКА ДАННЫХ =====
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchSessions(),
          fetchTests(),
          fetchEmployee(),
        ]);
        setDataLoaded(true);
        console.log("✅ Все данные загружены в TestSession");
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }
    };
    loadAllData();
  }, []);

  // ===== ЗАГРУЗКА СОХРАНЕННОГО ОТВЕТА =====
  const loadSavedAnswerForQuestion = useCallback((questionIndex) => {
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
      } else if (savedAnswer.optionId !== null && savedAnswer.optionId !== undefined) {
        setSelectedOptionId(savedAnswer.optionId);
      } else if (savedAnswer.textAnswer) {
        setManualAnswer(savedAnswer.textAnswer);
      }
    }
  }, [sessionQuestions, currentSessionLocal]);

  // ===== СОХРАНЕНИЕ СОСТОЯНИЯ =====
  const saveTestState = useCallback(() => {
    if (!isTestActive || !currentSessionLocal || !sessionQuestions.length || sessionComplete || isFinished) return;

    const testState = {
      sessionId: currentSessionLocal.id,
      testId: currentSessionLocal.testId,
      employeeId: currentSessionLocal.employeeId,
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
    localStorage.setItem("active_test_session", JSON.stringify(currentSessionLocal));
    setLastSaved(new Date());
  }, [
    isTestActive,
    currentSessionLocal,
    sessionQuestions.length,
    sessionComplete,
    isFinished,
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

  // ===== ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ =====
  const restoreTestState = useCallback(async () => {
    if (isFinished || sessionComplete) return false;
    
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

      message.success(`Тест восстановлен! Вопрос ${savedState.currentQuestionIndex + 1} из ${savedState.answersHistory.length}`);
      return true;
    } catch (error) {
      console.error("Ошибка восстановления состояния:", error);
      localStorage.removeItem("active_test_state");
      localStorage.removeItem("active_test_session");
      return false;
    }
  }, [sessions, tests, loadSavedAnswerForQuestion, isFinished, sessionComplete]);

  // ===== СБРОС СОСТОЯНИЯ =====
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

  // ===== ПРЕДУПРЕЖДЕНИЕ ПРИ ОБНОВЛЕНИИ =====
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isTestActive && currentSessionLocal && !sessionComplete && !isFinished) {
        saveTestState();
        e.preventDefault();
        e.returnValue = "Вы проходите тестирование. Прогресс будет сохранен. Вы уверены?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isTestActive, currentSessionLocal, sessionComplete, isFinished, saveTestState]);

  // ===== ВОССТАНОВЛЕНИЕ ПОСЛЕ ЗАГРУЗКИ =====
  useEffect(() => {
    const restore = async () => {
      if (
        !isRestoring &&
        !isTestActive &&
        !sessionComplete &&
        !isFinished &&
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
    isFinished,
    restoreTestState,
    dataLoaded,
  ]);

  // ===== АВТОСОХРАНЕНИЕ =====
  useEffect(() => {
    if (!isTestActive || !currentSessionLocal || sessionComplete || isFinished) return;

    const saveInterval = setInterval(() => {
      saveTestState();
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [isTestActive, currentSessionLocal, sessionComplete, isFinished, saveTestState]);

  useEffect(() => {
    if (isTestActive && currentSessionLocal && !sessionComplete && !isFinished) {
      saveTestState();
    }
  }, [currentQuestionIndex, answersHistory, selectedOptionId, manualAnswer, ratingValue, elapsedSeconds, remainingSeconds]);

  // ===== ОБРАБОТКА storeCurrentSession =====
  useEffect(() => {
    if (storeCurrentSession && !sessionComplete && !isTestActive && !isFinished) {
      setCurrentSessionLocal(storeCurrentSession);
      setIsTestActive(true);
      const elapsedTime = storeCurrentSession.elapsedSeconds || 0;
      setSessionStartTimestamp(Date.now() - elapsedTime * 1000);
      const duration = storeCurrentSession.durationMinutes || selectedTestDuration || 5;
      setSelectedTestDuration(duration);
      setRemainingSeconds(duration * 60 - elapsedTime);
      saveTestState();
    }
  }, [storeCurrentSession, sessionComplete, isTestActive, isFinished, selectedTestDuration, saveTestState]);

  // ===== НАЧАЛО ТЕСТА ИЗ ДАННЫХ =====
  useEffect(() => {
    if (!dataLoaded) return;

    const startNewTest = async () => {
      if (testData && testData.action === 'start' && !isTestActive && !sessionComplete && !isFinished) {
        try {
          const { testId, employeeId, duration, subDepartmentId } = testData;
          
          const session = await startSession(testId, employeeId, duration, subDepartmentId);
          
          const test = tests.find((t) => t.id === testId);

          if (test && test.questions) {
            setSessionQuestions(test.questions);
            const newHistory = new Array(test.questions.length).fill(false);
            setAnswersHistory(newHistory);
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

          saveTestState();

          message.success(`Тест начат! Время: ${duration} минут. Желаем успеха!`);
          await fetchSessions();

          if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
          }
        } catch (error) {
          console.error("Ошибка начала теста:", error);
          message.error(error?.response?.data?.message || "Ошибка при начале теста");
        }
      }
    };

    startNewTest();
  }, [testData, dataLoaded, isTestActive, sessionComplete, isFinished, startSession, tests, fetchSessions, saveTestState]);

  // ===== ПОКАЗ БЕЛОГО МОДАЛЬНОГО ОКНА =====
  const showTestResults = useCallback((resultData) => {
    setTestResultData(resultData);
    setTestResultModalVisible(true);
  }, []);

  // ===== ОТПРАВКА ОТВЕТА =====
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

  // ===== ЗАВЕРШЕНИЕ ТЕСТА =====
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
      setIsFinished(true);

      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      const passed = (finished.score || 0) >= 70;

      const test = tests.find((t) => t.id === currentSessionLocal.testId);
      const employee = employees.find((e) => e.id === currentSessionLocal.employeeId);

      const attemptInfo = getAttemptInfo(currentSessionLocal.employeeId, currentSessionLocal.testId);

      const resultData = {
        score: finished.score || 0,
        correctAnswers: finished.correctAnswersCount || 0,
        totalQuestions: finished.totalQuestionsCount || sessionQuestions.length,
        timeSpent: `${minutes} мин ${seconds} сек`,
        passed: passed,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "—",
        testName: lang === "ru" ? test?.titleRu || test?.title || "—" : test?.titleTj || test?.title || "—",
        attemptsLeft: attemptInfo.remaining - 1,
        isLastAttempt: attemptInfo.isLastAttempt,
      };

      showTestResults(resultData);

      if (passed) {
        message.success(`Поздравляем! Тест пройден с результатом ${finished.score}%`);
      } else {
        message.warning(`Тест не пройден. Результат: ${finished.score}%.`);
      }

      await fetchSessions();
      clearCurrentSession();
      
      resetTestState();
      localStorage.removeItem("active_test_state");
      localStorage.removeItem("active_test_session");

    } catch (error) {
      console.error("Finish session error:", error);
      message.error(
        error.response?.data?.message || "Ошибка при завершении сессии",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===== ПОВТОРНАЯ СДАЧА ТЕСТА =====
  const handleRetakeTest = async (testId, employeeId) => {
    try {
      const attemptInfo = getAttemptInfo(employeeId, testId);
      
      if (attemptInfo.isCompleted) {
        message.error("Вы уже использовали все 2 попытки. Повторная сдача недоступна.");
        return;
      }

      resetTestState();
      setIsFinished(false);

      const fullDuration = 10;

      const existingSessionForRetake = sessions.find(
        (s) => s.employeeId === employeeId && s.testId === testId,
      );
      const subDepartmentIdForRetake = existingSessionForRetake?.subDepartmentId || null;

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
        `Тест начат заново! Попытка ${attemptInfo.current + 1} из ${attemptInfo.max}. Время: ${fullDuration} минут. Удачи!`,
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

  // ===== ПРОДОЛЖЕНИЕ СЕССИИ =====
  const handleContinueSession = useCallback((session) => {
    setCurrentSession(session);
    setCurrentSessionLocal(session);
    const test = tests.find((t) => t.id === session.testId);
    if (test && test.questions) {
      setSessionQuestions(test.questions);
      const answeredCount = session.answers?.length || 0;
      setCurrentQuestionIndex(answeredCount);
      const newHistory = new Array(test.questions.length).fill(false);
      session.answers?.forEach((answer) => {
        const qIndex = test.questions.findIndex((q) => q.id === answer.questionId);
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

      message.info(`Продолжение теста. Осталось примерно ${Math.ceil(remaining / 60)} минут`);
    }
  }, [tests, selectedTestDuration, loadSavedAnswerForQuestion, saveTestState, setCurrentSession]);

  // ===== ОБРАБОТКА ПРОДОЛЖЕНИЯ =====
  useEffect(() => {
    if (testData && testData.action === 'continue' && testData.session && !isTestActive && !sessionComplete && !isFinished && dataLoaded) {
      handleContinueSession(testData.session);
    }
  }, [testData, dataLoaded, isTestActive, sessionComplete, isFinished, handleContinueSession]);

  // ===== ПЕРЕХОД МЕЖДУ ВОПРОСАМИ =====
  const handleQuestionNavigate = (index) => {
    if (submitting) return;
    setCurrentQuestionIndex(index);
    setSelectedOptionId(null);
    setManualAnswer("");
    setRatingValue(null);
    loadSavedAnswerForQuestion(index);
  };

  const handleRemainingChange = (remaining) => {
    setRemainingSeconds(remaining);
  };

  const handleRowClick = (record) => {
    setSelectedSessionForModal(record);
    setSessionModalVisible(true);
  };

  const answeredCount = answersHistory.filter((a) => a).length;

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("testsession_lang", newLang);
  };

  // ===== НОВАЯ ФУНКЦИЯ ЭКСПОРТА ВСЕХ (ExcelJS) =====
  const exportAllToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'HR System';
      workbook.created = new Date();

      // ЛИСТ "Сводка"
      const summarySheet = workbook.addWorksheet('Сводка', { properties: { tabColor: { argb: 'FF4B2B' } } });
      summarySheet.addRow(['Отчёт по тестированиям']);
      summarySheet.mergeCells('A1:C1');
      const titleRow = summarySheet.getRow(1);
      titleRow.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B2B' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(1).height = 40;

      summarySheet.addRow([]);

      const statsData = [
        ['Показатель', 'Значение'],
        ['Всего сессий', stats.total],
        ['Завершено', stats.completed],
        ['В процессе', stats.inProgress],
        ['Средний балл', `${stats.averageScore}%`],
      ];
      statsData.forEach((row) => {
        const r = summarySheet.addRow(row);
        r.font = { size: 12 };
        if (row[0] === 'Показатель') {
          r.font = { bold: true };
          r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } };
        }
      });
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 20;

      // ЛИСТ "Детали"
      const detailSheet = workbook.addWorksheet('Детали', { properties: { tabColor: { argb: 'FF1890FF' } } });

      const headerRow = detailSheet.addRow([
        'ID', 'Тест', 'Сотрудник', 'Email', 'Отдел', 'Статус',
        'Дата начала', 'Дата завершения', 'Длительность (мин)', 'Результат', 'Правильные ответы', 'Всего вопросов'
      ]);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B2B' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 28;

      sessions.forEach((session) => {
        const test = tests.find((t) => t.id === session.testId);
        const employee = employees.find((e) => e.id === session.employeeId);
        const row = detailSheet.addRow([
          session.id,
          lang === 'ru' ? test?.titleRu || test?.title || '' : test?.titleTj || test?.title || '',
          employee ? `${employee.firstName} ${employee.lastName}` : '',
          employee?.email || '',
          employee?.department || '',
          session.status === 1 ? 'В процессе' : 'Завершен',
          session.startedAt ? new Date(session.startedAt).toLocaleString() : '',
          session.finishedAt ? new Date(session.finishedAt).toLocaleString() : '',
          session.durationMinutes || '',
          session.score !== null ? `${session.score}%` : '',
          session.correctAnswersCount || 0,
          session.totalQuestionsCount || 0,
        ]);
        const statusCell = row.getCell(6);
        if (session.status === 1) {
          statusCell.font = { color: { argb: 'FF1890FF' } };
        } else {
          statusCell.font = { color: { argb: 'FF52C41A' } };
        }
        const scoreCell = row.getCell(10);
        if (session.score !== null) {
          if (session.score >= 70) {
            scoreCell.font = { color: { argb: 'FF52C41A' }, bold: true };
          } else {
            scoreCell.font = { color: { argb: 'FFFF4D4F' }, bold: true };
          }
        }
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 24;
      });

      detailSheet.getColumn(1).width = 8;
      detailSheet.getColumn(2).width = 30;
      detailSheet.getColumn(3).width = 25;
      detailSheet.getColumn(4).width = 25;
      detailSheet.getColumn(5).width = 20;
      detailSheet.getColumn(6).width = 15;
      detailSheet.getColumn(7).width = 20;
      detailSheet.getColumn(8).width = 20;
      detailSheet.getColumn(9).width = 15;
      detailSheet.getColumn(10).width = 15;
      detailSheet.getColumn(11).width = 18;
      detailSheet.getColumn(12).width = 16;
      detailSheet.autoFilter = {
        from: 'A1',
        to: `L${sessions.length + 1}`,
      };

      // ЛИСТ "Рейтинг"
      const rankingSheet = workbook.addWorksheet('Рейтинг', { properties: { tabColor: { argb: 'FFFAAD14' } } });

      const employeeStats = employees
        .map((emp) => {
          const empSessions = sessions.filter(
            (s) => s.employeeId === emp.id && s.status === 2 && s.score !== null
          );
          const completed = empSessions.length;
          const avgScore = completed > 0 ? empSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completed : 0;
          const bestScore = completed > 0 ? Math.max(...empSessions.map((s) => s.score || 0)) : 0;
          return { ...emp, completed, avgScore: Math.round(avgScore), bestScore };
        })
        .filter((emp) => emp.completed > 0)
        .sort((a, b) => b.avgScore - a.avgScore);

      if (employeeStats.length > 0) {
        const rankHeader = rankingSheet.addRow(['Рейтинг сотрудников']);
        rankingSheet.mergeCells('A1:E1');
        rankHeader.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        rankHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAAD14' } };
        rankHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        rankingSheet.getRow(1).height = 36;

        rankingSheet.addRow([]);

        const rankCols = rankingSheet.addRow([
          'Место', 'Сотрудник', 'Отдел', 'Пройдено тестов', 'Средний балл', 'Лучший результат'
        ]);
        rankCols.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        rankCols.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B2B' } };
        rankCols.alignment = { horizontal: 'center', vertical: 'middle' };
        rankCols.height = 28;

        employeeStats.forEach((emp, idx) => {
          const row = rankingSheet.addRow([
            idx + 1,
            `${emp.firstName} ${emp.lastName}`,
            emp.department || '—',
            emp.completed,
            `${emp.avgScore}%`,
            `${emp.bestScore}%`,
          ]);
          const placeCell = row.getCell(1);
          if (idx === 0) {
            placeCell.font = { color: { argb: 'FFFFD700' }, bold: true, size: 14 };
          } else if (idx === 1) {
            placeCell.font = { color: { argb: 'FFC0C0C0' }, bold: true, size: 14 };
          } else if (idx === 2) {
            placeCell.font = { color: { argb: 'FFCD7F32' }, bold: true, size: 14 };
          }
          row.alignment = { horizontal: 'center', vertical: 'middle' };
          row.height = 24;
        });

        rankingSheet.getColumn(1).width = 10;
        rankingSheet.getColumn(2).width = 30;
        rankingSheet.getColumn(3).width = 25;
        rankingSheet.getColumn(4).width = 18;
        rankingSheet.getColumn(5).width = 18;
        rankingSheet.getColumn(6).width = 20;
      } else {
        rankingSheet.addRow(['Нет данных для рейтинга']);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `test_sessions_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      message.success('Excel файл успешно создан с оформлением!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Ошибка при создании Excel файла');
    }
  };

  // ===== НОВАЯ ФУНКЦИЯ ЭКСПОРТА ОДНОЙ СЕССИИ (ExcelJS) =====
  const exportSingleSessionToExcel = async (session) => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'HR System';

      const sheet = workbook.addWorksheet('Сессия', { properties: { tabColor: { argb: 'FF4B2B' } } });

      sheet.addRow(['Отчёт по тестированию']);
      sheet.mergeCells('A1:C1');
      const titleRow = sheet.getRow(1);
      titleRow.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B2B' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 40;

      sheet.addRow([]);

      const test = tests.find((t) => t.id === session.testId);
      const employee = employees.find((e) => e.id === session.employeeId);

      const infoData = [
        ['ID сессии', session.id],
        ['Сотрудник', employee ? `${employee.firstName} ${employee.lastName}` : '—'],
        ['Тест', lang === 'ru' ? test?.titleRu || test?.title || '' : test?.titleTj || test?.title || ''],
        ['Статус', session.status === 1 ? 'В процессе' : 'Завершен'],
        ['Дата начала', session.startedAt ? new Date(session.startedAt).toLocaleString() : '—'],
        ['Дата завершения', session.finishedAt ? new Date(session.finishedAt).toLocaleString() : '—'],
        ['Длительность', session.durationMinutes ? `${Math.floor(session.durationMinutes)} мин ${Math.round((session.durationMinutes % 1) * 60)} сек` : '—'],
        ['Результат', session.score !== null ? `${session.score}%` : '—'],
        ['Правильные ответы', `${session.correctAnswersCount || 0}/${session.totalQuestionsCount || 0}`],
      ];

      infoData.forEach((row) => {
        const r = sheet.addRow(row);
        r.font = { size: 12 };
        r.getCell(1).font = { bold: true };
        r.alignment = { vertical: 'middle' };
        r.height = 24;
      });

      sheet.getColumn(1).width = 30;
      sheet.getColumn(2).width = 40;

      if (session.answers && session.answers.length > 0) {
        const answerSheet = workbook.addWorksheet('Ответы', { properties: { tabColor: { argb: 'FF52C41A' } } });
        const ansHeader = answerSheet.addRow(['№', 'Вопрос', 'Ответ', 'Результат']);
        ansHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        ansHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF52C41A' } };
        ansHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        ansHeader.height = 28;

        session.answers.forEach((answer, idx) => {
          const question = test?.questions?.find((q) => q.id === answer.questionId);
          const questionText = lang === 'ru'
            ? question?.contentRu || question?.content || '—'
            : question?.contentTj || question?.content || '—';
          let answerText = '—';
          if (answer.optionId !== null && question?.type === 3) {
            answerText = `Рейтинг: ${answer.optionId}/10`;
          } else if (answer.optionId !== null && question?.options) {
            const opt = question.options.find((o) => o.id === answer.optionId);
            answerText = lang === 'ru' ? opt?.textRu || opt?.text : opt?.textTj || opt?.text;
          } else if (answer.textAnswer) {
            answerText = answer.textAnswer;
          }
          const isCorrect = answer.isCorrect !== undefined ? answer.isCorrect : null;
          const row = answerSheet.addRow([
            idx + 1,
            questionText,
            answerText,
            question?.type === 3 ? 'Рейтинг' : (isCorrect ? '✅ Правильно' : '❌ Неправильно'),
          ]);
          row.alignment = { horizontal: 'center', vertical: 'middle' };
          row.height = 24;
          const resultCell = row.getCell(4);
          if (question?.type === 3) {
            resultCell.font = { color: { argb: 'FFFAAD14' }, bold: true };
          } else if (isCorrect) {
            resultCell.font = { color: { argb: 'FF52C41A' }, bold: true };
          } else if (isCorrect === false) {
            resultCell.font = { color: { argb: 'FFFF4D4F' }, bold: true };
          }
        });

        answerSheet.getColumn(1).width = 8;
        answerSheet.getColumn(2).width = 50;
        answerSheet.getColumn(3).width = 40;
        answerSheet.getColumn(4).width = 20;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `session_${session.id}_${employee?.firstName || ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      message.success('Excel файл с деталями успешно создан!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Ошибка при создании Excel файла');
    }
  };

  // ===== КОЛОНКИ ДЛЯ ИСТОРИИ =====
  const historyColumns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 70,
    },
    {
      title: "Тест",
      key: "test",
      render: (_, record) => {
        const test = tests.find((t) => t.id === record.testId);
        return lang === "ru" ? test?.titleRu || test?.title || `Тест ${record.testId}` : test?.titleTj || test?.title || `Тест ${record.testId}`;
      },
    },
    {
      title: "Сотрудник",
      key: "employee",
      render: (_, record) => {
        const emp = employees.find((e) => e.id === record.employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${record.employeeId}`;
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      render: (status) => {
        switch (status) {
          case 1:
            return <Tag color="processing" icon={<ClockCircleOutlined />}>В процессе</Tag>;
          case 2:
            return <Tag color="success" icon={<CheckCircleOutlined />}>Завершен</Tag>;
          default:
            return <Tag>Неизвестно</Tag>;
        }
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
              style={{ backgroundColor: record.score >= 70 ? "#52c41a" : "#ff4d4f" }}
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
        
        return (
          <Space>
            {record.status === 1 && (
              <Button
                size="small"
                type="primary"
                onClick={() => handleContinueSession(record)}
                style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              >
                Продолжить
              </Button>
            )}
            {record.status === 2 && !isCompleted && (
              <Tooltip title={`Осталось ${attemptInfo.remaining} попыток из ${attemptInfo.max}`}>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => handleRetakeTest(record.testId, record.employeeId)}
                  danger
                >
                  Пройти снова
                </Button>
              </Tooltip>
            )}
            {record.status === 2 && isCompleted && (
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

  // ===== SESSION DETAILS MODAL =====
  const SessionDetailsModal = ({
    visible,
    session,
    onClose: onModalClose,
    tests: testsProp,
    employees: employeesProp,
    lang: langProp,
  }) => {
    const [activeTab, setActiveTab] = useState("info");

    const test = testsProp.find((t) => t.id === session?.testId);
    const employee = employeesProp.find((e) => e.id === session?.employeeId);

    const getQuestionText = (questionId) => {
      const question = test?.questions?.find((q) => q.id === questionId);
      if (!question) return "—";
      return langProp === "ru" ? question.contentRu || question.content : question.contentTj || question.content;
    };

    const getAnswerText = (answer) => {
      const question = test?.questions?.find((q) => q.id === answer.questionId);
      if (answer.optionId !== null && question?.type === 3) {
        return `Рейтинг: ${answer.optionId}/10`;
      }
      if (answer.optionId !== null && question?.options) {
        const option = question.options.find((o) => o.id === answer.optionId);
        return langProp === "ru" ? option?.textRu || option?.text : option?.textTj || option?.text;
      }
      if (answer.textAnswer) {
        return answer.textAnswer;
      }
      return "—";
    };

    return (
      <Modal
        title="Детали тестирования"
        open={visible}
        onCancel={onModalClose}
        footer={[<Button key="close" onClick={onModalClose}>Закрыть</Button>]}
        width={700}
      >
        {session && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Button
                type={activeTab === "info" ? "primary" : "default"}
                onClick={() => setActiveTab("info")}
                style={activeTab === "info" ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}}
              >
                Информация
              </Button>
              <Button
                type={activeTab === "answers" ? "primary" : "default"}
                onClick={() => setActiveTab("answers")}
                style={activeTab === "answers" ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}}
              >
                Ответы ({session.answers?.length || 0})
              </Button>
            </div>

            {activeTab === "info" && (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="ID сессии">{session.id}</Descriptions.Item>
                <Descriptions.Item label="Сотрудник">
                  {employee ? `${employee.firstName} ${employee.lastName}` : session.employeeId}
                </Descriptions.Item>
                <Descriptions.Item label="Тест">
                  {langProp === "ru" ? test?.titleRu || test?.title : test?.titleTj || test?.title}
                </Descriptions.Item>
                <Descriptions.Item label="Статус">
                  {session.status === 1 ? "В процессе" : "Завершен"}
                </Descriptions.Item>
                <Descriptions.Item label="Дата начала">
                  {session.startedAt ? new Date(session.startedAt).toLocaleString() : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Дата окончания">
                  {session.finishedAt ? new Date(session.finishedAt).toLocaleString() : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Длительность">
                  {session.durationMinutes ? `${Math.floor(session.durationMinutes)} мин ${Math.round((session.durationMinutes % 1) * 60)} сек` : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Результат">
                  {session.score !== null ? (
                    <Badge count={`${session.score}%`} style={{ backgroundColor: session.score >= 70 ? "#52c41a" : "#ff4d4f" }} />
                  ) : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Правильные ответы">
                  {session.correctAnswersCount || 0}/{session.totalQuestionsCount || 0}
                </Descriptions.Item>
              </Descriptions>
            )}

            {activeTab === "answers" && (
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {session.answers && session.answers.length > 0 ? (
                  session.answers.map((answer, idx) => {
                    const question = test?.questions?.find((q) => q.id === answer.questionId);
                    return (
                      <Card key={idx} size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <Badge
                            count={idx + 1}
                            style={{
                              backgroundColor: question?.type === 3 ? "#faad14" : answer.isCorrect ? "#52c41a" : "#ff4d4f",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <Text strong>{getQuestionText(answer.questionId)}</Text>
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary">Ответ: </Text>
                              <Text>{getAnswerText(answer)}</Text>
                            </div>
                            {question?.type !== 3 && (
                              <div style={{ marginTop: 4 }}>
                                {answer.isCorrect ? (
                                  <Tag color="success" icon={<CheckCircleOutlined />}>Правильно</Tag>
                                ) : (
                                  <Tag color="error" icon={<CloseCircleOutlined />}>Неправильно</Tag>
                                )}
                              </div>
                            )}
                            {question?.type === 3 && (
                              <div style={{ marginTop: 4 }}>
                                <Tag color="orange" icon={<StarOutlined />}>Рейтинг сохранен</Tag>
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

  // ===== ТЕКСТЫ =====
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
      autoSave: "Автосохранение",
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
      showRanking: "Показать рейтинг",
      hideRanking: "Скрыть рейтинг",
      viewDetails: "Детали",
      history: "История тестирований",
      attempt: "Попытка",
      of: "из",
      retake: "Пройти снова",
      attemptsLeft: "Осталось попыток",
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
      autoSave: "Автоҳифз",
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
      showRanking: "Нишон додани рейтинг",
      hideRanking: "Пинҳон кардани рейтинг",
      viewDetails: "Тафсилот",
      history: "Таърихи тестирование",
      attempt: "Кӯшиш",
      of: "аз",
      retake: "Аз нав супоридан",
      attemptsLeft: "Кӯшишҳои боқимонда",
    },
  };

  // ===== РЕНДЕР =====
  if (loading && sessions.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50, alignItems: "center", height: "60vh" }}>
        <Spin size="small" tip={t[lang].loading} />
      </div>
    );
  }

  const attemptInfo = currentSessionLocal ? getAttemptInfo(
    currentSessionLocal.employeeId,
    currentSessionLocal.testId
  ) : { current: 1, max: 2 };

  return (
    <div ref={scrollRef} style={{ padding: 30, background: "#f0f2f5", minHeight: "100vh" }}>
      <TestResultsModal
        visible={testResultModalVisible}
        result={testResultData}
        onClose={() => {
          setTestResultModalVisible(false);
          setTestResultData(null);
          setTimeout(() => {
            onClose();
          }, 200);
        }}
        lang={lang}
      />

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
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
              style={lang === "ru" ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}}
            >
              RU
            </Button>
            <Button
              type={lang === "tj" ? "primary" : "default"}
              onClick={() => handleSetLang("tj")}
              style={lang === "tj" ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}}
            >
              TJ
            </Button>
            <Button
              icon={showRanking ? <StarOutlined /> : <TeamOutlined />}
              onClick={() => setShowRanking(!showRanking)}
            >
              {showRanking ? t[lang].hideRanking : t[lang].showRanking}
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={exportAllToExcel}>
              {t[lang].exportAll}
            </Button>
          </Space>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
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

      {isTestActive && currentSessionLocal && !sessionComplete && !isFinished && sessionQuestions.length > 0 && (
        <>
          <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
            <Tooltip title={lastSaved ? `Последнее автосохранение: ${lastSaved.toLocaleTimeString()}` : t[lang].autoSave}>
              <Badge
                status="processing"
                text={
                  <div style={{ background: "rgba(0,0,0,0.75)", padding: "6px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
                    <SaveOutlined style={{ color: "#52c41a" }} />
                    <Text style={{ fontSize: 12, color: "#fff" }}>{t[lang].autoSave}</Text>
                  </div>
                }
              />
            </Tooltip>
          </div>

          <Card style={{ marginBottom: 16, borderRadius: 12, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <Row gutter={16} align="middle">
              <Col>
                <Avatar icon={<BookOutlined />} style={{ backgroundColor: "#fff", color: "#667eea" }} />
              </Col>
              <Col flex="auto">
                <div>
                  <Text strong style={{ color: "#fff", fontSize: 16 }}>
                    {lang === "ru"
                      ? tests.find((t) => t.id === currentSessionLocal.testId)?.titleRu || "Тест"
                      : tests.find((t) => t.id === currentSessionLocal.testId)?.titleTj || "Тест"}
                  </Text>
                  <br />
                  <Text style={{ color: "#fff", opacity: 0.9 }}>
                    {employees.find((e) => e.id === currentSessionLocal.employeeId)?.firstName || ""}{" "}
                    {employees.find((e) => e.id === currentSessionLocal.employeeId)?.lastName || ""}
                  </Text>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold" }}>
                    {answeredCount}/{sessionQuestions.length}
                  </Text>
                  <br />
                  <Text style={{ color: "#fff", fontSize: 12 }}>{t[lang].questionsAnswered}</Text>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
                    {Math.floor(remainingSeconds / 60)}:{Math.floor(remainingSeconds % 60).toString().padStart(2, "0")}
                  </Text>
                  <br />
                  <Text style={{ color: "#fff", fontSize: 12 }}>осталось</Text>
                </div>
              </Col>
            </Row>
            <Progress
              percent={Math.round((answeredCount / sessionQuestions.length) * 100)}
              strokeColor="#fff"
              trailColor="rgba(255,255,255,0.3)"
              showInfo={false}
              style={{ marginTop: 12 }}
            />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
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
                    icon={currentQuestionIndex + 1 === sessionQuestions.length ? <FlagOutlined /> : <ArrowRightOutlined />}
                    onClick={handleSubmitAnswer}
                    style={{ flex: 1, background: "#ff4b2b", borderColor: "#ff4b2b" }}
                    loading={submitting}
                  >
                    {currentQuestionIndex + 1 === sessionQuestions.length ? t[lang].finish : t[lang].next}
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <Card title={t[lang].yourProgress} style={{ borderRadius: 12 }}>
                <Progress percent={Math.round((answeredCount / sessionQuestions.length) * 100)} status="active" strokeColor="#ff4b2b" strokeWidth={12} />
                <Text type="secondary" style={{ display: "block", textAlign: "center", marginTop: 8 }}>
                  {answeredCount} из {sessionQuestions.length} {t[lang].questionsAnswered}
                </Text>
              </Card>

              <Card title={t[lang].questionNavigation} style={{ marginTop: 16, borderRadius: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {sessionQuestions.map((_, idx) => (
                    <Tooltip key={idx} title={`${t[lang].questionNumber} ${idx + 1} - ${answersHistory[idx] ? t[lang].answered : t[lang].unanswered}`}>
                      <Button
                        size="small"
                        type={currentQuestionIndex === idx ? "primary" : "default"}
                        style={{
                          backgroundColor: answersHistory[idx] ? "#52c41a" : undefined,
                          borderColor: currentQuestionIndex === idx ? "#ff4b2b" : undefined,
                          color: answersHistory[idx] && currentQuestionIndex !== idx ? "white" : undefined,
                        }}
                        onClick={() => handleQuestionNavigate(idx)}
                        disabled={submitting}
                      >
                        {idx + 1}
                        {answersHistory[idx] && <CheckCircleOutlined style={{ fontSize: 10, marginLeft: 2 }} />}
                      </Button>
                    </Tooltip>
                  ))}
                </div>
                <Divider />
                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                  <div><Badge color="#52c41a" text={t[lang].answered} /></div>
                  <div><Badge color="#d9d9d9" text={t[lang].unanswered} /></div>
                  <div><Badge color="#ff4b2b" text={t[lang].current} /></div>
                </div>
              </Card>

              <Card title={t[lang].testInfo} style={{ marginTop: 16, borderRadius: 12 }}>
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

      {showRanking && !isTestActive && (
        <EmployeeRanking sessions={sessions} employees={employees} tests={tests} lang={lang} />
      )}

      {(!isTestActive || sessionComplete) && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HistoryOutlined />
              <span>{t[lang].history}</span>
            </div>
          }
          style={{ borderRadius: 12, marginTop: showRanking && !isTestActive ? 24 : 0 }}
        >
          {!sessions || sessions.length === 0 ? (
            <Empty description={t[lang].noSessions} />
          ) : (
            <Table
              dataSource={sessions}
              columns={historyColumns}
              rowKey="id"
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