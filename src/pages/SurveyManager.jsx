import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
import { useEmployeeStore } from "../store/useEmployee";
import { useTestAssignmentStore } from "../store/useTestAssignment";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import {
  Button, Modal, Input, Space, Card, Tabs, Typography, Popconfirm,
  Row, Col, message, Tag, Spin, Table, Flex, Avatar, Empty, Steps,
  Alert, Progress, Pagination, Checkbox, Badge, Select, Radio, Divider,
  Tooltip,
} from "antd";
import {
  DeleteOutlined, EditOutlined, FileTextOutlined, RocketOutlined,
  QuestionCircleOutlined, CheckCircleOutlined, ArrowRightOutlined,
  ClockCircleOutlined, TrophyOutlined, PlusOutlined, MinusOutlined,
  SearchOutlined, FilterOutlined, ClearOutlined, SaveOutlined,
  StarOutlined, UserOutlined, ApartmentOutlined, PlayCircleOutlined,
  HourglassOutlined, FormOutlined, SendOutlined, LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const API_BASE = "http://10.65.10.22:8525/api";

// ============================================================
// ХЕЛПЕРЫ
// ============================================================
const getNumericType = (type) => {
  if (type === 1 || type === "MultipleChoice" || type === "Test") return 1;
  if (type === 2 || type === "OpenEnded" || type === "Manual") return 2;
  if (type === 3 || type === "Rating") return 3;
  if (typeof type === "string") {
    const l = type.toLowerCase();
    if (l.startsWith("open")) return 2;
    if (l.startsWith("rat")) return 3;
  }
  return 1;
};

const getApiTypeString = (nType) => {
  if (nType === 2) return "OpenEnded";
  if (nType === 3) return "Rating";
  return "MultipleChoice";
};

const isSurvey = (t) => {
  if (!t) return false;
  const v = t.testType ?? t.test_type ?? t.categoryType;
  if (v === undefined || v === null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "quiz" || s === "survey" || s === "опрос";
};

const extractItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.$values)) return raw.$values;
  if (raw.data && Array.isArray(raw.data.items)) return raw.data.items;
  if (raw.data && Array.isArray(raw.data.$values)) return raw.data.$values;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  return [];
};

const normalizeQuestion = (q) => {
  if (!q) return q;
  const content = (q.content || q.contentRu || q.contentTj || "").trim();
  return {
    ...q,
    content,
    contentRu: q.contentRu || content,
    contentTj: q.contentTj || content,
    type: getNumericType(q.type),
    isSurvey:
      q.isSurvey === undefined || q.isSurvey === null ? null : !!q.isSurvey,
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

const getQTextSafe = (q, lang = "ru") => {
  if (!q) return "—";
  const text =
    lang === "ru"
      ? q.contentRu || q.content || q.contentTj
      : q.contentTj || q.content || q.contentRu;
  return text && text.trim() ? text : "(без текста)";
};

const getOptTextSafe = (o, lang = "ru") => {
  if (!o) return "—";
  const text =
    lang === "ru"
      ? o.textRu || o.text || o.textTj
      : o.textTj || o.text || o.textRu;
  return text && text.trim() ? text : "—";
};

// ============================================================
// ⭐ ЗАГРУЗКА ТОЛЬКО ОПРОСНЫХ ВОПРОСОВ (OpenEnded + Rating)
// ============================================================
const loadSurveyQuestionsFromApi = async (language = "Ru") => {
  try {
    const [openEndedRes, ratingRes] = await Promise.all([
      axios.get(`${API_BASE}/Question`, {
        params: {
          PageNumber: 1,
          PageSize: 1000,
          Type: "OpenEnded",
          language,
        },
      }),
      axios.get(`${API_BASE}/Question`, {
        params: {
          PageNumber: 1,
          PageSize: 1000,
          Type: "Rating",
          language,
        },
      }).catch(() => ({ data: { data: [] } })), // на случай если Rating нет
    ]);

    const openEnded = extractItems(openEndedRes.data);
    const ratings = extractItems(ratingRes.data);

    console.log("📥 OpenEnded:", openEnded.length);
    console.log("📥 Rating:", ratings.length);

    return [...openEnded, ...ratings].map(normalizeQuestion);
  } catch (err) {
    console.error("❌ loadSurveyQuestionsFromApi:", err);
    return [];
  }
};

// ============================================================
// QuestionCreator
// ⭐ Тест    → isSurvey: false
// ⭐ Ручной  → isSurvey: true
// ⭐ Рейтинг → isSurvey: true
// ============================================================
const QuestionCreator = ({ onQuestionCreated, lang, t }) => {
  const { addQuestion } = useQuestionStore();
  const [content, setContent] = useState("");
  const [type, setType] = useState(2);
  const [options, setOptions] = useState([]);
  const [manualAnswer, setManualAnswer] = useState("");
  const [ratingAnswer, setRatingAnswer] = useState(null);
  const [creating, setCreating] = useState(false);

  const letters = ["A", "B", "C", "D", "E", "F"];

  const addOption = () => {
    if (options.length >= 6) return message.warning("Максимум 6 вариантов");
    setOptions([...options, { text: "" }]);
  };
  const updateOption = (i, v) => {
    const arr = [...options];
    arr[i].text = v;
    setOptions(arr);
  };
  const deleteOption = (i) => setOptions(options.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!content.trim()) return message.warning("Введите текст вопроса");

    let payload;
    if (type === 1) {
      if (!options.length) return message.warning("Добавьте варианты");
      if (options.some((o) => !o.text.trim()))
        return message.warning("Заполните все варианты");

      payload = {
        contentRu: content,
        contentTj: content,
        type: "MultipleChoice",
        questionType: "MultipleChoice",
        isSurvey: false,
        options: options.map((o) => ({
          textRu: o.text,
          textTj: o.text,
          isCorrect: false,
        })),
      };
    } else if (type === 2) {
      payload = {
        contentRu: content,
        contentTj: content,
        type: "OpenEnded",
        questionType: "OpenEnded",
        isSurvey: true,
        testType: "Quiz",
        options: manualAnswer
          ? [{ textRu: manualAnswer, textTj: manualAnswer, isCorrect: true }]
          : [],
      };
    } else {
      if (!ratingAnswer) return message.warning("Выберите рейтинг");
      payload = {
        contentRu: content,
        contentTj: content,
        type: "Rating",
        questionType: "Rating",
        isSurvey: true,
        testType: "Quiz",
        optionId: ratingAnswer,
        options: [],
      };
    }

    setCreating(true);
    try {
      const res = await addQuestion(payload);
      message.success("Вопрос создан! 🎉");
      setContent("");
      setOptions([]);
      setManualAnswer("");
      setRatingAnswer(null);
      setType(2);
      if (onQuestionCreated) onQuestionCreated(res);
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Ошибка при создании");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <Alert
        message="Создание нового вопроса"
        description="«Ручной» и «Рейтинг» попадут в опросы. «Тест» идёт в тесты и не появится в опросах."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 12 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {t.question}:
        </Text>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          size="large"
          placeholder={t.question}
          style={{ borderRadius: 10 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Тип:
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
          <Radio value={2}>{t.manual}</Radio>
          <Radio value={3}>{t.rating}</Radio>
          <Radio value={1}>{t.test}</Radio>
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
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                <Card
                  size="small"
                  style={{ marginBottom: 10, borderRadius: 10 }}
                  extra={
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteOption(i)}>
                      Удалить
                    </Button>
                  }
                >
                  <Row align="middle" gutter={10}>
                    <Col>
                      <div
                        style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                          color: "#fff", display: "flex", alignItems: "center",
                          justifyContent: "center", fontWeight: "bold", fontSize: 13,
                        }}
                      >
                        {letters[i]}
                      </div>
                    </Col>
                    <Col flex="auto">
                      <Input
                        value={o.text}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`${t.variant} ${letters[i]}`}
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
            Эталонный ответ (необязательно):
          </Text>
          <Input
            value={manualAnswer}
            onChange={(e) => setManualAnswer(e.target.value)}
            size="large"
            placeholder={t.answer}
            style={{ borderRadius: 10 }}
          />
        </div>
      )}

      {type === 3 && (
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            {t.selectRating}
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <div
                key={num}
                onClick={() => setRatingAnswer(num)}
                style={{
                  width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "bold",
                  background: ratingAnswer === num ? "linear-gradient(135deg, #ff416c, #ff4b2b)" : "#fff",
                  color: ratingAnswer === num ? "#fff" : "#333",
                  border: ratingAnswer === num ? "3px solid #ffd6d6" : "1px solid #e8e8e8",
                }}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="primary"
        onClick={handleSave}
        loading={creating}
        icon={<SaveOutlined />}
        style={{
          marginTop: 16, width: "100%", height: 44, borderRadius: 10,
          background: "linear-gradient(135deg, #ff416c, #ff4b2b)", border: "none",
        }}
      >
        {creating ? "Сохранение..." : "Создать вопрос"}
      </Button>
    </div>
  );
};

// ============================================================
// SurveyTaking
// ============================================================
const SurveyTaking = ({
  survey,
  questions,
  onComplete,
  onClose,
  employeeId,
  lang,
  durationMinutes = 5,
}) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [timerActive, setTimerActive] = useState(true);

  const total = questions.length;

  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || isCompleted) return;
    const timer = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          handleComplete(true);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [timerActive, isCompleted]);

  const currentQuestion = questions[idx];
  const answered = Object.keys(answers).length;

  const handleAnswer = (qid, val) => setAnswers((p) => ({ ...p, [qid]: val }));
  const next = () => idx < total - 1 && setIdx(idx + 1);
  const prev = () => idx > 0 && setIdx(idx - 1);

  const handleComplete = async (force = false) => {
    if (!force && answered < total && timeLeft > 0) {
      message.warning(`Ответьте на все вопросы. Осталось ${total - answered}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = {
        surveyId: survey.id,
        employeeId,
        answers: Object.entries(answers).map(([qid, v]) => ({
          questionId: Number.isNaN(Number(qid)) ? qid : Number(qid),
          answer: v,
        })),
        completedAt: new Date().toISOString(),
        timeSpent: Math.floor((Date.now() - startTime) / 1000),
        isCompleted: answered === total,
      };
      const all = JSON.parse(localStorage.getItem("survey_results") || "[]");
      const i = all.findIndex(
        (r) =>
          String(r.surveyId) === String(result.surveyId) &&
          String(r.employeeId) === String(result.employeeId)
      );
      if (i !== -1) all[i] = { ...all[i], ...result };
      else all.push(result);
      localStorage.setItem("survey_results", JSON.stringify(all));

      setIsCompleted(true);
      message.success("Опрос завершён!");
      if (onComplete) onComplete(result);
      setTimeout(() => onClose && onClose(), 1500);
    } catch (e) {
      message.error("Ошибка завершения");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!currentQuestion) return <Empty description="Вопросы не найдены" />;

  if (isCompleted) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 64 }}>🎉</div>
        <Title level={2}>Спасибо за участие!</Title>
        <Button type="primary" onClick={onClose} style={{ marginTop: 20 }}>
          Закрыть
        </Button>
      </div>
    );
  }

  const ctype = getNumericType(currentQuestion?.type);
  const timeUp = timeLeft <= 0;
  const timeAlmost = timeLeft < 60;

  return (
    <div>
      <div
        style={{
          marginBottom: 16, padding: "10px 16px",
          background: timeUp ? "#ff4d4f" : timeAlmost ? "#fff7e6" : "#fff5f5",
          borderRadius: 12,
          border: timeUp ? "2px solid #ff4d4f" : timeAlmost ? "1px solid #ffa940" : "1px solid #ff4b2b",
          display: "flex", justifyContent: "space-between",
        }}
      >
        <Text style={{ color: timeUp ? "#fff" : "#ff4b2b", fontWeight: 500 }}>
          <ClockCircleOutlined /> Осталось:
        </Text>
        <Text style={{ fontSize: 20, fontWeight: 700, color: timeUp ? "#fff" : "#ff4b2b" }}>
          {formatTime(timeLeft)}
        </Text>
      </div>

      <Flex justify="space-between" style={{ marginBottom: 8 }}>
        <Text strong>
          Вопрос {idx + 1} из {total}
        </Text>
        <Text type="secondary">
          Отвечено: {answered} / {total}
        </Text>
      </Flex>
      <Progress
        percent={Math.round((answered / total) * 100)}
        showInfo={false}
        strokeColor={timeAlmost ? "#faad14" : "#ff4b2b"}
        style={{ marginBottom: 16 }}
      />

      <Card style={{ borderRadius: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">Вопрос {idx + 1}</Tag>
          {ctype === 1 && <Tag color="green">Тест</Tag>}
          {ctype === 2 && <Tag color="purple">Ручной</Tag>}
          {ctype === 3 && <Tag color="orange">Рейтинг</Tag>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 20, lineHeight: 1.6 }}>
          {getQTextSafe(currentQuestion, lang)}
        </div>
        <Divider>Ваш ответ</Divider>

        {ctype === 1 && (
          <Radio.Group
            value={answers[currentQuestion.id]}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            style={{ width: "100%" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(currentQuestion.options || []).map((o, i) => {
                const sel = answers[currentQuestion.id] === (o.id || i);
                return (
                  <div
                    key={o.id || i}
                    onClick={() => handleAnswer(currentQuestion.id, o.id || i)}
                    style={{
                      padding: "14px 16px", borderRadius: 10,
                      background: sel ? "#fff5f5" : "#fafafa",
                      border: sel ? "2px solid #ff4b2b" : "1px solid #e8e8e8",
                      cursor: "pointer",
                    }}
                  >
                    <Radio value={o.id || i}>
                      <Text style={{ fontSize: 15 }}>{getOptTextSafe(o, lang)}</Text>
                    </Radio>
                  </div>
                );
              })}
            </div>
          </Radio.Group>
        )}

        {ctype === 2 && (
          <TextArea
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            rows={4}
            size="large"
            placeholder="Введите ваш ответ..."
            style={{ borderRadius: 10 }}
          />
        )}

        {ctype === 3 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const active = answers[currentQuestion.id] === num;
              return (
                <div
                  key={num}
                  onClick={() => handleAnswer(currentQuestion.id, num)}
                  style={{
                    width: 48, height: 48, borderRadius: "50%", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "bold", fontSize: 16,
                    background: active ? "linear-gradient(135deg, #ff416c, #ff4b2b)" : "#f5f5f5",
                    color: active ? "#fff" : "#333",
                    border: active ? "3px solid #ffd6d6" : "1px solid #d9d9d9",
                  }}
                >
                  {num}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Flex justify="space-between">
        <Button icon={<LeftOutlined />} onClick={prev} disabled={idx === 0} size="large">
          Назад
        </Button>
        {idx === total - 1 || timeUp ? (
          <Button
            type="primary" icon={<SendOutlined />} onClick={() => handleComplete()}
            loading={isSubmitting} size="large"
            style={{ background: timeUp ? "#ff4d4f" : "#52c41a", borderColor: "transparent" }}
          >
            {timeUp ? "Завершить (время)" : "Завершить"}
          </Button>
        ) : (
          <Button type="primary" icon={<RightOutlined />} onClick={next} size="large" style={{ background: "#ff4b2b" }}>
            Далее
          </Button>
        )}
      </Flex>

      <div style={{ marginTop: 24 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 10, fontSize: 13 }}>
          Навигация:
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {questions.map((q, i) => {
            const isA = answers[q.id] !== undefined;
            const isC = i === idx;
            return (
              <Button
                key={q.id || i}
                size="small"
                type={isC ? "primary" : "default"}
                style={{
                  background: isA && !isC ? "#52c41a" : isC ? "#ff4b2b" : undefined,
                  borderColor: isC ? "#ff4b2b" : undefined,
                  color: isA && !isC ? "#fff" : undefined,
                  width: 32, height: 32, padding: 0, borderRadius: 8,
                }}
                onClick={() => setIdx(i)}
              >
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
// SurveyManager
// ============================================================
export const SurveyManager = ({ onStartSurvey }) => {
  const { tests = [], loading: testsLoading, fetchTests, addTest, editTest, removeTest } = useTestStore();
  const { removeQuestion } = useQuestionStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { testAssignments = [], fetchTestAssignments } = useTestAssignmentStore();
  const { subdepartments = [], fetchSubDepartments } = useSubDepartmentStore();

  const [lang, setLang] = useState(() => localStorage.getItem("survey_manager_lang") || "ru");

  // ⭐ ЛОКАЛЬНЫЙ СТЕЙТ ОПРОСНЫХ ВОПРОСОВ (OpenEnded + Rating)
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [surveyQuestionsLoading, setSurveyQuestionsLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newSurveyId, setNewSurveyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("select");
  const [titleRu, setTitleRu] = useState("");
  const [titleTj, setTitleTj] = useState("");
  const [descRu, setDescRu] = useState("");
  const [descTj, setDescTj] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [startOpen, setStartOpen] = useState(false);
  const [selSurveyId, setSelSurveyId] = useState(null);
  const [selEmpId, setSelEmpId] = useState(null);
  const [selSubDeptId, setSelSubDeptId] = useState(null);
  const [selDuration, setSelDuration] = useState(5);

  const [takingOpen, setTakingOpen] = useState(false);
  const [takingSurvey, setTakingSurvey] = useState(null);
  const [takingEmpId, setTakingEmpId] = useState(null);

  const roles = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("roles") || "[]"); }
    catch { return []; }
  }, []);
  const isAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");

  const surveyItems = useMemo(() => (tests || []).filter(isSurvey), [tests]);

  // ⭐ Загрузка только опросных вопросов
  const loadSurveyQuestions = useCallback(async () => {
    setSurveyQuestionsLoading(true);
    try {
      const list = await loadSurveyQuestionsFromApi("Ru");
      setSurveyQuestions(list);
      console.log("✅ Опросных вопросов загружено:", list.length);
    } catch (e) {
      console.error("loadSurveyQuestions error:", e);
      message.error("Ошибка загрузки вопросов");
    } finally {
      setSurveyQuestionsLoading(false);
    }
  }, []);

  // ⭐ ID всех вопросов, которые уже входят в опросы
  const surveyQuestionIds = useMemo(() => {
    const ids = new Set();
    surveyItems.forEach((s) => {
      s.questions?.forEach((q) => {
        const id = q.id || q.questionId;
        if (id) ids.add(String(id));
      });
    });
    return ids;
  }, [surveyItems]);

  const totalCount = surveyItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSurveys = surveyItems.slice(startIndex, startIndex + pageSize);

  const getQuestionText = useCallback((q) => getQTextSafe(q, lang), [lang]);

  const getTypeLabel = useCallback(
    (type) => {
      const n = getNumericType(type);
      if (n === 1)
        return { label: lang === "ru" ? "Тест" : "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
      if (n === 2)
        return { label: lang === "ru" ? "Ручной" : "Дастӣ", color: "#722ed1", icon: <FormOutlined /> };
      if (n === 3)
        return { label: lang === "ru" ? "Рейтинг" : "Баҳо", color: "#faad14", icon: <StarOutlined /> };
      return { label: "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
    },
    [lang]
  );

  const getUsedQuestionIds = useCallback(
    (excludeId = null) => {
      const usedIds = new Set();
      surveyItems.forEach((s) => {
        if (excludeId && Number(s.id) === Number(excludeId)) return;
        if (s.questions?.length > 0) {
          s.questions.forEach((q) => {
            const qId = q.id || q.questionId;
            if (qId) usedIds.add(qId);
          });
        }
      });
      return usedIds;
    },
    [surveyItems]
  );

  // ⭐ Из загруженных опросных вопросов убираем уже используемые
  const getAvailableQuestions = useCallback(
    (excludeId = null) => {
      const usedIds = getUsedQuestionIds(excludeId);
      return surveyQuestions.filter((q) => {
        if (q.id == null) return false;
        if (usedIds.has(q.id)) return false;
        return true;
      });
    },
    [surveyQuestions, getUsedQuestionIds]
  );

  const getEmployeeSubDepartment = useCallback(
    (employeeId) => {
      const e = employees.find((x) => x.id === employeeId);
      if (e?.subDepartmentId) return e.subDepartmentId;
      const a = testAssignments.find((x) => x.employeeId === employeeId);
      if (a?.subDepartmentId) return a.subDepartmentId;
      return null;
    },
    [employees, testAssignments]
  );

  const getSubDepartmentName = useCallback(
    (id) => {
      if (!id) return "—";
      const s = subdepartments.find((x) => Number(x.id) === Number(id));
      return s?.name || `Отделение ${id}`;
    },
    [subdepartments]
  );

  const groupedEmployees = useMemo(
    () =>
      employees.reduce((g, e) => {
        const d = e.department || "Без отдела";
        if (!g[d]) g[d] = [];
        g[d].push(e);
        return g;
      }, {}),
    [employees]
  );

  // ⭐ Первичная загрузка
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          fetchTests(1, 1000),
          fetchEmployee(1, 1000),
          fetchSubDepartments(),
          fetchTestAssignments(1, 1000),
          loadSurveyQuestions(),
        ]);
        setDataLoaded(true);
      } catch (e) {
        console.error("Ошибка загрузки:", e);
        message.error("Ошибка загрузки данных");
      }
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    if (selEmpId) {
      const subId = getEmployeeSubDepartment(selEmpId);
      setSelSubDeptId(subId || null);
    } else setSelSubDeptId(null);
  }, [selEmpId, dataLoaded, getEmployeeSubDepartment]);

  const currentEditingId = editingItem?.id;
  const availableQuestions = getAvailableQuestions(currentEditingId);

  const filteredAvailableQuestions = useMemo(
    () =>
      availableQuestions.filter((q) => {
        const text = getQuestionText(q).toLowerCase();
        const sMatch = text.includes(searchTerm.toLowerCase());
        const tMatch =
          filterType === "all" ||
          getNumericType(q.type) === parseInt(filterType);
        return sMatch && tMatch;
      }),
    [availableQuestions, searchTerm, filterType, getQuestionText]
  );

  const selectedQuestions = useMemo(
    () =>
      selectedQIds
        .map((id) => surveyQuestions.find((q) => q.id === id))
        .filter(Boolean),
    [selectedQIds, surveyQuestions]
  );

  const t = {
    ru: {
      title: "Управление опросами",
      addSurvey: "Создать опрос",
      edit: "Редактировать",
      delete: "Удалить",
      save: "Сохранить",
      cancel: "Отмена",
      deleteConfirm: "Удалить опрос?",
      surveyTitle: "Название опроса",
      description: "Описание",
      noSurveys: "Нет созданных опросов",
      surveyCreated: "Опрос создан",
      surveyUpdated: "Опрос обновлён",
      questionCount: "вопросов",
      createFirst: "Создать первый опрос",
      step1: "Информация",
      step2: "Вопросы",
      step3: "Проверка",
      next: "Далее",
      back: "Назад",
      totalQuestions: "Всего вопросов",
      surveyReady: "Опрос готов к публикации",
      fillTitle: "Заполните название",
      selectQuestions: "Выберите хотя бы один вопрос",
      success: "Успешно!",
      info: "Информация",
      test: "Тест",
      manual: "Ручной",
      rating: "Рейтинг",
      selectAll: "Выбрать все",
      clearAll: "Очистить",
      selected: "Выбрано",
      questionsSelected: "вопросов",
      searchPlaceholder: "Поиск...",
      allTypes: "Все типы",
      correctAnswer: "Эталон",
      question: "Вопрос",
      answer: "Ответ",
      correct: "Правильный",
      variant: "Вариант",
      add: "Добавить вариант",
      selectRating: "Рейтинг",
      createQuestionTab: "Создать вопрос",
      selectQuestionsTab: "Выбор вопросов",
      startSurvey: "Начать опрос",
      selectSurvey: "Выберите опрос",
      selectEmployee: "Выберите сотрудника",
      close: "Закрыть",
      selectDuration: "Длительность",
      minutesShort: "мин",
      presetTimes: "Быстро:",
      alreadyPassed: "Сотрудник уже прошёл",
      noSubDepartments: "У сотрудника нет отделения",
      preview: "Просмотр опроса",
      noQuestionsInSurvey: "Нет вопросов",
      created: "Создан",
      clearFilters: "Сбросить",
      noQuestionsFound: "Ничего не найдено",
      noAvailableQuestions: "Нет доступных вопросов",
      createQuestionFirst: "Создайте вопросы",
      selectedQuestionsTitle: "Выбранные вопросы",
    },
    tj: {
      title: "Идоракунии пурсишҳо",
      addSurvey: "Эҷоди пурсиш",
      edit: "Тағйир",
      delete: "Хориҷ",
      save: "Сабт",
      cancel: "Бекор",
      deleteConfirm: "Пурсишро нест кунам?",
      surveyTitle: "Номи пурсиш",
      description: "Тавсиф",
      noSurveys: "Пурсишҳо нестанд",
      surveyCreated: "Пурсиш эҷод шуд",
      surveyUpdated: "Пурсиш нав шуд",
      questionCount: "савол",
      createFirst: "Эҷоди пурсиши аввал",
      step1: "Маълумот",
      step2: "Саволҳо",
      step3: "Санҷиш",
      next: "Баъдӣ",
      back: "Қаблӣ",
      totalQuestions: "Ҳамагӣ",
      surveyReady: "Пурсиш омода аст",
      fillTitle: "Номро пур кунед",
      selectQuestions: "Як саволро интихоб кунед",
      success: "Бомуваффақият!",
      info: "Маълумот",
      test: "Тест",
      manual: "Дастӣ",
      rating: "Баҳо",
      selectAll: "Ҳамаро",
      clearAll: "Тоза",
      selected: "Интихоб",
      questionsSelected: "савол",
      searchPlaceholder: "Ҷустуҷӯ...",
      allTypes: "Ҳамаи навъҳо",
      correctAnswer: "Ҷавоби дуруст",
      question: "Савол",
      answer: "Ҷавоб",
      correct: "Дуруст",
      variant: "Вариант",
      add: "Илова",
      selectRating: "Баҳо",
      createQuestionTab: "Эҷоди савол",
      selectQuestionsTab: "Интихоби саволҳо",
      startSurvey: "Оғоз",
      selectSurvey: "Пурсишро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      close: "Пӯшидан",
      selectDuration: "Давомнокӣ",
      minutesShort: "дақ.",
      presetTimes: "Зуд:",
      alreadyPassed: "Аллакай гузашт",
      noSubDepartments: "Шуъба нест",
      preview: "Дидани пурсиш",
      noQuestionsInSurvey: "Саволҳо нестанд",
      created: "Эҷод шуд",
      clearFilters: "Тоза",
      noQuestionsFound: "Ёфт нашуд",
      noAvailableQuestions: "Саволҳо нестанд",
      createQuestionFirst: "Саволҳо эҷод кунед",
      selectedQuestionsTitle: "Саволҳои интихобшуда",
    },
  };

  const openCreate = () => {
    setEditingItem(null);
    setStep(0);
    setTitleRu("");
    setTitleTj("");
    setDescRu("");
    setDescTj("");
    setSelectedQIds([]);
    setSearchTerm("");
    setFilterType("all");
    setActiveTab("select");
    setOpen(true);
  };

  const openEdit = (sv) => {
    setEditingItem(sv);
    setStep(0);
    setTitleRu(sv.titleRu || sv.title || "");
    setTitleTj(sv.titleTj || sv.title || "");
    setDescRu(sv.descriptionRu || sv.description || "");
    setDescTj(sv.descriptionTj || sv.description || "");
    const ids = sv.questions?.map((q) => q.id || q.questionId).filter(Boolean) || [];
    setSelectedQIds(ids);
    setActiveTab("select");
    setOpen(true);
  };

  const openPreview = (sv) => {
    setSelectedSurvey(sv);
    setPreviewOpen(true);
  };

  const handleNext = () => {
    if (step === 0) {
      const cur = lang === "ru" ? titleRu : titleTj;
      if (!cur.trim()) return message.warning(t[lang].fillTitle);
    }
    if (step === 1 && selectedQIds.length === 0)
      return message.warning(t[lang].selectQuestions);
    setStep(step + 1);
  };

  const toggleQ = (id) =>
    setSelectedQIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const selectAll = () => {
    const ids = filteredAvailableQuestions.map((q) => q.id);
    setSelectedQIds((p) => [...new Set([...p, ...ids])]);
  };

  const handleQuestionCreated = async (nq) => {
    await loadSurveyQuestions();
    if (nq?.id) {
      setSelectedQIds((p) => (p.includes(nq.id) ? p : [...p, nq.id]));
      message.success("Вопрос добавлен в опрос");
    }
    setActiveTab("select");
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await removeQuestion(questionId);
      setSelectedQIds((prev) => prev.filter((id) => id !== questionId));
      message.success("Вопрос удалён навсегда");
      await loadSurveyQuestions();
    } catch (err) {
      console.error("Delete question error:", err);
      message.error("Ошибка удаления вопроса");
    }
  };

  const handleSave = async () => {
    const cur = lang === "ru" ? titleRu : titleTj;
    if (!cur.trim()) return message.warning(t[lang].fillTitle);
    if (selectedQIds.length === 0)
      return message.warning(t[lang].selectQuestions);

    const questionsData = selectedQIds.map((qid, i) => {
      const q = surveyQuestions.find((x) => x.id === qid);
      const nType = getNumericType(q?.type);
      const apiType = getApiTypeString(nType);

      let correctAnswer = null;
      if (q) {
        if (nType === 2 && q.options?.length > 0) {
          const o = q.options[0];
          correctAnswer = {
            textRu: o.textRu || o.text || "",
            textTj: o.textTj || o.text || "",
          };
        } else if (nType === 1) {
          const o = q.options?.find((x) => x.isCorrect === true);
          if (o)
            correctAnswer = {
              textRu: o.textRu || o.text || "",
              textTj: o.textTj || o.text || "",
            };
        }
      }

      return {
        questionId: qid,
        order: i + 1,
        type: apiType,
        correctAnswer,
        options: (q?.options || []).map((o) => ({
          textRu: o.textRu || o.text || "",
          textTj: o.textTj || o.text || "",
          isCorrect: !!o.isCorrect,
        })),
      };
    });

    const payload = {
      titleRu: titleRu || titleTj,
      titleTj: titleTj || titleRu,
      descriptionRu: descRu || descTj,
      descriptionTj: descTj || descRu,
      testType: "Quiz",
      questions: questionsData,
    };

    setSaving(true);
    try {
      let response;
      if (editingItem) {
        await editTest(editingItem.id, payload);
        message.success(t[lang].surveyUpdated);
      } else {
        response = await addTest(payload);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        message.success(t[lang].surveyCreated);
        if (response?.id) setNewSurveyId(response.id);
      }

      setCurrentPage(1);
      await fetchTests(1, 1000);

      if (!editingItem && response?.id) {
        setTimeout(() => {
          const el = document.getElementById(`survey-${response.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setNewSurveyId(null), 3000);
        }, 500);
      }

      setOpen(false);
      resetForm();
      setStep(0);
    } catch (err) {
      console.error("Save error:", err);
      message.error(
        err.response?.data?.message ||
          err.response?.data?.title ||
          "Ошибка сохранения"
      );
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitleRu("");
    setTitleTj("");
    setDescRu("");
    setDescTj("");
    setSelectedQIds([]);
    setSearchTerm("");
    setFilterType("all");
    setStep(0);
    setActiveTab("select");
  };

  const handleDelete = async (id) => {
    try {
      await removeTest(id);
      message.success("Опрос удалён");
      const newTotal = surveyItems.length - 1;
      const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
      await fetchTests(1, 1000);
    } catch (err) {
      console.error("Delete error:", err);
      message.error(err.response?.data?.message || "Ошибка удаления");
    }
  };

  const handleStartSurvey = async () => {
    if (!selSurveyId || !selEmpId)
      return message.warning("Выберите опрос и сотрудника");
    const subId = getEmployeeSubDepartment(selEmpId);
    if (!subId) return message.warning(t[lang].noSubDepartments);

    const sv = surveyItems.find((s) => s.id === selSurveyId);
    if (!sv) return message.error("Опрос не найден");

    setStartOpen(false);

    if (onStartSurvey) {
      onStartSurvey({
        surveyId: selSurveyId,
        employeeId: selEmpId,
        subDepartmentId: subId,
        duration: selDuration,
        survey: sv,
      });
      return;
    }

    setTakingSurvey({ ...sv, durationMinutes: selDuration });
    setTakingEmpId(selEmpId);
    setTakingOpen(true);
  };

  const getSurveyQuestions = useCallback(
    (sv) => {
      if (!sv || !sv.questions?.length) return [];
      return sv.questions
        .map((q) => {
          const id = q.id || q.questionId;
          const found = surveyQuestions.find((x) => x.id === id);
          return found || normalizeQuestion(q);
        })
        .filter(Boolean);
    },
    [surveyQuestions]
  );

  const handleComplete = (result) => {
    setTakingOpen(false);
    setTakingSurvey(null);
    setTakingEmpId(null);
    const all = JSON.parse(localStorage.getItem("survey_results") || "[]");
    const emp = employees.find((e) => e.id === result.employeeId);
    const sv = surveyItems.find((s) => s.id === result.surveyId);
    const svQ = getSurveyQuestions(sv);
    const withNames = {
      ...result,
      employeeName: emp
        ? `${emp.firstName} ${emp.lastName}`
        : `ID: ${result.employeeId}`,
      surveyName:
        lang === "ru"
          ? sv?.titleRu || sv?.title || "—"
          : sv?.titleTj || sv?.title || "—",
      questions: svQ,
      totalQuestions: svQ.length,
    };
    const i = all.findIndex(
      (r) =>
        String(r.surveyId) === String(result.surveyId) &&
        String(r.employeeId) === String(result.employeeId)
    );
    if (i !== -1) all[i] = { ...all[i], ...withNames };
    else all.push(withNames);
    localStorage.setItem("survey_results", JSON.stringify(all));
    message.success("Результат сохранён");
  };

  const loading = testsLoading || surveyQuestionsLoading;

  if (loading && surveyItems.length === 0 && !dataLoaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 50, alignItems: "center", height: "60vh" }}>
        <Spin size="large" tip="Загрузка..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto", background: "#f0f2f5", minHeight: "100vh" }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={["#ff416c", "#ff4b2b", "#ff6b4a", "#ff8c6b"]}
        />
      )}

      <Flex justify="space-between" align="center" style={{ marginBottom: 24, padding: "0 8px" }} wrap="wrap" gap={12}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#f00", fontWeight: 400 }}>
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {surveyItems.length} {surveyItems.length === 1 ? "опрос" : "опросов"}
            • Вопросов: {surveyQuestions.length}
          </Text>
        </div>
        <Space wrap>
          <Button
            type={lang === "ru" ? "primary" : "default"}
            onClick={() => { setLang("ru"); localStorage.setItem("survey_manager_lang", "ru"); }}
            style={lang === "ru" ? { background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 } : { borderRadius: 20 }}
          >
            RU
          </Button>
          <Button
            type={lang === "tj" ? "primary" : "default"}
            onClick={() => { setLang("tj"); localStorage.setItem("survey_manager_lang", "tj"); }}
            style={lang === "tj" ? { background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 } : { borderRadius: 20 }}
          >
            TJ
          </Button>

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={() => setStartOpen(true)}
            style={{ background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 }}
          >
            {t[lang].startSurvey}
          </Button>

          {isAdmin && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="primary"
                onClick={openCreate}
                icon={<RocketOutlined />}
                style={{
                  background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                  border: "none", borderRadius: 20, height: 40, padding: "0 24px",
                  fontWeight: "bold", boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
                }}
              >
                {t[lang].addSurvey}
              </Button>
            </motion.div>
          )}
        </Space>
      </Flex>

      <AnimatePresence>
        {!surveyItems || surveyItems.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card style={{ textAlign: "center", padding: 60, borderRadius: 20 }}>
              <FileTextOutlined style={{ fontSize: 64, color: "#ff4b2b", marginBottom: 20 }} />
              <Title level={4}>{t[lang].noSurveys}</Title>
              {isAdmin && (
                <Button type="primary" onClick={openCreate} icon={<RocketOutlined />}
                  style={{ borderRadius: 20, background: "#ff4b2b" }}>
                  {t[lang].createFirst}
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Row gutter={[24, 24]}>
              {paginatedSurveys.map((sv, index) => {
                const isHovered = hoveredCard === sv.id;
                const isNew = newSurveyId === sv.id;
                const questionCount = sv.questions?.length || 0;
                const hasDescription = lang === "ru"
                  ? sv.descriptionRu || sv.description
                  : sv.descriptionTj || sv.description;

                return (
                  <Col xs={24} md={12} lg={8} key={sv.id}>
                    <motion.div
                      id={`survey-${sv.id}`}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{
                        opacity: 1, scale: 1, y: 0,
                        boxShadow: isNew ? "0 0 0 3px #ff4b2b, 0 0 0 6px rgba(255, 75, 43, 0.3)" : "none",
                      }}
                      transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ y: -8 }}
                    >
                      {isNew && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          style={{ position: "absolute", top: -10, right: -10, zIndex: 10 }}
                        >
                          <Tag color="red" style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>
                            NEW! 🎉
                          </Tag>
                        </motion.div>
                      )}

                      <Card
                        onClick={() => { if (isAdmin) openPreview(sv); }}
                        onMouseEnter={() => setHoveredCard(sv.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          borderRadius: 20, border: "none", overflow: "hidden",
                          cursor: isAdmin ? "pointer" : "default",
                          boxShadow: isHovered
                            ? "0 16px 40px rgba(255, 75, 43, 0.18)"
                            : "0 6px 20px rgba(0, 0, 0, 0.08)",
                          transition: "all 0.3s ease", position: "relative", background: "#fff",
                        }}
                        styles={{ body: { padding: 0 } }}
                      >
                        <div
                          style={{
                            background: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
                            padding: "22px 24px", color: "#fff",
                            position: "relative", overflow: "hidden",
                          }}
                        >
                          <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, borderRadius: "50%", background: "rgba(255, 255, 255, 0.12)" }} />
                          <div style={{ position: "absolute", bottom: -60, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)" }} />

                          <Flex align="flex-start" gap={14} style={{ position: "relative", zIndex: 1 }}>
                            <div
                              style={{
                                background: "rgba(255, 255, 255, 0.25)", borderRadius: 14,
                                width: 52, height: 52, display: "flex", alignItems: "center",
                                justifyContent: "center", flexShrink: 0, fontSize: 24,
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                backdropFilter: "blur(6px)",
                              }}
                            >
                              <FileTextOutlined />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text strong style={{
                                color: "#fff", fontSize: 16, display: "block",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                              }}>
                                {lang === "ru"
                                  ? sv.titleRu || sv.title || "Без названия"
                                  : sv.titleTj || sv.title || "Безунвон"}
                              </Text>

                              <div style={{ marginTop: 10 }}>
                                <Tag icon={<ClockCircleOutlined />} style={{
                                  background: "rgba(255, 255, 255, 0.25)", color: "#fff",
                                  border: "1px solid rgba(255, 255, 255, 0.35)", borderRadius: 20,
                                  padding: "3px 12px", fontSize: 12, fontWeight: 500,
                                  backdropFilter: "blur(6px)",
                                }}>
                                  {questionCount} {t[lang].questionCount}
                                </Tag>
                              </div>
                            </div>
                          </Flex>
                        </div>

                        {hasDescription && (
                          <div style={{ padding: "16px 22px 14px", background: "#fff", minHeight: 60 }}>
                            <Text type="secondary" style={{
                              fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.55,
                            }}>
                              {hasDescription}
                            </Text>
                          </div>
                        )}

                        {isAdmin && (
                          <div style={{ padding: "14px 22px", background: "#fafbff", borderTop: "1px solid #f0f2f5" }}>
                            <Flex justify="end">
                              <Space>
                                <Button
                                  icon={<EditOutlined />}
                                  onClick={(e) => { e.stopPropagation(); openEdit(sv); }}
                                  style={{ borderRadius: 8, borderColor: "#ff4b2b", color: "#ff4b2b", fontWeight: 500 }}
                                >
                                  {t[lang].edit}
                                </Button>
                                <Popconfirm
                                  title={t[lang].deleteConfirm}
                                  onConfirm={async (e) => { e?.stopPropagation(); await handleDelete(sv.id); }}
                                  okText="Да" cancelText="Нет"
                                >
                                  <Button danger icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ borderRadius: 8, fontWeight: 500 }}>
                                    {t[lang].delete}
                                  </Button>
                                </Popconfirm>
                              </Space>
                            </Flex>
                          </div>
                        )}

                        <div style={{ height: 3, background: "linear-gradient(90deg, #ff416c 0%, #ff4b2b 50%, #ff8c6b 100%)" }} />
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {surveyItems.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <Pagination
            current={currentPage} pageSize={pageSize} total={totalCount}
            onChange={(page, size) => {
              if (size !== pageSize) { setPageSize(size); setCurrentPage(1); }
              else setCurrentPage(page);
            }}
          />
        </div>
      )}

      {/* МОДАЛКА СТАРТА */}
      <Modal
        open={startOpen} onCancel={() => setStartOpen(false)} centered width={650}
        footer={null} styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", padding: "24px 30px", color: "#fff" }}>
            <Flex align="center" gap={12}>
              <div style={{
                background: "rgba(255,255,255,0.2)", borderRadius: "50%",
                width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PlayCircleOutlined style={{ fontSize: 24 }} />
              </div>
              <div>
                <Title level={3} style={{ color: "#fff", margin: 0 }}>{t[lang].startSurvey}</Title>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  Выберите опрос, длительность и сотрудника
                </Text>
              </div>
            </Flex>
          </div>

          <div style={{ padding: "24px 30px 30px", background: "#fff", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <Text strong>{t[lang].selectSurvey}:</Text>
              <Select
                value={selSurveyId} onChange={setSelSurveyId} showSearch size="large"
                style={{ width: "100%", marginTop: 8 }} placeholder={t[lang].selectSurvey}
                optionFilterProp="children"
              >
                {surveyItems.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {lang === "ru" ? s.titleRu || s.title : s.titleTj || s.title}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Text strong>{t[lang].selectDuration}:</Text>
              <Input
                type="number" min={1} max={480} value={selDuration}
                onChange={(e) => setSelDuration(Math.max(1, Math.min(480, parseInt(e.target.value) || 5)))}
                prefix={<HourglassOutlined />} suffix={t[lang].minutesShort}
                size="large" style={{ marginTop: 8, borderRadius: 10 }}
              />
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t[lang].presetTimes}</Text>
                {[5, 10, 15, 20, 30, 45, 60, 90].map((m) => (
                  <Button
                    key={m} size="small"
                    type={selDuration === m ? "primary" : "default"}
                    onClick={() => setSelDuration(m)}
                    style={{
                      borderRadius: 20,
                      ...(selDuration === m ? { background: "#ff4b2b", borderColor: "#ff4b2b" } : {}),
                    }}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <Alert message="Информация" description={`На прохождение опроса даётся ${selDuration} минут.`}
              type="info" showIcon icon={<HourglassOutlined />} style={{ borderRadius: 12 }} />

            <div>
              <Text strong>{t[lang].selectEmployee}:</Text>
              <Select
                value={selEmpId} onChange={setSelEmpId} showSearch size="large"
                style={{ width: "100%", marginTop: 8 }} placeholder={t[lang].selectEmployee}
                optionFilterProp="children"
              >
                {Object.entries(groupedEmployees).map(([dep, list]) => (
                  <Select.OptGroup key={dep} label={`Отдел: ${dep}`}>
                    {list.map((e) => (
                      <Option key={e.id} value={e.id}>
                        <UserOutlined /> {e.firstName} {e.lastName}
                        {e.subDepartmentId && (
                          <Tag color="green" style={{ marginLeft: 6 }}>
                            <ApartmentOutlined /> {getSubDepartmentName(e.subDepartmentId)}
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
                  <Text strong>{getSubDepartmentName(selSubDeptId)}</Text>
                  <Tag color="green"><CheckCircleOutlined /></Tag>
                </Space>
              </Card>
            )}

            <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
              <Button onClick={() => setStartOpen(false)} style={{ borderRadius: 10 }}>
                {t[lang].close}
              </Button>
              <Button
                type="primary" onClick={handleStartSurvey}
                disabled={!selSurveyId || !selEmpId}
                icon={<PlayCircleOutlined />}
                style={{
                  background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                  border: "none", borderRadius: 10, fontWeight: "bold",
                }}
              >
                {t[lang].startSurvey} ({selDuration} {t[lang].minutesShort})
              </Button>
            </Flex>
          </div>
        </div>
      </Modal>

      {/* ПРОХОЖДЕНИЕ */}
      <Modal
        open={takingOpen} footer={null} width={700} centered
        title={<Space><FormOutlined style={{ color: "#ff4b2b" }} />{takingSurvey?.titleRu || takingSurvey?.titleTj || "Опрос"}</Space>}
        onCancel={() => { setTakingOpen(false); setTakingSurvey(null); setTakingEmpId(null); }}
        styles={{ body: { maxHeight: "80vh", overflow: "auto" } }}
      >
        {takingSurvey && (
          <SurveyTaking
            survey={takingSurvey}
            questions={getSurveyQuestions(takingSurvey)}
            onComplete={handleComplete}
            onClose={() => { setTakingOpen(false); setTakingSurvey(null); setTakingEmpId(null); }}
            employeeId={takingEmpId}
            lang={lang}
            durationMinutes={takingSurvey.durationMinutes || 5}
          />
        )}
      </Modal>

      {/* СОЗДАНИЕ / РЕДАКТИРОВАНИЕ */}
      <Modal
        open={open}
        onCancel={() => { setOpen(false); resetForm(); }}
        footer={null} width={1100} centered
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", padding: "24px 30px", color: "#fff" }}>
            <Flex align="center" gap={12}>
              <div style={{
                background: "rgba(255,255,255,0.2)", borderRadius: "50%",
                width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {editingItem ? <EditOutlined style={{ fontSize: 24 }} /> : <RocketOutlined style={{ fontSize: 24 }} />}
              </div>
              <div>
                <Title level={3} style={{ color: "#fff", margin: 0 }}>
                  {editingItem ? t[lang].edit : t[lang].addSurvey}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  {editingItem ? "Измените параметры опроса" : "Заполните информацию о новом опросе"}
                </Text>
              </div>
            </Flex>
          </div>

          <div style={{ padding: "24px 30px 0 30px", background: "#fff" }}>
            <Steps
              current={step}
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
              {step === 0 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <Alert message={t[lang].info} description="Введите информацию об опросе."
                    type="info" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
                  <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                      {t[lang].surveyTitle} <span style={{ color: "#ff4b2b" }}>*</span>
                    </Text>
                    <Input
                      value={lang === "ru" ? titleRu : titleTj}
                      onChange={(e) => lang === "ru" ? setTitleRu(e.target.value) : setTitleTj(e.target.value)}
                      size="large" style={{ borderRadius: 12 }} placeholder="Введите название опроса"
                    />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                      {t[lang].description}
                    </Text>
                    <TextArea
                      value={lang === "ru" ? descRu : descTj}
                      onChange={(e) => lang === "ru" ? setDescRu(e.target.value) : setDescTj(e.target.value)}
                      rows={4} size="large" style={{ borderRadius: 12 }} placeholder="Введите описание"
                    />
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <Alert
                    message={t[lang].info}
                    description={
                      <div>
                        <Text>Выберите вопросы для опроса (Ручной + Рейтинг).</Text>
                        <div style={{ marginTop: 6 }}>
                          <Tag color="blue">Доступно: {availableQuestions.length}</Tag>
                          <Tag color="green" style={{ marginLeft: 8 }}>Всего опросных: {surveyQuestions.length}</Tag>
                          {selectedQIds.length > 0 && (
                            <Tag color="red" style={{ marginLeft: 8 }}>Выбрано: {selectedQIds.length}</Tag>
                          )}
                        </div>
                      </div>
                    }
                    type="info" showIcon style={{ marginBottom: 24, borderRadius: 12 }}
                  />

                  <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane tab={<span><FormOutlined /> {t[lang].selectQuestionsTab}</span>} key="select">
                      <div style={{ background: "#f8f9fa", padding: "16px 20px", borderRadius: 12, marginBottom: 20 }}>
                        <Flex justify="space-between" wrap="wrap" gap={12}>
                          <Space>
                            <Button icon={<PlusOutlined />} onClick={selectAll}
                              disabled={filteredAvailableQuestions.length === 0}
                              type="primary" ghost style={{ borderRadius: 20 }}>
                              {t[lang].selectAll}
                            </Button>
                            <Button icon={<MinusOutlined />} onClick={() => setSelectedQIds([])}
                              disabled={selectedQIds.length === 0} danger ghost style={{ borderRadius: 20 }}>
                              {t[lang].clearAll}
                            </Button>
                          </Space>
                          <Space>
                            <Input
                              placeholder={t[lang].searchPlaceholder} value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              prefix={<SearchOutlined />} allowClear style={{ width: 220, borderRadius: 20 }}
                            />
                            <Select value={filterType} onChange={setFilterType} style={{ width: 140 }} suffixIcon={<FilterOutlined />}>
                              <Option value="all">{t[lang].allTypes}</Option>
                              <Option value="2">✏️ {t[lang].manual}</Option>
                              <Option value="3">⭐ {t[lang].rating}</Option>
                            </Select>
                            {(searchTerm || filterType !== "all") && (
                              <Button icon={<ClearOutlined />}
                                onClick={() => { setSearchTerm(""); setFilterType("all"); }}
                                style={{ borderRadius: 20 }}>
                                {t[lang].clearFilters}
                              </Button>
                            )}
                          </Space>
                        </Flex>
                      </div>

                      {filteredAvailableQuestions.length === 0 ? (
                        <Empty
                          description={
                            searchTerm || filterType !== "all"
                              ? t[lang].noQuestionsFound
                              : surveyQuestions.length === 0
                              ? t[lang].createQuestionFirst
                              : t[lang].noAvailableQuestions
                          }
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          style={{ padding: 40 }}
                        >
                          {surveyQuestions.length === 0 && (
                            <Button type="primary" onClick={() => setActiveTab("create")}
                              style={{ borderRadius: 20, background: "#ff4b2b" }}>
                              {t[lang].createQuestionTab}
                            </Button>
                          )}
                        </Empty>
                      ) : (
                        <div style={{ maxHeight: 420, overflow: "auto", padding: "4px" }}>
                          <Row gutter={[12, 12]}>
                            {filteredAvailableQuestions.map((q) => {
                              const sel = selectedQIds.includes(q.id);
                              const tInfo = getTypeLabel(q.type);
                              const nType = getNumericType(q.type);
                              return (
                                <Col xs={24} key={q.id}>
                                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                                    <Card
                                      onClick={() => toggleQ(q.id)}
                                      style={{
                                        cursor: "pointer", borderRadius: 16,
                                        border: sel ? "2px solid #ff4b2b" : "1px solid #e8e8e8",
                                        background: sel ? "linear-gradient(135deg, #fff5f5, #ffffff)" : "#fff",
                                        boxShadow: sel ? "0 4px 12px rgba(255, 75, 43, 0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                                        transition: "all 0.2s",
                                      }}
                                      styles={{ body: { padding: "14px 18px" } }}
                                    >
                                      <Flex align="flex-start" gap={14}>
                                        <Checkbox checked={sel} onChange={() => toggleQ(q.id)} style={{ flexShrink: 0, marginTop: 4 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <Text style={{ fontSize: 15, display: "block", fontWeight: sel ? 500 : 400 }}>
                                            {getQuestionText(q)}
                                          </Text>
                                          <Flex gap={8} style={{ marginTop: 8 }} wrap="wrap">
                                            <Tag color={tInfo.color} icon={tInfo.icon} style={{ borderRadius: 20, border: "none" }}>
                                              {tInfo.label}
                                            </Tag>
                                            <Text type="secondary" style={{ fontSize: 11, alignSelf: "center" }}>
                                              ID: {q.id}
                                            </Text>
                                            {nType === 2 && q.options?.length > 0 && (
                                              <Text style={{ fontSize: 11, color: "#52c41a", alignSelf: "center" }}>
                                                ✓ {getOptTextSafe(q.options[0], lang)}
                                              </Text>
                                            )}
                                          </Flex>
                                        </div>

                                        <Flex vertical align="center" gap={6} style={{ flexShrink: 0, marginTop: 4 }}>
                                          {sel && (
                                            <div style={{
                                              background: "#ff4b2b", color: "white", borderRadius: "50%",
                                              width: 28, height: 28, display: "flex", alignItems: "center",
                                              justifyContent: "center", boxShadow: "0 2px 8px rgba(255, 75, 43, 0.3)",
                                            }}>
                                              <CheckCircleOutlined />
                                            </div>
                                          )}
                                          {sel && (
                                            <Popconfirm
                                              title="Убрать из опроса?" description="Вопрос останется в базе данных"
                                              onConfirm={(e) => { e?.stopPropagation(); toggleQ(q.id); }}
                                              onCancel={(e) => e?.stopPropagation()}
                                              okText="Да" cancelText="Нет"
                                            >
                                              <Button type="text" size="small" icon={<MinusOutlined />}
                                                title="Убрать из опроса" onClick={(e) => e.stopPropagation()}
                                                style={{ color: "#faad14" }} />
                                            </Popconfirm>
                                          )}
                                          <Popconfirm
                                            title="Удалить вопрос навсегда?"
                                            description="Вопрос исчезнет из базы данных. Действие нельзя отменить!"
                                            onConfirm={(e) => { e?.stopPropagation(); handleDeleteQuestion(q.id); }}
                                            onCancel={(e) => e?.stopPropagation()}
                                            okText="Да, удалить" cancelText="Отмена"
                                            okButtonProps={{ danger: true }}
                                          >
                                            <Button type="text" danger size="small" icon={<DeleteOutlined />}
                                              title="Удалить вопрос навсегда" onClick={(e) => e.stopPropagation()} />
                                          </Popconfirm>
                                        </Flex>
                                      </Flex>
                                    </Card>
                                  </motion.div>
                                </Col>
                              );
                            })}
                          </Row>
                        </div>
                      )}

                      {selectedQIds.length > 0 && (
                        <div style={{
                          marginTop: 20, padding: "10px 16px", background: "#fff5f5",
                          borderRadius: 10, border: "1px solid #ffd6d6", textAlign: "center",
                        }}>
                          <Text strong style={{ fontSize: 14, color: "#ff4b2b" }}>
                            <TrophyOutlined style={{ marginRight: 8 }} />
                            {t[lang].selected}: {selectedQIds.length} {t[lang].questionsSelected}
                          </Text>
                        </div>
                      )}
                    </TabPane>

                    <TabPane tab={<span><PlusOutlined /> {t[lang].createQuestionTab}</span>} key="create">
                      <QuestionCreator
                        onQuestionCreated={handleQuestionCreated}
                        lang={lang}
                        t={{
                          question: t[lang].question, answer: t[lang].answer,
                          correct: t[lang].correct, variant: t[lang].variant,
                          add: t[lang].add, test: t[lang].test,
                          manual: t[lang].manual, rating: t[lang].rating,
                          correctAnswer: t[lang].correctAnswer, selectRating: t[lang].selectRating,
                        }}
                      />
                    </TabPane>
                  </Tabs>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <Alert message={t[lang].success} description={t[lang].surveyReady}
                    type="success" showIcon style={{ marginBottom: 24, borderRadius: 12 }} />
                  <Card style={{ background: "#fff5f5", borderColor: "#ffd6d6", marginBottom: 16 }}>
                    <Space>
                      <Avatar style={{ background: "#ff4b2b" }}><FileTextOutlined /></Avatar>
                      <div>
                        <Text strong>{lang === "ru" ? titleRu : titleTj}</Text>
                        <div>
                          <Tag color="blue">{selectedQIds.length} {t[lang].totalQuestions}</Tag>
                        </div>
                      </div>
                    </Space>
                  </Card>
                  {selectedQuestions.length > 0 && (
                    <div style={{ maxHeight: 260, overflow: "auto" }}>
                      {selectedQuestions.map((q, idx) => (
                        <Flex
                          key={q.id} align="center" gap={10} onClick={() => toggleQ(q.id)}
                          style={{
                            padding: "8px 12px", marginBottom: 6, background: "#fafafa",
                            borderRadius: 8, border: "1px solid #f0f0f0", cursor: "pointer",
                          }}
                        >
                          <Checkbox checked onChange={() => toggleQ(q.id)} />
                          <Badge count={idx + 1} style={{ backgroundColor: "#ff4b2b" }} />
                          <Text style={{ fontSize: 13, flex: 1 }}>{getQuestionText(q)}</Text>
                        </Flex>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Flex justify="space-between" style={{ marginTop: 30, paddingTop: 20 }}>
              <Button onClick={() => setOpen(false)} style={{ borderRadius: 10 }}>{t[lang].cancel}</Button>
              <Space>
                {step > 0 && (
                  <Button onClick={() => setStep(step - 1)} style={{ borderRadius: 10 }}>{t[lang].back}</Button>
                )}
                {step < 2 ? (
                  <Button type="primary" onClick={handleNext} icon={<ArrowRightOutlined />}
                    style={{ background: "#ff4b2b", borderRadius: 10 }}>
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleSave} loading={saving} icon={<RocketOutlined />}
                    style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", borderRadius: 10, fontWeight: "bold" }}>
                    {saving ? "Сохранение..." : editingItem ? t[lang].save : t[lang].addSurvey}
                  </Button>
                )}
              </Space>
            </Flex>
          </div>
        </div>
      </Modal>

      {/* ПРЕДПРОСМОТР */}
      <Modal
        open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)} width={1200}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {lang === "ru"
                ? selectedSurvey?.titleRu || selectedSurvey?.title
                : selectedSurvey?.titleTj || selectedSurvey?.title}
            </span>
            <Tag color="blue" style={{ borderRadius: 20, padding: "4px 12px" }}>
              <ClockCircleOutlined /> {selectedSurvey?.questions?.length || 0} {t[lang].questionCount}
            </Tag>
          </div>
        }
      >
        {selectedSurvey && (selectedSurvey.descriptionRu || selectedSurvey.description) && (
          <div style={{
            marginBottom: 20, padding: "12px 16px", background: "#f8f9fa",
            borderRadius: 8, borderLeft: "4px solid #ff4b2b",
          }}>
            <Text>
              {lang === "ru"
                ? selectedSurvey.descriptionRu || selectedSurvey.description
                : selectedSurvey.descriptionTj || selectedSurvey.description}
            </Text>
          </div>
        )}

        <Table
          dataSource={getSurveyQuestions(selectedSurvey)}
          rowKey={(r) => r.id}
          columns={[
            {
              title: "№", width: 60,
              render: (_, __, i) => <Badge count={i + 1} style={{ backgroundColor: "#ff4b2b" }} />,
            },
            {
              title: "Вопрос", key: "q",
              render: (_, r) => {
                const nType = getNumericType(r.type);
                const tInfo = getTypeLabel(r.type);
                return (
                  <div>
                    <Text style={{ fontSize: 15 }}>{getQuestionText(r)}</Text>
                    <div style={{ marginTop: 6 }}>
                      <Tag color={tInfo.color} icon={tInfo.icon}>{tInfo.label}</Tag>
                    </div>
                    {nType === 1 && r.options?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {r.options.map((o, oi) => (
                          <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: "50%",
                              background: o.isCorrect ? "#52c41a" : "#f0f0f0",
                              color: o.isCorrect ? "#fff" : "#666",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: "bold",
                            }}>
                              {["A", "B", "C", "D", "E", "F"][oi]}
                            </span>
                            <Text style={{ color: o.isCorrect ? "#52c41a" : "#333" }}>
                              {getOptTextSafe(o, lang)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                    {nType === 2 && (
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: "block" }}>
                        ✏️ Ручной ответ
                        {r.options?.[0] && ` — эталон: ${getOptTextSafe(r.options[0], lang)}`}
                      </Text>
                    )}
                    {nType === 3 && (
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: "block" }}>
                        ⭐ Рейтинг 1-10
                      </Text>
                    )}
                  </div>
                );
              },
            },
          ]}
          pagination={false}
          locale={{ emptyText: t[lang].noQuestionsInSurvey }}
        />
      </Modal>
    </div>
  );
};

export default SurveyManager;