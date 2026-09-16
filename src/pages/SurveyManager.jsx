import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuestionStore } from "../store/useQuestion";
import { useEmployeeStore } from "../store/useEmployee";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import {
  Button, Modal, Input, Space, Card, Tabs, Typography, Popconfirm,
  Row, Col, message, Tag, Spin, Table, Flex, Avatar, Empty, Steps,
  Alert, Progress, Pagination, Checkbox, Badge, Select, Divider,
  Radio, Statistic, Tooltip, Descriptions,
} from "antd";
import {
  DeleteOutlined, EditOutlined, FileTextOutlined, RocketOutlined,
  QuestionCircleOutlined, CheckCircleOutlined, ArrowRightOutlined,
  ClockCircleOutlined, TrophyOutlined, PlusOutlined, MinusOutlined,
  SearchOutlined, FilterOutlined, ClearOutlined, SaveOutlined,
  StarOutlined, UserOutlined, PlayCircleOutlined, FormOutlined,
  BarChartOutlined, SendOutlined, ApartmentOutlined, HourglassOutlined,
  LeftOutlined, RightOutlined, WarningOutlined, TeamOutlined,
  FireOutlined, ThunderboltOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ============================================================
// AXIOS КЛИЕНТ
// ============================================================
const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// ============================================================
// УТИЛИТЫ
// ============================================================
const QUESTION_TYPE_MAP = {
  Test: 1, test: 1, TEST: 1, MultipleChoice: 1, multiplechoice: 1,
  SingleChoice: 1, Choice: 1,
  OpenEnded: 2, openended: 2, OPENENDED: 2, "open-ended": 2,
  Open: 2, Text: 2, text: 2, Manual: 2,
  Rating: 3, rating: 3, RATING: 3, Score: 3, Scale: 3,
};
const QUESTION_TYPE_TO_API = { 1: "MultipleChoice", 2: "OpenEnded", 3: "Rating" };

const normalizeQuestionType = (type) => {
  if (type === null || type === undefined || type === "") return 1;
  if (typeof type === "number") return (type === 1 || type === 2 || type === 3) ? type : 1;
  if (typeof type === "string") {
    const s = type.trim();
    if (/^[123]$/.test(s)) return parseInt(s, 10);
    if (QUESTION_TYPE_MAP[s] !== undefined) return QUESTION_TYPE_MAP[s];
    const l = s.toLowerCase();
    if (QUESTION_TYPE_MAP[l] !== undefined) return QUESTION_TYPE_MAP[l];
    if (s.startsWith("Open")) return 2;
    if (s.startsWith("Rate") || s.startsWith("Rat")) return 3;
  }
  return 1;
};

const isSameId = (a, b) => a != null && b != null && String(a) === String(b);

const extractEntityId = (res) =>
  res?.id ?? res?.data?.id ?? res?.data?.data?.id ?? res?.result?.id ?? null;

const extractEntity = (res) => res?.data?.data ?? res?.data ?? res?.result ?? res;

const extractItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.$values)) return raw.$values;
  if (raw.data && Array.isArray(raw.data.items)) return raw.data.items;
  if (raw.data && Array.isArray(raw.data.$values)) return raw.data.$values;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  return [];
};

const normalizeQuestion = (q) => {
  if (!q) return q;
  const content = q.content || q.contentRu || q.contentTj || q.text || "";
  return {
    ...q,
    content,
    contentRu: q.contentRu || q.content || content,
    contentTj: q.contentTj || q.content || content,
    type: normalizeQuestionType(q.type),
    options: Array.isArray(q.options)
      ? q.options.map((o) => ({
          ...o,
          text: o.text || o.textRu || o.textTj || "",
          textRu: o.textRu || o.text || o.textTj || "",
          textTj: o.textTj || o.text || o.textRu || "",
        }))
      : [],
  };
};

const extractQuestionsArray = (source) => {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  if (Array.isArray(source.data)) return source.data;
  if (Array.isArray(source.questions)) return source.questions;
  if (Array.isArray(source.$values)) return source.$values;
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.results)) return source.results;
  if (source.data && Array.isArray(source.data.$values)) return source.data.$values;
  if (source.data && Array.isArray(source.data.questions)) return source.data.questions;
  return [];
};

const isSurveyItem = (t) => {
  if (!t || typeof t !== "object") return false;
  const raw = t.testType ?? t.type ?? t.test_type ?? t.categoryType ?? t.kind;
  if (raw === undefined || raw === null || raw === "") return Array.isArray(t.questions);
  const n = Number(raw);
  if (!Number.isNaN(n)) return n === 0;
  const s = String(raw).trim().toLowerCase();
  return ["0", "survey", "surveys", "опрос", "опросы"].includes(s);
};

// ============================================================
// API: ОПРОСЫ (через /api/Test с testType: 0)
// ============================================================
const SurveyAPI = {
  // GET /api/Test — возвращает ВСЁ, фильтруем на клиенте
  async getAllRaw(pageNumber = 1, pageSize = 100, search = null, language = "Ru") {
    const params = { PageNumber: pageNumber, PageSize: pageSize, language };
    if (search) params.Search = search;
    const res = await API.get("/api/Test", { params });
    return extractItems(res.data);
  },

  async getAll(pageNumber = 1, pageSize = 100, search = null, language = "Ru") {
    const items = await this.getAllRaw(pageNumber, pageSize, search, language);
    return items.filter(isSurveyItem);
  },

  async getById(id) {
    const res = await API.get(`/api/Test/${id}`);
    return res.data;
  },

  // POST — отправляем testType: 0 всеми возможными именами
  async create(payload) {
    const body = {
      titleRu: payload.titleRu || payload.titleTj || "",
      titleTj: payload.titleTj || payload.titleRu || "",
      descriptionRu: payload.descriptionRu || payload.descriptionTj || "",
      descriptionTj: payload.descriptionTj || payload.descriptionRu || "",
      testType: 0,
      type: 0,
      test_type: 0,
      questions: (payload.questions || []).map((q, i) => ({
        questionId: q.questionId ?? q.id,
        order: q.order ?? i + 1,
      })),
    };
    const res = await API.post("/api/Test", body);
    return res.data;
  },

  async update(id, payload) {
    const body = {
      id,
      titleRu: payload.titleRu || payload.titleTj || "",
      titleTj: payload.titleTj || payload.titleRu || "",
      descriptionRu: payload.descriptionRu || payload.descriptionTj || "",
      descriptionTj: payload.descriptionTj || payload.descriptionRu || "",
      testType: 0,
      type: 0,
      test_type: 0,
      questions: (payload.questions || []).map((q, i) => ({
        questionId: q.questionId ?? q.id,
        order: q.order ?? i + 1,
      })),
    };
    const res = await API.put(`/api/Test/${id}`, body);
    return res.data;
  },

  async remove(id) {
    const res = await API.delete(`/api/Test/${id}`);
    return res.data;
  },
};

// ============================================================
// API: ВОПРОСЫ — РАЗДЕЛЕНО ПО ТИПАМ (OpenEnded отдельно)
// ============================================================
const QuestionAPI = {
  async getAll(pageNumber = 1, pageSize = 1000, type = null, search = null, language = "Ru") {
    const params = { PageNumber: pageNumber, PageSize: pageSize, language };
    if (type) params.Type = type;
    if (search) params.Search = search;
    const res = await API.get("/api/Question", { params });
    return extractItems(res.data);
  },

  // ⭐ Отдельные методы по типам
  getAllOpenEnded(page = 1, size = 1000, search = null, lang = "Ru") {
    return this.getAll(page, size, "OpenEnded", search, lang);
  },
  getAllMultipleChoice(page = 1, size = 1000, search = null, lang = "Ru") {
    return this.getAll(page, size, "MultipleChoice", search, lang);
  },
  getAllRating(page = 1, size = 1000, search = null, lang = "Ru") {
    return this.getAll(page, size, "Rating", search, lang);
  },

  // ⭐ Создание по типам
  async createOpenEnded({ content, contentRu, contentTj, correctAnswer }) {
    const body = {
      content: contentRu || content,
      contentRu: contentRu || content,
      contentTj: contentTj || content,
      type: "OpenEnded",
      questionType: "OpenEnded",
      options: [],
      correctAnswer: correctAnswer || "",
    };
    const res = await API.post("/api/Question", body);
    return res.data;
  },

  async createMultipleChoice({ content, contentRu, contentTj, options = [] }) {
    const body = {
      content: contentRu || content,
      contentRu: contentRu || content,
      contentTj: contentTj || content,
      type: "MultipleChoice",
      questionType: "MultipleChoice",
      options: options.map((o) => ({
        text: o.text || "",
        textRu: o.textRu || o.text || "",
        textTj: o.textTj || o.text || "",
        isCorrect: !!o.isCorrect,
      })),
    };
    const res = await API.post("/api/Question", body);
    return res.data;
  },

  async createRating({ content, contentRu, contentTj, optionId }) {
    const body = {
      content: contentRu || content,
      contentRu: contentRu || content,
      contentTj: contentTj || content,
      type: "Rating",
      questionType: "Rating",
      optionId,
      options: [],
    };
    const res = await API.post("/api/Question", body);
    return res.data;
  },
};

// ============================================================
// ПАЛИТРА КАРТОЧЕК
// ============================================================
const CARD_GRADIENTS = [
  { from: "#1890ff", to: "#40a9ff", icon: <FileTextOutlined /> },
  { from: "#722ed1", to: "#9254de", icon: <FireOutlined /> },
  { from: "#fa8c16", to: "#ffa940", icon: <ThunderboltOutlined /> },
  { from: "#13c2c2", to: "#36cfc9", icon: <RocketOutlined /> },
  { from: "#eb2f96", to: "#f759ab", icon: <TrophyOutlined /> },
  { from: "#52c41a", to: "#73d13d", icon: <CheckCircleOutlined /> },
];

// ============================================================
// 1. СОЗДАНИЕ ВОПРОСА (OpenEnded отделён)
// ============================================================
const SurveyQuestionCreator = ({ onQuestionCreated, lang, t }) => {
  const [content, setContent] = useState("");
  const [type, setType] = useState(1);
  const [options, setOptions] = useState([]);
  const [manualAnswer, setManualAnswer] = useState("");
  const [ratingAnswer, setRatingAnswer] = useState(null);
  const [creating, setCreating] = useState(false);
  const letters = ["A", "B", "C", "D", "E", "F"];

  const addOption = () => {
    if (options.length >= 6) return message.warning("Максимум 6 вариантов");
    setOptions([...options, { text: "", isCorrect: false }]);
  };
  const updateOption = (i, v) => {
    const arr = [...options];
    arr[i].text = v;
    setOptions(arr);
  };
  const setCorrectOption = (i) =>
    setOptions(options.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  const deleteOption = (i) => setOptions(options.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!content.trim()) return message.warning("Введите текст вопроса");
    setCreating(true);
    try {
      let created;
      // ⭐ OPENENDED — отдельный эндпоинт-метод
      if (type === 2) {
        if (!manualAnswer.trim()) {
          setCreating(false);
          return message.warning("Введите эталонный ответ");
        }
        created = await QuestionAPI.createOpenEnded({
          content, contentRu: content, contentTj: content,
          correctAnswer: manualAnswer,
        });
      }
      // ⭐ RATING
      else if (type === 3) {
        if (!ratingAnswer) {
          setCreating(false);
          return message.warning("Выберите рейтинг");
        }
        created = await QuestionAPI.createRating({
          content, contentRu: content, contentTj: content,
          optionId: ratingAnswer,
        });
      }
      // ⭐ MULTIPLE CHOICE
      else {
        if (options.length === 0) {
          setCreating(false);
          return message.warning("Добавьте варианты");
        }
        if (!options.some((o) => o.isCorrect)) {
          setCreating(false);
          return message.warning("Выберите правильный вариант");
        }
        created = await QuestionAPI.createMultipleChoice({
          content, contentRu: content, contentTj: content, options,
        });
      }

      message.success("Вопрос создан! 🎉");

      const norm = normalizeQuestion({
        ...(created || {}),
        id: extractEntityId(created) ?? created?.id,
        content, contentRu: content, contentTj: content,
        type,
        options: type === 1 ? options : [],
        correctAnswer: type === 2 ? manualAnswer : created?.correctAnswer,
        optionId: type === 3 ? ratingAnswer : created?.optionId,
      });

      setContent(""); setOptions([]); setManualAnswer(""); setRatingAnswer(null); setType(1);

      if (onQuestionCreated) onQuestionCreated(norm);
    } catch (err) {
      console.error("create question error:", err);
      message.error("Ошибка создания: " + (err?.response?.data?.title || err.message));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <Alert message="Новый вопрос" description="Заполните поля и сохраните."
        type="info" showIcon style={{ marginBottom: 16, borderRadius: 12 }} />

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>{t.question}:</Text>
        <Input.TextArea value={content} onChange={(e) => setContent(e.target.value)}
          rows={3} size="large" placeholder={t.question} style={{ borderRadius: 10 }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>Тип:</Text>
        <Radio.Group value={type} onChange={(e) => {
          setType(e.target.value); setOptions([]); setManualAnswer(""); setRatingAnswer(null);
        }}>
          <Radio value={1}>{t.test}</Radio>
          <Radio value={2}>{t.manual}</Radio>
          <Radio value={3}>{t.rating}</Radio>
        </Radio.Group>
      </div>

      {type === 1 && (
        <div>
          <Button type="dashed" onClick={addOption} block size="large"
            style={{ marginBottom: 15, borderRadius: 10 }} icon={<PlusOutlined />}>
            {t.add}
          </Button>
          <AnimatePresence>
            {options.map((o, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.3 }}>
                <Card size="small" style={{ marginBottom: 10, borderRadius: 10 }}
                  extra={<Button type="text" danger icon={<DeleteOutlined />}
                    onClick={() => deleteOption(i)}>Удалить</Button>}>
                  <Row align="middle" gutter={10}>
                    <Col>
                      <Radio checked={o.isCorrect} onChange={() => setCorrectOption(i)}>
                        {t.correct} ({letters[i]})
                      </Radio>
                    </Col>
                    <Col flex="auto">
                      <Input value={o.text} onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`${t.variant} ${letters[i]}`} size="large" />
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
          <Alert message="OpenEnded (открытый вопрос)"
            description="Пользователь введёт ответ вручную. Укажите эталон для сверки."
            type="info" showIcon
            style={{ marginBottom: 12, borderRadius: 10, background: "#f9f0ff", borderColor: "#d3adf7" }} />
          <Text strong style={{ display: "block", marginBottom: 8 }}>{t.correctAnswer}:</Text>
          <Input value={manualAnswer} onChange={(e) => setManualAnswer(e.target.value)}
            size="large" placeholder={t.answer} style={{ borderRadius: 10 }} />
        </div>
      )}

      {type === 3 && (
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>{t.selectRating}</Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9,10].map((num) => (
              <div key={num} onClick={() => setRatingAnswer(num)} style={{
                width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold", fontSize: 15, transition: "0.3s",
                background: ratingAnswer === num ? "linear-gradient(135deg, #1890ff, #096dd9)" : "#fff",
                color: ratingAnswer === num ? "#fff" : "#333",
                border: ratingAnswer === num ? "3px solid #bae7ff" : "1px solid #e8e8e8",
              }}>{num}</div>
            ))}
          </div>
        </div>
      )}

      <Button type="primary" onClick={handleSave} loading={creating}
        style={{
          marginTop: 16, background: "linear-gradient(135deg, #1890ff, #096dd9)",
          border: "none", borderRadius: 10, width: "100%", height: 44,
        }}
        icon={<SaveOutlined />}>
        {creating ? "Сохранение..." : "Создать вопрос"}
      </Button>
    </div>
  );
};

// ============================================================
// 2. ПРОХОЖДЕНИЕ (OpenEnded = TextArea, Rating = круги, MC = radio)
// ============================================================
const SurveyTaking = ({ survey, questions, onComplete, onClose, employeeId, lang, t, durationMinutes = 5 }) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [timerActive, setTimerActive] = useState(true);

  const STORAGE_KEY = `active_survey_${survey?.id || "x"}_${employeeId || "x"}`;

  useEffect(() => {
    if (!survey || !employeeId) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const st = JSON.parse(saved);
        if (isSameId(st.surveyId, survey.id) && isSameId(st.employeeId, employeeId)) {
          setIdx(st.currentQuestionIndex || 0);
          setAnswers(st.answers || {});
          setTimeLeft(st.timeLeft ?? durationMinutes * 60);
          setTimerActive(st.timerActive ?? true);
        }
      } catch {}
    }
  }, [survey, employeeId, durationMinutes]);

  useEffect(() => {
    if (!survey || !employeeId || isCompleted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      surveyId: survey.id, employeeId, currentQuestionIndex: idx, answers, timeLeft, timerActive,
    }));
  }, [idx, answers, timeLeft, timerActive, survey, employeeId, isCompleted]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(timer); setTimerActive(false); handleComplete(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [timerActive, isCompleted]);

  const currentQuestion = questions[idx];
  const total = questions.length;
  const answered = Object.keys(answers).length;

  const getQText = (q) => !q ? "—" : (lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content) || "—";
  const getOText = (o) => !o ? "—" : (lang === "ru" ? o.textRu || o.text : o.textTj || o.text) || "—";

  const handleAnswer = (qid, val) => setAnswers((p) => ({ ...p, [qid]: val }));
  const next = () => idx < total - 1 && setIdx(idx + 1);
  const prev = () => idx > 0 && setIdx(idx - 1);

  const handleComplete = async () => {
    if (answered < total && timeLeft > 0) {
      message.warning(`Ответьте на все вопросы. Осталось ${total - answered}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = {
        surveyId: survey.id, employeeId,
        answers: Object.entries(answers).map(([qid, v]) => ({
          questionId: Number.isNaN(Number(qid)) ? qid : Number(qid),
          answer: v,
        })),
        completedAt: new Date().toISOString(),
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        isCompleted: answered === total,
      };
      const all = JSON.parse(localStorage.getItem("survey_results") || "[]");
      const i = all.findIndex((r) => isSameId(r.surveyId, result.surveyId) && isSameId(r.employeeId, result.employeeId));
      if (i !== -1) all[i] = { ...all[i], ...result };
      else all.push(result);
      localStorage.setItem("survey_results", JSON.stringify(all));
      localStorage.removeItem(STORAGE_KEY);
      setIsCompleted(true);
      message.success("Опрос завершён!");
      if (onComplete) onComplete(result);
      setTimeout(() => onClose && onClose(), 2000);
    } catch (e) {
      message.error("Ошибка завершения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!currentQuestion) return <Empty description="Вопросы не найдены" />;

  if (isCompleted) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <Title level={2}>Спасибо за участие!</Title>
        <Button type="primary" onClick={onClose} style={{ marginTop: 20 }}>Закрыть</Button>
      </div>
    );
  }

  const ctype = normalizeQuestionType(currentQuestion?.type);
  const timeUp = timeLeft <= 0;
  const timeAlmost = timeLeft < 60;

  return (
    <div>
      <div style={{
        marginBottom: 16, padding: "10px 16px",
        background: timeUp ? "#ff4d4f" : timeAlmost ? "#fff7e6" : "#f0f7ff",
        borderRadius: 12,
        border: timeUp ? "2px solid #ff4d4f" : timeAlmost ? "1px solid #ffa940" : "1px solid #1890ff",
        display: "flex", justifyContent: "space-between",
      }}>
        <Text style={{ color: timeUp ? "#fff" : "#1890ff", fontWeight: 500 }}>
          <ClockCircleOutlined /> Осталось:
        </Text>
        <Text style={{ fontSize: 20, fontWeight: 700, color: timeUp ? "#fff" : "#1890ff" }}>
          {formatTime(timeLeft)}
        </Text>
      </div>

      <Flex justify="space-between" style={{ marginBottom: 8 }}>
        <Text strong>Вопрос {idx + 1} из {total}</Text>
        <Text type="secondary">Отвечено: {answered} / {total}</Text>
      </Flex>
      <Progress percent={Math.round((answered / total) * 100)} showInfo={false}
        strokeColor={timeAlmost ? "#faad14" : "#1890ff"} style={{ marginBottom: 16 }} />

      <Card style={{ borderRadius: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">Вопрос {idx + 1}</Tag>
          {ctype === 1 && <Tag color="green">Тест</Tag>}
          {ctype === 2 && <Tag color="purple">Ручной</Tag>}
          {ctype === 3 && <Tag color="orange">Рейтинг</Tag>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 20, lineHeight: 1.6 }}>
          {getQText(currentQuestion)}
        </div>
        <Divider>Ваш ответ</Divider>

        {ctype === 1 && (
          <Radio.Group value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            style={{ width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(currentQuestion.options || []).map((o, i) => {
                const sel = answers[currentQuestion.id] === (o.id || i);
                return (
                  <div key={o.id || i} onClick={() => handleAnswer(currentQuestion.id, o.id || i)}
                    style={{
                      padding: "14px 16px", borderRadius: 10,
                      background: sel ? "#e6f7ff" : "#fafafa",
                      border: sel ? "2px solid #1890ff" : "1px solid #e8e8e8",
                      cursor: "pointer",
                    }}>
                    <Radio value={o.id || i}><Text style={{ fontSize: 15 }}>{getOText(o)}</Text></Radio>
                  </div>
                );
              })}
            </div>
          </Radio.Group>
        )}

        {ctype === 2 && (
          <TextArea value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            rows={4} size="large" placeholder="Введите ваш ответ..."
            style={{ borderRadius: 10 }} />
        )}

        {ctype === 3 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[1,2,3,4,5,6,7,8,9,10].map((num) => {
              const active = answers[currentQuestion.id] === num;
              return (
                <div key={num} onClick={() => handleAnswer(currentQuestion.id, num)}
                  style={{
                    width: 48, height: 48, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "bold", fontSize: 16,
                    background: active ? "linear-gradient(135deg, #1890ff, #096dd9)" : "#f5f5f5",
                    color: active ? "#fff" : "#333",
                    border: active ? "3px solid #bae7ff" : "1px solid #d9d9d9",
                  }}>{num}</div>
              );
            })}
          </div>
        )}
      </Card>

      <Flex justify="space-between">
        <Button icon={<LeftOutlined />} onClick={prev} disabled={idx === 0} size="large">Назад</Button>
        {idx === total - 1 || timeUp ? (
          <Button type="primary" icon={<SendOutlined />} onClick={handleComplete}
            loading={isSubmitting} size="large"
            style={{ background: timeUp ? "#ff4d4f" : "#52c41a", borderColor: "transparent" }}>
            {timeUp ? "Завершить (время)" : "Завершить"}
          </Button>
        ) : (
          <Button type="primary" icon={<RightOutlined />} onClick={next} size="large">Далее</Button>
        )}
      </Flex>

      <div style={{ marginTop: 24 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 13 }}>Навигация:</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {questions.map((q, i) => {
            const isA = answers[q.id] !== undefined;
            const isC = i === idx;
            return (
              <Button key={q.id || i} size="small" type={isC ? "primary" : "default"}
                style={{
                  background: isA && !isC ? "#52c41a" : undefined,
                  color: isA && !isC ? "#fff" : undefined,
                  width: 32, height: 32, padding: 0, borderRadius: 8,
                }}
                onClick={() => setIdx(i)}>
                {i + 1}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 3. РЕЗУЛЬТАТЫ ОДНОГО ОПРОСА
// ============================================================
const SurveyResultsModal = ({ visible, result, onClose, lang }) => {
  if (!result) return null;
  const isCompleted = result.isCompleted !== false;
  const answered = result.answers?.length || 0;
  const total = result.totalQuestions || 0;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  const getQText = (qid) => {
    const q = result.questions?.find((x) => isSameId(x.id, qid));
    if (!q) return "—";
    return lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content;
  };
  const getAText = (a) => {
    const q = result.questions?.find((x) => isSameId(x.id, a.questionId));
    if (!q) return String(a.answer);
    const t = normalizeQuestionType(q.type);
    if (t === 1) {
      const o = q.options?.find((x) => isSameId(x.id, a.answer) || x.text === a.answer);
      return lang === "ru" ? o?.textRu || o?.text || a.answer : o?.textTj || o?.text || a.answer;
    }
    if (t === 3) return `⭐ ${a.answer}/10`;
    return String(a.answer);
  };

  return (
    <Modal open={visible} onCancel={onClose} width={620} centered
      title={<Space><TrophyOutlined style={{ color: "#1890ff" }} /> Результаты опроса</Space>}
      footer={<Button type="primary" onClick={onClose}>Закрыть</Button>}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Progress type="circle" percent={percent} width={140}
          strokeColor={isCompleted ? "#1890ff" : "#faad14"} />
      </div>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Сотрудник">{result.employeeName || "—"}</Descriptions.Item>
        <Descriptions.Item label="Опрос">{result.surveyName || "—"}</Descriptions.Item>
        <Descriptions.Item label="Отвечено">{answered} / {total}</Descriptions.Item>
        <Descriptions.Item label="Статус">
          {isCompleted ? <Tag color="success">Завершён</Tag> : <Tag color="warning">Не завершён</Tag>}
        </Descriptions.Item>
        {result.timeSpent && <Descriptions.Item label="Время">{result.timeSpent}</Descriptions.Item>}
      </Descriptions>

      {result.answers?.length > 0 && (
        <>
          <Divider orientation="left">Ответы</Divider>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {result.answers.map((a, i) => {
              const q = result.questions?.find((x) => isSameId(x.id, a.questionId));
              const t = normalizeQuestionType(q?.type);
              return (
                <div key={i} style={{
                  padding: "10px 14px", marginBottom: 8,
                  background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0",
                }}>
                  <Flex gap={8} align="flex-start">
                    <Tag color="blue">{i + 1}</Tag>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{getQText(a.questionId)}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Ответ: </Text>
                        <Text style={{ fontSize: 13 }}>{getAText(a)}</Text>
                        {t === 3 && <Tag color="orange" style={{ marginLeft: 8 }}><StarOutlined /></Tag>}
                        {t === 2 && <Tag color="purple" style={{ marginLeft: 8 }}>Текстовый</Tag>}
                      </div>
                      {t === 2 && q?.correctAnswer && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>Эталон: </Text>
                          <Text style={{ fontSize: 12, color: "#52c41a" }}>{q.correctAnswer}</Text>
                        </div>
                      )}
                    </div>
                  </Flex>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
};

// ============================================================
// 4. ОБЩИЕ РЕЗУЛЬТАТЫ
// ============================================================
const SurveyResults = ({ results, employees, lang }) => {
  const getEmpName = (id) => {
    const e = employees.find((x) => isSameId(x.id, id));
    return e ? `${e.firstName} ${e.lastName}` : `ID: ${id}`;
  };
  const columns = [
    { title: "Сотрудник", key: "emp", render: (_, r) => getEmpName(r.employeeId) },
    { title: "Отвечено", key: "ans", render: (_, r) => `${r.answers?.length || 0} / ${r.totalQuestions || 0}` },
    { title: "Статус", key: "st", render: (_, r) =>
      r.isCompleted !== false ? <Tag color="success">Завершён</Tag> : <Tag color="warning">Не завершён</Tag> },
    { title: "Время", dataIndex: "timeSpent", render: (t) => t || "—" },
    { title: "Дата", dataIndex: "completedAt",
      render: (d) => (d ? new Date(d).toLocaleString() : "—") },
  ];
  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="Участников" value={results.length} prefix={<UserOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Средний %" value={
          results.length ? Math.round(results.reduce((a, r) => {
            const an = r.answers?.length || 0, tot = r.totalQuestions || 0;
            return a + (tot > 0 ? (an / tot) * 100 : 0);
          }, 0) / results.length) : 0
        } suffix="%" /></Card></Col>
      </Row>
      <Table dataSource={results} columns={columns}
        rowKey={(r) => `${r.surveyId}-${r.employeeId}`} pagination={{ pageSize: 5 }} />
    </div>
  );
};

// ============================================================
// 5. ОСНОВНОЙ КОМПОНЕНТ
// ============================================================
export const SurveyManager = ({ onStartSurvey }) => {
  const navigate = useNavigate();

  const { questions: rawQuestions = [], loading: questionsLoading } = useQuestionStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { subdepartments = [], fetchSubDepartments } = useSubDepartmentStore();

  const questions = useMemo(() => (rawQuestions || []).map(normalizeQuestion), [rawQuestions]);

  const [surveys, setSurveys] = useState([]);
  const [surveysLoading, setSurveysLoading] = useState(false);

  const [lang, setLang] = useState(() => localStorage.getItem("survey_manager_lang") || "ru");
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [step, setStep] = useState(0);
  const [newSurveyId, setNewSurveyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("select");
  const [titleRu, setTitleRu] = useState("");
  const [titleTj, setTitleTj] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [descriptionTj, setDescriptionTj] = useState("");

  const [takingOpen, setTakingOpen] = useState(false);
  const [takingSurvey, setTakingSurvey] = useState(null);
  const [takingEmpId, setTakingEmpId] = useState(null);

  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedForResults, setSelectedForResults] = useState(null);
  const [surveyResults, setSurveyResults] = useState([]);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailResult, setDetailResult] = useState(null);

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [selSurveyId, setSelSurveyId] = useState(null);
  const [selEmpId, setSelEmpId] = useState(null);
  const [selSubDeptId, setSelSubDeptId] = useState(null);
  const [selDuration, setSelDuration] = useState(5);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [dataLoaded, setDataLoaded] = useState(false);

  // ==============================================================
  // Загрузка опросов из API
  // ==============================================================
  const loadSurveys = useCallback(async () => {
    setSurveysLoading(true);
    try {
      const list = await SurveyAPI.getAll(1, 100);
      setSurveys(list || []);
    } catch (e) {
      console.error("loadSurveys error:", e);
      message.error("Ошибка загрузки опросов");
      setSurveys([]);
    } finally {
      setSurveysLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const list = await QuestionAPI.getAll(1, 1000);
      // обновляем стор вопросов через замену
      const store = useQuestionStore.getState();
      if (store && typeof store.setQuestions === "function") {
        store.setQuestions(list);
      } else {
        // fallback — используем fetchQuestions если он есть
        if (typeof store.fetchQuestions === "function") await store.fetchQuestions(1, 1000);
      }
    } catch (e) {
      console.error("loadQuestions error:", e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadSurveys(),
      fetchEmployee(),
      fetchSubDepartments(),
    ]);
  }, [loadSurveys, fetchEmployee, fetchSubDepartments]);

  // Первичная загрузка
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          loadSurveys(),
          fetchEmployee(),
          fetchSubDepartments(),
        ]);
        // вопросы тоже подгружаем
        if (typeof useQuestionStore.getState().fetchQuestions === "function") {
          await useQuestionStore.getState().fetchQuestions(1, 1000);
        }
        setDataLoaded(true);
      } catch (e) {
        message.error("Ошибка загрузки данных");
      }
    })();
    // eslint-disable-next-line
  }, []);

  // Результаты из localStorage (для отображения количества участников)
  useEffect(() => {
    const r = JSON.parse(localStorage.getItem("survey_results") || "[]");
    setSurveyResults(r);
  }, [takingOpen]);

  // Автозапуск прохождения из localStorage
  useEffect(() => {
    if (!dataLoaded) return;
    const st = localStorage.getItem("active_survey_state");
    if (st) {
      try {
        const s = JSON.parse(st);
        const sv = surveys.find((x) => isSameId(x.id, s.surveyId));
        const em = employees.find((x) => isSameId(x.id, s.employeeId));
        if (sv && em) {
          setTakingSurvey(sv);
          setTakingEmpId(s.employeeId);
          setTakingOpen(true);
        } else {
          localStorage.removeItem("active_survey_state");
        }
      } catch {
        localStorage.removeItem("active_survey_state");
      }
    }
  }, [dataLoaded, surveys, employees]);

  // Авто-подстановка отделения
  useEffect(() => {
    if (selEmpId) {
      const emp = employees.find((e) => isSameId(e.id, selEmpId));
      setSelSubDeptId(emp?.subDepartmentId || null);
    } else setSelSubDeptId(null);
  }, [selEmpId, employees]);

  // Пагинация — реально режем массив
  const pagedSurveys = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return surveys.slice(start, start + pageSize);
  }, [surveys, currentPage, pageSize]);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(surveys.length / pageSize));
    if (currentPage > max) setCurrentPage(max);
  }, [surveys.length, pageSize, currentPage]);

  // ==============================================================
  // СЛОВАРИ
  // ==============================================================
  const t = {
    ru: {
      title: "Управление опросами", addSurvey: "Создать опрос", edit: "Редактировать",
      cancel: "Отмена", deleteConfirm: "Удалить опрос?",
      surveyTitle: "Название опроса", description: "Описание",
      noSurveys: "Нет опросов", surveyCreated: "Опрос создан",
      surveyUpdated: "Опрос обновлён", loading: "Загрузка...",
      questionCount: "вопросов", createFirst: "Создать первый опрос",
      step1: "Информация", step2: "Вопросы", step3: "Проверка",
      next: "Далее", back: "Назад", totalQuestions: "Всего вопросов",
      surveyReady: "Опрос готов к публикации",
      fillTitle: "Заполните название", selectQuestions: "Выберите хотя бы один вопрос",
      success: "Успешно!", info: "Информация", test: "Тест", manual: "Ручной",
      save: "Сохранить", selectAll: "Выбрать все", clearAll: "Очистить",
      selected: "Выбрано", questionsSelected: "вопросов выбрано",
      searchPlaceholder: "Поиск...", allTypes: "Все типы",
      correctAnswer: "Правильный ответ", question: "Вопрос", answer: "Ответ",
      correct: "Правильный", variant: "Вариант", add: "Добавить вариант",
      rating: "Рейтинг", selectRating: "Рейтинг", createQuestionTab: "Создать вопрос",
      selectQuestionsTab: "Выбор вопросов", startSurvey: "Начать опрос",
      selectSurvey: "Выберите опрос", selectEmployee: "Выберите сотрудника",
      close: "Закрыть", viewResults: "Результаты", participants: "Участников",
      surveyResults: "Результаты", employee: "Сотрудник",
      department: "Отдел", subDepartment: "Отделение",
      selectDuration: "Длительность", minutesShort: "мин",
      presetTimes: "Быстро:", customDuration: "Своя", timeRemaining: "Осталось:",
      infoDuration: "Даётся {minutes} минут.",
      deleteSuccess: "Удалено", deleteError: "Ошибка удаления",
      alreadyPassed: "Уже пройден",
    },
    tj: {
      title: "Идоракунии пурсишҳо", addSurvey: "Эҷоди пурсиш", edit: "Тағйир",
      cancel: "Бекор", deleteConfirm: "Нест кардан?",
      surveyTitle: "Номи пурсиш", description: "Тавсиф",
      noSurveys: "Пурсишҳо нестанд", surveyCreated: "Пурсиш эҷод шуд",
      surveyUpdated: "Пурсиш нав шуд", loading: "Боркунӣ...",
      questionCount: "савол", createFirst: "Эҷоди пурсиши аввал",
      step1: "Маълумот", step2: "Саволҳо", step3: "Санҷиш",
      next: "Баъдӣ", back: "Қаблӣ", totalQuestions: "Ҳамагӣ",
      surveyReady: "Пурсиш омода аст",
      fillTitle: "Номро пур кунед", selectQuestions: "Як саволро интихоб кунед",
      success: "Бомуваффақият!", info: "Маълумот", test: "Тест", manual: "Дастӣ",
      save: "Сабт", selectAll: "Ҳамаро", clearAll: "Тоза",
      selected: "Интихоб", questionsSelected: "савол",
      searchPlaceholder: "Ҷустуҷӯ...", allTypes: "Ҳамаи навъҳо",
      correctAnswer: "Ҷавоби дуруст", question: "Савол", answer: "Ҷавоб",
      correct: "Дуруст", variant: "Вариант", add: "Илова",
      rating: "Баҳо", selectRating: "Баҳо", createQuestionTab: "Эҷоди савол",
      selectQuestionsTab: "Интихоби саволҳо", startSurvey: "Оғоз",
      selectSurvey: "Пурсишро интихоб кунед", selectEmployee: "Кормандра интихоб кунед",
      close: "Пӯшидан", viewResults: "Натиҷаҳо", participants: "Иштирокчиён",
      surveyResults: "Натиҷаҳо", employee: "Корманд",
      department: "Шуъба", subDepartment: "Шуъбаи хурд",
      selectDuration: "Давомнокӣ", minutesShort: "дақ.",
      presetTimes: "Зуд:", customDuration: "Худ", timeRemaining: "Боқимонда:",
      infoDuration: "{minutes} дақиқа дода мешавад.",
      deleteSuccess: "Нест шуд", deleteError: "Хатогӣ",
      alreadyPassed: "Гузашта шудааст",
    },
  };

  // ==============================================================
  // МОДАЛКА
  // ==============================================================
  const openCreate = () => {
    setEditingItem(null); setStep(0);
    setTitleRu(""); setTitleTj(""); setDescriptionRu(""); setDescriptionTj("");
    setSelectedQIds([]); setSearchTerm(""); setFilterType("all");
    setActiveTab("select"); setOpen(true);
  };

  const openEdit = (sv) => {
    setEditingItem(sv); setStep(0);
    setTitleRu(sv.titleRu || sv.title || "");
    setTitleTj(sv.titleTj || sv.title || "");
    setDescriptionRu(sv.descriptionRu || sv.description || "");
    setDescriptionTj(sv.descriptionTj || sv.description || "");
    setSelectedQIds(extractQuestionsArray(sv.questions).map((q) => q.id ?? q.questionId).filter((x) => x != null));
    setSearchTerm(""); setFilterType("all");
    setActiveTab("select"); setOpen(true);
  };

  const handleNext = () => {
    if (step === 0) {
      const cur = lang === "ru" ? titleRu : titleTj;
      if (!cur.trim()) return message.warning(t[lang].fillTitle);
    }
    if (step === 1 && selectedQIds.length === 0) return message.warning(t[lang].selectQuestions);
    setStep(step + 1);
  };

  const toggleQ = (qid) => setSelectedQIds((p) =>
    p.some((x) => isSameId(x, qid)) ? p.filter((x) => !isSameId(x, qid)) : [...p, qid]
  );

  // Список свободных вопросов (не занятых другими опросами)
  const filteredQuestions = useMemo(() => {
    const usedIds = new Set();
    surveys.forEach((sv) => {
      if (isSameId(sv.id, editingItem?.id)) return;
      (sv.questions || []).forEach((q) => {
        const qid = q.id ?? q.questionId;
        if (qid != null) usedIds.add(String(qid));
      });
    });
    return questions
      .filter((q) => q.id != null && !usedIds.has(String(q.id)))
      .filter((q) => {
        const text = (q.contentRu || q.contentTj || q.content || "").toLowerCase();
        const sMatch = text.includes(searchTerm.toLowerCase());
        const tMatch = filterType === "all" || Number(normalizeQuestionType(q.type)) === Number(filterType);
        return sMatch && tMatch;
      });
  }, [questions, surveys, editingItem, searchTerm, filterType]);

  const handleQuestionCreated = async (nq) => {
    // перезагружаем вопросы
    try {
      if (typeof useQuestionStore.getState().fetchQuestions === "function") {
        await useQuestionStore.getState().fetchQuestions(1, 1000);
      }
    } catch {}

    if (nq?.id != null) {
      setSelectedQIds((p) => p.some((x) => isSameId(x, nq.id)) ? p : [...p, nq.id]);
      message.success("Вопрос добавлен в опрос");
    }
    setActiveTab("select");
  };

  // ============================================================
  // СОХРАНЕНИЕ
  // ============================================================
  const handleSave = async () => {
    const cur = lang === "ru" ? titleRu : titleTj;
    if (!cur.trim()) return message.warning(t[lang].fillTitle);
    if (selectedQIds.length === 0) return message.warning(t[lang].selectQuestions);

    setSaving(true);
    try {
      const payload = {
        titleRu: titleRu || titleTj,
        titleTj: titleTj || titleRu,
        descriptionRu: descriptionRu || descriptionTj,
        descriptionTj: descriptionTj || descriptionRu,
        questions: selectedQIds.map((qid, i) => ({ questionId: qid, order: i + 1 })),
      };

      let res;
      if (editingItem) {
        res = await SurveyAPI.update(editingItem.id, payload);
        message.success(t[lang].surveyUpdated);
      } else {
        res = await SurveyAPI.create(payload);
        message.success(t[lang].surveyCreated);
        const nid = extractEntityId(res);
        if (nid != null) setNewSurveyId(nid);
      }

      await loadSurveys();
      setOpen(false);
      resetForm();

      if (!editingItem) {
        const nid = extractEntityId(res);
        if (nid != null) {
          setTimeout(() => {
            const el = document.getElementById(`survey-${nid}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => setNewSurveyId(null), 3000);
          }, 500);
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      message.error(
        "Ошибка: " + (err?.response?.data?.title || err?.response?.data?.message || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await SurveyAPI.remove(id);
      message.success(t[lang].deleteSuccess);
      await loadSurveys();
    } catch (err) {
      console.error("Delete error:", err);
      message.error(t[lang].deleteError);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitleRu(""); setTitleTj(""); setDescriptionRu(""); setDescriptionTj("");
    setSelectedQIds([]); setSearchTerm(""); setFilterType("all");
    setStep(0); setActiveTab("select");
  };

  // Вопросы конкретного опроса
  const getSurveyQuestions = useCallback((sv) => {
    if (!sv || !sv.questions) return [];
    const raw = extractQuestionsArray(sv.questions);
    if (raw.length === 0) return [];

    // если с контентом — отдаём как есть
    if (raw[0].contentRu || raw[0].content || raw[0].text) return raw.map(normalizeQuestion);

    const ids = raw.map((q) => q.id ?? q.questionId).filter((x) => x != null).map(String);
    const found = questions.filter((q) => q.id != null && ids.includes(String(q.id)));
    if (found.length > 0) {
      const byId = new Map(found.map((q) => [String(q.id), q]));
      return ids.map((id) => byId.get(id)).filter(Boolean).map(normalizeQuestion);
    }
    return raw.map((q) => normalizeQuestion({ ...q, content: q.content || q.contentRu || q.contentTj || "Вопрос" }));
  }, [questions]);

  const isPassed = (sid, eid) => {
    try {
      const all = JSON.parse(localStorage.getItem("survey_results") || "[]");
      return all.some((r) => isSameId(r.surveyId, sid) && isSameId(r.employeeId, eid));
    } catch { return false; }
  };

  // ============================================================
  // СТАРТ ОПРОСА
  // ============================================================
  const startSurvey = () => {
    if (!selSurveyId) return message.warning("Выберите опрос");
    if (!selEmpId) return message.warning("Выберите сотрудника");
    if (isPassed(selSurveyId, selEmpId)) {
      message.warning(t[lang].alreadyPassed);
      setStartModalOpen(false);
      return;
    }
    const sv = surveys.find((s) => isSameId(s.id, selSurveyId));
    if (!sv) return message.error("Опрос не найден");

    setStartModalOpen(false);
    localStorage.setItem("active_survey_state", JSON.stringify({
      surveyId: selSurveyId,
      employeeId: selEmpId,
    }));

    if (onStartSurvey) {
      onStartSurvey({
        surveyId: selSurveyId, employeeId: selEmpId,
        subDepartmentId: selSubDeptId,
        survey: { ...sv, durationMinutes: selDuration },
        duration: selDuration,
      });
    } else {
      setTakingSurvey({ ...sv, durationMinutes: selDuration });
      setTakingEmpId(selEmpId);
      setTakingOpen(true);
    }
  };

  const viewResults = (sv) => {
    const all = JSON.parse(localStorage.getItem("survey_results") || "[]");
    setSelectedForResults(sv);
    setSurveyResults(all.filter((r) => isSameId(r.surveyId, sv.id)));
    setResultsOpen(true);
  };

  const handleComplete = (result) => {
    setTakingOpen(false);
    setTakingSurvey(null);
    setTakingEmpId(null);
    localStorage.removeItem("active_survey_state");

    const all = JSON.parse(localStorage.getItem("survey_results") || "[]");
    const emp = employees.find((e) => isSameId(e.id, result.employeeId));
    const sv = surveys.find((s) => isSameId(s.id, result.surveyId));
    const svQ = getSurveyQuestions(sv);

    const withNames = {
      ...result,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : `ID: ${result.employeeId}`,
      surveyName: lang === "ru"
        ? sv?.titleRu || sv?.title || "—"
        : sv?.titleTj || sv?.title || "—",
      questions: svQ,
      totalQuestions: svQ.length,
    };

    const i = all.findIndex((r) =>
      isSameId(r.surveyId, result.surveyId) && isSameId(r.employeeId, result.employeeId));
    if (i !== -1) all[i] = { ...all[i], ...withNames, attemptCount: (all[i].attemptCount || 1) + 1 };
    else all.push({ ...withNames, attemptCount: 1 });
    localStorage.setItem("survey_results", JSON.stringify(all));
    setSurveyResults(all);

    setDetailResult({
      employeeName: withNames.employeeName,
      surveyName: withNames.surveyName,
      answers: result.answers || [],
      totalQuestions: svQ.length,
      isCompleted: result.isCompleted !== false,
      timeSpent: result.timeSpent
        ? `${Math.floor(result.timeSpent / 60)} мин ${result.timeSpent % 60} сек`
        : "—",
      questions: svQ,
    });
    setDetailModalVisible(true);
  };

  // Группировка сотрудников
  const groupedEmployees = useMemo(() => employees.reduce((g, e) => {
    const d = e.department || "Без отдела";
    if (!g[d]) g[d] = [];
    g[d].push(e);
    return g;
  }, {}), [employees]);

  const loading = surveysLoading || questionsLoading;

  // ==============================================================
  // RENDER
  // ==============================================================
  return (
    <div style={{ padding: 24, maxWidth: 1600, margin: "0 auto", background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Стили синей пагинации */}
      <style>{`
        .blue-pagination .ant-pagination-item-active {
          background: #1890ff !important;
          border-color: #1890ff !important;
        }
        .blue-pagination .ant-pagination-item-active a {
          color: #ffffff !important;
          font-weight: 600 !important;
        }
        .blue-pagination .ant-pagination-item:hover {
          border-color: #1890ff !important;
        }
        .blue-pagination .ant-pagination-item:hover a {
          color: #1890ff !important;
        }
        .blue-pagination .ant-pagination-prev:hover .ant-pagination-item-link,
        .blue-pagination .ant-pagination-next:hover .ant-pagination-item-link {
          color: #1890ff !important;
          border-color: #1890ff !important;
        }
      `}</style>

      <Flex justify="space-between" align="center" wrap="wrap" gap={12}
        style={{ marginBottom: 24, padding: "0 8px" }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>📋 {t[lang].title}</Title>
          <Text type="secondary">
            Всего {surveys.length} {surveys.length === 1 ? "опрос" : "опросов"} • Вопросов: {questions.length}
          </Text>
        </div>
        <Space wrap>
          <Button type={lang === "ru" ? "primary" : "default"}
            onClick={() => { setLang("ru"); localStorage.setItem("survey_manager_lang", "ru"); }}>RU</Button>
          <Button type={lang === "tj" ? "primary" : "default"}
            onClick={() => { setLang("tj"); localStorage.setItem("survey_manager_lang", "tj"); }}>TJ</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} size="large"
            style={{ borderRadius: 20 }} onClick={() => setStartModalOpen(true)}>
            {t[lang].startSurvey}
          </Button>
          <Button type="primary" icon={<RocketOutlined />}
            style={{
              background: "linear-gradient(135deg, #1890ff, #096dd9)",
              border: "none", borderRadius: 20, padding: "0 24px", height: 40,
            }}
            onClick={openCreate}>
            {t[lang].addSurvey}
          </Button>
        </Space>
      </Flex>

      {loading && surveys.length === 0 ? (
        <Flex justify="center" style={{ padding: 50 }}><Spin size="large" /></Flex>
      ) : surveys.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60, borderRadius: 20 }}>
          <FileTextOutlined style={{ fontSize: 64, color: "#1890ff" }} />
          <Title level={4} style={{ marginTop: 20 }}>{t[lang].noSurveys}</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
            Создайте первый опрос или проверьте, что бэкенд принимает <b>testType: 0</b> в POST /api/Test
          </Text>
          <Button type="primary" onClick={openCreate} icon={<RocketOutlined />}
            style={{ borderRadius: 20 }}>{t[lang].createFirst}</Button>
        </Card>
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {pagedSurveys.map((sv, i) => {
              const gi = (currentPage - 1) * pageSize + i;
              const isNew = isSameId(newSurveyId, sv.id);
              const svQ = getSurveyQuestions(sv);
              const results = surveyResults.filter((r) => isSameId(r.surveyId, sv.id));
              const pal = CARD_GRADIENTS[gi % CARD_GRADIENTS.length];
              const title = lang === "ru"
                ? sv.titleRu || sv.title || "Без названия"
                : sv.titleTj || sv.title || "Безунвон";

              return (
                <Col xs={24} sm={12} lg={8} key={sv.id || gi}>
                  <motion.div id={`survey-${sv.id}`}
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    whileHover={{ y: -6 }}>
                    <Card hoverable style={{
                      borderRadius: 20, border: "none", overflow: "hidden",
                      boxShadow: "0 6px 24px rgba(24,144,255,0.10)", height: "100%",
                      position: "relative",
                    }} styles={{ body: { padding: 0 } }}>
                      <div style={{
                        background: `linear-gradient(135deg, ${pal.from} 0%, ${pal.to} 100%)`,
                        padding: "22px 24px", color: "#fff",
                        position: "relative", overflow: "hidden",
                      }}>
                        <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                        <div style={{ position: "absolute", bottom: -50, right: 60, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                        <div style={{ position: "absolute", top: 30, left: -20, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

                        <Flex align="flex-start" gap={14} style={{ position: "relative", zIndex: 1 }}>
                          <div style={{
                            background: "rgba(255,255,255,0.22)", borderRadius: 14,
                            width: 52, height: 52, display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0, fontSize: 24,
                            border: "1px solid rgba(255,255,255,0.25)",
                          }}>{pal.icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{
                              color: "#fff", fontSize: 16, fontWeight: 700,
                              display: "block", overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{title}</Text>
                            <Text style={{
                              color: "rgba(255,255,255,0.75)", fontSize: 12,
                              display: "block", marginTop: 2, overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{sv.descriptionRu || sv.description || "Опрос без описания"}</Text>
                          </div>
                        </Flex>

                        {isNew && (
                          <div style={{
                            position: "absolute", top: 12, right: 12, zIndex: 3,
                            background: "rgba(255,255,255,0.95)", color: pal.from,
                            fontSize: 10, fontWeight: 800, padding: "3px 10px",
                            borderRadius: 10, letterSpacing: 0.5,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }}>NEW</div>
                        )}
                      </div>

                      <div style={{
                        padding: "16px 20px", display: "flex", justifyContent: "space-between",
                        background: "#fafbff", borderBottom: "1px solid #f0f2f5",
                      }}>
                        <Tooltip title={`${svQ.length} вопросов`}>
                          <Flex align="center" gap={6}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 10,
                              background: "linear-gradient(135deg, #e6f7ff, #bae7ff)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#1890ff",
                            }}><FormOutlined style={{ fontSize: 14 }} /></div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{svQ.length}</div>
                              <div style={{ fontSize: 10, color: "#8c8c8c" }}>{t[lang].questionCount}</div>
                            </div>
                          </Flex>
                        </Tooltip>
                        <div style={{ width: 1, background: "#e8e8e8" }} />
                        <Tooltip title={`${results.length} участников`}>
                          <Flex align="center" gap={6}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 10,
                              background: "linear-gradient(135deg, #f6ffed, #d9f7be)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#52c41a",
                            }}><TeamOutlined style={{ fontSize: 14 }} /></div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{results.length}</div>
                              <div style={{ fontSize: 10, color: "#8c8c8c" }}>{t[lang].participants}</div>
                            </div>
                          </Flex>
                        </Tooltip>
                      </div>

                      <div style={{
                        padding: "14px 18px", display: "flex",
                        justifyContent: "space-between", alignItems: "center", background: "#fff",
                      }}>
                        <Button size="middle" icon={<BarChartOutlined />}
                          onClick={() => viewResults(sv)}
                          style={{
                            borderColor: pal.from, color: pal.from,
                            borderRadius: 10, fontWeight: 500,
                          }}>
                          {t[lang].viewResults}
                        </Button>
                        <Space size={2}>
                          <Tooltip title={t[lang].edit}>
                            <Button type="text" icon={<EditOutlined />}
                              onClick={() => openEdit(sv)} style={{ color: "#1890ff" }} />
                          </Tooltip>
                          <Popconfirm title={t[lang].deleteConfirm}
                            onConfirm={() => handleRemove(sv.id)}
                            okText="Да" cancelText="Нет">
                            <Tooltip title="Удалить">
                              <Button type="text" danger icon={<DeleteOutlined />} />
                            </Tooltip>
                          </Popconfirm>
                        </Space>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              );
            })}
          </Row>

          {/* Синяя пагинация */}
          {surveys.length > pageSize && (
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <div className="blue-pagination">
                <Pagination
                  current={currentPage} pageSize={pageSize} total={surveys.length}
                  showSizeChanger pageSizeOptions={["6", "9", "12", "18", "24"]}
                  onShowSizeChange={(_, s) => { setPageSize(s); setCurrentPage(1); }}
                  onChange={(p, s) => { setCurrentPage(p); if (s !== pageSize) setPageSize(s); }}
                  showTotal={(tot, range) => `${range[0]}-${range[1]} из ${tot} опросов`}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Модалка "Начать опрос" */}
      <Modal open={startModalOpen} onCancel={() => setStartModalOpen(false)}
        width={650} centered
        title={<Space><PlayCircleOutlined style={{ color: "#1890ff" }} />{t[lang].startSurvey}</Space>}
        footer={[
          <Button key="c" onClick={() => setStartModalOpen(false)}>{t[lang].close}</Button>,
          <Button key="s" type="primary" onClick={startSurvey}
            disabled={!selSurveyId || !selEmpId || !selSubDeptId}>
            {t[lang].startSurvey} ({selDuration} {t[lang].minutesShort})
          </Button>,
        ]}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>
          <div>
            <Text strong>{t[lang].selectSurvey}:</Text>
            <Select value={selSurveyId} onChange={setSelSurveyId} showSearch size="large"
              style={{ width: "100%", marginTop: 8 }} placeholder={t[lang].selectSurvey}
              optionFilterProp="children"
              filterOption={(inp, opt) =>
                (opt?.children?.toString?.() || "").toLowerCase().includes(inp.toLowerCase())}>
              {surveys.map((s) => (
                <Option key={s.id} value={s.id}>
                  <Flex justify="space-between">
                    <span>{lang === "ru" ? s.titleRu || s.title : s.titleTj || s.title}</span>
                    <Tag color="blue">{getSurveyQuestions(s).length} в.</Tag>
                  </Flex>
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>{t[lang].selectDuration}:</Text>
            <Input type="number" min={1} max={480} value={selDuration} size="large"
              onChange={(e) => setSelDuration(Math.max(1, Math.min(480, parseInt(e.target.value) || 5)))}
              prefix={<HourglassOutlined />} suffix={t[lang].minutesShort}
              style={{ marginTop: 8 }} />
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t[lang].presetTimes}</Text>
              {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                <Button key={m} size="small" type={selDuration === m ? "primary" : "default"}
                  onClick={() => setSelDuration(m)}>{m}</Button>
              ))}
            </div>
          </div>

          <div>
            <Text strong>{t[lang].selectEmployee}:</Text>
            <Select value={selEmpId} onChange={setSelEmpId} showSearch size="large"
              style={{ width: "100%", marginTop: 8 }} placeholder={t[lang].selectEmployee}
              optionFilterProp="children"
              filterOption={(inp, opt) =>
                (opt?.children?.toString?.() || "").toLowerCase().includes(inp.toLowerCase())}>
              {Object.entries(groupedEmployees).map(([dep, list]) => (
                <Select.OptGroup key={dep} label={`${t[lang].department}: ${dep}`}>
                  {list.map((e) => (
                    <Option key={e.id} value={e.id}>
                      <UserOutlined /> {e.firstName} {e.lastName}
                      {e.subDepartmentId && (
                        <Tag color="green" style={{ marginLeft: 6 }}>
                          <ApartmentOutlined />{" "}
                          {subdepartments.find((s) => isSameId(s.id, e.subDepartmentId))?.name || e.subDepartmentId}
                        </Tag>
                      )}
                    </Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </div>

          {selSubDeptId && (
            <Card size="small" style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}>
              <Space>
                <ApartmentOutlined style={{ color: "#52c41a" }} />
                <Text strong>
                  {subdepartments.find((s) => isSameId(s.id, selSubDeptId))?.name || selSubDeptId}
                </Text>
                <Tag color="green"><CheckCircleOutlined /> Из сотрудника</Tag>
              </Space>
            </Card>
          )}
        </div>
      </Modal>

      {/* Прохождение */}
      <Modal open={takingOpen} footer={null} width={680} centered
        title={
          <Space>
            <FormOutlined style={{ color: "#1890ff" }} />
            {takingSurvey?.titleRu || takingSurvey?.titleTj || "Опрос"}
          </Space>
        }
        onCancel={() => { setTakingOpen(false); setTakingSurvey(null); setTakingEmpId(null); }}
        styles={{ body: { maxHeight: "80vh", overflow: "auto" } }}>
        {takingSurvey && (
          <SurveyTaking
            survey={takingSurvey}
            questions={getSurveyQuestions(takingSurvey)}
            onComplete={handleComplete}
            onClose={() => { setTakingOpen(false); setTakingSurvey(null); setTakingEmpId(null); }}
            employeeId={takingEmpId}
            lang={lang} t={t[lang]}
            durationMinutes={takingSurvey.durationMinutes || 5}
          />
        )}
      </Modal>

      {/* Результат */}
      <SurveyResultsModal visible={detailModalVisible} result={detailResult}
        onClose={() => { setDetailModalVisible(false); setDetailResult(null); }} lang={lang} />

      {/* Все результаты опроса */}
      <Modal open={resultsOpen} footer={null} width={850} centered
        title={<Space><BarChartOutlined style={{ color: "#1890ff" }} />{t[lang].surveyResults}</Space>}
        onCancel={() => { setResultsOpen(false); setSelectedForResults(null); }}
        styles={{ body: { maxHeight: "80vh", overflow: "auto" } }}>
        {selectedForResults && (
          <SurveyResults results={surveyResults} employees={employees} lang={lang} />
        )}
      </Modal>

      {/* Создание/редактирование */}
      <Modal open={open} onCancel={() => { setOpen(false); resetForm(); }}
        footer={null} width={900} centered
        styles={{ header: { display: "none" }, body: { padding: 0 } }}>
        <div style={{ borderRadius: 16, overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(135deg, #1890ff, #096dd9)",
            padding: "20px 28px", color: "#fff",
          }}>
            <Flex align="center" gap={12}>
              <div style={{
                background: "rgba(255,255,255,0.2)", borderRadius: "50%",
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {editingItem ? <EditOutlined style={{ fontSize: 20 }} /> : <RocketOutlined style={{ fontSize: 20 }} />}
              </div>
              <div>
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  {editingItem ? t[lang].edit : t[lang].addSurvey}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                  {editingItem ? "Измените параметры опроса" : "Заполните информацию о новом опросе"}
                </Text>
              </div>
            </Flex>
          </div>

          <div style={{ padding: "20px 28px 0", background: "#fff" }}>
            <Steps current={step} size="small" items={[
              { title: t[lang].step1, icon: <FileTextOutlined /> },
              { title: t[lang].step2, icon: <QuestionCircleOutlined /> },
              { title: t[lang].step3, icon: <CheckCircleOutlined /> },
            ]} style={{ marginBottom: 24 }} />
          </div>

          <div style={{ padding: "0 28px 24px", background: "#fff" }}>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <Alert message={t[lang].info} description="Введите информацию об опросе."
                    type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {t[lang].surveyTitle} <span style={{ color: "red" }}>*</span>
                    </Text>
                    <Input value={lang === "ru" ? titleRu : titleTj}
                      onChange={(e) => lang === "ru" ? setTitleRu(e.target.value) : setTitleTj(e.target.value)}
                      size="large" style={{ borderRadius: 10 }}
                      placeholder={lang === "ru" ? "Введите название опроса" : "Номи пурсишро ворид кунед"} />
                  </div>
                  <div>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>{t[lang].description}</Text>
                    <Input.TextArea value={lang === "ru" ? descriptionRu : descriptionTj}
                      onChange={(e) => lang === "ru" ? setDescriptionRu(e.target.value) : setDescriptionTj(e.target.value)}
                      rows={3} size="large" style={{ borderRadius: 10 }}
                      placeholder={lang === "ru" ? "Введите описание" : "Тавсифро ворид кунед"} />
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <Alert message={t[lang].info}
                    description={
                      <div>
                        <Text>Занятые в других опросах вопросы скрыты.</Text>
                        <div style={{ marginTop: 6 }}>
                          <Tag color="blue">Доступно: {filteredQuestions.length}</Tag>
                          <Tag color="green" style={{ marginLeft: 8 }}>Всего: {questions.length}</Tag>
                        </div>
                      </div>
                    } type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />

                  <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
                    <TabPane tab={<span><FormOutlined /> {t[lang].selectQuestionsTab}</span>} key="select">
                      <Flex justify="space-between" wrap="wrap" gap={8}
                        style={{
                          background: "#f8f9fa", padding: "12px 16px",
                          borderRadius: 10, marginBottom: 16,
                        }}>
                        <Space wrap>
                          <Button size="small" icon={<PlusOutlined />}
                            disabled={filteredQuestions.length === 0}
                            onClick={() => {
                              const set = new Set(selectedQIds.map(String));
                              filteredQuestions.forEach((q) => q.id != null && set.add(String(q.id)));
                              setSelectedQIds([...set].map((s) => {
                                const q = questions.find((x) => String(x.id) === s);
                                return q ? q.id : s;
                              }));
                            }}>
                            {t[lang].selectAll}
                          </Button>
                          <Button size="small" icon={<MinusOutlined />}
                            onClick={() => setSelectedQIds([])}
                            disabled={selectedQIds.length === 0}>
                            {t[lang].clearAll}
                          </Button>
                        </Space>
                        <Space wrap>
                          <Input placeholder={t[lang].searchPlaceholder} value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} allowClear
                            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                            size="small" style={{ width: 180 }} />
                          <Select value={filterType} onChange={setFilterType} size="small"
                            style={{ width: 130 }} suffixIcon={<FilterOutlined />}>
                            <Option value="all">{t[lang].allTypes}</Option>
                            <Option value="1">📝 {t[lang].test}</Option>
                            <Option value="2">✏️ {t[lang].manual}</Option>
                            <Option value="3">⭐ {t[lang].rating}</Option>
                          </Select>
                        </Space>
                      </Flex>

                      {filteredQuestions.length === 0 ? (
                        <div style={{ padding: 30, textAlign: "center" }}>
                          <Empty description={
                            questions.length === 0
                              ? "Вопросы не загружены с сервера."
                              : searchTerm || filterType !== "all"
                              ? "Ничего не найдено по фильтрам."
                              : "Нет доступных вопросов — все уже используются."
                          } image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          {(searchTerm || filterType !== "all") && (
                            <Button size="small" style={{ marginTop: 12 }}
                              onClick={() => { setSearchTerm(""); setFilterType("all"); }}
                              icon={<ClearOutlined />}>
                              Сбросить фильтры
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div style={{ maxHeight: 350, overflow: "auto" }}>
                          {filteredQuestions.map((q) => {
                            const sel = selectedQIds.some((id) => isSameId(id, q.id));
                            const tNum = normalizeQuestionType(q.type);
                            const tLbl = tNum === 1 ? t[lang].test : tNum === 2 ? t[lang].manual : t[lang].rating;
                            const tCol = tNum === 1 ? "#52c41a" : tNum === 2 ? "#722ed1" : "#faad14";
                            const text = lang === "ru"
                              ? q.contentRu || q.content
                              : q.contentTj || q.content;
                            return (
                              <div key={q.id} onClick={() => toggleQ(q.id)}
                                style={{
                                  padding: "10px 14px", marginBottom: 8, borderRadius: 10,
                                  border: sel ? "2px solid #1890ff" : "1px solid #e8e8e8",
                                  background: sel ? "#e6f7ff" : "#fff",
                                  cursor: "pointer", transition: "all 0.2s",
                                }}>
                                <Flex align="center" gap={12}>
                                  <Checkbox checked={sel} />
                                  <div style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14 }}>
                                      {text || `(без текста) ID: ${q.id}`}
                                    </Text>
                                    <div style={{ marginTop: 4 }}>
                                      <Tag color={tCol} style={{ fontSize: 11, borderRadius: 12 }}>
                                        {tLbl}
                                      </Tag>
                                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                        ID: {q.id}
                                      </Text>
                                      {tNum === 2 && q.correctAnswer && (
                                        <Text style={{ fontSize: 11, marginLeft: 8, color: "#52c41a" }}>
                                          ✓ {q.correctAnswer}
                                        </Text>
                                      )}
                                    </div>
                                  </div>
                                  {sel && <CheckCircleOutlined style={{ color: "#1890ff" }} />}
                                </Flex>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedQIds.length > 0 && (
                        <div style={{
                          marginTop: 16, padding: "10px 16px",
                          background: "#f8f9fa", borderRadius: 10,
                        }}>
                          <Text strong style={{ fontSize: 13 }}>
                            {t[lang].selected}: {selectedQIds.length} {t[lang].questionsSelected}
                          </Text>
                        </div>
                      )}
                    </TabPane>

                    <TabPane tab={<span><PlusOutlined /> {t[lang].createQuestionTab}</span>} key="create">
                      <SurveyQuestionCreator onQuestionCreated={handleQuestionCreated}
                        lang={lang} t={{
                          question: t[lang].question, answer: t[lang].answer,
                          correct: t[lang].correct, variant: t[lang].variant,
                          add: t[lang].add, test: t[lang].test, manual: t[lang].manual,
                          rating: t[lang].rating, correctAnswer: t[lang].correctAnswer,
                          selectRating: t[lang].selectRating,
                        }} />
                    </TabPane>
                  </Tabs>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                  <Alert message={t[lang].success} description={t[lang].surveyReady}
                    type="success" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
                  <Card style={{ background: "#e6f7ff", borderColor: "#bae7ff", marginBottom: 16 }}>
                    <Space>
                      <Avatar style={{ background: "#1890ff" }}><FileTextOutlined /></Avatar>
                      <div>
                        <Text strong>{lang === "ru" ? titleRu : titleTj}</Text>
                        <div>
                          <Tag color="blue">{selectedQIds.length} {t[lang].totalQuestions}</Tag>
                          <Tag color="purple" style={{ marginLeft: 8 }}>Опрос</Tag>
                        </div>
                      </div>
                    </Space>
                  </Card>
                  {selectedQIds.length > 0 && (
                    <div style={{ maxHeight: 200, overflow: "auto" }}>
                      {questions
                        .filter((q) => selectedQIds.some((id) => isSameId(id, q.id)))
                        .map((q, idx) => (
                          <Flex key={q.id} align="center" gap={10}
                            style={{
                              padding: "6px 12px",
                              borderBottom: "1px solid #f0f0f0",
                            }}>
                            <Badge count={idx + 1} style={{ backgroundColor: "#1890ff" }} />
                            <Text style={{ fontSize: 13 }}>
                              {lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content}
                            </Text>
                          </Flex>
                        ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Flex justify="space-between"
              style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
              <Button onClick={() => { setOpen(false); resetForm(); }}>{t[lang].cancel}</Button>
              <Space>
                {step > 0 && <Button onClick={() => setStep(step - 1)}>{t[lang].back}</Button>}
                {step < 2 ? (
                  <Button type="primary" onClick={handleNext} icon={<ArrowRightOutlined />}>
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleSave} loading={saving} icon={<RocketOutlined />}
                    style={{ background: "linear-gradient(135deg, #1890ff, #096dd9)" }}>
                    {saving ? "Сохранение..." : editingItem ? t[lang].save : t[lang].addSurvey}
                  </Button>
                )}
              </Space>
            </Flex>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SurveyManager;