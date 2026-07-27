// components/SurveyManager.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ (только create работает)
import { useEffect, useState, useCallback } from "react";
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
  CloseOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ==================== КОМПОНЕНТ СОЗДАНИЯ ВОПРОСА ====================
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

// ==================== КОМПОНЕНТ ПРОХОЖДЕНИЯ ОПРОСА ====================
const SurveyTaking = ({
  survey,
  questions,
  onComplete,
  onClose,
  employeeId,
  lang,
  t,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());

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

  const handleComplete = async () => {
    if (answeredCount < totalQuestions) {
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
      };

      const savedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
      savedResults.push(result);
      localStorage.setItem("survey_results", JSON.stringify(savedResults));

      message.success("Опрос успешно завершен! Спасибо за участие.");

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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Flex justify="space-between" align="center">
          <Text>
            Вопрос {currentQuestionIndex + 1} из {totalQuestions}
          </Text>
          <Text type="secondary">
            Отвечено: {answeredCount} из {totalQuestions}
          </Text>
        </Flex>
        <Progress
          percent={Math.round((answeredCount / totalQuestions) * 100)}
          strokeColor="#1890ff"
          trailColor="#f0f0f0"
          style={{ marginTop: 8 }}
        />
      </div>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue" style={{ borderRadius: 20 }}>
            Вопрос {currentQuestionIndex + 1}
          </Tag>
        </div>

        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 24 }}>
          {getQuestionText(currentQuestion)}
        </div>

        <Divider orientation="left" style={{ fontSize: 14, margin: "16px 0" }}>
          <Text type="secondary">Ваш ответ</Text>
        </Divider>

        {currentQuestion?.type === 1 && (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            style={{ width: "100%" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {currentQuestion?.options?.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === (option.id || idx);
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
            style={{ fontSize: 15, borderRadius: 8 }}
          />
        )}

        {currentQuestion?.type === 3 && (
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
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
                      background: active ? "linear-gradient(135deg, #1890ff, #096dd9)" : "rgba(255,255,255,0.9)",
                      color: active ? "#fff" : "#333",
                      border: active ? "3px solid #bae7ff" : "1px solid #e8e8e8",
                      boxShadow: active ? "0 8px 20px rgba(24, 144, 255, 0.35)" : "0 2px 6px rgba(0,0,0,0.08)",
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

      <div style={{ display: "flex", gap: 16, justifyContent: "space-between" }}>
        <Button
          icon={<ArrowRightOutlined />}
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          size="large"
        >
          Назад
        </Button>

        <Space>
          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleComplete}
              loading={isSubmitting}
              size="large"
              style={{ background: "#52c41a", borderColor: "#52c41a" }}
            >
              Завершить
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={handleNext}
              size="large"
              style={{ background: "#1890ff", borderColor: "#1890ff" }}
            >
              Далее
            </Button>
          )}
        </Space>
      </div>

      <div style={{ marginTop: 24 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Быстрая навигация:
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                }}
                onClick={() => setCurrentQuestionIndex(idx)}
              >
                {idx + 1}
                {isAnswered && <CheckCircleOutlined style={{ fontSize: 10, marginLeft: 2 }} />}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==================== КОМПОНЕНТ РЕЗУЛЬТАТОВ ОПРОСА ====================
const SurveyResults = ({ survey, questions, results, employees, lang, t }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const getEmployeeName = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${employeeId}`;
  };

  const getQuestionText = (questionId) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return "—";
    return lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content;
  };

  const getAnswerDisplay = (questionId, answer) => {
    const q = questions.find((q) => q.id === questionId);
    if (!q) return String(answer);

    if (q.type === 1) {
      const option = q.options?.find((o) => o.id === answer || o.text === answer);
      return getOptionText(option) || String(answer);
    }

    if (q.type === 3) {
      return `⭐ ${answer}/10`;
    }

    return String(answer);
  };

  const getOptionText = (option) => {
    if (!option) return "—";
    return lang === "ru" ? option.textRu || option.text : option.textTj || option.text;
  };

  const totalParticipants = results.length;
  const averageCompletionTime = totalParticipants > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalParticipants)
    : 0;

  const questionStats = questions.map((q) => {
    const answersForQuestion = results
      .map((r) => r.answers.find((a) => a.questionId === q.id))
      .filter(Boolean);

    const totalAnswers = answersForQuestion.length;

    if (q.type === 1) {
      const optionCounts = {};
      q.options?.forEach((opt) => {
        const count = answersForQuestion.filter(
          (a) => a.answer === opt.id || a.answer === opt.text
        ).length;
        optionCounts[opt.id || opt.text] = count;
      });

      return {
        question: q,
        totalAnswers,
        optionCounts,
        mostPopular: Object.entries(optionCounts).sort((a, b) => b[1] - a[1])[0],
      };
    }

    if (q.type === 3) {
      const ratings = answersForQuestion.map((a) => parseInt(a.answer) || 0);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
        : 0;

      return {
        question: q,
        totalAnswers,
        avgRating,
        distribution: ratings.reduce((acc, r) => {
          acc[r] = (acc[r] || 0) + 1;
          return acc;
        }, {}),
      };
    }

    return {
      question: q,
      totalAnswers,
      answers: answersForQuestion.map((a) => a.answer),
    };
  });

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic
              title="Всего участников"
              value={totalParticipants}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic
              title="Вопросов в опросе"
              value={questions.length}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <Statistic
              title="Среднее время прохождения"
              value={averageCompletionTime}
              suffix="сек"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginBottom: 16 }}>
        <BarChartOutlined /> Анализ ответов
      </Title>

      {questionStats.map((stat, idx) => {
        const q = stat.question;

        return (
          <Card
            key={q.id}
            style={{ borderRadius: 12, marginBottom: 16 }}
            title={
              <div>
                <Badge count={idx + 1} style={{ backgroundColor: "#1890ff", marginRight: 12 }} />
                <Text strong>{getQuestionText(q.id)}</Text>
                <Tag color="blue" style={{ marginLeft: 12, borderRadius: 20 }}>
                  {q.type === 1 ? "Тест" : q.type === 2 ? "Ручной" : "Рейтинг"}
                </Tag>
              </div>
            }
          >
            {q.type === 1 && (
              <div>
                <Text type="secondary">Всего ответов: {stat.totalAnswers}</Text>
                <div style={{ marginTop: 12 }}>
                  {q.options?.map((opt) => {
                    const count = stat.optionCounts[opt.id] || stat.optionCounts[opt.text] || 0;
                    const percent = stat.totalAnswers > 0 ? Math.round((count / stat.totalAnswers) * 100) : 0;

                    return (
                      <div key={opt.id} style={{ marginBottom: 8 }}>
                        <Flex justify="space-between">
                          <Text>{getOptionText(opt)}</Text>
                          <Text type="secondary">{count} ({percent}%)</Text>
                        </Flex>
                        <Progress
                          percent={percent}
                          size="small"
                          strokeColor={percent > 50 ? "#52c41a" : "#1890ff"}
                          showInfo={false}
                        />
                      </div>
                    );
                  })}
                </div>
                {stat.mostPopular && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "#f6ffed", borderRadius: 8 }}>
                    <Text type="secondary">Самый популярный ответ: </Text>
                    <Text strong>{stat.mostPopular[0]}</Text>
                    <Text type="secondary"> ({stat.mostPopular[1]} ответов)</Text>
                  </div>
                )}
              </div>
            )}

            {q.type === 2 && (
              <div>
                <Text type="secondary">Всего ответов: {stat.totalAnswers}</Text>
                <div style={{ marginTop: 12, maxHeight: 200, overflow: "auto" }}>
                  {stat.answers?.map((answer, i) => (
                    <div key={i} style={{ padding: "4px 8px", borderBottom: "1px solid #f0f0f0" }}>
                      {String(answer)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {q.type === 3 && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Statistic
                    title="Средний рейтинг"
                    value={stat.avgRating}
                    suffix="/10"
                    prefix={<StarOutlined />}
                    valueStyle={{ color: "#faad14" }}
                  />
                </div>
                <Text type="secondary">Всего оценок: {stat.totalAnswers}</Text>
                <div style={{ marginTop: 12 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const count = stat.distribution?.[num] || 0;
                    const percent = stat.totalAnswers > 0 ? Math.round((count / stat.totalAnswers) * 100) : 0;

                    return (
                      <div key={num} style={{ marginBottom: 4 }}>
                        <Flex justify="space-between">
                          <Text>{num} ⭐</Text>
                          <Text type="secondary">{count} ({percent}%)</Text>
                        </Flex>
                        <Progress
                          percent={percent}
                          size="small"
                          strokeColor={num >= 7 ? "#52c41a" : num >= 4 ? "#faad14" : "#ff4d4f"}
                          showInfo={false}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
        <TeamOutlined /> Участники ({totalParticipants})
      </Title>

      <Table
        dataSource={results}
        rowKey="id"
        columns={[
          {
            title: "Участник",
            key: "employee",
            render: (_, record) => getEmployeeName(record.employeeId),
          },
          {
            title: "Время прохождения",
            dataIndex: "timeSpent",
            render: (time) => `${time || 0} сек`,
          },
          {
            title: "Завершен",
            dataIndex: "completedAt",
            render: (date) => date ? new Date(date).toLocaleString() : "—",
          },
          {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setSelectedEmployee(record)}
              >
                Детали
              </Button>
            ),
          },
        ]}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
      />

      <Modal
        title="Детали ответов участника"
        open={!!selectedEmployee}
        onCancel={() => setSelectedEmployee(null)}
        footer={null}
        width={600}
      >
        {selectedEmployee && (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Участник">
                {getEmployeeName(selectedEmployee.employeeId)}
              </Descriptions.Item>
              <Descriptions.Item label="Время прохождения">
                {selectedEmployee.timeSpent || 0} сек
              </Descriptions.Item>
              <Descriptions.Item label="Завершен">
                {selectedEmployee.completedAt ? new Date(selectedEmployee.completedAt).toLocaleString() : "—"}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {selectedEmployee.answers?.map((answer) => (
              <div key={answer.questionId} style={{ marginBottom: 12, padding: "8px 12px", background: "#f8f9fa", borderRadius: 8 }}>
                <Text strong>{getQuestionText(answer.questionId)}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary">Ответ: </Text>
                  <Text>{getAnswerDisplay(answer.questionId, answer.answer)}</Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==================== ОСНОВНОЙ КОМПОНЕНТ SURVEY MANAGER ====================
export const SurveyManager = () => {
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

  // ===== ДОБАВЛЯЕМ ЛОКАЛЬНОЕ СОСТОЯНИЕ ДЛЯ ОПРОСОВ =====
  const [localSurveys, setLocalSurveys] = useState([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchTests(),
          fetchQuestions(1, 1000),
          fetchEmployee(),
          fetchSubDepartments(),
        ]);
        setDataLoaded(true);
        console.log("✅ Все данные загружены для SurveyManager");
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }
    };
    loadAllData();

    const savedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
    setSurveyResults(savedResults);
    
    // Загружаем локальные опросы
    const savedSurveys = JSON.parse(localStorage.getItem("local_surveys") || "[]");
    setLocalSurveys(savedSurveys);
  }, []);

  const getQuestionText = useCallback((question) => {
    if (!question) return "—";
    if (lang === "ru") {
      return question.contentRu || question.content || "—";
    }
    return question.contentTj || question.content || "—";
  }, [lang]);

  const getTypeLabel = useCallback((type) => {
    if (type === 1) return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
    if (type === 2) return { label: lang === "ru" ? "Ручной" : "Дастӣ", color: "#722ed1", icon: <QuestionCircleOutlined /> };
    if (type === 3) return { label: lang === "ru" ? "Рейтинг" : "Баҳо", color: "#faad14", icon: <StarOutlined /> };
    return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
  }, [lang]);

  const getUsedQuestionIds = useCallback(() => {
    const usedIds = new Set();
    // Проверяем тесты из store
    tests.forEach(test => {
      if (test.questions && test.questions.length > 0) {
        test.questions.forEach(q => {
          if (q.id) usedIds.add(q.id);
        });
      }
    });
    // Проверяем локальные опросы
    localSurveys.forEach(survey => {
      if (survey.questions && survey.questions.length > 0) {
        survey.questions.forEach(q => {
          if (q.id) usedIds.add(q.id);
        });
      }
    });
    return usedIds;
  }, [tests, localSurveys]);

  const getAvailableQuestions = useCallback(() => {
    const usedIds = getUsedQuestionIds();
    return questions.filter(q => !usedIds.has(q.id));
  }, [questions, getUsedQuestionIds]);

  // ===== ОБЪЕДИНЯЕМ ОПРОСЫ =====
  const allSurveys = [...tests, ...localSurveys];

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
      startSurvey: "Пройти опрос",
      selectSurvey: "Выберите опрос",
      selectEmployee: "Выберите сотрудника",
      close: "Закрыть",
      results: "Результаты",
      viewResults: "Посмотреть результаты",
      participants: "Участников",
      takeSurvey: "Пройти опрос",
      surveyResults: "Результаты опроса",
      employee: "Сотрудник",
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
      startSurvey: "Гузаштани пурсиш",
      selectSurvey: "Пурсишро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      close: "Пӯшидан",
      results: "Натиҷаҳо",
      viewResults: "Дидани натиҷаҳо",
      participants: "Иштирокчиён",
      takeSurvey: "Гузаштани пурсиш",
      surveyResults: "Натиҷаҳои пурсиш",
      employee: "Корманд",
    },
  };

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

    const questionIds = survey.questions?.map(q => q.id).filter(Boolean) || [];
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
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const selectAllQuestions = () => {
    const availableQuestions = getAvailableQuestions();
    const allIds = availableQuestions.map(q => q.id);
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
      message.success("Вопрос добавлен в опрос!");
    }
    setActiveTab("select");
  };

  // ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ - РАБОТАЕТ ЛОКАЛЬНО =====
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
      // Создаем опрос
      const newSurvey = {
        id: Date.now(),
        titleRu: titleRu || titleTj,
        titleTj: titleTj || titleRu,
        descriptionRu: descriptionRu || descriptionTj,
        descriptionTj: descriptionTj || descriptionRu,
        questions: selectedQuestionIds.map((questionId, index) => {
          const question = questions.find(q => q.id === questionId);
          return {
            id: questionId,
            order: index + 1,
            type: question?.type || 1,
          };
        }),
        createdAt: new Date().toISOString(),
        isLocal: true,
      };

      // Сохраняем в localStorage
      const savedSurveys = JSON.parse(localStorage.getItem("local_surveys") || "[]");
      savedSurveys.push(newSurvey);
      localStorage.setItem("local_surveys", JSON.stringify(savedSurveys));
      setLocalSurveys(savedSurveys);

      setNewSurveyId(newSurvey.id);
      message.success(t[lang].surveyCreated);

      setTimeout(() => {
        const element = document.getElementById(`survey-${newSurvey.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        setTimeout(() => setNewSurveyId(null), 3000);
      }, 500);

      setOpen(false);
      resetForm();
      setCurrentStep(0);
    } catch (err) {
      console.error("Save error:", err);
      message.error("Ошибка при сохранении опроса");
    } finally {
      setSaving(false);
    }
  };

  // ===== УДАЛЕНИЕ ЛОКАЛЬНОГО ОПРОСА =====
  const handleRemoveLocalSurvey = (id) => {
    const savedSurveys = JSON.parse(localStorage.getItem("local_surveys") || "[]");
    const filtered = savedSurveys.filter(s => s.id !== id);
    localStorage.setItem("local_surveys", JSON.stringify(filtered));
    setLocalSurveys(filtered);
    message.success("Опрос удален");
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

  const openEmployeeSelection = (survey) => {
    setSelectedSurveyForTaking(survey);
    setTempEmployeeId(null);
    setEmployeeModalVisible(true);
  };

  const handleStartSurvey = () => {
    if (!selectedSurveyForTaking) {
      message.warning("Опрос не выбран");
      return;
    }

    if (!tempEmployeeId) {
      message.warning("Выберите сотрудника");
      return;
    }

    const alreadyPassed = surveyResults.some(
      r => r.surveyId === selectedSurveyForTaking.id && r.employeeId === tempEmployeeId
    );

    setSelectedEmployeeIdForTaking(tempEmployeeId);
    setEmployeeModalVisible(false);

    if (alreadyPassed) {
      Modal.confirm({
        title: "Вы уже проходили этот опрос",
        content: "Вы уверены, что хотите пройти его снова?",
        okText: "Да, пройти снова",
        cancelText: "Отмена",
        onOk: () => {
          setSurveyTakingOpen(true);
        },
      });
    } else {
      setSurveyTakingOpen(true);
    }
  };

  const handleViewResults = (survey) => {
    const results = JSON.parse(localStorage.getItem("survey_results") || "[]");
    const surveyResultsForThis = results.filter(r => r.surveyId === survey.id);

    setSelectedSurveyForResults(survey);
    setSurveyResults(surveyResultsForThis);
    setResultsOpen(true);
  };

  const handleSurveyComplete = () => {
    setSurveyTakingOpen(false);
    setSelectedSurveyForTaking(null);
    setSelectedEmployeeIdForTaking(null);

    const updatedResults = JSON.parse(localStorage.getItem("survey_results") || "[]");
    setSurveyResults(updatedResults);
  };

  const availableQuestions = getAvailableQuestions();
  const filteredAvailableQuestions = availableQuestions.filter(q => {
    const searchMatch = getQuestionText(q).toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === "all" || q.type === parseInt(filterType);
    return searchMatch && typeMatch;
  });

  const loading = testsLoading;
  const surveys = allSurveys;

  if (loading && tests.length === 0 && localSurveys.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50, alignItems: "center", height: "60vh" }}>
        <Spin size="small" tip={t[lang].loading} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* ==================== ВЕРХНЯЯ ПАНЕЛЬ ==================== */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24, padding: "0 8px" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {surveys.length} {surveys.length === 1 ? "опрос" : "опросов"} • Всего {questions.length} вопросов
          </Text>
        </div>

        <Space size="middle">
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

      {/* ==================== СПИСОК ОПРОСОВ ==================== */}
      {!surveys || surveys.length === 0 ? (
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
            const questionCount = survey.questions?.length || 0;
            const resultsForSurvey = surveyResults.filter(r => r.surveyId === survey.id);
            const participantsCount = resultsForSurvey.length;
            const isLocal = survey.isLocal === true;

            return (
              <Col xs={24} sm={12} lg={8} key={survey.id || index}>
                <motion.div
                  id={`survey-${survey.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: "1px solid #e8e8e8",
                      overflow: "hidden",
                      background: "#fff",
                      height: "100%",
                    }}
                    styles={{ body: { padding: 0 } }}
                  >
                    {isNew && (
                      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                        <Tag color="blue" style={{ fontSize: 11, padding: "2px 10px", borderRadius: 12 }}>NEW</Tag>
                      </div>
                    )}
                    {isLocal && (
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
                        <Tag color="orange" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12 }}>Локальный</Tag>
                      </div>
                    )}

                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                      <Flex align="center" gap={12}>
                        <Avatar style={{ background: isLocal ? "#faad14" : "#1890ff", width: 40, height: 40 }}>
                          <FileTextOutlined style={{ fontSize: 18 }} />
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Title level={5} style={{ margin: 0, fontSize: 15, color: "#1a1a1a" }}>
                            {lang === "ru" ? survey.titleRu || survey.title : survey.titleTj || survey.title}
                          </Title>
                          <Flex gap={8} align="center" style={{ marginTop: 4 }} wrap>
                            <Tag color="blue" style={{ fontSize: 11, borderRadius: 12, margin: 0 }}>
                              {questionCount} {t[lang].questionCount}
                            </Tag>
                            <Tag color="green" style={{ fontSize: 11, borderRadius: 12, margin: 0 }}>
                              {participantsCount} {t[lang].participants}
                            </Tag>
                          </Flex>
                        </div>
                      </Flex>
                    </div>

                    <div style={{ padding: "12px 20px", background: "#fafafa" }}>
                      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Space size={8}>
                          <Button
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() => openEmployeeSelection(survey)}
                            style={{ fontSize: 12 }}
                          >
                            {t[lang].takeSurvey}
                          </Button>

                          <Button
                            size="small"
                            icon={<BarChartOutlined />}
                            onClick={() => handleViewResults(survey)}
                            style={{ fontSize: 12 }}
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
                            style={{ fontSize: 12 }}
                          />
                          <Popconfirm
                            title={t[lang].deleteConfirm}
                            onConfirm={async () => {
                              if (isLocal) {
                                handleRemoveLocalSurvey(survey.id);
                              } else {
                                await removeTest(survey.id);
                                message.success("Опрос удален");
                              }
                            }}
                            okText="Да"
                            cancelText="Нет"
                          >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ fontSize: 12 }} />
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

      {/* ==================== МОДАЛЬНОЕ ОКНО ВЫБОРА СОТРУДНИКА ==================== */}
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
                {employees.find(e => e.id === tempEmployeeId)?.firstName} {employees.find(e => e.id === tempEmployeeId)?.lastName}
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* ==================== МОДАЛЬНОЕ ОКНО ПРОХОЖДЕНИЯ ОПРОСА ==================== */}
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
      >
        {selectedSurveyForTaking && (
          <SurveyTaking
            survey={selectedSurveyForTaking}
            questions={selectedSurveyForTaking.questions || []}
            onComplete={handleSurveyComplete}
            onClose={() => {
              setSurveyTakingOpen(false);
              setSelectedSurveyForTaking(null);
              setSelectedEmployeeIdForTaking(null);
            }}
            employeeId={selectedEmployeeIdForTaking}
            lang={lang}
            t={t[lang]}
          />
        )}
      </Modal>

      {/* ==================== МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТОВ ==================== */}
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
      >
        {selectedSurveyForResults && (
          <SurveyResults
            survey={selectedSurveyForResults}
            questions={selectedSurveyForResults.questions || []}
            results={surveyResults}
            employees={employees}
            lang={lang}
            t={t[lang]}
          />
        )}
      </Modal>

      {/* ==================== МОДАЛЬНОЕ ОКНО СОЗДАНИЯ ОПРОСА ==================== */}
      <Modal
        open={open}
        onCancel={() => { setOpen(false); resetForm(); }}
        footer={null}
        width={900}
        centered
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #1890ff, #096dd9)", padding: "20px 28px", color: "white" }}>
            <Flex align="center" gap={12}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <Alert message={t[lang].info} description="Введите основную информацию об опросе." type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />

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
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <Alert
                    message={t[lang].info}
                    description={
                      <div>
                        <Text>
                          {editingItem
                            ? "Редактирование опроса. Вы можете добавлять новые вопросы или удалять существующие."
                            : "Выберите вопросы для опроса из доступных."
                          }
                        </Text>
                        <div style={{ marginTop: 6 }}>
                          <Tag color="blue" style={{ borderRadius: 16 }}>
                            {editingItem
                              ? `В опросе: ${selectedQuestionIds.length} вопросов`
                              : `Доступно: ${availableQuestions.length} вопросов`
                            }
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
                            <Button size="small" icon={<PlusOutlined />} onClick={selectAllQuestions} disabled={filteredAvailableQuestions.length === 0}>
                              {t[lang].selectAll}
                            </Button>
                            <Button size="small" icon={<MinusOutlined />} onClick={clearAllQuestions} disabled={selectedQuestionIds.length === 0}>
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
                              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
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
                <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <Alert message={t[lang].success} description={t[lang].surveyReady} type="success" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />

                  <div style={{ padding: "16px 20px", background: "#e6f7ff", borderRadius: 12, border: "1px solid #bae7ff", marginBottom: 16 }}>
                    <Flex align="center" gap={12}>
                      <Avatar style={{ background: "#1890ff", width: 36, height: 36 }}><FileTextOutlined /></Avatar>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {lang === "ru" ? titleRu || "Без названия" : titleTj || "Безунвон"}
                        </Text>
                        <div>
                          <Tag color="blue" style={{ borderRadius: 16 }}>
                            {selectedQuestionIds.length} {t[lang].totalQuestions}
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
                        {questions.filter(q => selectedQuestionIds.includes(q.id)).map((q, idx) => (
                          <div key={q.id} style={{ padding: "6px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
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
                {currentStep > 0 && <Button onClick={handleBack} style={{ borderRadius: 8 }}>{t[lang].back}</Button>}
                {currentStep < 2 ? (
                  <Button type="primary" onClick={handleNext} style={{ background: "#1890ff", borderRadius: 8 }} icon={<ArrowRightOutlined />}>
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleSave} loading={saving} style={{ background: "linear-gradient(135deg, #1890ff, #096dd9)", borderRadius: 8 }} icon={<RocketOutlined />}>
                    {saving ? "Сохранение..." : (editingItem ? t[lang].save : t[lang].addSurvey)}
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