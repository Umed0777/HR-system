// components/SurveyManager.jsx – ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ (с модальным окном)
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
import { useEmployeeStore } from "../store/useEmployee";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import {
  Button,
  Modal,
  Input,
  Space,
  Card,
  Tabs,
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
  Descriptions,
  Statistic,
  Tooltip,
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
  SaveOutlined,
  StarOutlined,
  UserOutlined,
  PlayCircleOutlined,
  FormOutlined,
  BarChartOutlined,
  SendOutlined,
  TeamOutlined,
  EyeOutlined,
  ApartmentOutlined,
  HourglassOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ============================================================
// 1. КОМПОНЕНТ СОЗДАНИЯ ВОПРОСА
// ============================================================
const SurveyQuestionCreator = ({ onQuestionCreated, lang, t }) => {
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
        message="Создание нового вопроса для опроса"
        description="Заполните поля и сохраните вопрос. Он будет доступен для добавления в опрос."
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
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {t.selectRating}
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <div
                key={num}
                onClick={() => setRatingAnswer(num)}
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
                  background: ratingAnswer === num ? "linear-gradient(135deg, #1890ff, #096dd9)" : "rgba(255,255,255,0.9)",
                  color: ratingAnswer === num ? "#fff" : "#333",
                  border: ratingAnswer === num ? "3px solid #bae7ff" : "1px solid #e8e8e8",
                  boxShadow: ratingAnswer === num ? "0 8px 20px rgba(24, 144, 255, 0.35)" : "0 2px 6px rgba(0,0,0,0.08)",
                }}
              >
                {num}
              </div>
            ))}
          </div>
          {ratingAnswer && (
            <div style={{ marginTop: 12 }}>
              <Tag color="orange" style={{ fontSize: 14, padding: "4px 12px" }}>
                {t.rating}: {ratingAnswer}/10
              </Tag>
            </div>
          )}
        </div>
      )}

      <Button
        type="primary"
        onClick={handleSaveQuestion}
        loading={creating}
        style={{
          marginTop: 16,
          background: "linear-gradient(135deg, #1890ff, #096dd9)",
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

// ============================================================
// 2. КОМПОНЕНТ ПРОХОЖДЕНИЯ ОПРОСА (с сохранением состояния)
// ============================================================
const SurveyTaking = ({
  survey,
  questions,
  onComplete,
  onClose,
  employeeId,
  lang,
  t,
  durationMinutes = 5,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [timerActive, setTimerActive] = useState(true);
  const [restored, setRestored] = useState(false);

  const STORAGE_KEY = `active_survey_${survey?.id || "unknown"}_${employeeId || "unknown"}`;

  useEffect(() => {
    if (!survey || !employeeId) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.surveyId === survey.id && state.employeeId === employeeId) {
          setCurrentQuestionIndex(state.currentQuestionIndex || 0);
          setAnswers(state.answers || {});
          const remaining = state.timeLeft !== undefined ? state.timeLeft : durationMinutes * 60;
          setTimeLeft(remaining);
          setTimerActive(state.timerActive !== undefined ? state.timerActive : true);
          setStartTime(Date.now() - (durationMinutes * 60 - remaining) * 1000);
          setRestored(true);
          if (remaining <= 0) {
            handleComplete();
          }
          return;
        }
      } catch (e) {
        console.warn("Failed to restore survey state", e);
      }
    }
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(durationMinutes * 60);
    setTimerActive(true);
    setStartTime(Date.now());
    setRestored(true);
  }, [survey, employeeId, durationMinutes]);

  useEffect(() => {
    if (!restored || !survey || !employeeId || isCompleted) return;
    const state = {
      surveyId: survey.id,
      employeeId: employeeId,
      currentQuestionIndex,
      answers,
      timeLeft,
      timerActive,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [currentQuestionIndex, answers, timeLeft, timerActive, survey, employeeId, restored, isCompleted]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || isCompleted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          message.warning("Время на прохождение опроса истекло!");
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, isCompleted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const getQuestionText = (q) => {
    if (!q) return "—";
    return lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content;
  };

  const getOptionText = (option) => {
    if (!option) return "—";
    return lang === "ru" ? option.textRu || option.text : option.textTj || option.text;
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleComplete = async () => {
    if (answeredCount < totalQuestions && timeLeft > 0) {
      const unanswered = totalQuestions - answeredCount;
      message.warning(`Пожалуйста, ответьте на все вопросы. Осталось ${unanswered} вопросов.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = {
        surveyId: survey.id,
        employeeId: employeeId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId: parseInt(questionId),
          answer: value,
        })),
        completedAt: new Date().toISOString(),
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        isCompleted: answeredCount === totalQuestions,
      };

      const savedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
      const existingIndex = savedResults.findIndex(
        (r) => r.surveyId === result.surveyId && r.employeeId === result.employeeId
      );
      if (existingIndex !== -1) {
        savedResults[existingIndex] = { ...savedResults[existingIndex], ...result };
      } else {
        savedResults.push(result);
      }
      localStorage.setItem("survey_results", JSON.stringify(savedResults));
      localStorage.removeItem(STORAGE_KEY);

      if (answeredCount === totalQuestions) {
        message.success("Опрос успешно завершен! Спасибо за участие.");
      } else {
        message.warning(`Опрос завершен. Отвечено на ${answeredCount} из ${totalQuestions} вопросов.`);
      }

      setIsCompleted(true);
      if (onComplete) {
        onComplete(result);
      }

      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error("Error completing survey:", error);
      message.error("Ошибка при завершении опроса");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Empty description="Вопросы не найдены" />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <Title level={2}>Спасибо за участие в опросе!</Title>
        <Text type="secondary">Ваши ответы успешно сохранены.</Text>
        <div style={{ marginTop: 20 }}>
          <Button type="primary" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    );
  }

  const isTimeAlmostUp = timeLeft < 60;
  const isTimeUp = timeLeft <= 0;

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          padding: "10px 16px",
          background: isTimeUp ? "#ff4d4f" : isTimeAlmostUp ? "#fff7e6" : "#f0f7ff",
          borderRadius: 12,
          border: isTimeUp ? "2px solid #ff4d4f" : isTimeAlmostUp ? "1px solid #ffa940" : "1px solid #1890ff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <ClockCircleOutlined
            style={{
              color: isTimeUp ? "#fff" : isTimeAlmostUp ? "#faad14" : "#1890ff",
              marginRight: 8,
            }}
          />
          <Text
            style={{
              color: isTimeUp ? "#fff" : isTimeAlmostUp ? "#d48806" : "#1890ff",
              fontWeight: 500,
            }}
          >
            {t.timeRemaining || "Осталось времени:"}
          </Text>
        </div>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: isTimeUp ? "#fff" : isTimeAlmostUp ? "#d48806" : "#1890ff",
          }}
        >
          {formatTime(timeLeft)}
        </Text>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Flex justify="space-between" align="center">
          <Text strong style={{ fontSize: 16 }}>
            Вопрос {currentQuestionIndex + 1} из {totalQuestions}
          </Text>
          <Text type="secondary">
            Отвечено: {answeredCount} из {totalQuestions}
          </Text>
        </Flex>
        <Progress
          percent={Math.round((answeredCount / totalQuestions) * 100)}
          strokeColor={isTimeAlmostUp ? "#faad14" : "#1890ff"}
          trailColor="#f0f0f0"
          style={{ marginTop: 8 }}
          showInfo={false}
        />
      </div>

      <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue" style={{ borderRadius: 20, fontSize: 12, padding: "2px 14px" }}>
            Вопрос {currentQuestionIndex + 1}
          </Tag>
          {currentQuestion?.type === 1 && (
            <Tag color="green" style={{ borderRadius: 20, fontSize: 12, marginLeft: 8 }}>
              Тест
            </Tag>
          )}
          {currentQuestion?.type === 2 && (
            <Tag color="purple" style={{ borderRadius: 20, fontSize: 12, marginLeft: 8 }}>
              Ручной
            </Tag>
          )}
          {currentQuestion?.type === 3 && (
            <Tag color="orange" style={{ borderRadius: 20, fontSize: 12, marginLeft: 8 }}>
              Рейтинг
            </Tag>
          )}
        </div>

        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 24, lineHeight: 1.6 }}>
          {getQuestionText(currentQuestion)}
        </div>

        <Divider orientation="left" style={{ fontSize: 13, margin: "16px 0" }}>
          <Text type="secondary">Ваш ответ</Text>
        </Divider>

        {currentQuestion?.type === 1 && (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            style={{ width: "100%" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentQuestion?.options?.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === (option.id || idx);
                return (
                  <div
                    key={option.id || idx}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      backgroundColor: isSelected ? "#e6f7ff" : "#fafafa",
                      border: isSelected ? "2px solid #1890ff" : "1px solid #e8e8e8",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onClick={() => handleAnswer(currentQuestion.id, option.id || idx)}
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

        {currentQuestion?.type === 2 && (
          <TextArea
            placeholder="Введите ваш ответ..."
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            rows={4}
            size="large"
            style={{ fontSize: 15, borderRadius: 10 }}
          />
        )}

        {currentQuestion?.type === 3 && (
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
              Выберите рейтинг (1-10):
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const active = answers[currentQuestion.id] === num;
                return (
                  <div
                    key={num}
                    onClick={() => handleAnswer(currentQuestion.id, num)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: 16,
                      transition: "0.3s",
                      background: active ? "linear-gradient(135deg, #1890ff, #096dd9)" : "#f5f5f5",
                      color: active ? "#fff" : "#333",
                      border: active ? "3px solid #bae7ff" : "1px solid #d9d9d9",
                      boxShadow: active ? "0 4px 16px rgba(24, 144, 255, 0.3)" : "none",
                    }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
        <Button
          icon={<LeftOutlined />}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          size="large"
          style={{ borderRadius: 10, minWidth: 100 }}
        >
          Назад
        </Button>

        {currentQuestionIndex === totalQuestions - 1 || isTimeUp ? (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleComplete}
            loading={isSubmitting}
            size="large"
            style={{
              background: isTimeUp ? "#ff4d4f" : "#52c41a",
              borderColor: isTimeUp ? "#ff4d4f" : "#52c41a",
              borderRadius: 10,
              minWidth: 120,
              fontWeight: 500,
            }}
          >
            {isTimeUp ? "Завершить (время истекло)" : "Завершить"}
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<RightOutlined />}
            onClick={handleNext}
            size="large"
            style={{
              background: "#1890ff",
              borderColor: "#1890ff",
              borderRadius: 10,
              minWidth: 120,
              fontWeight: 500,
            }}
          >
            Далее
          </Button>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
          Быстрая навигация:
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentQuestionIndex;

            return (
              <Button
                key={q.id}
                size="small"
                type={isCurrent ? "primary" : "default"}
                style={{
                  backgroundColor: isAnswered && !isCurrent ? "#52c41a" : undefined,
                  color: isAnswered && !isCurrent ? "white" : undefined,
                  borderColor: isCurrent ? "#1890ff" : undefined,
                  width: 32,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
                  fontWeight: isCurrent ? 600 : 400,
                }}
                onClick={() => goToQuestion(idx)}
              >
                {idx + 1}
                {isAnswered && <CheckCircleOutlined style={{ fontSize: 8, marginLeft: 1 }} />}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ ПОСЛЕ ЗАВЕРШЕНИЯ ОПРОСА
// ============================================================
const SurveyResultsModal = ({ visible, result, onClose, lang }) => {
  const t = {
    ru: {
      surveyResults: "Результаты опроса",
      employee: "Сотрудник",
      surveyName: "Опрос",
      answeredQuestions: "Отвечено вопросов",
      totalQuestions: "Всего вопросов",
      timeSpent: "Затраченное время",
      status: "Статус",
      completed: "Завершен ✅",
      notCompleted: "Не завершен ❌",
      close: "Закрыть",
      congratulations: "Спасибо за участие! 🎉",
      notCompletedMessage: "Вы не ответили на все вопросы",
      completionRate: "Процент завершения",
      answers: "Ответы",
      rating: "Рейтинг",
      textAnswer: "Текстовый ответ",
      question: "Вопрос",
      answer: "Ответ",
    },
    tj: {
      surveyResults: "Натиҷаҳои пурсиш",
      employee: "Корманд",
      surveyName: "Пурсиш",
      answeredQuestions: "Саволҳои ҷавобдодашуда",
      totalQuestions: "Ҳамагӣ саволҳо",
      timeSpent: "Вақти сарфшуда",
      status: "Ҳолат",
      completed: "Анҷомёфта ✅",
      notCompleted: "Анҷом наёфта ❌",
      close: "Пӯшидан",
      congratulations: "Ташаккур барои иштирок! 🎉",
      notCompletedMessage: "Шумо ба ҳамаи саволҳо ҷавоб надодаед",
      completionRate: "Фоизи анҷом",
      answers: "Ҷавобҳо",
      rating: "Баҳо",
      textAnswer: "Ҷавоби матнӣ",
      question: "Савол",
      answer: "Ҷавоб",
    },
  };

  if (!result) return null;

  const isCompleted = result.isCompleted !== false;
  const answeredCount = result.answers?.length || 0;
  const totalQuestions = result.totalQuestions || 0;
  const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const getQuestionText = (questionId, questions) => {
    const q = questions?.find((q) => q.id === questionId);
    if (!q) return "—";
    return lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content;
  };

  const getAnswerText = (answer, questions) => {
    const q = questions?.find((q) => q.id === answer.questionId);
    if (!q) return String(answer.answer);

    if (q.type === 1) {
      const option = q.options?.find((o) => o.id === answer.answer || o.text === answer.answer);
      if (lang === "ru") {
        return option?.textRu || option?.text || String(answer.answer);
      }
      return option?.textTj || option?.text || String(answer.answer);
    }

    if (q.type === 3) {
      return `⭐ ${answer.answer}/10`;
    }

    return String(answer.answer);
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isCompleted ? (
            <TrophyOutlined style={{ color: "#1890ff", fontSize: 28 }} />
          ) : (
            <WarningOutlined style={{ color: "#faad14", fontSize: 28 }} />
          )}
          <span style={{ fontSize: 20, fontWeight: 600 }}>{t[lang].surveyResults}</span>
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
            background: isCompleted ? "#1890ff" : "#faad14",
            borderColor: isCompleted ? "#1890ff" : "#faad14",
            borderRadius: 12,
            padding: "0 32px",
            height: 44,
            fontWeight: 600,
          }}
        >
          {t[lang].close}
        </Button>,
      ]}
      width={600}
      centered
      styles={{
        header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 16 },
        body: { paddingTop: 24, paddingBottom: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
    >
      <div>
        {isCompleted && (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 56, animation: "bounce 1s infinite" }}>🎉</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Progress
            type="circle"
            percent={completionPercent}
            format={(percent) => (
              <div>
                <div style={{ fontSize: 30, fontWeight: "bold", lineHeight: 1 }}>{percent}%</div>
                <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
                  {t[lang].completionRate}
                </div>
              </div>
            )}
            strokeColor={isCompleted ? "#1890ff" : "#faad14"}
            trailColor="#f0f0f0"
            width={150}
          />
        </div>

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: isCompleted ? "#1890ff" : "#faad14",
            }}
          >
            {isCompleted ? t[lang].congratulations : t[lang].notCompletedMessage}
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
                <Text type="secondary">{t[lang].surveyName}:</Text>
                <Text strong>{result.surveyName || "—"}</Text>
              </div>
            </Col>
          </Row>
        </div>

        <Row gutter={[12, 12]}>
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
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>{t[lang].answeredQuestions}</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>{answeredCount}</div>
            </div>
          </Col>
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
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>{t[lang].totalQuestions}</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>{totalQuestions}</div>
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

        {result.answers && result.answers.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Divider orientation="left">
              <Text strong>{t[lang].answers}</Text>
            </Divider>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {result.answers.map((answer, idx) => {
                const questions = result.questions || [];
                const q = questions.find((q) => q.id === answer.questionId);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "10px 14px",
                      marginBottom: 8,
                      background: "#fafafa",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Tag color="blue" style={{ borderRadius: 50, minWidth: 24, textAlign: "center" }}>
                        {idx + 1}
                      </Tag>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: 500 }}>
                          {getQuestionText(answer.questionId, questions)}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t[lang].answer}:{" "}
                          </Text>
                          <Text style={{ fontSize: 13 }}>{getAnswerText(answer, questions)}</Text>
                          {q?.type === 3 && (
                            <Tag color="orange" style={{ marginLeft: 8 }}>
                              <StarOutlined /> {t[lang].rating}
                            </Tag>
                          )}
                          {q?.type === 2 && (
                            <Tag color="purple" style={{ marginLeft: 8 }}>
                              {t[lang].textAnswer}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isCompleted && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message={t[lang].notCompletedMessage}
              description="Пожалуйста, ответьте на все вопросы в следующий раз."
              type="warning"
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

// ============================================================
// 4. КОМПОНЕНТ ДЛЯ ПРОСМОТРА ВСЕХ РЕЗУЛЬТАТОВ (в модальном окне)
// ============================================================
const SurveyResults = ({ survey, questions, results, employees, lang, t }) => {
  const getEmployeeName = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${employeeId}`;
  };

  const columns = [
    {
      title: "Сотрудник",
      key: "employee",
      render: (_, record) => getEmployeeName(record.employeeId),
    },
    {
      title: "Отвечено",
      key: "answered",
      render: (_, record) => {
        const count = record.answers?.length || 0;
        const total = record.totalQuestions || 0;
        return `${count} / ${total}`;
      },
    },
    {
      title: "Статус",
      key: "status",
      render: (_, record) =>
        record.isCompleted !== false ? (
          <Tag color="success">Завершен</Tag>
        ) : (
          <Tag color="warning">Не завершен</Tag>
        ),
    },
    {
      title: "Время",
      dataIndex: "timeSpent",
      render: (time) => time || "—",
    },
    {
      title: "Дата",
      dataIndex: "completedAt",
      render: (date) => (date ? new Date(date).toLocaleString() : "—"),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Участников" value={results.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Средний % завершения"
              value={
                results.length > 0
                  ? Math.round(
                      results.reduce((acc, r) => {
                        const answered = r.answers?.length || 0;
                        const total = r.totalQuestions || 0;
                        return acc + (total > 0 ? (answered / total) * 100 : 0);
                      }, 0) / results.length
                    )
                  : 0
              }
              suffix="%"
            />
          </Card>
        </Col>
      </Row>
      <Table dataSource={results} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />
    </div>
  );
};

// ============================================================
// 5. ОСНОВНОЙ КОМПОНЕНТ SurveyManager
// ============================================================
export const SurveyManager = ({ onStartSurvey }) => {
  const navigate = useNavigate();

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
    loading: questionsLoading,
  } = useQuestionStore();

  const {
    employees = [],
    fetchEmployee,
  } = useEmployeeStore();

  const {
    subdepartments = [],
    fetchSubDepartments,
  } = useSubDepartmentStore();

  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("survey_manager_lang");
    return savedLang || "ru";
  });

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [newSurveyId, setNewSurveyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("select");

  const [titleRu, setTitleRu] = useState("");
  const [titleTj, setTitleTj] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [descriptionTj, setDescriptionTj] = useState("");

  const [surveyTakingOpen, setSurveyTakingOpen] = useState(false);
  const [selectedSurveyForTaking, setSelectedSurveyForTaking] = useState(null);
  const [selectedEmployeeIdForTaking, setSelectedEmployeeIdForTaking] = useState(null);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [tempEmployeeId, setTempEmployeeId] = useState(null);

  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedSurveyForResults, setSelectedSurveyForResults] = useState(null);
  const [surveyResults, setSurveyResults] = useState([]);

  const [hoveredCard, setHoveredCard] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [startSurveyModalOpen, setStartSurveyModalOpen] = useState(false);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedSubDepartmentId, setSelectedSubDepartmentId] = useState(null);
  const [selectedSurveyDuration, setSelectedSurveyDuration] = useState(5);

  const [surveyResultModalVisible, setSurveyResultModalVisible] = useState(false);
  const [surveyResultData, setSurveyResultData] = useState(null);

  // ==============================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ==============================================================
  const refreshData = useCallback(async () => {
    try {
      await Promise.all([fetchTests(), fetchQuestions(1, 1000), fetchEmployee(), fetchSubDepartments()]);
      const savedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
      setSurveyResults(savedResults);
    } catch (error) {
      console.error("Ошибка при обновлении данных:", error);
    }
  }, [fetchTests, fetchQuestions, fetchEmployee, fetchSubDepartments]);

  const groupedEmployees = employees.reduce((groups, employee) => {
    const department = employee.department || "Без отдела";
    if (!groups[department]) groups[department] = [];
    groups[department].push(employee);
    return groups;
  }, {});

  const getEmployeeSubDepartment = useCallback(
    (employeeId) => {
      const employee = employees.find((e) => e.id === employeeId);
      return employee?.subDepartmentId || null;
    },
    [employees]
  );

  const getSubDepartmentName = useCallback(
    (id) => {
      if (!id) return "—";
      const sub = subdepartments.find((s) => Number(s.id) === Number(id));
      return sub?.name || `Отделение ${id}`;
    },
    [subdepartments]
  );

  const getQuestionText = useCallback(
    (question) => {
      if (!question) return "—";
      if (lang === "ru") {
        return question.contentRu || question.content || "—";
      }
      return question.contentTj || question.content || "—";
    },
    [lang]
  );

  const getTypeLabel = useCallback(
    (type) => {
      if (type === 1) return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
      if (type === 2) return { label: lang === "ru" ? "Ручной" : "Дастӣ", color: "#722ed1", icon: <QuestionCircleOutlined /> };
      if (type === 3) return { label: lang === "ru" ? "Рейтинг" : "Баҳо", color: "#faad14", icon: <StarOutlined /> };
      return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
    },
    [lang]
  );

  const getUsedQuestionIds = useCallback(() => {
    const usedIds = new Set();
    tests.forEach((test) => {
      if (test.testType === 0 && test.questions?.length > 0) {
        test.questions.forEach((q) => {
          const questionId = q.id || q.questionId;
          if (questionId) usedIds.add(questionId);
        });
      }
    });
    return usedIds;
  }, [tests]);

  const getAvailableQuestions = useCallback(() => {
    const usedIds = getUsedQuestionIds();
    return questions.filter((q) => !usedIds.has(q.id));
  }, [questions, getUsedQuestionIds]);

  // ==============================================================
  // surveys и getSurveyQuestions
  // ==============================================================
  const surveys = tests.filter((test) => test.testType === 0);

  const getSurveyQuestions = useCallback(
    (survey) => {
      if (!survey || !survey.questions) return [];
      if (survey.questions.length > 0 && survey.questions[0].contentRu) {
        return survey.questions;
      }
      const questionIds = survey.questions.map((q) => q.id || q.questionId).filter(Boolean);
      const foundQuestions = questions.filter((q) => questionIds.includes(q.id));
      if (foundQuestions.length === 0 && survey.questions.length > 0) {
        return survey.questions.map((q) => ({
          ...q,
          contentRu: q.contentRu || q.content || "Вопрос",
          contentTj: q.contentTj || q.content || "Вопрос",
        }));
      }
      return foundQuestions;
    },
    [questions]
  );

  // ==============================================================
  // useEffect
  // ==============================================================
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([fetchTests(), fetchQuestions(1, 1000), fetchEmployee(), fetchSubDepartments()]);
        setDataLoaded(true);
        const savedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
        setSurveyResults(savedResults);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }
    };
    loadAllData();
  }, []);

  // Восстановление активного опроса
  useEffect(() => {
    if (!dataLoaded) return;
    const savedState = localStorage.getItem("active_survey_state");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const survey = surveys.find((s) => s.id === state.surveyId);
        const employee = employees.find((e) => e.id === state.employeeId);
        if (survey && employee) {
          setSelectedSurveyForTaking(survey);
          setSelectedEmployeeIdForTaking(state.employeeId);
          setSurveyTakingOpen(true);
        } else {
          localStorage.removeItem("active_survey_state");
        }
      } catch (e) {
        localStorage.removeItem("active_survey_state");
      }
    }
  }, [dataLoaded, surveys, employees]);

  useEffect(() => {
    const savedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
    setSurveyResults(savedResults);
  }, [surveyTakingOpen]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (selectedEmployeeId) {
      const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);
      setSelectedSubDepartmentId(subDeptId || null);
    } else {
      setSelectedSubDepartmentId(null);
    }
  }, [selectedEmployeeId, dataLoaded, getEmployeeSubDepartment]);

  // ==============================================================
  // ТЕКСТЫ
  // ==============================================================
  const t = {
    ru: {
      title: "Управление опросами",
      addSurvey: "Создать опрос",
      edit: "Редактировать",
      delete: "Удалить",
      save: "Сохранить",
      cancel: "Отмена",
      deleteConfirm: "Вы уверены, что хотите удалить этот опрос?",
      surveyTitle: "Название опроса",
      description: "Описание",
      questions: "Вопросы",
      availableQuestions: "Доступные вопросы",
      selectedQuestions: "Выбранные вопросы",
      questionText: "Текст вопроса",
      order: "Порядок",
      noSurveys: "Нет созданных опросов",
      noQuestions: "Нет доступных вопросов",
      surveyCreated: "Опрос успешно создан",
      surveyUpdated: "Опрос успешно обновлен",
      loading: "Загрузка...",
      questionCount: "вопросов",
      createFirst: "Создать первый опрос",
      step1: "Основная информация",
      step2: "Выбор вопросов",
      step3: "Проверка и сохранение",
      next: "Далее",
      back: "Назад",
      surveyInfo: "Информация об опросе",
      questionsInfo: "Вопросы опроса",
      summary: "Сводка",
      totalQuestions: "Всего вопросов",
      surveyReady: "Опрос готов к публикации",
      fillTitle: "Пожалуйста, заполните название опроса",
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
      noAvailableQuestions: "Нет доступных вопросов для добавления в опрос",
      createQuestionFirst: "Создайте вопросы перед созданием опроса",
      usedInTests: "Используется в опросах",
      available: "Доступен",
      filters: "Фильтры",
      clearFilters: "Сбросить фильтры",
      showing: "Показано",
      of: "из",
      questionsFound: "вопросов найдено",
      preview: "Просмотр опроса",
      noQuestionsInSurvey: "Нет вопросов в этом опросе",
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
      startSurvey: "Начать опрос",
      selectSurvey: "Выберите опрос",
      selectEmployee: "Выберите сотрудника",
      close: "Закрыть",
      results: "Результаты",
      viewResults: "Посмотреть результаты",
      participants: "Участников",
      takeSurvey: "Пройти опрос",
      surveyResults: "Результаты опроса",
      employee: "Сотрудник",
      department: "Отдел",
      subDepartment: "Отделение",
      selectSubDepartment: "Выберите отделение",
      selectDuration: "Длительность опроса",
      minutes: "минут",
      minutesShort: "мин",
      presetTimes: "Быстрый выбор:",
      customDuration: "Своя длительность",
      timeRemaining: "Осталось времени:",
      infoDuration: "На прохождение опроса дается {minutes} минут. Вы можете изменить время выше.",
      deleteSuccess: "Опрос успешно удален",
      deleteError: "Ошибка при удалении опроса",
      refresh: "Обновить",
      alreadyPassed: "Вы уже проходили этот опрос. Повторная сдача недоступна.",
    },
    tj: {
      title: "Идоракунии пурсишҳо",
      addSurvey: "Эҷоди пурсиш",
      edit: "Тағйир додан",
      delete: "Хориҷ",
      save: "Сабт кардан",
      cancel: "Бекор кардан",
      deleteConfirm: "Шумо боварӣ доред, ки ин пурсишро нест кардан мехоҳед?",
      surveyTitle: "Номи пурсиш",
      description: "Тавсиф",
      questions: "Саволҳо",
      availableQuestions: "Саволҳои дастрас",
      selectedQuestions: "Саволҳои интихобшуда",
      questionText: "Матни савол",
      order: "Тартиб",
      noSurveys: "Пурсишҳо нестанд",
      noQuestions: "Саволҳо нестанд",
      surveyCreated: "Пурсиш бомуваффақият эҷод шуд",
      surveyUpdated: "Пурсиш бомуваффақият нав карда шуд",
      loading: "Боркунӣ...",
      questionCount: "савол",
      createFirst: "Эҷоди пурсиши аввал",
      step1: "Маълумоти асосӣ",
      step2: "Интихоби саволҳо",
      step3: "Санҷиш ва сабт",
      next: "Баъдӣ",
      back: "Қаблӣ",
      surveyInfo: "Маълумоти пурсиш",
      questionsInfo: "Саволҳои пурсиш",
      summary: "Хулоса",
      totalQuestions: "Ҳамагӣ саволҳо",
      surveyReady: "Пурсиш барои нашр омода аст",
      fillTitle: "Лутфан, номи пурсишро пур кунед",
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
      noAvailableQuestions: "Барои илова ба пурсиш саволҳо нестанд",
      createQuestionFirst: "Пеш аз эҷоди пурсиш саволҳо эҷод кунед",
      usedInTests: "Дар пурсишҳо истифода мешавад",
      available: "Дастрас",
      filters: "Филтрҳо",
      clearFilters: "Тоза кардани филтрҳо",
      showing: "Нишон дода шуд",
      of: "аз",
      questionsFound: "савол ёфт шуд",
      preview: "Дидани пурсиш",
      noQuestionsInSurvey: "Дар ин пурсиш саволҳо нест",
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
      startSurvey: "Оғози пурсиш",
      selectSurvey: "Пурсишро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      close: "Пӯшидан",
      results: "Натиҷаҳо",
      viewResults: "Дидани натиҷаҳо",
      participants: "Иштирокчиён",
      takeSurvey: "Гузаштани пурсиш",
      surveyResults: "Натиҷаҳои пурсиш",
      employee: "Корманд",
      department: "Шуъба",
      subDepartment: "Шуъбаи хурд",
      selectSubDepartment: "Шуъбаи хурдро интихоб кунед",
      selectDuration: "Давомнокии пурсиш",
      minutes: "дақиқа",
      minutesShort: "дақ.",
      presetTimes: "Интихоби зуд:",
      customDuration: "Давомнокии худ",
      timeRemaining: "Вақти боқимонда:",
      infoDuration: "Барои гузаштани пурсиш {minutes} дақиқа дода мешавад. Шумо метавонед вақтро тағйир диҳед.",
      deleteSuccess: "Пурсиш бомуваффақият нест карда шуд",
      deleteError: "Хатогӣ ҳангоми нест кардани пурсиш",
      refresh: "Навсозӣ",
      alreadyPassed: "Шумо аллакай ин пурсишро гузаштаед. Аз нав супоридан дастрас нест.",
    },
  };

  // ==============================================================
  // ФУНКЦИИ ДЛЯ РАБОТЫ С ОПРОСАМИ
  // ==============================================================
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

  const openEditModal = (survey) => {
    setEditingItem(survey);
    setCurrentStep(0);
    setTitleRu(survey.titleRu || survey.title || "");
    setTitleTj(survey.titleTj || survey.title || "");
    setDescriptionRu(survey.descriptionRu || survey.description || "");
    setDescriptionTj(survey.descriptionTj || survey.description || "");
    const questionIds = survey.questions?.map((q) => q.id || q.questionId).filter(Boolean) || [];
    setSelectedQuestionIds(questionIds);
    setActiveTab("select");
    setOpen(true);
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("survey_manager_lang", newLang);
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
    setSelectedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const selectAllQuestions = () => {
    const availableQuestions = getAvailableQuestions();
    const allIds = availableQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => {
      const newIds = [...prev];
      allIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
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
      setSelectedQuestionIds((prev) => {
        if (!prev.includes(newQuestion.id)) {
          return [...prev, newQuestion.id];
        }
        return prev;
      });
      message.success("Вопрос добавлен в опрос!");
    }
    setActiveTab("select");
  };

  const handleDurationChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 480) {
      setSelectedSurveyDuration(numValue);
    } else if (value === "") {
      setSelectedSurveyDuration(5);
    }
  };

  const showSurveyResults = useCallback((resultData) => {
    setSurveyResultData(resultData);
    setSurveyResultModalVisible(true);
  }, []);

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
    setSaving(true);
    try {
      const payload = {
        titleRu: titleRu || titleTj,
        titleTj: titleTj || titleRu,
        descriptionRu: descriptionRu || descriptionTj,
        descriptionTj: descriptionTj || descriptionRu,
        testType: 0,
        questions: selectedQuestionIds.map((questionId, index) => ({
          questionId: questionId,
          order: index + 1,
        })),
      };
      let response;
      if (editingItem) {
        response = await editTest(editingItem.id, payload);
        message.success(t[lang].surveyUpdated);
      } else {
        response = await addTest(payload);
        message.success(t[lang].surveyCreated);
        setNewSurveyId(response?.id || Date.now());
      }
      await refreshData();
      if (!editingItem && response?.id) {
        setNewSurveyId(response.id);
        setTimeout(() => {
          const element = document.getElementById(`survey-${response.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setTimeout(() => setNewSurveyId(null), 3000);
        }, 500);
      }
      setOpen(false);
      resetForm();
      setCurrentStep(0);
    } catch (err) {
      console.error("Save error:", err);
      message.error(editingItem ? "Ошибка при обновлении опроса" : "Ошибка при создании опроса");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSurvey = async (id) => {
    try {
      await removeTest(id);
      message.success(t[lang].deleteSuccess);
      await refreshData();
    } catch (err) {
      console.error("Delete error:", err);
      message.error(t[lang].deleteError);
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

  // ==============================================================
  // ФУНКЦИИ ДЛЯ НАЧАЛА ОПРОСА
  // ==============================================================
  const openEmployeeSelection = (survey) => {
    setSelectedSurveyForTaking(survey);
    setTempEmployeeId(null);
    setEmployeeModalVisible(true);
  };

  const isSurveyPassed = useCallback((surveyId, employeeId) => {
    try {
      const allResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
      return allResults.some(
        (r) => r.surveyId === surveyId && r.employeeId === employeeId
      );
    } catch (e) {
      return false;
    }
  }, []);

  const handleStartSurvey = () => {
    if (!selectedSurveyForTaking) {
      message.warning("Опрос не выбран");
      return;
    }
    if (!tempEmployeeId) {
      message.warning("Выберите сотрудника");
      return;
    }

    if (isSurveyPassed(selectedSurveyForTaking.id, tempEmployeeId)) {
      message.warning(t[lang].alreadyPassed);
      setEmployeeModalVisible(false);
      return;
    }

    setSelectedEmployeeIdForTaking(tempEmployeeId);
    setEmployeeModalVisible(false);

    setSurveyTakingOpen(true);
    localStorage.setItem(
      "active_survey_state",
      JSON.stringify({
        surveyId: selectedSurveyForTaking.id,
        employeeId: tempEmployeeId,
      })
    );
  };

  const handleStartSurveyFromMain = () => {
    if (!selectedSurveyId) {
      message.warning("Выберите опрос");
      return;
    }
    if (!selectedEmployeeId) {
      message.warning("Выберите сотрудника");
      return;
    }

    if (isSurveyPassed(selectedSurveyId, selectedEmployeeId)) {
      message.warning(t[lang].alreadyPassed);
      setStartSurveyModalOpen(false);
      return;
    }

    const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);
    if (!subDeptId) {
      message.warning("У сотрудника не указано отделение");
      return;
    }
    setSelectedSubDepartmentId(subDeptId);
    startSurveySession();
  };

  const startSurveySession = () => {
    const survey = surveys.find((s) => s.id === selectedSurveyId);
    if (!survey) {
      message.error("Опрос не найден");
      return;
    }
    const surveyWithDuration = {
      ...survey,
      durationMinutes: selectedSurveyDuration || 5,
    };
    setStartSurveyModalOpen(false);
    localStorage.setItem(
      "active_survey_state",
      JSON.stringify({
        surveyId: selectedSurveyId,
        employeeId: selectedEmployeeId,
      })
    );
    if (onStartSurvey) {
      onStartSurvey({
        surveyId: selectedSurveyId,
        employeeId: selectedEmployeeId,
        subDepartmentId: selectedSubDepartmentId,
        survey: surveyWithDuration,
        duration: selectedSurveyDuration,
      });
    } else {
      setSelectedSurveyForTaking(surveyWithDuration);
      setSelectedEmployeeIdForTaking(selectedEmployeeId);
      setSurveyTakingOpen(true);
    }
  };

  const handleViewResults = (survey) => {
    const results = JSON.parse(localStorage.getItem("survey_results") || "[]");
    const surveyResultsForThis = results.filter((r) => r.surveyId === survey.id);
    setSelectedSurveyForResults(survey);
    setSurveyResults(surveyResultsForThis);
    setResultsOpen(true);
  };

  // ===== ЗАВЕРШЕНИЕ ОПРОСА (с увеличением attemptCount) =====
  const handleSurveyComplete = (result) => {
    setSurveyTakingOpen(false);
    setSelectedSurveyForTaking(null);
    setSelectedEmployeeIdForTaking(null);
    localStorage.removeItem("active_survey_state");

    const updatedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
    const employee = employees.find((e) => e.id === result.employeeId);
    const survey = surveys.find((s) => s.id === result.surveyId);
    const surveyQuestions = getSurveyQuestions(survey);

    const existingIndex = updatedResults.findIndex(
      (r) => r.surveyId === result.surveyId && r.employeeId === result.employeeId
    );

    const resultWithNames = {
      ...result,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : `ID: ${result.employeeId}`,
      surveyName:
        lang === "ru"
          ? survey?.titleRu || survey?.title || `Опрос ${result.surveyId}`
          : survey?.titleTj || survey?.title || `Опрос ${result.surveyId}`,
      questions: surveyQuestions,
      totalQuestions: surveyQuestions.length,
    };

    // ===== УВЕЛИЧИВАЕМ attemptCount при обновлении =====
    if (existingIndex !== -1) {
      const existing = updatedResults[existingIndex];
      const newAttemptCount = (existing.attemptCount || 1) + 1;
      updatedResults[existingIndex] = { ...existing, ...resultWithNames, attemptCount: newAttemptCount };
    } else {
      updatedResults.push({ ...resultWithNames, attemptCount: 1 });
    }

    localStorage.setItem("survey_results", JSON.stringify(updatedResults));
    setSurveyResults(updatedResults);
    refreshData();

    const resultData = {
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : `ID: ${result.employeeId}`,
      surveyName:
        lang === "ru"
          ? survey?.titleRu || survey?.title || `Опрос ${result.surveyId}`
          : survey?.titleTj || survey?.title || `Опрос ${result.surveyId}`,
      answers: result.answers || [],
      totalQuestions: surveyQuestions.length || 0,
      isCompleted: result.isCompleted !== false,
      timeSpent: result.timeSpent ? `${Math.floor(result.timeSpent / 60)} мин ${result.timeSpent % 60} сек` : "—",
      questions: surveyQuestions,
      surveyId: result.surveyId,
      employeeId: result.employeeId,
      completedAt: result.completedAt,
    };
    showSurveyResults(resultData);

    navigate("/survey-results");
  };

  const availableQuestions = getAvailableQuestions();
  const filteredAvailableQuestions = availableQuestions.filter((q) => {
    const searchMatch = getQuestionText(q).toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === "all" || q.type === parseInt(filterType);
    return searchMatch && typeMatch;
  });

  const loading = testsLoading || questionsLoading;

  // ==============================================================
  // RENDER
  // ==============================================================
  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: "0 auto", background: "#f0f2f5", minHeight: "100vh" }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 24, padding: "0 8px" }} wrap="wrap" gap={12}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {surveys.length} {surveys.length === 1 ? "опрос" : "опросов"} • Всего {questions.length} вопросов
          </Text>
        </div>
        <Space size="middle" wrap>
          {/* <Button icon={<ReloadOutlined />} onClick={refreshData} loading={testsLoading} style={{ borderRadius: 20 }}>
            {t[lang].refresh}
          </Button> */}
          <Button
            type={lang === "ru" ? "primary" : "default"}
            onClick={() => handleSetLang("ru")}
            style={lang === "ru" ? { background: "#1890ff", borderColor: "#1890ff", borderRadius: 20 } : { borderRadius: 20 }}
          >
            RU
          </Button>
          <Button
            type={lang === "tj" ? "primary" : "default"}
            onClick={() => handleSetLang("tj")}
            style={lang === "tj" ? { background: "#1890ff", borderColor: "#1890ff", borderRadius: 20 } : { borderRadius: 20 }}
          >
            TJ
          </Button>
          <Button
            type="primary"
            onClick={() => setStartSurveyModalOpen(true)}
            icon={<PlayCircleOutlined />}
            size="large"
            style={{ background: "#1890ff", borderColor: "#1890ff", borderRadius: 20 }}
          >
            {t[lang].startSurvey}
          </Button>
          <Button
            type="primary"
            onClick={openCreateModal}
            style={{
              background: "linear-gradient(135deg, #1890ff, #096dd9)",
              border: "none",
              boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
              fontWeight: "bold",
              height: "40px",
              padding: "0 24px",
              borderRadius: "20px",
            }}
            icon={<RocketOutlined />}
          >
            {t[lang].addSurvey}
          </Button>
        </Space>
      </Flex>

      {/* Список опросов */}
      {loading && surveys.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 50 }}>
          <Spin size="large" tip={t[lang].loading} />
        </div>
      ) : surveys.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60, borderRadius: 20 }}>
          <FileTextOutlined style={{ fontSize: 64, color: "#1890ff", marginBottom: 20 }} />
          <Title level={4}>{t[lang].noSurveys}</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
            Нажмите кнопку "Создать опрос" чтобы создать первый опрос
          </Text>
          <Button type="primary" onClick={openCreateModal} style={{ background: "#1890ff", borderRadius: 20 }} icon={<RocketOutlined />}>
            {t[lang].createFirst}
          </Button>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {surveys.map((survey, index) => {
            const isNew = newSurveyId === survey.id;
            const surveyQuestions = getSurveyQuestions(survey);
            const questionCount = surveyQuestions.length;
            const resultsForSurvey = surveyResults.filter((r) => r.surveyId === survey.id);
            const participantsCount = resultsForSurvey.length;

            return (
              <Col xs={24} sm={12} lg={9} key={survey.id || index}>
                <motion.div
                  id={`survey-${survey.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 2px 12px rgba(24, 144, 255, 0.08)",
                      border: "1px solid #e6f0ff",
                      overflow: "hidden",
                      background: "#fff",
                      height: "100%",
                      transition: "all 0.3s",
                      position: "relative",
                    }}
                    styles={{ body: { padding: 0 } }}
                    onMouseEnter={() => setHoveredCard(survey.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {isNew && (
                      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                        <Tag color="blue" style={{ fontSize: 11, padding: "2px 12px", borderRadius: 12 }}>NEW</Tag>
                      </div>
                    )}

                    <div
                      style={{
                        padding: "20px 24px",
                        background: "linear-gradient(135deg, #1890ff, #096dd9)",
                        color: "white",
                      }}
                    >
                      <Flex align="center" gap={12}>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: "50%",
                            width: 44,
                            height: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FileTextOutlined style={{ fontSize: 20 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{
                              color: "white",
                              fontSize: 16,
                              fontWeight: 600,
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {lang === "ru" ? survey.titleRu || survey.title : survey.titleTj || survey.title}
                          </Text>
                          <Flex gap={8} align="center" style={{ marginTop: 4 }} wrap>
                            <Tag
                              style={{
                                background: "rgba(255,255,255,0.2)",
                                border: "none",
                                color: "white",
                                fontSize: 11,
                                borderRadius: 12,
                                margin: 0,
                              }}
                            >
                              {questionCount} {t[lang].questionCount}
                            </Tag>
                            <Tag
                              style={{
                                background: "rgba(255,255,255,0.2)",
                                border: "none",
                                color: "white",
                                fontSize: 11,
                                borderRadius: 12,
                                margin: 0,
                              }}
                            >
                              {participantsCount} {t[lang].participants}
                            </Tag>
                            <Tag
                              style={{
                                background: "rgba(255,255,255,0.25)",
                                border: "none",
                                color: "white",
                                fontSize: 10,
                                borderRadius: 12,
                                margin: 0,
                              }}
                            >
                              Опрос
                            </Tag>
                          </Flex>
                        </div>
                      </Flex>
                    </div>

                    {survey.descriptionRu || survey.descriptionTj ? (
                      <div style={{ padding: "8px 20px", background: "#fafbff", borderBottom: "1px solid #f0f0f0" }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {lang === "ru" ? survey.descriptionRu || survey.description : survey.descriptionTj || survey.description}
                        </Text>
                      </div>
                    ) : null}

                    <div style={{ padding: "14px 20px", background: "#fafbff" }}>
                      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Space size={8}>
                          {/* <Button
                            size="middle"
                            icon={<PlayCircleOutlined />}
                            onClick={() => openEmployeeSelection(survey)}
                            style={{
                              fontSize: 13,
                              borderRadius: 8,
                              borderColor: "#1890ff",
                              color: "#1890ff",
                            }}
                          >
                            {t[lang].takeSurvey}
                          </Button> */}
                          <Button
                            size="middle"
                            icon={<BarChartOutlined />}
                            onClick={() => handleViewResults(survey)}
                            style={{
                              fontSize: 13,
                              borderRadius: 8,
                            }}
                          >
                            {t[lang].viewResults}
                          </Button>
                        </Space>
                        <Space size={4}>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(survey)}
                            style={{ fontSize: 13 }}
                          />
                          <Popconfirm
                            title={t[lang].deleteConfirm}
                            onConfirm={() => handleRemoveSurvey(survey.id)}
                            okText="Да"
                            cancelText="Нет"
                          >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 13 }} />
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
      )}

      {surveys.length > 0 && (
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords || surveys.length}
            showSizeChanger={false}
            onChange={(page) => {
              setCurrentPage(page);
            }}
          />
        </div>
      )}

      {/* Модальное окно "Начать опрос" */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircleOutlined style={{ color: "#1890ff" }} />
            <span>{t[lang].startSurvey}</span>
          </div>
        }
        open={startSurveyModalOpen}
        onCancel={() => {
          setStartSurveyModalOpen(false);
          setSelectedSurveyId(null);
          setSelectedEmployeeId(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setStartSurveyModalOpen(false)}>
            {t[lang].close}
          </Button>,
          <Button
            key="start"
            type="primary"
            onClick={handleStartSurveyFromMain}
            disabled={!selectedSurveyId || !selectedEmployeeId || !selectedSubDepartmentId}
            style={{ background: "#1890ff", borderColor: "#1890ff" }}
          >
            {t[lang].startSurvey} ({selectedSurveyDuration} {t[lang].minutesShort})
          </Button>,
        ]}
        width={650}
        centered
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "8px 0" }}>
          <div>
            <Text strong>{t[lang].selectSurvey}:</Text>
            <Select
              placeholder={t[lang].selectSurvey}
              value={selectedSurveyId}
              onChange={(value) => setSelectedSurveyId(value)}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              size="large"
              optionFilterProp="children"
              filterOption={(input, option) => {
                const text = option?.children?.toString?.() || "";
                return text.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {surveys.map((survey) => {
                const surveyQuestions = getSurveyQuestions(survey);
                return (
                  <Option key={survey.id} value={survey.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileTextOutlined />
                        {lang === "ru" ? survey.titleRu || survey.title : survey.titleTj || survey.title}
                      </div>
                      <Tag color="blue">{surveyQuestions.length} вопросов</Tag>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>

          <div>
            <Text strong>{t[lang].selectDuration}:</Text>
            <div style={{ marginTop: 8 }}>
              <Input
                type="number"
                placeholder={t[lang].customDuration}
                value={selectedSurveyDuration}
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
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t[lang].presetTimes}
              </Text>
              {[5, 10, 15, 20, 30, 45, 60].map((min) => (
                <Button
                  key={min}
                  size="small"
                  type={selectedSurveyDuration === min ? "primary" : "default"}
                  onClick={() => setSelectedSurveyDuration(min)}
                  style={selectedSurveyDuration === min ? { background: "#1890ff", borderColor: "#1890ff" } : {}}
                >
                  {min} мин
                </Button>
              ))}
            </div>
          </div>

          <Alert
            message="Информация"
            description={t[lang].infoDuration.replace("{minutes}", selectedSurveyDuration)}
            type="info"
            showIcon
            icon={<HourglassOutlined />}
          />

          <div>
            <Text strong>{t[lang].selectEmployee}:</Text>
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
                const text = option?.children?.toString?.() || "";
                return text.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {Object.entries(groupedEmployees).map(([department, deptEmployees]) => (
                <Select.OptGroup key={department} label={`${t[lang].department}: ${department}`}>
                  {deptEmployees.map((emp) => (
                    <Option key={emp.id} value={emp.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                    </Option>
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
                        <Text strong style={{ fontSize: 16 }}>
                          {getSubDepartmentName(selectedSubDepartmentId)}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Отделение из данных сотрудника
                        </Text>
                      </div>
                      <Tag color="green" style={{ marginLeft: "auto" }}>
                        <CheckCircleOutlined /> Из сотрудника
                      </Tag>
                    </div>
                  </Card>
                ) : (
                  <Alert
                    message="У сотрудника не указано отделение"
                    description="Пожалуйста, укажите отделение в карточке сотрудника"
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </>
            ) : (
              <div style={{ marginTop: 8 }}>
                <Select placeholder={t[lang].selectSubDepartment} disabled style={{ width: "100%" }}>
                  <Option value="">{t[lang].selectEmployee}</Option>
                </Select>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Модальное окно выбора сотрудника */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserOutlined style={{ color: "#1890ff" }} />
            <span>{t[lang].selectEmployee}</span>
          </div>
        }
        open={employeeModalVisible}
        onCancel={() => setEmployeeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmployeeModalVisible(false)}>
            {t[lang].cancel}
          </Button>,
          <Button
            key="start"
            type="primary"
            onClick={handleStartSurvey}
            disabled={!tempEmployeeId}
            style={{ background: "#1890ff", borderColor: "#1890ff" }}
          >
            {t[lang].takeSurvey}
          </Button>,
        ]}
        width={450}
        centered
      >
        <div style={{ padding: "8px 0" }}>
          <Text strong style={{ display: "block", marginBottom: 12 }}>
            {t[lang].selectEmployee}
          </Text>
          <Select
            placeholder={t[lang].selectEmployee}
            style={{ width: "100%" }}
            value={tempEmployeeId}
            onChange={setTempEmployeeId}
            showSearch
            size="large"
            optionFilterProp="children"
            filterOption={(input, option) => {
              const text = option?.children?.toString?.() || "";
              return text.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {employees.map((emp) => (
              <Option key={emp.id} value={emp.id}>
                <Space>
                  <UserOutlined />
                  {emp.firstName} {emp.lastName}
                  {emp.position && <Tag color="blue" style={{ fontSize: 11 }}>{emp.position}</Tag>}
                </Space>
              </Option>
            ))}
          </Select>
          {tempEmployeeId && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#f6ffed", borderRadius: 8, border: "1px solid #b7eb8f" }}>
              <Text type="secondary">Выбран: </Text>
              <Text strong>
                {employees.find((e) => e.id === tempEmployeeId)?.firstName}{" "}
                {employees.find((e) => e.id === tempEmployeeId)?.lastName}
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Модальное окно прохождения опроса */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FormOutlined style={{ color: "#1890ff" }} />
            <span>{selectedSurveyForTaking?.titleRu || t[lang].startSurvey}</span>
          </div>
        }
        open={surveyTakingOpen}
        onCancel={() => {
          setSurveyTakingOpen(false);
          setSelectedSurveyForTaking(null);
          setSelectedEmployeeIdForTaking(null);
        }}
        footer={null}
        width={680}
        centered
        styles={{ body: { maxHeight: "80vh", overflow: "auto" } }}
      >
        {selectedSurveyForTaking && (
          <SurveyTaking
            survey={selectedSurveyForTaking}
            questions={getSurveyQuestions(selectedSurveyForTaking)}
            onComplete={handleSurveyComplete}
            onClose={() => {
              setSurveyTakingOpen(false);
              setSelectedSurveyForTaking(null);
              setSelectedEmployeeIdForTaking(null);
            }}
            employeeId={selectedEmployeeIdForTaking}
            lang={lang}
            t={t[lang]}
            durationMinutes={selectedSurveyForTaking.durationMinutes || 5}
          />
        )}
      </Modal>

      {/* Модальное окно результатов после завершения */}
      <SurveyResultsModal
        visible={surveyResultModalVisible}
        result={surveyResultData}
        onClose={() => {
          setSurveyResultModalVisible(false);
          setSurveyResultData(null);
        }}
        lang={lang}
      />

      {/* Модальное окно просмотра всех результатов */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChartOutlined style={{ color: "#1890ff" }} />
            <span>{t[lang].surveyResults}</span>
          </div>
        }
        open={resultsOpen}
        onCancel={() => {
          setResultsOpen(false);
          setSelectedSurveyForResults(null);
        }}
        footer={null}
        width={850}
        centered
        styles={{ body: { maxHeight: "80vh", overflow: "auto" } }}
      >
        {selectedSurveyForResults && (
          <SurveyResults
            survey={selectedSurveyForResults}
            questions={getSurveyQuestions(selectedSurveyForResults)}
            results={surveyResults}
            employees={employees}
            lang={lang}
            t={t[lang]}
          />
        )}
      </Modal>

      {/* ============================================================
          МОДАЛЬНОЕ ОКНО СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ОПРОСА (ПОЛНОЕ)
          ============================================================ */}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          resetForm();
        }}
        footer={null}
        width={900}
        centered
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #1890ff, #096dd9)", padding: "20px 28px", color: "white" }}>
            <Flex align="center" gap={12}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {editingItem ? <EditOutlined style={{ fontSize: 20 }} /> : <RocketOutlined style={{ fontSize: 20 }} />}
              </div>
              <div>
                <Title level={4} style={{ color: "white", margin: 0 }}>
                  {editingItem ? t[lang].edit : t[lang].addSurvey}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                  {editingItem ? "Измените параметры опроса" : "Заполните информацию о новом опросе"}
                </Text>
              </div>
            </Flex>
          </div>

          <div style={{ padding: "20px 28px 0 28px", background: "#fff" }}>
            <Steps
              current={currentStep}
              size="small"
              items={[
                { title: t[lang].step1, icon: <FileTextOutlined /> },
                { title: t[lang].step2, icon: <QuestionCircleOutlined /> },
                { title: t[lang].step3, icon: <CheckCircleOutlined /> },
              ]}
              style={{ marginBottom: 24 }}
            />
          </div>

          <div style={{ padding: "0 28px 24px 28px", background: "#fff" }}>
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert
                    message={t[lang].info}
                    description="Введите основную информацию об опросе."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 10 }}
                  />

                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 14, display: "block", marginBottom: 6 }}>
                      {t[lang].surveyTitle} <span style={{ color: "#ff4b2b" }}>*</span>
                    </Text>
                    <Input
                      value={lang === "ru" ? titleRu : titleTj}
                      onChange={(e) => {
                        if (lang === "ru") setTitleRu(e.target.value);
                        else setTitleTj(e.target.value);
                      }}
                      placeholder={lang === "ru" ? "Введите название опроса" : "Номи пурсишро ворид кунед"}
                      size="large"
                      style={{ borderRadius: 10 }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 14, display: "block", marginBottom: 6 }}>
                      {t[lang].description}
                    </Text>
                    <Input.TextArea
                      value={lang === "ru" ? descriptionRu : descriptionTj}
                      onChange={(e) => {
                        if (lang === "ru") setDescriptionRu(e.target.value);
                        else setDescriptionTj(e.target.value);
                      }}
                      placeholder={lang === "ru" ? "Введите описание опроса" : "Тавсифи пурсишро ворид кунед"}
                      rows={3}
                      size="large"
                      style={{ borderRadius: 10 }}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert
                    message={t[lang].info}
                    description={
                      <div>
                        <Text>
                          {editingItem
                            ? "Редактирование опроса. Вы можете добавлять новые вопросы или удалять существующие."
                            : "Выберите вопросы для опроса из доступных."}
                        </Text>
                        <div style={{ marginTop: 6 }}>
                          <Tag color="blue" style={{ borderRadius: 16 }}>
                            {editingItem
                              ? `В опросе: ${selectedQuestionIds.length} вопросов`
                              : `Доступно: ${availableQuestions.length} вопросов`}
                          </Tag>
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 10 }}
                  />

                  <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
                    <TabPane tab={<span><FormOutlined /> {t[lang].selectQuestionsTab}</span>} key="select">
                      <div style={{ background: "#f8f9fa", padding: "12px 16px", borderRadius: 10, marginBottom: 16 }}>
                        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                          <Space size="small" wrap>
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={selectAllQuestions}
                              disabled={filteredAvailableQuestions.length === 0}
                            >
                              {t[lang].selectAll}
                            </Button>
                            <Button
                              size="small"
                              icon={<MinusOutlined />}
                              onClick={clearAllQuestions}
                              disabled={selectedQuestionIds.length === 0}
                            >
                              {t[lang].clearAll}
                            </Button>
                          </Space>

                          <Space size="small" wrap>
                            <Input
                              placeholder={t[lang].searchPlaceholder}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ width: 200, borderRadius: 16 }}
                              allowClear
                              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                              size="small"
                            />
                            <Select
                              value={filterType}
                              onChange={setFilterType}
                              style={{ width: 120, borderRadius: 16 }}
                              size="small"
                              suffixIcon={<FilterOutlined />}
                            >
                              <Option value="all">{t[lang].allTypes}</Option>
                              <Option value="1">📝 {t[lang].test}</Option>
                              <Option value="2">✏️ {t[lang].manual}</Option>
                              <Option value="3">⭐ {t[lang].rating}</Option>
                            </Select>
                          </Space>
                        </Flex>
                      </div>

                      {filteredAvailableQuestions.length === 0 ? (
                        <Empty description={t[lang].noQuestionsFound} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 30 }} />
                      ) : (
                        <div style={{ maxHeight: 350, overflow: "auto" }}>
                          {filteredAvailableQuestions.map((question) => {
                            const isSelected = selectedQuestionIds.includes(question.id);
                            const typeInfo = getTypeLabel(question.type);

                            return (
                              <div
                                key={question.id}
                                onClick={() => toggleQuestionSelection(question.id)}
                                style={{
                                  padding: "10px 14px",
                                  marginBottom: 8,
                                  borderRadius: 10,
                                  border: isSelected ? "2px solid #1890ff" : "1px solid #e8e8e8",
                                  background: isSelected ? "#e6f7ff" : "#fff",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                              >
                                <Flex align="center" gap={12}>
                                  <Checkbox checked={isSelected} />
                                  <div style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14 }}>{getQuestionText(question)}</Text>
                                    <div style={{ marginTop: 4 }}>
                                      <Tag color={typeInfo.color} style={{ fontSize: 11, borderRadius: 12 }}>
                                        {typeInfo.label}
                                      </Tag>
                                    </div>
                                  </div>
                                  {isSelected && <CheckCircleOutlined style={{ color: "#1890ff" }} />}
                                </Flex>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {filteredAvailableQuestions.length > 0 && (
                        <div style={{ marginTop: 16, padding: "10px 16px", background: "#f8f9fa", borderRadius: 10 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {t[lang].selected}: {selectedQuestionIds.length} {t[lang].questionsSelected}
                          </Text>
                        </div>
                      )}
                    </TabPane>
                    <TabPane tab={<span><PlusOutlined /> {t[lang].createQuestionTab}</span>} key="create">
                      <SurveyQuestionCreator
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
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert message={t[lang].success} description={t[lang].surveyReady} type="success" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />

                  <div style={{ padding: "16px 20px", background: "#e6f7ff", borderRadius: 12, border: "1px solid #bae7ff", marginBottom: 16 }}>
                    <Flex align="center" gap={12}>
                      <Avatar style={{ background: "#1890ff", width: 36, height: 36 }}>
                        <FileTextOutlined />
                      </Avatar>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {lang === "ru" ? titleRu || "Без названия" : titleTj || "Безунвон"}
                        </Text>
                        <div>
                          <Tag color="blue" style={{ borderRadius: 16 }}>
                            {selectedQuestionIds.length} {t[lang].totalQuestions}
                          </Tag>
                          <Tag color="purple" style={{ borderRadius: 16, marginLeft: 8 }}>
                            Опрос
                          </Tag>
                        </div>
                      </div>
                    </Flex>
                  </div>

                  {selectedQuestionIds.length > 0 && (
                    <div>
                      <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
                        📋 {t[lang].questionsInfo}:
                      </Text>
                      <div style={{ maxHeight: 200, overflow: "auto" }}>
                        {questions
                          .filter((q) => selectedQuestionIds.includes(q.id))
                          .map((q, idx) => (
                            <div
                              key={q.id}
                              style={{
                                padding: "6px 12px",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <Badge count={idx + 1} style={{ backgroundColor: "#1890ff" }} />
                              <Text style={{ fontSize: 13 }}>{getQuestionText(q)}</Text>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
              <Button onClick={() => setOpen(false)} style={{ borderRadius: 8 }}>
                {t[lang].cancel}
              </Button>
              <Space>
                {currentStep > 0 && (
                  <Button onClick={handleBack} style={{ borderRadius: 8 }}>
                    {t[lang].back}
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button type="primary" onClick={handleNext} style={{ background: "#1890ff", borderRadius: 8 }} icon={<ArrowRightOutlined />}>
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleSave}
                    loading={saving}
                    style={{ background: "linear-gradient(135deg, #1890ff, #096dd9)", borderRadius: 8 }}
                    icon={<RocketOutlined />}
                  >
                    {saving ? "Сохранение..." : editingItem ? t[lang].save : t[lang].addSurvey}
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};