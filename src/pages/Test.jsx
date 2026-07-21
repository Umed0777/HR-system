// TestManager.jsx - ПОЛНАЯ ВЕРСИЯ

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
import { useTestSessionStore } from "../store/useTestSession";
import { useEmployeeStore } from "../store/useEmployee";
import { useTestAssignmentStore } from "../store/useTestAssignment";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import {
  Button,
  Modal,
  Input,
  Space,
  Card,
  Typography,
  Popconfirm,
  Row,
  Col,
  message,
  Tag,
  Spin,
  Table,
  Flex,
  Avatar,
  Empty,
  Steps,
  Alert,
  Progress,
  Pagination,
  Checkbox,
  Badge,
  Select,
  Divider,
  Radio,
  Tabs,
  Descriptions,
  Statistic,
  Tooltip,
  List,
} from "antd";
import { 
  DeleteOutlined, 
  EditOutlined, 
  FileTextOutlined,
  RocketOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  FormOutlined,
  SaveOutlined,
  StarOutlined,
  WarningOutlined,
  SafetyOutlined,
  FileDoneOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  HourglassOutlined,
  UserOutlined,
  BookOutlined,
  ArrowLeftOutlined,
  FlagOutlined,
  StopOutlined,
  CrownOutlined,
  ReloadOutlined,
  EyeOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import img from '../assets/image2.jpg';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ==================== КОМПОНЕНТ РЕЗУЛЬТАТОВ ТЕСТА (В TestSession) ====================
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

// ==================== КОМПОНЕНТ ТАЙМЕРА ====================
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

// ==================== КОМПОНЕНТ ВЫБОРА РЕЙТИНГА ====================
const RatingSelector = ({ value, onChange, label, disabled = false }) => {
  const ratingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div>
      {label && (
        <Text strong style={{ display: "block", marginBottom: 12 }}>
          <span style={{ marginRight: 8, color: "#ff4d4f" }}>⭐</span>
          {label}
        </Text>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
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
                  ? "radial-gradient(circle, #ff4d4f, #ff7875)"
                  : "rgba(255,255,255,0.9)",
                color: active ? "#fff" : "#333",
                border: active ? "3px solid #ffd6d6" : "1px solid #e8e8e8",
                boxShadow: active
                  ? "0 8px 20px rgba(255, 77, 79, 0.35)"
                  : "0 2px 6px rgba(0,0,0,0.08)",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {num}
            </div>
          );
        })}
      </div>
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

// ==================== КОМПОНЕНТ РЕЙТИНГА СОТРУДНИКОВ ====================
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

// ==================== КОМПОНЕНТ СОЗДАНИЯ ВОПРОСА ====================
const QuestionCreator = ({ onQuestionCreated, lang, t }) => {
  const { addQuestion } = useQuestionStore();
  
  const [content, setContent] = useState("");
  const [type, setType] = useState(1);
  const [options, setOptions] = useState([]);
  const [manualAnswer, setManualAnswer] = useState("");
  const [ratingAnswer, setRatingAnswer] = useState(null);
  const [creating, setCreating] = useState(false);

  const letters = ["A", "B", "C", "D", "E", "F"];

  const addOption = () => {
    if (options.length >= 6) {
      message.warning("Максимум 6 вариантов");
      return;
    }
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const updateOption = (i, value) => {
    const arr = [...options];
    arr[i].text = value;
    setOptions(arr);
  };

  const setCorrectOption = (index) => {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === index })));
  };

  const deleteOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSaveQuestion = async () => {
    let payload;

    if (type === 2) {
      if (!manualAnswer) {
        message.warning("Пожалуйста, введите ответ");
        return;
      }
      payload = {
        contentRu: content,
        contentTj: content,
        type: 2,
        options: [
          {
            textRu: manualAnswer,
            textTj: manualAnswer,
            isCorrect: true,
          },
        ],
      };
    } else if (type === 3) {
      if (!ratingAnswer) {
        message.warning("Пожалуйста, выберите рейтинг");
        return;
      }
      payload = {
        contentRu: content,
        contentTj: content,
        type: 3,
        optionId: ratingAnswer,
        options: [],
      };
    } else {
      if (!content) {
        message.warning("Пожалуйста, введите вопрос");
        return;
      }
      if (options.length === 0) {
        message.warning("Пожалуйста, добавьте хотя бы один вариант ответа");
        return;
      }
      const hasCorrect = options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        message.warning("Пожалуйста, выберите правильный вариант ответа");
        return;
      }

      payload = {
        contentRu: content,
        contentTj: content,
        type: 1,
        options: options.map((o) => ({
          textRu: o.text,
          textTj: o.text,
          isCorrect: o.isCorrect,
        })),
      };
    }

    setCreating(true);
    try {
      const response = await addQuestion(payload);
      message.success("Вопрос успешно создан! 🎉");
      
      setContent("");
      setOptions([]);
      setManualAnswer("");
      setRatingAnswer(null);
      setType(1);
      
      if (onQuestionCreated && response) {
        onQuestionCreated(response);
      }
    } catch (err) {
      console.error("Error creating question:", err);
      message.error("Ошибка при создании вопроса");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <Alert
        message="Создание нового вопроса"
        description="Заполните поля и сохраните вопрос. Он будет доступен для добавления в тест."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 12 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
          {t.question}:
        </Text>
        <Input.TextArea
          placeholder={t.question}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          size="large"
          style={{ borderRadius: 10 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 15, display: "block", marginBottom: 8 }}>
          Тип вопроса:
        </Text>
        <Radio.Group
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setOptions([]);
            setManualAnswer("");
            setRatingAnswer(null);
          }}
        >
          <Radio value={1}>{t.test}</Radio>
          <Radio value={2}>{t.manual}</Radio>
          <Radio value={3}>{t.rating}</Radio>
        </Radio.Group>
      </div>

      {type === 1 && (
        <div>
          <Button
            type="dashed"
            onClick={addOption}
            block
            size="large"
            style={{ marginBottom: 15, borderRadius: 10 }}
            icon={<PlusOutlined />}
          >
            {t.add}
          </Button>

          <AnimatePresence>
            {options.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  size="small"
                  style={{ marginBottom: 10, borderRadius: 10 }}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteOption(i)}
                    >
                      Удалить
                    </Button>
                  }
                >
                  <Row align="middle" gutter={10}>
                    <Col>
                      <Radio checked={o.isCorrect} onChange={() => setCorrectOption(i)}>
                        {t.correct} ({letters[i]})
                      </Radio>
                    </Col>
                    <Col flex="auto">
                      <Input
                        placeholder={`${t.variant} ${letters[i]}`}
                        value={o.text}
                        onChange={(e) => updateOption(i, e.target.value)}
                        size="large"
                      />
                    </Col>
                  </Row>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {type === 2 && (
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {t.correctAnswer}:
          </Text>
          <Input
            placeholder={t.answer}
            value={manualAnswer}
            onChange={(e) => setManualAnswer(e.target.value)}
            size="large"
            style={{ borderRadius: 10 }}
          />
        </div>
      )}
      
      {type === 3 && (
        <RatingSelector
          label={t.selectRating}
          value={ratingAnswer}
          onChange={setRatingAnswer}
        />
      )}

      <Button
        type="primary"
        onClick={handleSaveQuestion}
        loading={creating}
        style={{
          marginTop: 16,
          background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
          border: "none",
          borderRadius: 10,
          width: "100%",
          height: 44,
        }}
        icon={<SaveOutlined />}
      >
        {creating ? "Сохранение..." : "Создать вопрос"}
      </Button>
    </div>
  );
};

// ==================== КОМПОНЕНТ СТАТИСТИКИ ====================
const StatItem = ({ icon, label, value }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 20, fontWeight: 'bold' }}>{value}</div>
    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{label}</div>
  </div>
);

// ==================== КОМПОНЕНТ SESSION DETAILS ====================
const SessionDetailsModal = ({ visible, session, onClose, tests: testsProp, employees: employeesProp, lang: langProp }) => {
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
      footer={[<Button key="close" onClick={onClose}>{tModal[langProp].close}</Button>]}
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
              {tModal[langProp].info}
            </Button>
            <Button
              type={activeTab === "answers" ? "primary" : "default"}
              onClick={() => setActiveTab("answers")}
              style={activeTab === "answers" ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}}
            >
              {tModal[langProp].answers} ({session.answers?.length || 0})
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
                {session.durationMinutes
                  ? `${Math.floor(session.durationMinutes)} мин ${Math.round((session.durationMinutes % 1) * 60)} сек`
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Результат">
                {session.score !== null ? (
                  <Badge
                    count={`${session.score}%`}
                    style={{ backgroundColor: session.score >= 70 ? "#52c41a" : "#ff4d4f" }}
                  />
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
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Тип ответа: </Text>
                            <Tag color={question?.type === 3 ? "orange" : answer.optionId !== null ? "blue" : "green"}>
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

// ==================== ОСНОВНОЙ КОМПОНЕНТ TestManager ====================
export const TestManager = () => {
  const navigate = useNavigate();
  
  // Store для тестов и вопросов
  const { 
    tests = [], 
    loading: testsLoading, 
    fetchTests, 
    addTest, 
    editTest, 
    removeTest,
    totalRecords, 
  } = useTestStore();
  const { 
    questions = [], 
    fetchQuestions,
  } = useQuestionStore();

  // Store для сессий
  const {
    sessions = [],
    currentSession: storeCurrentSession,
    loading: sessionsLoading,
    pagination,
    startSession,
    submitAnswer,
    finishSession,
    fetchSessions,
    setCurrentSession,
    clearCurrentSession,
    getStats,
  } = useTestSessionStore();

  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { 
    testAssignments = [], 
    fetchTestAssignments,
  } = useTestAssignmentStore();
  const { 
    subdepartments = [], 
    fetchSubDepartments 
  } = useSubDepartmentStore();

  // Состояния
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("test_manager_lang");
    return savedLang || "ru";
  });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newTestId, setNewTestId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("select");
  
  const [titleRu, setTitleRu] = useState("");
  const [titleTj, setTitleTj] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [descriptionTj, setDescriptionTj] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  // Состояния для результатов теста
  const [testResultModalVisible, setTestResultModalVisible] = useState(false);
  const [testResultData, setTestResultData] = useState(null);

  // Состояния тестирования
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedSubDepartmentId, setSelectedSubDepartmentId] = useState(null);
  const [selectedTestDuration, setSelectedTestDuration] = useState(5);
  const [userManuallyChangedDuration, setUserManuallyChangedDuration] = useState(false);

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
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState(Date.now());
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [finishResultModal, setFinishResultModal] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const scrollRef = useRef(null);
  const API_BASE = "http://10.65.10.22:8525/api";

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  const getQuestionText = useCallback((question) => {
    if (!question) return "—";
    if (lang === "ru") {
      return question.contentRu || question.content || "—";
    }
    return question.contentTj || question.content || "—";
  }, [lang]);

  const getCorrectAnswerText = useCallback((question) => {
    if (!question) return "—";
    
    if (question.type === 2 && question.options?.length > 0) {
      const option = question.options[0];
      if (lang === "ru") {
        return option.textRu || option.text || "—";
      }
      return option.textTj || option.text || "—";
    }
    
    if (question.type === 1) {
      const correctOption = question.options?.find(o => o.isCorrect === true);
      if (correctOption) {
        if (lang === "ru") {
          return correctOption.textRu || correctOption.text || "—";
        }
        return correctOption.textTj || correctOption.text || "—";
      }
    }
    
    return "—";
  }, [lang]);

  const getTypeLabel = useCallback((type) => {
    if (type === 1) return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
    if (type === 2) return { label: lang === "ru" ? "Ручной" : "Дастӣ", color: "#722ed1", icon: <QuestionCircleOutlined /> };
    if (type === 3) return { label: lang === "ru" ? "Рейтинг" : "Баҳо", color: "#faad14", icon: <StarOutlined /> };
    return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
  }, [lang]);

  const getUsedQuestionIds = useCallback(() => {
    const usedIds = new Set();
    tests.forEach(test => {
      if (test.questions && test.questions.length > 0) {
        test.questions.forEach(q => {
          if (q.id) usedIds.add(q.id);
        });
      }
    });
    return usedIds;
  }, [tests]);

  const getAvailableQuestions = useCallback(() => {
    const usedIds = getUsedQuestionIds();
    return questions.filter(q => !usedIds.has(q.id));
  }, [questions, getUsedQuestionIds]);

  const checkCanStartTest = useCallback(
    (employeeId, testId) => {
      const employeeSessions = sessions.filter(
        (s) => s.employeeId === employeeId && s.testId === testId && s.status === 2,
      );
      return employeeSessions.length < 2;
    },
    [sessions],
  );

  const getEmployeeSubDepartment = useCallback((employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee?.subDepartmentId) {
      return employee.subDepartmentId;
    }
    const assignment = testAssignments.find(a => a.employeeId === employeeId);
    if (assignment?.subDepartmentId) {
      return assignment.subDepartmentId;
    }
    return null;
  }, [employees, testAssignments]);

  const getSubDepartmentName = useCallback((id) => {
    if (!id) return "—";
    const sub = subdepartments.find(s => Number(s.id) === Number(id));
    return sub?.name || `Отделение ${id}`;
  }, [subdepartments]);

  // ==================== ХУКИ ====================

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchSessions(),
          fetchTests(),
          fetchEmployee(),
          fetchQuestions(1, 1000),
          fetchSubDepartments(),
          fetchTestAssignments(1, 1000),
        ]);
        setDataLoaded(true);
        console.log("✅ Все данные загружены");
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }
    };
    loadAllData();
  }, []);

  const showTestResults = useCallback((resultData) => {
    setTestResultData(resultData);
    setTestResultModalVisible(true);
  }, []);

  useEffect(() => {
    const checkForTestResult = () => {
      const storedResult = localStorage.getItem("test_completion_result");
      if (storedResult) {
        try {
          const result = JSON.parse(storedResult);
          showTestResults(result);
          localStorage.removeItem("test_completion_result");
        } catch (e) {
          console.error("Error parsing test result:", e);
        }
      }
    };

    checkForTestResult();
    
    const handleStorageChange = (e) => {
      if (e.key === "test_completion_result") {
        checkForTestResult();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", checkForTestResult);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", checkForTestResult);
    };
  }, [showTestResults]);

  // ==================== ВЫЧИСЛЯЕМЫЕ ДАННЫЕ ====================

  const groupedEmployees = employees.reduce((groups, employee) => {
    const department = employee.department || "Без отдела";
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(employee);
    return groups;
  }, {});

  const stats = getStats();
  const availableQuestions = getAvailableQuestions();
  
  const filteredAvailableQuestions = availableQuestions.filter(q => {
    const searchMatch = getQuestionText(q).toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === "all" || q.type === parseInt(filterType);
    return searchMatch && typeMatch;
  });

  const selectedQuestions = questions.filter(q => selectedQuestionIds.includes(q.id));
  const displayQuestions = filteredAvailableQuestions;
  const answeredCount = answersHistory.filter((a) => a).length;

  // ==================== ТЕКСТЫ ====================

  const t = {
    ru: {
      title: "Управление тестами",
      addTest: "Создать тест",
      edit: "Редактировать",
      delete: "Удалить",
      save: "Сохранить",
      cancel: "Отмена",
      deleteConfirm: "Вы уверены, что хотите удалить этот тест?",
      testTitle: "Название теста",
      description: "Описание",
      questions: "Вопросы",
      availableQuestions: "Доступные вопросы",
      selectedQuestions: "Выбранные вопросы",
      questionText: "Текст вопроса",
      order: "Порядок",
      noTests: "Нет созданных тестов",
      noQuestions: "Нет доступных вопросов",
      testCreated: "Тест успешно создан",
      testUpdated: "Тест успешно обновлен",
      loading: "Загрузка...",
      questionCount: "вопросов",
      createFirst: "Создать первый тест",
      step1: "Основная информация",
      step2: "Выбор вопросов",
      step3: "Проверка и сохранение",
      next: "Далее",
      back: "Назад",
      testInfo: "Информация о тесте",
      questionsInfo: "Вопросы теста",
      summary: "Сводка",
      totalQuestions: "Всего вопросов",
      testReady: "Тест готов к публикации",
      fillTitle: "Пожалуйста, заполните название теста",
      selectQuestions: "Пожалуйста, выберите хотя бы один вопрос",
      success: "Успешно!",
      warning: "Внимание",
      info: "Информация",
      questionType: "Тип вопроса",
      test: "Тест",
      manual: "Ручной",
      allQuestions: "Все вопросы",
      manualAnswer: "Правильный ответ",
      selectAll: "Выбрать все",
      clearAll: "Очистить все",
      selected: "Выбрано",
      questionsSelected: "вопросов выбрано",
      searchPlaceholder: "Поиск вопросов...",
      allTypes: "Все типы",
      noQuestionsFound: "Вопросы не найдены",
      noAvailableQuestions: "Нет доступных вопросов для добавления в тест",
      createQuestionFirst: "Создайте вопросы перед созданием теста",
      usedInTests: "Используется в тестах",
      available: "Доступен",
      filters: "Фильтры",
      clearFilters: "Сбросить фильтры",
      showing: "Показано",
      of: "из",
      questionsFound: "вопросов найдено",
      preview: "Просмотр теста",
      noQuestionsInTest: "Нет вопросов в этом тесте",
      created: "Создан",
      totalQuestionsLabel: "Всего вопросов",
      correctAnswer: "Правильный ответ",
      question: "Вопрос",
      answer: "Ответ",
      correct: "Правильный",
      variant: "Вариант",
      add: "Добавить вариант",
      rating: "Рейтинг",
      selectRating: "Выберите рейтинг вопроса",
      createQuestion: "Создать вопрос",
      selectQuestionsTab: "Выбор вопросов",
      createQuestionTab: "Создать вопрос",
      startTest: "Начать тест",
      continue: "Продолжить",
      finish: "Завершить",
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
      correctAnswers: "Правильные ответы",
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
      percentage: "Процент выполнения",
      customDuration: "Своя длительность",
      minutesShort: "мин",
      department: "Отдел",
      ranking: "Рейтинг сотрудников",
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
      title: "Идоракунии тестҳо",
      addTest: "Эҷоди тест",
      edit: "Тағйир додан",
      delete: "Хориҷ",
      save: "Сабт кардан",
      cancel: "Бекор кардан",
      deleteConfirm: "Шумо боварӣ доред, ки ин тестро нест кардан мехоҳед?",
      testTitle: "Номи тест",
      description: "Тавсиф",
      questions: "Саволҳо",
      availableQuestions: "Саволҳои дастрас",
      selectedQuestions: "Саволҳои интихобшуда",
      questionText: "Матни савол",
      order: "Тартиб",
      noTests: "Тестҳо нестанд",
      noQuestions: "Саволҳо нестанд",
      testCreated: "Тест бомуваффақият эҷод шуд",
      testUpdated: "Тест бомуваффақият нав карда шуд",
      loading: "Боркунӣ...",
      questionCount: "савол",
      createFirst: "Эҷоди тести аввал",
      step1: "Маълумоти асосӣ",
      step2: "Интихоби саволҳо",
      step3: "Санҷиш ва сабт",
      next: "Баъдӣ",
      back: "Қаблӣ",
      testInfo: "Маълумоти тест",
      questionsInfo: "Саволҳои тест",
      summary: "Хулоса",
      totalQuestions: "Ҳамагӣ саволҳо",
      testReady: "Тест барои нашр омода аст",
      fillTitle: "Лутфан, номи тестро пур кунед",
      selectQuestions: "Лутфан, ҳадди ақал як саволро интихоб кунед",
      success: "Бомуваффақият!",
      warning: "Диққат",
      info: "Маълумот",
      questionType: "Навъи савол",
      test: "Тест",
      manual: "Дастӣ",
      allQuestions: "Ҳамаи саволҳо",
      manualAnswer: "Ҷавоби дуруст",
      selectAll: "Ҳамаро интихоб кунед",
      clearAll: "Ҳамаро тоза кунед",
      selected: "Интихоб шуд",
      questionsSelected: "савол интихоб шуд",
      searchPlaceholder: "Ҷустуҷӯи саволҳо...",
      allTypes: "Ҳамаи навъҳо",
      noQuestionsFound: "Саволҳо ёфт нашуд",
      noAvailableQuestions: "Барои илова ба тест саволҳо нестанд",
      createQuestionFirst: "Пеш аз эҷоди тест саволҳо эҷод кунед",
      usedInTests: "Дар тестҳо истифода мешавад",
      available: "Дастрас",
      filters: "Филтрҳо",
      clearFilters: "Тоза кардани филтрҳо",
      showing: "Нишон дода шуд",
      of: "аз",
      questionsFound: "савол ёфт шуд",
      preview: "Дидани тест",
      noQuestionsInTest: "Дар ин тест саволҳо нест",
      created: "Эҷод шуд",
      totalQuestionsLabel: "Ҳамагӣ саволҳо",
      correctAnswer: "Ҷавоби дуруст",
      question: "Савол",
      answer: "Ҷавоб",
      correct: "Дуруст",
      variant: "Вариант",
      add: "Илова вариант",
      rating: "Баҳо",
      selectRating: "Баҳои саволро интихоб кунед",
      createQuestion: "Эҷоди савол",
      selectQuestionsTab: "Интихоби саволҳо",
      createQuestionTab: "Эҷоди савол",
      startTest: "Оғози тест",
      continue: "Давом додан",
      finish: "Анҷом додан",
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
      correctAnswers: "Ҷавобҳои дуруст",
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
      percentage: "Фоизи иҷро",
      customDuration: "Давомнокии худ",
      minutesShort: "дақ.",
      department: "Шуъба",
      ranking: "Рейтинги кормандон",
      retake: "Аз нав супоридан",
      viewDetails: "Тафсилот",
      activeTest: "Тести фаъол",
      attemptsLeft: "Кӯшишҳои боқимонда",
      of2: "аз",
      retakeWarning: "Диққат! Ҳангоми аз нав супоридан 10 дақиқа ҷудо карда мешавад",
      presetTimes: "Интихоби зуд:",
      autoSave: "Автоҳифз",
      subDepartment: "Шуъба",
      selectSubDepartment: "Шуъбаи корманд",
      noSubDepartments: "Шуъбаи корманд муайян нашудааст",
      assignmentInfo: "Шуъба аз маълумоти корманд",
      creatingAssignment: "Эҷоди таъинот...",
    },
  };

  // ==================== ФУНКЦИИ ДЛЯ ТЕСТОВ (CRUD) ====================

  const openCreateModal = () => {
    setEditingItem(null);
    setCurrentStep(0);
    setTitleRu("");
    setTitleTj("");
    setDescriptionRu("");
    setDescriptionTj("");
    setSelectedQuestionIds([]);
    setSearchTerm("");
    setFilterType("all");
    setActiveTab("select");
    setOpen(true);
  };

  const openEditModal = (test) => {
    setEditingItem(test);
    setCurrentStep(0);
    setTitleRu(test.titleRu || test.title || "");
    setTitleTj(test.titleTj || test.title || "");
    setDescriptionRu(test.descriptionRu || test.description || "");
    setDescriptionTj(test.descriptionTj || test.description || "");
    
    const questionIds = test.questions?.map(q => q.id).filter(Boolean) || [];
    setSelectedQuestionIds(questionIds);
    setActiveTab("select");
    setOpen(true);
  };

  const openPreview = (test) => {
    setSelectedTest(test);
    setPreviewOpen(true);
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("test_manager_lang", newLang);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      const currentTitle = lang === "ru" ? titleRu : titleTj;
      if (!currentTitle.trim()) {
        message.warning(t[lang].fillTitle);
        return;
      }
    }
    if (currentStep === 1 && selectedQuestionIds.length === 0) {
      message.warning(t[lang].selectQuestions);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const selectAllQuestions = () => {
    const allIds = filteredAvailableQuestions.map(q => q.id);
    setSelectedQuestionIds(prev => {
      const newIds = [...prev];
      allIds.forEach(id => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      return newIds;
    });
  };

  const clearAllQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const handleQuestionCreated = (newQuestion) => {
    fetchQuestions(1, 1000);
    if (newQuestion && newQuestion.id) {
      setSelectedQuestionIds(prev => {
        if (!prev.includes(newQuestion.id)) {
          return [...prev, newQuestion.id];
        }
        return prev;
      });
      message.success("Вопрос добавлен в тест!");
    }
    setActiveTab("select");
  };

  const handleSave = async () => {
    const currentTitle = lang === "ru" ? titleRu : titleTj;
    if (!currentTitle.trim()) {
      message.warning(t[lang].fillTitle);
      return;
    }

    if (selectedQuestionIds.length === 0) {
      message.warning(t[lang].selectQuestions);
      return;
    }

    const questionsData = selectedQuestionIds.map((questionId, index) => {
      const question = questions.find(q => q.id === questionId);
      let correctAnswer = null;
      
      if (question) {
        if (question.type === 2 && question.options?.length > 0) {
          const option = question.options[0];
          correctAnswer = {
            textRu: option.textRu || option.text || "",
            textTj: option.textTj || option.text || "",
          };
        } else if (question.type === 1) {
          const correctOption = question.options?.find(o => o.isCorrect === true);
          if (correctOption) {
            correctAnswer = {
              textRu: correctOption.textRu || correctOption.text || "",
              textTj: correctOption.textTj || correctOption.text || "",
            };
          }
        }
      }
      
      return {
        questionId: questionId,
        order: index + 1,
        type: question?.type || 1,
        correctAnswer: correctAnswer,
      };
    });

    const payload = {
      titleRu: titleRu || titleTj,
      titleTj: titleTj || titleRu,
      descriptionRu: descriptionRu || descriptionTj,
      descriptionTj: descriptionTj || descriptionRu,
      questions: questionsData,
    };

    setSaving(true);

    try {
      let response;
      if (editingItem) {
        await editTest(editingItem.id, payload);
        message.success(t[lang].testUpdated);
      } else {
        response = await addTest(payload);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        message.success(t[lang].testCreated);
        
        if (response && response.id) {
          setNewTestId(response.id);
        }
      }
      
      await fetchTests();
      
      if (!editingItem && response && response.id) {
        setTimeout(() => {
          const element = document.getElementById(`test-${response.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setTimeout(() => setNewTestId(null), 3000);
        }, 500);
      }
      
      setOpen(false);
      resetForm();
      setCurrentStep(0);
    } catch (err) {
      console.error("Save error:", err);
      message.error(err.response?.data?.message || "Ошибка при сохранении теста");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitleRu("");
    setTitleTj("");
    setDescriptionRu("");
    setDescriptionTj("");
    setSelectedQuestionIds([]);
    setSearchTerm("");
    setFilterType("all");
    setCurrentStep(0);
    setActiveTab("select");
  };

  // ==================== ФУНКЦИИ ТЕСТИРОВАНИЯ ====================

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
        } else if (savedAnswer.optionId !== null && savedAnswer.optionId !== undefined) {
          setSelectedOptionId(savedAnswer.optionId);
        } else if (savedAnswer.textAnswer) {
          setManualAnswer(savedAnswer.textAnswer);
        }
      }
    },
    [sessionQuestions, currentSessionLocal],
  );

  const saveTestState = useCallback(() => {
    if (!isTestActive || !currentSessionLocal || !sessionQuestions.length || sessionComplete) return;

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
    localStorage.setItem("active_test_session", JSON.stringify(currentSessionLocal));
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

      const sessionExists = sessions.find((s) => s.id === savedState.sessionId && s.status === 1);
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
  }, [sessions, tests, loadSavedAnswerForQuestion]);

  const resetTestState = useCallback(() => {
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
  }, []);

  // Автосохранение
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isTestActive && currentSessionLocal && !sessionComplete) {
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
  }, [isTestActive, currentSessionLocal, sessionComplete, saveTestState]);

  useEffect(() => {
    const restore = async () => {
      if (!isRestoring && !isTestActive && !sessionComplete && sessions.length > 0 && tests.length > 0 && dataLoaded) {
        setIsRestoring(true);
        await restoreTestState();
        setIsRestoring(false);
      }
    };

    restore();
  }, [sessions.length, tests.length, isTestActive, sessionComplete, restoreTestState, dataLoaded]);

  useEffect(() => {
    if (!isTestActive || !currentSessionLocal || sessionComplete) return;

    const saveInterval = setInterval(() => {
      saveTestState();
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [isTestActive, currentSessionLocal, sessionComplete, saveTestState]);

  useEffect(() => {
    if (isTestActive && currentSessionLocal && !sessionComplete) {
      saveTestState();
    }
  }, [currentQuestionIndex, answersHistory, selectedOptionId, manualAnswer, ratingValue, elapsedSeconds, remainingSeconds]);

  useEffect(() => {
    if (storeCurrentSession && !sessionComplete && !isTestActive) {
      setCurrentSessionLocal(storeCurrentSession);
      setIsTestActive(true);
      const elapsedTime = storeCurrentSession.elapsedSeconds || 0;
      setSessionStartTimestamp(Date.now() - elapsedTime * 1000);
      const duration = storeCurrentSession.durationMinutes || selectedTestDuration || 5;
      setSelectedTestDuration(duration);
      setRemainingSeconds(duration * 60 - elapsedTime);
      saveTestState();
    }
  }, [storeCurrentSession, sessionComplete, isTestActive, selectedTestDuration, saveTestState]);

  useEffect(() => {
    if (selectedEmployeeId && selectedTestId) {
      const canStart = checkCanStartTest(selectedEmployeeId, selectedTestId);
      setCanStartTest(canStart);

      const unfinished = sessions.find(
        (s) => s.employeeId === selectedEmployeeId && s.testId === selectedTestId && s.status === 1,
      );
      setExistingSession(unfinished);
    }
  }, [selectedEmployeeId, selectedTestId, sessions, checkCanStartTest]);

  // ==================== ФУНКЦИИ ДЛЯ ЗАВЕРШЕНИЯ ТЕСТА ====================

  const handleRetakeTest = async (testId, employeeId) => {
    try {
      resetTestState();

      const fullDuration = 10;

      const completedSessionsCount = sessions.filter(
        (s) => s.employeeId === employeeId && s.testId === testId && s.status === 2,
      ).length;

      if (completedSessionsCount >= 2) {
        message.error("Доступно только 2 попытки сдачи теста");
        return;
      }

      const existingSessionForRetake = sessions.find(
        (s) => s.employeeId === employeeId && s.testId === testId,
      );
      const subDepartmentIdForRetake = existingSessionForRetake?.subDepartmentId || selectedSubDepartmentId;

      const session = await startSession(testId, employeeId, fullDuration, subDepartmentIdForRetake);
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

      message.success(`Тест начат заново! Время: ${fullDuration} минут. Удачи!`);
      await fetchSessions();

      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Retake session error:", error);
      message.error(error.response?.data?.message || "Ошибка при начале теста");
    }
  };

  // ==================== ГЛАВНАЯ ФУНКЦИЯ ЗАВЕРШЕНИЯ ТЕСТА ====================
  const handleFinishSession = async () => {
    if (!currentSessionLocal) return;

    setSubmitting(true);

    try {
      const finished = await finishSession(currentSessionLocal.id, currentSessionLocal.employeeId);
      setSessionComplete(true);
      setShowConfirmFinish(false);
      setIsTestActive(false);

      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      const passed = (finished.score || 0) >= 70;

      const test = tests.find((t) => t.id === currentSessionLocal.testId);
      const employee = employees.find((e) => e.id === currentSessionLocal.employeeId);

      // Данные для белого модального окна
      const resultData = {
        score: finished.score || 0,
        correctAnswers: finished.correctAnswersCount || 0,
        totalQuestions: finished.totalQuestionsCount || sessionQuestions.length,
        timeSpent: `${minutes} мин ${seconds} сек`,
        passed: passed,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "—",
        testName: lang === "ru" ? test?.titleRu || test?.title || "—" : test?.titleTj || test?.title || "—",
      };

      // Сохраняем результат
      localStorage.setItem("test_completion_result", JSON.stringify(resultData));
      console.log("✅ Результат теста сохранен в localStorage:", resultData);

      window.dispatchEvent(new Event('storage'));

      // ПОКАЗЫВАЕМ БЕЛОЕ МОДАЛЬНОЕ ОКНО
      showTestResults(resultData);

      setFinishResultModal({
        score: finished.score || 0,
        correctAnswers: finished.correctAnswersCount || 0,
        totalQuestions: finished.totalQuestionsCount || sessionQuestions.length,
        minutes,
        seconds,
        passed,
      });

      if (passed) {
        message.success(`Поздравляем! Тест пройден с результатом ${finished.score}%`);
      } else {
        message.warning(`Тест не пройден. Результат: ${finished.score}%. Попробуйте снова!`);
      }

      await fetchSessions();
      clearCurrentSession();
      setCurrentSessionLocal(null);
      resetTestState();

    } catch (error) {
      console.error("Finish session error:", error);
      message.error(error.response?.data?.message || "Ошибка при завершении сессии");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = async () => {
    if (!selectedTestId || !selectedEmployeeId) {
      message.warning("Выберите тест и сотрудника");
      return;
    }

    const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);
    
    if (!subDeptId) {
      message.warning("У сотрудника не указано отделение");
      return;
    }

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

    let hasAssignment = testAssignments.some(
      a => a.employeeId === selectedEmployeeId && a.testId === selectedTestId
    );

    if (!hasAssignment) {
      setIsCreatingAssignment(true);
      message.loading({ content: "Создание назначения...", key: "creating", duration: 0 });
      
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
        
        const text = await response.text();
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

    const finalCheck = testAssignments.some(
      a => a.employeeId === selectedEmployeeId && a.testId === selectedTestId
    );

    if (!finalCheck && !hasAssignment) {
      message.error("Назначение не создано. Попробуйте еще раз.");
      return;
    }

    try {
      const duration = selectedTestDuration || 5;

      resetTestState();

      const session = await startSession(selectedTestId, selectedEmployeeId, duration, subDeptId);
      
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
        message.error(error?.response?.data?.message || "Ошибка при начале сессии");
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
      await submitAnswer(currentSessionLocal.id, currentQ.id, optionId, textAnswer);

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
      message.error(error.response?.data?.message || "Ошибка при отправке ответа");
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

  // ==================== КОЛОНКИ ====================

  const columns = [
    {
      title: t[lang].order,
      key: "order",
      width: 80,
      render: (_, __, index) => <Badge count={index + 1} style={{ backgroundColor: "#ff4b2b" }} />,
    },
    {
      title: t[lang].questionText,
      key: "questionText",
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 14 }}>{getQuestionText(record)}</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="green" style={{ fontSize: 12 }}>
              ✅ {t[lang].manualAnswer}: {getCorrectAnswerText(record)}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: t[lang].questionType,
      key: "type",
      width: 120,
      render: (_, record) => {
        const typeInfo = getTypeLabel(record.type);
        return (
          <Tag color={typeInfo.color} icon={typeInfo.icon} style={{ borderRadius: 20, border: 'none' }}>
            {typeInfo.label}
          </Tag>
        );
      },
    },
  ];

  const sessionColumns = [
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
        return emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${record.employeeId}`;
      },
    },
    {
      title: t[lang].status,
      dataIndex: "status",
      render: (status) => {
        switch (status) {
          case 1:
            return <Tag color="processing" icon={<ClockCircleOutlined />}>{t[lang].testingInProgress}</Tag>;
          case 2:
            return <Tag color="success" icon={<CheckCircleOutlined />}>{t[lang].testingCompleted}</Tag>;
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
              style={{ backgroundColor: record.score >= 70 ? "#52c41a" : "#ff4d4f" }}
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
          (s) => s.employeeId === record.employeeId && s.testId === record.testId && s.status === 2,
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
              <Tooltip title={`${t[lang].retakeWarning}. ${t[lang].attemptsLeft}: ${2 - completedCount} ${t[lang].of2} 2`}>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => handleRetakeTest(record.testId, record.employeeId)}
                  danger
                >
                  {t[lang].retake}
                </Button>
              </Tooltip>
            )}
            {record.status === 2 && completedCount >= 2 && (
              <Tooltip title={t[lang].cannotRetake}>
                <Button size="small" disabled>{t[lang].retake}</Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // ==================== КОМПОНЕНТ ВЫБОРА ВОПРОСОВ ====================

  const QuestionSelector = () => {
    const usedIds = getUsedQuestionIds();
    const isEditing = !!editingItem;
    
    return (
      <div>
        <Alert
          message={t[lang].info}
          description={
            <div>
              <Text>
                {isEditing 
                  ? "Редактирование теста. Вы можете добавлять новые вопросы или удалять существующие."
                  : "Выберите вопросы для теста из доступных (не используются в других тестах)."
                }
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue" style={{ borderRadius: 20 }}>
                  {isEditing 
                    ? `В тесте: ${selectedQuestionIds.length} вопросов`
                    : `Доступно: ${availableQuestions.length} вопросов`
                  }
                </Tag>
                {!isEditing && questions.length > 0 && (
                  <Tag color="orange" style={{ borderRadius: 20 }}>
                    Используется в тестах: {questions.length - availableQuestions.length}
                  </Tag>
                )}
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />

        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
          <TabPane tab={<span><FormOutlined /> {t[lang].selectQuestionsTab}</span>} key="select">
            <div style={{ background: "#f8f9fa", padding: "16px 20px", borderRadius: 12, marginBottom: 20 }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Space size="middle" wrap>
                  <Button 
                    icon={<PlusOutlined />} 
                    onClick={selectAllQuestions}
                    style={{ borderRadius: 20 }}
                    disabled={filteredAvailableQuestions.length === 0}
                    type="primary"
                    ghost
                  >
                    {t[lang].selectAll}
                  </Button>
                  <Button 
                    icon={<MinusOutlined />} 
                    onClick={clearAllQuestions}
                    style={{ borderRadius: 20 }}
                    disabled={selectedQuestionIds.length === 0}
                    danger
                    ghost
                  >
                    {t[lang].clearAll}
                  </Button>
                </Space>
                
                <Space size="middle" wrap>
                  <Input
                    placeholder={t[lang].searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 250, borderRadius: 20 }}
                    allowClear
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    size="middle"
                  />
                  
                  <Select
                    value={filterType}
                    onChange={setFilterType}
                    style={{ width: 150, borderRadius: 20 }}
                    size="middle"
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="all">{t[lang].allTypes}</Option>
                    <Option value="1"><span style={{ color: "#52c41a" }}>📝 {t[lang].test}</span></Option>
                    <Option value="2"><span style={{ color: "#722ed1" }}>✏️ {t[lang].manual}</span></Option>
                    <Option value="3"><span style={{ color: "#faad14" }}>⭐ {t[lang].rating}</span></Option>
                  </Select>
                  
                  {(searchTerm || filterType !== "all") && (
                    <Button 
                      icon={<ClearOutlined />} 
                      onClick={() => {
                        setSearchTerm("");
                        setFilterType("all");
                      }}
                      style={{ borderRadius: 20 }}
                      size="middle"
                    >
                      {t[lang].clearFilters}
                    </Button>
                  )}
                </Space>
              </Flex>
              
              {availableQuestions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {t[lang].showing} {displayQuestions.length} {t[lang].of} {availableQuestions.length} {t[lang].questionsFound}
                    {selectedQuestionIds.length > 0 && (
                      <span style={{ marginLeft: 16 }}>
                        <Tag color="red" style={{ borderRadius: 20 }}>
                          {t[lang].selected}: {selectedQuestionIds.length}
                        </Tag>
                      </span>
                    )}
                  </Text>
                </div>
              )}
            </div>

            {displayQuestions.length === 0 ? (
              <Empty
                description={
                  searchTerm || filterType !== "all"
                    ? t[lang].noQuestionsFound
                    : isEditing 
                      ? "В этом тесте нет вопросов"
                      : questions.length === 0 
                        ? t[lang].createQuestionFirst
                        : t[lang].noAvailableQuestions
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 40 }}
              >
                {!isEditing && questions.length === 0 && (
                  <Button 
                    type="primary" 
                    onClick={() => setActiveTab("create")} 
                    style={{ borderRadius: 20, background: "#ff4b2b", borderColor: "#ff4b2b" }}
                  >
                    {t[lang].createQuestion}
                  </Button>
                )}
                {(searchTerm || filterType !== "all") && (
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                    }}
                    style={{ borderRadius: 20 }}
                  >
                    {t[lang].clearFilters}
                  </Button>
                )}
              </Empty>
            ) : (
              <div style={{ maxHeight: 450, overflow: "auto", padding: "4px" }}>
                <Row gutter={[16, 16]}>
                  {displayQuestions.map((question) => {
                    const isSelected = selectedQuestionIds.includes(question.id);
                    const isUsed = usedIds.has(question.id) && !isSelected && !editingItem;
                    const typeInfo = getTypeLabel(question.type);
                    const isInTest = editingItem && selectedQuestionIds.includes(question.id);
                    
                    return (
                      <Col xs={24} key={question.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <Card
                            onClick={() => {
                              if (isUsed) {
                                message.warning("Этот вопрос уже используется в другом тесте");
                                return;
                              }
                              toggleQuestionSelection(question.id);
                            }}
                            style={{
                              cursor: isUsed ? "not-allowed" : "pointer",
                              borderRadius: 16,
                              border: isSelected ? "2px solid #ff4b2b" : "1px solid #e8e8e8",
                              background: isSelected 
                                ? "linear-gradient(135deg, #fff5f5, #ffffff)" 
                                : isUsed 
                                  ? "#f5f5f5" 
                                  : "white",
                              transition: "all 0.3s ease",
                              boxShadow: isSelected ? "0 4px 12px rgba(255, 75, 43, 0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                              opacity: isUsed ? 0.6 : 1,
                            }}
                            styles={{ body: { padding: "16px 20px" } }}
                          >
                            <Flex align="center" gap={16}>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => {
                                  if (isUsed) {
                                    message.warning("Этот вопрос уже используется в другом тесте");
                                    return;
                                  }
                                  toggleQuestionSelection(question.id);
                                }}
                                disabled={isUsed}
                                style={{ flexShrink: 0 }}
                              />
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: 15, display: "block", fontWeight: isSelected ? 500 : 400 }}>
                                  {getQuestionText(question)}
                                </Text>
                                <Flex gap={8} style={{ marginTop: 8 }} wrap="wrap">
                                  <Tag color={typeInfo.color} icon={typeInfo.icon} style={{ borderRadius: 20, border: 'none' }}>
                                    {typeInfo.label}
                                  </Tag>
                                  <Tag color="green" style={{ borderRadius: 20, fontSize: 12, border: 'none' }}>
                                    ✅ {getCorrectAnswerText(question)}
                                  </Tag>
                                  {isUsed && !isSelected && (
                                    <Tag color="red" style={{ borderRadius: 20, border: 'none' }}>
                                      🔒 {t[lang].usedInTests}
                                    </Tag>
                                  )}
                                  {isInTest && (
                                    <Tag color="blue" style={{ borderRadius: 20, border: 'none' }}>
                                      📝 В текущем тесте
                                    </Tag>
                                  )}
                                </Flex>
                              </div>

                              {isSelected && (
                                <div style={{
                                  background: "#ff4b2b",
                                  color: "white",
                                  borderRadius: "50%",
                                  width: 28,
                                  height: 28,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  boxShadow: "0 2px 8px rgba(255, 75, 43, 0.3)",
                                }}>
                                  <CheckOutlined />
                                </div>
                              )}
                            </Flex>
                          </Card>
                        </motion.div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            )}

            {displayQuestions.length > 0 && (
              <div style={{ 
                marginTop: 24, 
                padding: "16px 20px", 
                background: "linear-gradient(135deg, #f8f9fa, #ffffff)", 
                borderRadius: 12,
                border: "1px solid #f0f0f0",
              }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                  <div>
                    <Text strong style={{ fontSize: 15 }}>
                      <TrophyOutlined style={{ marginRight: 8, color: "#ff4b2b" }} />
                      {t[lang].selected}: {selectedQuestionIds.length} {t[lang].questionsSelected}
                    </Text>
                  </div>
                  <div style={{ width: 250 }}>
                    <Progress 
                      percent={Math.round((selectedQuestionIds.length / Math.max(1, (editingItem ? questions.length : availableQuestions.length))) * 100)} 
                      strokeColor="#ff4b2b"
                      size="small"
                      showInfo={false}
                    />
                  </div>
                </Flex>
              </div>
            )}
          </TabPane>
          <TabPane tab={<span><PlusOutlined /> {t[lang].createQuestionTab}</span>} key="create">
            <QuestionCreator 
              onQuestionCreated={handleQuestionCreated} 
              lang={lang} 
              t={{
                question: t[lang].question,
                answer: t[lang].answer,
                correct: t[lang].correct,
                variant: t[lang].variant,
                add: t[lang].add,
                test: t[lang].test,
                manual: t[lang].manual,
                rating: t[lang].rating,
                correctAnswer: t[lang].correctAnswer,
                selectRating: t[lang].selectRating,
              }}
            />
          </TabPane>
        </Tabs>
      </div>
    );
  };

  const loading = testsLoading || sessionsLoading;

  // ==================== РЕНДЕР ====================

  if (loading && sessions.length === 0 && tests.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50, alignItems: "center", height: "60vh" }}>
        <Spin size="small" tip={t[lang].loading} />
      </div>
    );
  }

  return (
    <div ref={scrollRef} style={{ padding: 24, maxWidth: 1400, margin: "0 auto", background: "#f0f2f5", minHeight: "100vh" }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={['#ff416c', '#ff4b2b', '#ff6b4a', '#ff8c6b']}
        />
      )}

      {/* ==================== ВЕРХНЯЯ ПАНЕЛЬ ==================== */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24, padding: "0 8px" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {tests.length} {tests.length === 1 ? "тест" : "тестов"} • Всего {questions.length} вопросов • {sessions.length} сессий
          </Text>
        </div>

        <Space size="middle">
          {/* Кнопки RU/TJ */}
          <Button
            type={lang === "ru" ? "primary" : "default"}
            onClick={() => handleSetLang("ru")}
            style={lang === "ru" ? { background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 } : { borderRadius: 20 }}
          >
            RU
          </Button>
          <Button
            type={lang === "tj" ? "primary" : "default"}
            onClick={() => handleSetLang("tj")}
            style={lang === "tj" ? { background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 } : { borderRadius: 20 }}
          >
            TJ
          </Button>
          
          {/* Кнопка "Начать тест" */}
          {!isTestActive && (
            <Button
              type="primary"
              onClick={() => {
                setUserManuallyChangedDuration(false);
                setTestModalOpen(true);
              }}
              icon={<PlayCircleOutlined />}
              size="large"
              style={{ background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 }}
            >
              {t[lang].startTest}
            </Button>
          )}
          
          {/* Кнопка "Создать тест" */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="primary"
              onClick={openCreateModal}
              style={{
                background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                border: "none",
                boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
                fontWeight: "bold",
                height: "40px",
                padding: "0 24px",
                borderRadius: "20px",
              }}
              icon={<RocketOutlined />}
            >
              {t[lang].addTest}
            </Button>
          </motion.div>
        </Space>
      </Flex>

      {/* ==================== СТАТИСТИКА ==================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={t[lang].totalSessions} value={stats.total} prefix={<FileDoneOutlined />} valueStyle={{ color: "#3f8600" }} />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={t[lang].completedSessions} value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#52c41a" }} />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={t[lang].inProgressSessions} value={stats.inProgress} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#1890ff" }} />
        </Card>
        <Card style={{ borderRadius: 12 }}>
          <Statistic title={t[lang].averageScore} value={stats.averageScore} suffix="%" prefix={<TrophyOutlined />} valueStyle={{ color: "#faad14" }} />
        </Card>
      </div>

      {/* ==================== АКТИВНЫЙ ТЕСТ (TestSession внутри) ==================== */}
      {isTestActive && currentSessionLocal && !sessionComplete && sessionQuestions.length > 0 && (
        <>
          {/* Индикатор автосохранения */}
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

          {/* Карточка с информацией о тесте */}
          <Card style={{ marginBottom: 16, borderRadius: 12, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <Row gutter={16} align="middle">
              <Col>
                <Avatar icon={<SafetyOutlined />} style={{ backgroundColor: "#fff", color: "#667eea" }} />
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

          {/* Основная часть теста */}
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
                  {answeredCount} {t[lang].of} {sessionQuestions.length} {t[lang].questionsAnswered}
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
                  <Descriptions.Item label={t[lang].questionsCount}>{sessionQuestions.length}</Descriptions.Item>
                  <Descriptions.Item label={t[lang].estimatedTime}>{selectedTestDuration} {t[lang].minutes}</Descriptions.Item>
                  <Descriptions.Item label="Попытка">
                    {sessions.filter((s) => s.employeeId === currentSessionLocal.employeeId && s.testId === currentSessionLocal.testId && s.status === 2).length + 1} из 2
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* ==================== СПИСОК ТЕСТОВ ==================== */}
      <AnimatePresence>
        {!tests || tests.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card style={{ textAlign: "center", padding: 60, borderRadius: 20 }}>
              <FileTextOutlined style={{ fontSize: 64, color: "#ff4b2b", marginBottom: 20 }} />
              <Title level={4}>{t[lang].noTests}</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
                Нажмите кнопку "Создать тест" чтобы создать первый тест
              </Text>
              <Button type="primary" onClick={openCreateModal} style={{ background: "#ff4b2b", borderRadius: 20 }} icon={<RocketOutlined />}>
                {t[lang].createFirst}
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Row gutter={[24, 24]}>
              {tests.map((test, index) => {
                const isHovered = hoveredCard === test.id;
                const isNew = newTestId === test.id;
                const questionCount = test.questions?.length || 0;
                
                return (
                  <Col xs={24} md={12} lg={8} key={test.id}>
                    <motion.div
                      id={`test-${test.id}`}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        boxShadow: isNew ? "0 0 0 3px #ff4b2b, 0 0 0 6px rgba(255, 75, 43, 0.3)" : "none"
                      }}
                      transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ y: -8 }}
                    >
                      {isNew && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          style={{ position: "absolute", top: -10, right: -10, zIndex: 10 }}
                        >
                          <Tag color="red" style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>NEW! 🎉</Tag>
                        </motion.div>
                      )}
                      
                      <Card
                        onClick={() => openPreview(test)}
                        onMouseEnter={() => setHoveredCard(test.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          borderRadius: 20,
                          boxShadow: isHovered ? "0 12px 24px rgba(0, 0, 0, 0.12)" : "0 4px 12px rgba(0, 0, 0, 0.08)",
                          transition: "all 0.3s ease",
                          border: "none",
                          overflow: "hidden",
                          cursor: "pointer",
                          backgroundImage: `url(${img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                        styles={{ body: { padding: 0, background: 'transparent' } }}
                      >
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(0, 0, 0, 0.1)", background: "rgba(255, 255, 255, 0.9)" }}>
                          <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
                            <Avatar style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", verticalAlign: "middle" }} size={50}>
                              <FileTextOutlined />
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Title level={4} style={{ margin: 0, color: "#1a1a1a", fontSize: 18 }}>
                                {lang === "ru" ? test.titleRu || test.title : test.titleTj || test.title}
                              </Title>
                              <Flex gap={8} align="center" style={{ marginTop: 8 }}>
                                <Tag icon={<ClockCircleOutlined />} color="blue" style={{ borderRadius: 20 }}>
                                  {questionCount} {t[lang].questionCount}
                                </Tag>
                              </Flex>
                            </div>
                          </Flex>
                          
                          {(lang === "ru" ? test.descriptionRu || test.description : test.descriptionTj || test.description) && (
                            <Text type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 12, marginBottom: 0, display: "block" }}>
                              {lang === "ru" ? test.descriptionRu || test.description : test.descriptionTj || test.description}
                            </Text>
                          )}
                        </div>

                        <div style={{ padding: "16px 24px", background: "rgba(255, 255, 255, 0.9)" }}>
                          <Flex justify="end" align="center">
                            <Space>
                              <Button
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(test);
                                }}
                                style={{ borderRadius: 8 }}
                              >
                                {t[lang].edit}
                              </Button>
                              <Popconfirm
                                title={t[lang].deleteConfirm}
                                onConfirm={async (e) => {
                                  e?.stopPropagation();
                                  await removeTest(test.id);
                                  message.success("Тест удален");
                                }}
                                okText="Да"
                                cancelText="Нет"
                              >
                                <Button danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} style={{ borderRadius: 8 }}>
                                  {t[lang].delete}
                                </Button>
                              </Popconfirm>
                            </Space>
                          </Flex>
                        </div>
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </motion.div>
        )}
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", justifyContent: "end" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger={false}
            showQuickJumper={false}
            pageSizeOptions={[5, 10, 20, 50]}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </AnimatePresence>

      {/* ==================== РЕЙТИНГ СОТРУДНИКОВ ==================== */}
      <EmployeeRanking sessions={sessions} employees={employees} tests={tests} lang={lang} />

      {/* ==================== ИСТОРИЯ ТЕСТИРОВАНИЙ ==================== */}
      {(!isTestActive || sessionComplete) && (
        <Card
          title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><HistoryOutlined /><span>История тестирований</span></div>}
          style={{ borderRadius: 12, marginTop: 24 }}
        >
          {!sessions || sessions.length === 0 ? (
            <Empty description={t[lang].noSessions} />
          ) : (
            <Table
              dataSource={sessions}
              columns={sessionColumns}
              rowKey="id"
              onRow={(record) => ({ onClick: () => handleRowClick(record), style: { cursor: "pointer" } })}
              pagination={{
                current: pagination.pageNumber,
                pageSize: pagination.pageSize,
                total: pagination.totalCount,
                onChange: (page) => fetchSessions(page, pagination.pageSize),
              }}
              scroll={{ x: 1200 }}
              loading={sessionsLoading}
            />
          )}
        </Card>
      )}

      {/* ==================== ВСЕ МОДАЛЬНЫЕ ОКНА ==================== */}

      {/* БЕЛОЕ МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ ТЕСТА */}
      <TestResultsModal
        visible={testResultModalVisible}
        result={testResultData}
        onClose={() => {
          setTestResultModalVisible(false);
          setTestResultData(null);
        }}
        lang={lang}
      />

      {/* Модальное окно создания/редактирования теста */}
      <Modal
        open={open}
        onCancel={() => { setOpen(false); resetForm(); }}
        footer={null}
        width={1100}
        centered
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", padding: "24px 30px", color: "white" }}>
            <Flex align="center" gap={12}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {editingItem ? <EditOutlined style={{ fontSize: 24 }} /> : <RocketOutlined style={{ fontSize: 24 }} />}
              </div>
              <div>
                <Title level={3} style={{ color: "white", margin: 0 }}>
                  {editingItem ? t[lang].edit : t[lang].addTest}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  {editingItem ? "Измените параметры теста" : "Заполните информацию о новом тесте"}
                </Text>
              </div>
            </Flex>
          </div>

          <div style={{ padding: "24px 30px 0 30px", background: "#fff" }}>
            <Steps
              current={currentStep}
              items={[
                { title: t[lang].step1, icon: <FileTextOutlined /> },
                { title: t[lang].step2, icon: <QuestionCircleOutlined /> },
                { title: t[lang].step3, icon: <CheckCircleOutlined /> },
              ]}
              style={{ marginBottom: 30 }}
            />
          </div>

          <div style={{ padding: "0 30px 30px 30px", background: "#fff" }}>
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                  <Alert message={t[lang].info} description="Введите основную информацию о тесте." type="info" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
                  
                  <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                      {t[lang].testTitle} <span style={{ color: "#ff4b2b" }}>*</span>
                    </Text>
                    <Input
                      value={lang === "ru" ? titleRu : titleTj}
                      onChange={(e) => {
                        if (lang === "ru") setTitleRu(e.target.value);
                        else setTitleTj(e.target.value);
                      }}
                      placeholder={lang === "ru" ? "Введите название теста" : "Номи тестро ворид кунед"}
                      size="large"
                      style={{ borderRadius: 12 }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                      {t[lang].description}
                    </Text>
                    <Input.TextArea
                      value={lang === "ru" ? descriptionRu : descriptionTj}
                      onChange={(e) => {
                        if (lang === "ru") setDescriptionRu(e.target.value);
                        else setDescriptionTj(e.target.value);
                      }}
                      placeholder={lang === "ru" ? "Введите описание теста" : "Тавсифи тестро ворид кунед"}
                      rows={4}
                      size="large"
                      style={{ borderRadius: 12 }}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                  <QuestionSelector />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                  <Alert message={t[lang].success} description={t[lang].testReady} type="success" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
                  
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ background: "linear-gradient(135deg, #fff5f5, #ffffff)", padding: 20, borderRadius: 16, border: "1px solid #ffe0e0" }}>
                      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                        <Avatar style={{ background: "#ff4b2b" }}><FileTextOutlined /></Avatar>
                        <div>
                          <Text strong style={{ fontSize: 18 }}>
                            {lang === "ru" ? titleRu || "Без названия" : titleTj || "Безунвон"}
                          </Text>
                          <div>
                            <Tag color="blue" style={{ marginTop: 4, borderRadius: 20 }}>
                              {selectedQuestionIds.length} {t[lang].totalQuestions}
                            </Tag>
                          </div>
                        </div>
                      </Flex>
                    </div>
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div>
                      <Text strong style={{ fontSize: 16, display: "block", marginBottom: 12 }}>
                        📋 {t[lang].questionsInfo}:
                      </Text>
                      <div style={{ maxHeight: 300, overflow: "auto" }}>
                        <Table dataSource={selectedQuestions} columns={columns} pagination={false} size="small" style={{ borderRadius: 12 }} rowKey="id" />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
              <Button onClick={() => setOpen(false)} style={{ borderRadius: 10 }}>
                {t[lang].cancel}
              </Button>
              <Space>
                {currentStep > 0 && <Button onClick={handleBack} style={{ borderRadius: 10 }}>{t[lang].back}</Button>}
                {currentStep < 2 ? (
                  <Button type="primary" onClick={handleNext} style={{ background: "#ff4b2b", borderRadius: 10 }} icon={<ArrowRightOutlined />}>
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleSave} loading={saving} style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", borderRadius: 10, fontWeight: "bold" }} icon={<RocketOutlined />}>
                    {saving ? "Сохранение..." : (editingItem ? t[lang].save : t[lang].addTest)}
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </div>
      </Modal>

      {/* Модальное окно предпросмотра теста */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 20px', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {lang === "ru" ? selectedTest?.titleRu || selectedTest?.title || "Без названия" : selectedTest?.titleTj || selectedTest?.title || "Безунвон"}
            </span>
            <Space wrap>
              <Tag color="blue" style={{ borderRadius: 20, padding: '4px 12px' }}>
                <ClockCircleOutlined /> {selectedTest?.questions?.length || 0} {t[lang].questionCount}
              </Tag>
            </Space>
          </div>
        }
        styles={{ header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }, body: { paddingTop: 20 } }}
      >
        {selectedTest && (selectedTest.descriptionRu || selectedTest.description || selectedTest.descriptionTj) && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8f9fa', borderRadius: 8, borderLeft: '4px solid #ff4b2b' }}>
            <Text>
              {lang === "ru" ? selectedTest.descriptionRu || selectedTest.description : selectedTest.descriptionTj || selectedTest.description}
            </Text>
          </div>
        )}

        <Table
          dataSource={selectedTest?.questions || []}
          rowKey="id"
          columns={[
            { title: "№", key: "index", width: 60, render: (_, __, index) => <Badge count={index + 1} style={{ backgroundColor: "#ff4b2b" }} /> },
            {
              title: lang === "ru" ? "Вопрос" : "Савол",
              key: "question",
              render: (_, record) => (
                <div>
                  <Text style={{ fontSize: 15 }}>
                    {lang === "ru" ? record.contentRu || record.content : record.contentTj || record.content}
                  </Text>
                  {(record.type === 1 || record.type === 2) && (
                    <div style={{ marginTop: 6 }}>
                      <Tag color="green" style={{ fontSize: 12, borderRadius: 20, border: 'none' }}>
                        ✅ {t[lang].correctAnswer}: {getCorrectAnswerText(record)}
                      </Tag>
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: lang === "ru" ? "Тип" : "Навъ",
              key: "type",
              width: 130,
              render: (_, record) => {
                const typeInfo = getTypeLabel(record.type);
                return <Tag color={typeInfo.color} icon={typeInfo.icon} style={{ borderRadius: 20, border: 'none' }}>{typeInfo.label}</Tag>;
              },
            },
          ]}
          pagination={false}
          locale={{ emptyText: t[lang].noQuestionsInTest }}
          style={{ borderRadius: 12 }}
        />

        <div style={{ marginTop: 20, padding: '16px 20px', background: 'linear-gradient(135deg, #f8f9fa, #ffffff)', borderRadius: 12, border: '1px solid #f0f0f0' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <StatItem icon={<QuestionCircleOutlined style={{ color: '#ff4b2b' }} />} label={t[lang].totalQuestionsLabel} value={selectedTest?.questions?.length || 0} />
            </Col>
            <Col xs={24} sm={12}>
              <StatItem icon={<ClockCircleOutlined style={{ color: '#1890ff' }} />} label={t[lang].created} value={selectedTest?.createdAt ? new Date(selectedTest.createdAt).toLocaleDateString(lang === "ru" ? 'ru-RU' : 'tj-TJ') : '—'} />
            </Col>
          </Row>
        </div>
      </Modal>

      {/* Модальное окно деталей сессии */}
      <SessionDetailsModal
        visible={sessionModalVisible}
        session={selectedSessionForModal}
        onClose={() => { setSessionModalVisible(false); setSelectedSessionForModal(null); }}
        tests={tests}
        employees={employees}
        lang={lang}
      />

      {/* Модальное окно начала теста */}
      <Modal
        title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><PlayCircleOutlined style={{ color: "#ff4b2b" }} /><span>{t[lang].startTest}</span></div>}
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setTestModalOpen(false)}>{t[lang].close}</Button>,
          <Button
            key="start"
            type="primary"
            onClick={handleStartSession}
            style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
            disabled={!canStartTest || !selectedSubDepartmentId || isCreatingAssignment}
            loading={isCreatingAssignment}
          >
            {isCreatingAssignment ? t[lang].creatingAssignment : `${t[lang].startTest} (${selectedTestDuration} мин)`}
          </Button>,
        ]}
        width={650}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <Text strong>{t[lang].test}:</Text>
            <Select
              placeholder={t[lang].selectTest}
              value={selectedTestId}
              onChange={(value) => setSelectedTestId(value)}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              size="large"
            >
              {tests.map((test) => (
                <Select.Option key={test.id} value={test.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <BookOutlined />
                      {lang === "ru" ? test.titleRu || test.title : test.titleTj || test.title}
                    </div>
                    <Tag color="blue">по умолч. {test.durationMinutes || 30} мин</Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

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
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t[lang].presetTimes}</Text>
              {[5, 10, 15, 20, 30, 45, 60].map((min) => (
                <Button
                  key={min}
                  size="small"
                  type={selectedTestDuration === min ? "primary" : "default"}
                  onClick={() => { setSelectedTestDuration(min); setUserManuallyChangedDuration(true); }}
                  style={selectedTestDuration === min ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}}
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

          <div>
            <Text strong>{t[lang].employee}:</Text>
            <Select
              placeholder={t[lang].selectEmployee}
              value={selectedEmployeeId}
              onChange={(value) => { setSelectedEmployeeId(value); setSelectedSubDepartmentId(null); }}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              size="large"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const children = option?.props?.children;
                if (typeof children === "object") {
                  const text = children.props.children[1]?.props?.children || "";
                  return text.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            >
              {Object.entries(groupedEmployees).map(([department, deptEmployees]) => (
                <Select.OptGroup key={department} label={`${t[lang].department}: ${department}`}>
                  {deptEmployees.map((emp) => (
                    <Select.Option key={emp.id} value={emp.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <UserOutlined />
                        {emp.firstName} {emp.lastName}
                        <Text type="secondary" style={{ fontSize: 12 }}>{emp.email}</Text>
                        {emp.subDepartmentId && (
                          <Tag color="green" style={{ marginLeft: 4 }}>
                            <ApartmentOutlined /> {getSubDepartmentName(emp.subDepartmentId)}
                          </Tag>
                        )}
                      </div>
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>{t[lang].subDepartment}:</Text>
            {selectedEmployeeId ? (
              <>
                {selectedSubDepartmentId ? (
                  <Card size="small" style={{ marginTop: 8, background: "#f6ffed", borderColor: "#b7eb8f", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ApartmentOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                      <div>
                        <Text strong style={{ fontSize: 16 }}>{getSubDepartmentName(selectedSubDepartmentId)}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {(() => {
                            const employee = employees.find(e => e.id === selectedEmployeeId);
                            if (employee?.subDepartmentId) return "Отделение из данных сотрудника";
                            const assignment = testAssignments.find(a => a.employeeId === selectedEmployeeId);
                            if (assignment?.subDepartmentId) return "Отделение из назначения";
                            return "Отделение";
                          })()}
                        </Text>
                      </div>
                      <Tag color="green" style={{ marginLeft: "auto" }}>
                        <CheckCircleOutlined />
                        {(() => {
                          const employee = employees.find(e => e.id === selectedEmployeeId);
                          if (employee?.subDepartmentId) return "Из сотрудника";
                          const assignment = testAssignments.find(a => a.employeeId === selectedEmployeeId);
                          if (assignment?.subDepartmentId) return "Из назначения";
                          return "Нет";
                        })()}
                      </Tag>
                    </div>
                  </Card>
                ) : (
                  <Alert message="У сотрудника не указано отделение" description="Пожалуйста, укажите отделение в карточке сотрудника или создайте назначение" type="warning" showIcon style={{ marginTop: 8 }} />
                )}
              </>
            ) : (
              <div style={{ marginTop: 8 }}>
                <Select placeholder={t[lang].selectSubDepartment} disabled style={{ width: "100%" }}>
                  <Select.Option value="">{t[lang].selectEmployee}</Select.Option>
                </Select>
              </div>
            )}
          </div>

          {selectedEmployeeId && selectedTestId && !canStartTest && (
            <Alert message={t[lang].alreadyPassed} description={t[lang].cannotRetake} type="error" showIcon icon={<StopOutlined />} />
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
                  onClick={() => { handleContinueSession(existingSession); setTestModalOpen(false); }}
                >
                  {t[lang].continue}
                </Button>
              }
            />
          )}
        </div>
      </Modal>

      {/* Модальное окно подтверждения завершения теста */}
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

      {/* Внутреннее модальное окно результата */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {finishResultModal?.passed ? <TrophyOutlined style={{ color: "#ffd700" }} /> : <WarningOutlined style={{ color: "#ff4d4f" }} />}
            <span>{finishResultModal?.passed ? t[lang].congratulations : t[lang].details}</span>
          </div>
        }
        open={finishResultModal !== null}
        onCancel={() => setFinishResultModal(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setFinishResultModal(null)} style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}>
            {t[lang].close}
          </Button>,
        ]}
        width={500}
      >
        {finishResultModal && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Progress type="circle" percent={finishResultModal.score} format={(percent) => `${percent}%`} strokeColor={finishResultModal.passed ? "#52c41a" : "#ff4d4f"} width={120} />
              <Title level={4} style={{ marginTop: 16, color: finishResultModal.passed ? "#52c41a" : "#ff4d4f" }}>
                {finishResultModal.passed ? t[lang].passed : t[lang].failed}
              </Title>
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t[lang].result}>
                <Text strong style={{ color: finishResultModal.passed ? "#52c41a" : "#ff4d4f", fontSize: 18 }}>
                  {finishResultModal.score}%
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t[lang].correctAnswers}>
                {finishResultModal.correctAnswers}/{finishResultModal.totalQuestions}
              </Descriptions.Item>
              <Descriptions.Item label={t[lang].timeSpent}>
                {finishResultModal.minutes} мин {finishResultModal.seconds} сек
              </Descriptions.Item>
            </Descriptions>
            {!finishResultModal.passed && finishResultModal.score < 70 && (
              <Alert message="Не расстраивайтесь!" description="У вас есть еще одна попытка для сдачи этого теста." type="info" showIcon style={{ marginTop: 16 }} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};