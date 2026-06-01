import { useEffect, useState } from "react";
import { useAnswerStore } from "../store/useAnswer";
import { useQuestionStore } from "../store/useQuestion";
import { useEmployeeStore } from "../store/useEmployee";
import { useTestStore } from "../store/useTest";
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
  Select,
  Table,
  Collapse,
  Badge,
} from "antd";
import { 
  PlusOutlined, 
  DeleteOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined 
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

export const Answer = () => {
  const {
    answers = [],
    loading,
    fetchAnswers,
    addAnswer,
    remove,
  } = useAnswerStore();

  const { questions = [], fetchQuestions } = useQuestionStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { tests = [], fetchTests } = useTestStore();

  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("answer_lang");
    return savedLang || "ru";
  });

  // Форма для ответа с testId
  const [form, setForm] = useState({
    questionId: null,
    testId: null,
    employeeId: null,
    optionId: null,
    textAnswer: "",
  });

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);

  useEffect(() => {
    fetchAnswers();
    fetchQuestions();
    fetchEmployee();
    fetchTests();
  }, []);

  // Фильтруем вопросы по выбранному тесту
  useEffect(() => {
    if (form.testId) {
      const test = tests.find(t => t.id === form.testId);
      if (test && test.questions) {
        setFilteredQuestions(test.questions);
      } else {
        setFilteredQuestions([]);
      }
    } else {
      setFilteredQuestions(questions);
    }
  }, [form.testId, tests, questions]);

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("answer_lang", newLang);
  };

  const t = {
    ru: {
      title: "Результаты тестирования",
      addAnswer: "Добавить ответ",
      delete: "Удалить",
      save: "Сохранить",
      cancel: "Отмена",
      deleteConfirm: "Вы уверены, что хотите удалить этот ответ?",
      test: "Тест",
      question: "Вопрос",
      employee: "Сотрудник",
      answer: "Ответ",
      textAnswer: "Текстовый ответ",
      selectTest: "Выберите тест",
      selectQuestion: "Выберите вопрос",
      selectEmployee: "Выберите сотрудника",
      selectOption: "Выберите вариант ответа",
      noAnswers: "Нет результатов тестирования",
      loading: "Загрузка...",
      answerCreated: "Ответ успешно сохранен",
      answerDeleted: "Ответ успешно удален",
      testType: "Тестовый вопрос",
      manualType: "Ручной ввод",
      correctAnswer: "Правильный ответ",
      result: "Результат",
      correct: "Правильно",
      total: "Всего",
      percentage: "Процент",
      passed: "Пройден",
      failed: "Не пройден",
      answers: "Ответы",
      userAnswer: "Ответ сотрудника",
    },
    tj: {
      title: "Натиҷаҳои тестирование",
      addAnswer: "Иловаи ҷавоб",
      delete: "Хориҷ",
      save: "Сабт кардан",
      cancel: "Бекор кардан",
      deleteConfirm: "Шумо боварӣ доред, ки ин ҷавобро нест кардан мехоҳед?",
      test: "Тест",
      question: "Савол",
      employee: "Корманд",
      answer: "Ҷавоб",
      textAnswer: "Ҷавоби матнӣ",
      selectTest: "Тестро интихоб кунед",
      selectQuestion: "Саволро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      selectOption: "Варианти ҷавобро интихоб кунед",
      noAnswers: "Натиҷаи тестирование нест",
      loading: "Боркунӣ...",
      answerCreated: "Ҷавоб бомуваффақият сабт шуд",
      answerDeleted: "Ҷавоб бомуваффақият нест шуд",
      testType: "Саволи тестӣ",
      manualType: "Вориди дастӣ",
      correctAnswer: "Ҷавоби дуруст",
      result: "Натиҷа",
      correct: "Дуруст",
      total: "Ҳамагӣ",
      percentage: "Фоиз",
      passed: "Гузашт",
      failed: "Нагузашт",
      answers: "Ҷавобҳо",
      userAnswer: "Ҷавоби корманд",
    },
  };

  const openCreateModal = () => {
    setForm({
      questionId: null,
      testId: null,
      employeeId: null,
      optionId: null,
      textAnswer: "",
    });
    setSelectedQuestion(null);
    setSelectedOptions([]);
    setOpen(true);
  };

  const handleTestChange = (testId) => {
    setForm({
      ...form,
      testId,
      questionId: null,
      optionId: null,
      textAnswer: "",
    });
    setSelectedQuestion(null);
    setSelectedOptions([]);
  };

  const handleQuestionChange = (questionId) => {
    const question = filteredQuestions.find(q => q.id === questionId);
    setSelectedQuestion(question);
    setForm({
      ...form,
      questionId,
      optionId: null,
      textAnswer: "",
    });

    if (question && question.type === 1 && question.options) {
      setSelectedOptions(question.options);
    } else {
      setSelectedOptions([]);
    }
  };

  const getQuestionText = (question) => {
    if (!question) return "—";
    if (question.type === 2) {
      const parts = question.content?.split(" || ") || [];
      return parts[0] || question.content || "—";
    }
    if (lang === "ru") {
      return question.contentRu || question.content || "—";
    }
    return question.contentTj || question.content || "—";
  };

  const getOptionText = (option) => {
    if (!option) return "—";
    if (lang === "ru") {
      return option.textRu || option.text || "—";
    }
    return option.textTj || option.text || "—";
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return "—";
    return `${employee.firstName} ${employee.lastName}`;
  };

  const getTestTitle = (testId) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return "—";
    if (lang === "ru") {
      return test.titleRu || test.title || "—";
    }
    return test.titleTj || test.title || "—";
  };

  const handleSave = async () => {
    if (!form.testId) {
      message.warning(t[lang].selectTest);
      return;
    }
    if (!form.questionId) {
      message.warning(t[lang].selectQuestion);
      return;
    }
    if (!form.employeeId) {
      message.warning(t[lang].selectEmployee);
      return;
    }

    if (selectedQuestion?.type === 1 && !form.optionId) {
      message.warning(t[lang].selectOption);
      return;
    }
    if (selectedQuestion?.type === 2 && !form.textAnswer?.trim()) {
      message.warning("Введите текстовый ответ");
      return;
    }

    const payload = {
      questionId: form.questionId,
      testId: form.testId,
      employeeId: form.employeeId,
      optionId: form.optionId || null,
      textAnswer: form.textAnswer || "",
    };

    console.log("Saving answer payload:", payload);

    try {
      await addAnswer(payload);
      message.success(t[lang].answerCreated);
      await fetchAnswers();
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Save error:", err);
      message.error(err.response?.data?.message || "Ошибка при сохранении ответа");
    }
  };

  const resetForm = () => {
    setForm({
      questionId: null,
      testId: null,
      employeeId: null,
      optionId: null,
      textAnswer: "",
    });
    setSelectedQuestion(null);
    setSelectedOptions([]);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
      message.success(t[lang].answerDeleted);
      await fetchAnswers();
    } catch (err) {
      console.error("Delete error:", err);
      message.error("Ошибка при удалении");
    }
  };

  // Группируем ответы по сотрудникам и тестам
  const groupedAnswers = {};
  answers.forEach(answer => {
    const key = `${answer.employeeId}_${answer.testId}`;
    if (!groupedAnswers[key]) {
      groupedAnswers[key] = {
        employeeId: answer.employeeId,
        testId: answer.testId,
        answers: [],
        total: 0,
        correct: 0,
      };
    }
    
    const question = questions.find(q => q.id === answer.questionId);
    let isCorrect = false;
    
    if (question) {
      if (question.type === 1 && answer.optionId) {
        const option = question.options?.find(o => o.id === answer.optionId);
        isCorrect = option?.isCorrect || false;
      } else if (question.type === 2) {
        const correctAnswer = question.content?.split(" || ")[1]?.toLowerCase().trim();
        isCorrect = correctAnswer === answer.textAnswer?.toLowerCase().trim();
      }
    }
    
    groupedAnswers[key].answers.push({ ...answer, question, isCorrect });
    if (isCorrect) groupedAnswers[key].correct++;
    groupedAnswers[key].total++;
  });

  const columns = [
    {
      title: t[lang].test,
      key: "test",
      render: (_, record) => {
        const question = questions.find(q => q.id === record.questionId);
        return getTestTitle(record.testId);
      },
    },
    {
      title: t[lang].question,
      key: "question",
      width: "30%",
      render: (_, record) => {
        const question = questions.find(q => q.id === record.questionId);
        return (
          <div>
            <Text strong>{getQuestionText(question)}</Text>
            <br />
            <Tag color={question?.type === 1 ? "green" : "orange"} style={{ marginTop: 5 }}>
              {question?.type === 1 ? t[lang].testType : t[lang].manualType}
            </Tag>
          </div>
        );
      },
    },
    {
      title: t[lang].employee,
      key: "employeeId",
      render: (_, record) => getEmployeeName(record.employeeId),
    },
    {
      title: t[lang].answer,
      key: "answer",
      render: (_, record) => {
        const question = questions.find(q => q.id === record.questionId);
        if (question?.type === 1 && record.optionId) {
          const option = question.options?.find(o => o.id === record.optionId);
          return <Text style={{ color: "#52c41a" }}>{getOptionText(option)}</Text>;
        }
        return <Text style={{ color: "#52c41a" }}>{record.textAnswer || "—"}</Text>;
      },
    },
    {
      title: "Действие",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title={t[lang].deleteConfirm}
          onConfirm={() => handleDelete(record.id)}
          okText="Да"
          cancelText="Нет"
        >
          <Button danger icon={<DeleteOutlined />}>
            {t[lang].delete}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  if (loading && answers.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50 }}>
        <Spin size="small" tip={t[lang].loading} />
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            {t[lang].title}
          </Title>
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
            <Button
              type="primary"
              onClick={openCreateModal}
              icon={<PlusOutlined />}
              style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
            >
              {t[lang].addAnswer}
            </Button>
          </Space>
        </Col>
      </Row>
      {!answers || answers.length === 0 ? (
        <Card>
          <Text type="secondary">{t[lang].noAnswers}</Text>
        </Card>
      ) : (
        <Table
          dataSource={answers}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      )}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          resetForm();
        }}
        onOk={handleSave}
        title={t[lang].addAnswer}
        width={700}
        okText={t[lang].save}
        cancelText={t[lang].cancel}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Text strong>{t[lang].test}:</Text>
            <Select
              placeholder={t[lang].selectTest}
              value={form.testId}
              onChange={handleTestChange}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
            >
              {tests.map((test) => (
                <Select.Option key={test.id} value={test.id}>
                  {lang === "ru" ? test.titleRu : test.titleTj}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>{t[lang].question}:</Text>
            <Select
              placeholder={t[lang].selectQuestion}
              value={form.questionId}
              onChange={handleQuestionChange}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              disabled={!form.testId}
            >
              {filteredQuestions.map((q) => (
                <Select.Option key={q.id} value={q.id}>
                  {getQuestionText(q)} ({q.type === 1 ? t[lang].testType : t[lang].manualType})
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>{t[lang].employee}:</Text>
            <Select
              placeholder={t[lang].selectEmployee}
              value={form.employeeId}
              onChange={(value) => setForm({ ...form, employeeId: value })}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
            >
              {employees.map((emp) => (
                <Select.Option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.email})
                </Select.Option>
              ))}
            </Select>
          </div>

          {selectedQuestion && (
            <div>
              <Text strong>{t[lang].answer}:</Text>
              {selectedQuestion.type === 1 ? (
                <Select
                  placeholder={t[lang].selectOption}
                  value={form.optionId}
                  onChange={(value) => setForm({ ...form, optionId: value, textAnswer: "" })}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  {selectedOptions.map((opt, idx) => (
                    <Select.Option key={opt.id || idx} value={opt.id || idx}>
                      {getOptionText(opt)}
                      {opt.isCorrect && (
                        <Tag color="success" style={{ marginLeft: 8 }}>
                          <CheckCircleOutlined /> {t[lang].correctAnswer}
                        </Tag>
                      )}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <TextArea
                  placeholder={t[lang].textAnswer}
                  value={form.textAnswer}
                  onChange={(e) => setForm({ ...form, textAnswer: e.target.value, optionId: null })}
                  rows={4}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};