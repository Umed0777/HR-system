import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
import { useTestSessionStore } from "../store/useTestSession";
import { useEmployeeStore } from "../store/useEmployee";
import {
  Card,
  Typography,
  Radio,
  Button,
  Space,
  Progress,
  Alert,
  Result,
  Input,
  Row,
  Col,
  Tag,
  message,
  Spin,
  Statistic,
  Modal,
  Select,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;
const { Option } = Select;
const letters = ["A", "B", "C", "D", "E", "F"];

export const TestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { fetchTestById, loading: testLoading } = useTestStore();
  const { fetchQuestions, questions, loading: questionsLoading } = useQuestionStore();
  const { 
    startSession, 
    saveAnswer, 
    finishSession, 
    currentSession,
    loading: sessionLoading,
  } = useTestSessionStore();
  const { employees = [], fetchEmployee, loading: employeesLoading } = useEmployeeStore();

  const [test, setTest] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("test_taking_lang");
    return savedLang || "ru";
  });
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [countdownKey, setCountdownKey] = useState(Date.now());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const TEST_DURATION = 300; // 5 минут

  useEffect(() => {
    if (testId) {
      loadTest();
    }
    loadEmployees();
  }, [testId]);

  const loadEmployees = async () => {
    try {
      await fetchEmployee();
    } catch (error) {
      console.error("Error loading employees:", error);
      message.error("Ошибка загрузки списка сотрудников");
    }
  };

  const loadTest = async () => {
    try {
      const testData = await fetchTestById(testId);
      console.log("Loaded test:", testData);
      setTest(testData);
      await fetchQuestions();
    } catch (error) {
      console.error("Error loading test:", error);
      message.error("Ошибка загрузки теста");
      navigate("/test");
    }
  };

  const startTest = async () => {
    try {
      if (!testId) {
        message.error("ID теста не найден");
        return;
      }
      
      if (!selectedEmployeeId) {
        message.error("Пожалуйста, выберите сотрудника");
        return;
      }
      
      console.log("Starting test with:", { 
        testId: Number(testId), 
        employeeId: selectedEmployeeId 
      });
      
      const session = await startSession(Number(testId), selectedEmployeeId);
      console.log("Session started successfully:", session);
      
      // Сохраняем данные сессии
      setSessionData(session.data || session);
      setTestStarted(true);
      setTimeRemaining(Date.now() + TEST_DURATION * 1000);
      setCountdownKey(Date.now());
      setUserAnswers({});
      setCurrentIndex(0);
      setTestCompleted(false);
      setShowResults(false);
      setScore(0);
      
      message.info(`У вас есть ${Math.floor(TEST_DURATION / 60)} минут на прохождение теста`);
    } catch (error) {
      console.error("Error starting test:", error);
      
      if (error.response) {
        console.error("Server response:", error.response.data);
        
        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (errorData.message) {
            message.error(errorData.message);
          } else {
            message.error("Неверные данные для начала теста");
          }
        } else if (error.response.status === 404) {
          message.error("Тест не найден");
        } else {
          message.error("Ошибка сервера. Попробуйте позже.");
        }
      } else if (error.request) {
        message.error("Сервер не отвечает. Проверьте соединение.");
      } else {
        message.error(error.message || "Ошибка при начале теста");
      }
    }
  };

  const autoSubmitOnTimeout = async () => {
    const orderedQuestions = getOrderedQuestions();
    let correctCount = 0;
    
    orderedQuestions.forEach((q) => {
      if (!q) return;
      const userAnswer = userAnswers[q.id];
      const correctAnswers = getCorrectAnswers(q);
      let isCorrect = false;
      
      if (q.type === 2) {
        const userAnswerText = userAnswer?.answer?.toLowerCase().trim();
        isCorrect = correctAnswers.some(correct => correct === userAnswerText);
      } else {
        const userSelected = userAnswer?.answer;
        isCorrect = correctAnswers.includes(userSelected?.toLowerCase().trim());
      }
      
      if (isCorrect) {
        correctCount++;
      }
    });
    
    setScore(correctCount);
    setTestCompleted(true);
    setShowResults(true);
    
    if (sessionData?.id || currentSession?.id) {
      const sessionId = sessionData?.id || currentSession?.id;
      try {
        await finishSession(sessionId, selectedEmployeeId);
        message.success("Результаты сохранены!");
      } catch (error) {
        console.error("Error finishing session:", error);
      }
    }
    
    message.warning(`Время вышло! Вы ответили правильно на ${correctCount} из ${orderedQuestions.length} вопросов.`);
  };

  const handleTimeOut = () => {
    message.warning("Время вышло! Тест автоматически завершен.");
    autoSubmitOnTimeout();
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("test_taking_lang", newLang);
  };

  const t = {
    ru: {
      back: "Назад к тестам",
      next: "Следующий",
      prev: "Назад",
      submit: "Завершить",
      retry: "Пройти заново",
      start: "Начать тест",
      score: "Результат",
      correct: "Правильно",
      incorrect: "Неправильно",
      yourAnswer: "Ваш ответ",
      correctAnswer: "Правильный ответ",
      questionNumber: "Вопрос",
      of: "из",
      completed: "Тест завершен!",
      selectAnswer: "Пожалуйста, выберите ответ",
      correctAnswers: "Правильных ответов",
      totalQuestions: "Всего вопросов",
      percentage: "Процент",
      manualInput: "Введите ответ:",
      yourInput: "Ваш ответ",
      checkAnswers: "Проверка ответов",
      timeRemaining: "Осталось времени",
      startTest: "Начать тестирование",
      minutes: "мин",
      correctCount: "Правильно",
      incorrectCount: "Неправильно",
      unanswered: "Не отвечено",
      selectEmployee: "Выберите сотрудника",
      questions: "вопросов",
      noEmployees: "Нет доступных сотрудников",
    },
    tj: {
      back: "Бозгашт ба тестҳо",
      next: "Баъдӣ",
      prev: "Қаблӣ",
      submit: "Анҷом додан",
      retry: "Аз нав гузаштан",
      start: "Оғози тест",
      score: "Натиҷа",
      correct: "Дуруст",
      incorrect: "Нодуруст",
      yourAnswer: "Ҷавоби шумо",
      correctAnswer: "Ҷавоби дуруст",
      questionNumber: "Савол",
      of: "аз",
      completed: "Тест анҷом ёфт!",
      selectAnswer: "Лутфан, ҷавобро интихоб кунед",
      correctAnswers: "Ҷавобҳои дуруст",
      totalQuestions: "Ҳамагӣ саволҳо",
      percentage: "Фоиз",
      manualInput: "Ҷавоб ворид кунед:",
      yourInput: "Ҷавоби шумо",
      checkAnswers: "Санҷиши ҷавобҳо",
      timeRemaining: "Вақти боқимонда",
      startTest: "Оғози тестирование",
      minutes: "дақ",
      correctCount: "Дуруст",
      incorrectCount: "Нодуруст",
      unanswered: "Ҷавоб дода нашудааст",
      selectEmployee: "Корманди интихоб кунед",
      questions: "саволҳо",
      noEmployees: "Корманди дастрас нест",
    },
  };

  const getOrderedQuestions = () => {
    if (!test || !test.questions) return [];
    return test.questions.filter(q => q);
  };

  const getQuestionText = (q) => {
    if (!q) return "—";
    if (q.type === 2) {
      const parts = q.content?.split(" || ") || [];
      return parts[0] || "—";
    } else {
      return q.content || "—";
    }
  };

  const getOptionText = (o) => {
    if (!o) return "—";
    return o.text || "—";
  };

  const getCorrectAnswers = (q) => {
    if (!q) return [];
    if (q.type === 2) {
      const parts = q.content?.split(" || ") || [];
      return [parts[1]?.toLowerCase().trim() || ""];
    } else {
      return q.options
        ?.filter(opt => opt.isCorrect)
        .map(opt => opt.text?.toLowerCase().trim()) || [];
    }
  };

  const handleAnswer = async (value, type, questionId) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: { answer: value, type: type },
    }));

    const sessionId = sessionData?.id || currentSession?.id;
    if (sessionId) {
      try {
        if (type === 2) {
          await saveAnswer(sessionId, questionId, null, value);
        } else {
          const question = getOrderedQuestions().find(q => q.id === questionId);
          const option = question?.options?.find(opt => opt.text === value);
          if (option) {
            await saveAnswer(sessionId, questionId, option.id, null);
          }
        }
        console.log("Answer saved successfully");
      } catch (error) {
        console.error("Error saving answer:", error);
        message.error("Ошибка сохранения ответа");
      }
    }
  };

  const handleManualAnswer = async (value, questionId) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: { answer: value, type: 2 },
    }));

    const sessionId = sessionData?.id || currentSession?.id;
    if (sessionId) {
      try {
        await saveAnswer(sessionId, questionId, null, value);
        console.log("Answer saved successfully");
      } catch (error) {
        console.error("Error saving answer:", error);
        message.error("Ошибка сохранения ответа");
      }
    }
  };

  const calculateScore = async () => {
    const orderedQuestions = getOrderedQuestions();
    let correctCount = 0;
    
    orderedQuestions.forEach((q) => {
      if (!q) return;
      const userAnswer = userAnswers[q.id];
      if (!userAnswer) return;
      
      const correctAnswers = getCorrectAnswers(q);
      
      if (q.type === 2) {
        const userAnswerText = userAnswer.answer?.toLowerCase().trim();
        if (correctAnswers.some(correct => correct === userAnswerText)) {
          correctCount++;
        }
      } else {
        const userSelected = userAnswer.answer;
        if (correctAnswers.includes(userSelected?.toLowerCase().trim())) {
          correctCount++;
        }
      }
    });
    
    setScore(correctCount);
    setTestCompleted(true);
    
    const sessionId = sessionData?.id || currentSession?.id;
    if (sessionId) {
      try {
        await finishSession(sessionId, selectedEmployeeId);
        message.success(`Тест завершен! Результат: ${correctCount} из ${orderedQuestions.length}`);
      } catch (error) {
        console.error("Error finishing session:", error);
        message.error("Ошибка сохранения результатов");
      }
    }
  };

  const handleSubmit = async () => {
    const orderedQuestions = getOrderedQuestions();
    const unanswered = orderedQuestions.some(q => !userAnswers[q?.id]);
    if (unanswered) {
      message.warning(t[lang].selectAnswer);
      return;
    }
    await calculateScore();
    setShowResults(true);
  };

  const handleRetry = () => {
    Modal.confirm({
      title: "Подтверждение",
      content: "Вы уверены, что хотите пройти тест заново? Все предыдущие ответы будут потеряны.",
      okText: "Да",
      cancelText: "Нет",
      onOk: async () => {
        setUserAnswers({});
        setCurrentIndex(0);
        setTestCompleted(false);
        setShowResults(false);
        setScore(0);
        setTestStarted(false);
        setTimeRemaining(null);
        setSelectedEmployeeId(null);
        setSessionData(null);
        await loadTest();
        message.info("Начинаем тест заново!");
      }
    });
  };

  const getAnswerStatus = (question) => {
    if (!question) return null;
    const userAnswer = userAnswers[question.id];
    if (!userAnswer) return null;
    
    const correctAnswers = getCorrectAnswers(question);
    
    if (question.type === 2) {
      const isCorrect = correctAnswers.some(
        correct => correct === userAnswer.answer?.toLowerCase().trim()
      );
      return isCorrect;
    } else {
      const userSelected = userAnswer.answer;
      return correctAnswers.includes(userSelected?.toLowerCase().trim());
    }
  };

  const goToQuestion = (index) => {
    setCurrentIndex(index);
  };

  const getStats = () => {
    const orderedQuestions = getOrderedQuestions();
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    
    orderedQuestions.forEach((q) => {
      if (!q) return;
      const userAnswer = userAnswers[q.id];
      if (!userAnswer) {
        unanswered++;
        return;
      }
      
      const correctAnswers = getCorrectAnswers(q);
      let isCorrect = false;
      
      if (q.type === 2) {
        const userAnswerText = userAnswer.answer?.toLowerCase().trim();
        isCorrect = correctAnswers.some(correct => correct === userAnswerText);
      } else {
        const userSelected = userAnswer.answer;
        isCorrect = correctAnswers.includes(userSelected?.toLowerCase().trim());
      }
      
      if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }
    });
    
    return { correct, incorrect, unanswered };
  };

  if (testLoading || questionsLoading || employeesLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="small" tip="Загрузка..." />
      </div>
    );
  }

  if (!test) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Alert message="Тест не найден" type="error" />
        <Button style={{ marginTop: 20 }} onClick={() => navigate("/test")}>
          {t[lang].back}
        </Button>
      </div>
    );
  }

  const orderedQuestions = getOrderedQuestions();
  
  if (orderedQuestions.length === 0) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Alert message="В тесте нет вопросов" type="warning" />
        <Button style={{ marginTop: 20 }} onClick={() => navigate("/test")}>
          {t[lang].back}
        </Button>
      </div>
    );
  }

  // Стартовая страница с выбором сотрудника
  if (!testStarted && !showResults) {
    const validEmployees = (employees || []).filter(emp => emp && emp.id);
    
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
        <Button onClick={() => navigate("/test")} style={{ marginBottom: 20 }}>
          ← {t[lang].back}
        </Button>
        
        <Card style={{ textAlign: "center", padding: 40 }}>
          <Title level={2}>{test.title}</Title>
          <Paragraph style={{ fontSize: 16, marginTop: 20, color: "#666" }}>
            {test.description}
          </Paragraph>
          
          <Divider />
          
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <Space size="large" wrap>
              <Tag color="orange" style={{ fontSize: 16, padding: "8px 16px" }}>
                📝 {orderedQuestions.length} {t[lang].questions}
              </Tag>
              <Tag color="blue" style={{ fontSize: 16, padding: "8px 16px" }}>
                <ClockCircleOutlined /> {Math.floor(TEST_DURATION / 60)} {t[lang].minutes}
              </Tag>
              <Tag color="green" style={{ fontSize: 16, padding: "8px 16px" }}>
                <UserOutlined /> {t[lang].selectEmployee}
              </Tag>
            </Space>
          </div>
          
          <Divider />
          
          <div style={{ marginTop: 20 }}>
            <Text strong style={{ display: "block", marginBottom: 10 }}>
              {t[lang].selectEmployee}:
            </Text>
            
            {validEmployees.length > 0 ? (
              <Select
                placeholder="Выберите сотрудника"
                value={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                style={{ width: "100%", maxWidth: 300 }}
                size="large"
                showSearch
                optionFilterProp="children"
              >
                {validEmployees.map(emp => (
                  <Option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} - {emp.email}
                  </Option>
                ))}
              </Select>
            ) : (
              <Alert
                message={t[lang].noEmployees}
                description="Пожалуйста, добавьте сотрудников в разделе 'Сотрудники'"
                type="warning"
                showIcon
                action={
                  <Button size="small" type="primary" onClick={() => navigate("/employee")}>
                    Перейти к сотрудникам
                  </Button>
                }
              />
            )}
          </div>
          
          <Button
            type="primary"
            size="large"
            onClick={startTest}
            loading={sessionLoading}
            disabled={!selectedEmployeeId}
            style={{ marginTop: 40, background: "#ff4b2b", borderColor: "#ff4b2b" }}
          >
            {t[lang].startTest}
          </Button>
        </Card>
      </div>
    );
  }

  // Страница результатов
  if (showResults) {
    const percentage = Math.round((score / orderedQuestions.length) * 100);
    const stats = getStats();
    
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
        <Button onClick={() => navigate("/test")} style={{ marginBottom: 20 }}>
          ← {t[lang].back}
        </Button>

        <Result
          icon={<TrophyOutlined style={{ color: "#ff4b2b" }} />}
          title={t[lang].completed}
          subTitle={`${t[lang].score}: ${score} ${t[lang].of} ${orderedQuestions.length}`}
          extra={[
            <Button 
              type="primary" 
              key="retry" 
              onClick={handleRetry} 
              style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
            >
              {t[lang].retry}
            </Button>,
          ]}
        />
        
        <Card style={{ marginTop: 20 }}>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ color: "#52c41a", margin: 0 }}>{stats.correct}</Title>
                <Text type="secondary">{t[lang].correctCount}</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ color: "#ff4b2b", margin: 0 }}>{stats.incorrect}</Title>
                <Text type="secondary">{t[lang].incorrectCount}</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ color: "#faad14", margin: 0 }}>{stats.unanswered}</Title>
                <Text type="secondary">{t[lang].unanswered}</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: "center" }}>
                <Title level={2} style={{ margin: 0 }}>{percentage}%</Title>
                <Text type="secondary">{t[lang].percentage}</Text>
              </div>
            </Col>
          </Row>
        </Card>

        <div style={{ marginTop: 30 }}>
          <Title level={4}>{t[lang].checkAnswers}:</Title>
          {orderedQuestions.map((q, idx) => {
            if (!q) return null;
            const isCorrect = getAnswerStatus(q);
            const userAnswer = userAnswers[q.id];
            const isUnanswered = !userAnswer;
            
            let statusColor = "error";
            let statusText = t[lang].incorrect;
            if (isUnanswered) {
              statusColor = "warning";
              statusText = t[lang].unanswered;
            } else if (isCorrect) {
              statusColor = "success";
              statusText = t[lang].correct;
            }
            
            return (
              <Card
                key={q.id}
                style={{ marginBottom: 16 }}
                title={
                  <Space>
                    <Tag color={statusColor}>{statusText}</Tag>
                    <span>
                      {t[lang].questionNumber} {idx + 1}
                    </span>
                  </Space>
                }
              >
                <Text strong style={{ fontSize: 16, display: "block", marginBottom: 15 }}>
                  {getQuestionText(q)}
                </Text>
                
                <div style={{ marginBottom: 10 }}>
                  <Text type="secondary">{t[lang].yourAnswer}: </Text>
                  <Text>{userAnswer?.answer || "—"}</Text>
                </div>
                
                <div>
                  <Text type="success">{t[lang].correctAnswer}: </Text>
                  <Text strong style={{ color: "#52c41a" }}>
                    {getCorrectAnswers(q).join(", ")}
                  </Text>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Страница прохождения теста
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Button onClick={() => navigate("/test")}>
            ← {t[lang].back}
          </Button>
        </Col>
        <Col>
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
          </Space>
        </Col>
      </Row>

      {timeRemaining && (
        <Card style={{ marginBottom: 20, textAlign: "center", background: "#f0f0f0" }}>
          <Space>
            <ClockCircleOutlined style={{ fontSize: 24, color: "#ff4b2b" }} />
            <div>
              <Text type="secondary">{t[lang].timeRemaining}:</Text>
              <Countdown
                key={countdownKey}
                value={timeRemaining}
                onFinish={handleTimeOut}
                format="mm:ss"
                valueStyle={{ fontSize: 28, fontWeight: "bold", color: "#ff4b2b", marginLeft: 10 }}
              />
            </div>
          </Space>
        </Card>
      )}

      <Card>
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            background: "linear-gradient(135deg, #ff416c, #ff4b2b)", 
            color: "white",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: "bold",
            display: "inline-block",
            marginBottom: 15
          }}>
            {test.title}
          </div>
          
          <Progress percent={((currentIndex + 1) / orderedQuestions.length) * 100} strokeColor="#ff4b2b" style={{ marginTop: 10 }} />
          
          <div style={{ marginTop: 10, textAlign: "right" }}>
            <Text type="secondary">
              {t[lang].questionNumber} {currentIndex + 1} {t[lang].of} {orderedQuestions.length}
            </Text>
          </div>
        </div>

        <Title level={4} style={{ marginBottom: 30 }}>
          {getQuestionText(orderedQuestions[currentIndex])}
        </Title>

        {orderedQuestions[currentIndex].type === 1 ? (
          orderedQuestions[currentIndex].options && orderedQuestions[currentIndex].options.length > 0 ? (
            <Radio.Group
              value={userAnswers[orderedQuestions[currentIndex].id]?.answer}
              onChange={(e) => handleAnswer(e.target.value, 1, orderedQuestions[currentIndex].id)}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {orderedQuestions[currentIndex].options.map((opt, idx) => (
                  <Radio key={idx} value={getOptionText(opt)} style={{ marginLeft: 0 }}>
                    <Text strong>{letters[idx]}. </Text>
                    {getOptionText(opt)}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          ) : (
            <Alert message="Нет вариантов ответов" type="warning" />
          )
        ) : (
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 10 }}>
              {t[lang].manualInput}
            </Text>
            <Input.TextArea
              placeholder={t[lang].yourInput}
              value={userAnswers[orderedQuestions[currentIndex].id]?.answer || ""}
              onChange={(e) => handleManualAnswer(e.target.value, orderedQuestions[currentIndex].id)}
              rows={3}
              size="large"
            />
          </div>
        )}

        <Row justify="space-between" style={{ marginTop: 30 }}>
          <Col>
            <Button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
              icon={<ArrowLeftOutlined />}
              size="large"
            >
              {t[lang].prev}
            </Button>
          </Col>
          <Col>
            {currentIndex === orderedQuestions.length - 1 ? (
              <Button
                type="primary"
                onClick={handleSubmit}
                icon={<CheckCircleOutlined />}
                loading={sessionLoading}
                size="large"
                style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              >
                {t[lang].submit}
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                icon={<ArrowRightOutlined />}
                size="large"
                style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              >
                {t[lang].next}
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <div style={{ 
        marginTop: 30, 
        padding: "20px",
        background: "#f9f9f9",
        borderRadius: 12,
        textAlign: "center"
      }}>
        <Text strong style={{ display: "block", marginBottom: 15 }}>
          {t[lang].questionNumber}:
        </Text>
        <Space wrap size="middle" style={{ justifyContent: "center" }}>
          {orderedQuestions.map((q, idx) => {
            const isAnswered = !!userAnswers[q?.id];
            const isCurrent = idx === currentIndex;
            
            return (
              <Button
                key={idx}
                type={isCurrent ? "primary" : isAnswered ? "default" : "dashed"}
                shape="circle"
                size="middle"
                onClick={() => goToQuestion(idx)}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: isCurrent ? "#ff4b2b" : isAnswered ? "#52c41a" : undefined,
                  borderColor: isCurrent ? "#ff4b2b" : undefined,
                  color: isCurrent ? "white" : isAnswered ? "#52c41a" : undefined,
                  fontWeight: isCurrent ? "bold" : "normal",
                }}
              >
                {idx + 1}
              </Button>
            );
          })}
        </Space>
        <div style={{ marginTop: 15 }}>
          <Space>
            <Tag color="green">✓ Отвечен</Tag>
            <Tag color="#ff4b2b">Текущий</Tag>
            <Tag>Не отвечен</Tag>
          </Space>
        </div>
      </div>
    </div>
  );
};