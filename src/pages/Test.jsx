import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
import { useEmployeeStore } from "../store/useEmployee";
import { useTestAssignmentStore } from "../store/useTestAssignment";
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
  Pagination,
  Checkbox,
  Badge,
  Select,
  Radio,
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
  BookOutlined,
  ApartmentOutlined,
  PlayCircleOutlined,
  HourglassOutlined,
  StopOutlined,
  FormOutlined,
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
    if (l.startsWith("open") || l.startsWith("man")) return 2;
    if (l.startsWith("rat")) return 3;
  }
  return 1;
};

const getApiTypeString = (nType) => {
  if (nType === 2) return 2;
  if (nType === 3) return 3;
  return 1;
};

const isSurvey = (t) => {
  if (!t) return false;
  const v = t.testType ?? t.test_type ?? t.categoryType;
  if (v === undefined || v === null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  if (s === "quiz" || s === "survey" || s === "опрос" || s === "questionnaire")
    return true;
  const n = Number(s);
  if (!Number.isNaN(n) && n >= 2) return true;
  return false;
};

const extractItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (item && typeof item === "object" && Array.isArray(item.$values)) {
        return item.$values;
      }
      return item;
    });
  }
  const tryKeys = [
    "data",
    "items",
    "results",
    "$values",
    "Data",
    "Items",
    "Results",
  ];
  for (const key of tryKeys) {
    if (raw[key] !== undefined) {
      const result = extractItems(raw[key]);
      if (result.length > 0) return result;
    }
  }
  return [];
};

const normalizeQuestion = (q) => {
  if (!q) return q;
  const content = (q.content || q.contentRu || q.contentTj || "").trim();
  const rawOptions = Array.isArray(q.options)
    ? q.options
    : Array.isArray(q.$values)
      ? q.$values
      : Array.isArray(q.Options)
        ? q.Options
        : [];
  return {
    ...q,
    content,
    contentRu: q.contentRu || content,
    contentTj: q.contentTj || content,
    type: getNumericType(q.type ?? q.Type),
    optionId: q.optionId ?? q.OptionId,
    options: rawOptions.map((o) => ({
      ...o,
      id: o.id ?? o.Id,
      text: o.text || o.textRu || o.textTj || "",
      textRu: o.textRu || o.text || o.textTj || "",
      textTj: o.textTj || o.text || o.textRu || "",
      isCorrect: !!(o.isCorrect ?? o.IsCorrect),
    })),
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

const readRoles = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("roles") || "[]");
    if (Array.isArray(raw)) return raw.map((r) => String(r).toLowerCase());
    if (typeof raw === "string") return [raw.toLowerCase()];
    return [];
  } catch {
    return [];
  }
};

const isAdminOrSuper = (roles) =>
  roles.includes("admin") ||
  roles.includes("superadmin") ||
  roles.includes("super_admin") ||
  roles.includes("super-admin");

// ============================================================
// ⭐ НАДЁЖНАЯ ЗАГРУЗКА ВОПРОСОВ
// ============================================================
const loadAllQuestionsFromApi = async (language = "Ru") => {
  const tryFetch = async (params) => {
    try {
      const r = await axios.get(`${API_BASE}/Question`, { params });
      return extractItems(r.data);
    } catch (e) {
      console.warn("Fetch questions failed:", params, e?.message);
      return [];
    }
  };

  let items = await tryFetch({ PageNumber: 1, PageSize: 2000, language });
  if (items.length === 0) {
    items = await tryFetch({ PageNumber: 1, PageSize: 2000 });
  }
  if (items.length === 0) {
    const [mc, open, rating] = await Promise.all([
      tryFetch({ PageNumber: 1, PageSize: 1000, Type: 1 }),
      tryFetch({ PageNumber: 1, PageSize: 1000, Type: 2 }),
      tryFetch({ PageNumber: 1, PageSize: 1000, Type: 3 }),
    ]);
    items = [...mc, ...open, ...rating];
  }
  if (items.length === 0) {
    const [mc, open, rating] = await Promise.all([
      tryFetch({ PageNumber: 1, PageSize: 1000, Type: "MultipleChoice" }),
      tryFetch({ PageNumber: 1, PageSize: 1000, Type: "OpenEnded" }),
      tryFetch({ PageNumber: 1, PageSize: 1000, Type: "Rating" }),
    ]);
    items = [...mc, ...open, ...rating];
  }

  const seen = new Set();
  const unique = [];
  for (const q of items) {
    const id = q?.id ?? q?.questionId ?? q?.Id ?? q?.QuestionId;
    if (id != null && !seen.has(id)) {
      seen.add(id);
      unique.push(q);
    } else if (id == null) {
      unique.push(q);
    }
  }

  const result = unique.map(normalizeQuestion);
  console.log("✅ Loaded questions:", result.length);
  return result;
};

// ============================================================
// RatingSelector
// ============================================================
const RatingSelector = ({ value, onChange, label, disabled = false }) => {
  const ratingOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div>
      {label && (
        <Text strong style={{ display: "block", marginBottom: 12 }}>
          <StarOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />
          {label}
        </Text>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {ratingOptions.map((num) => {
          const active = value === num;
          return (
            <motion.div
              key={num}
              whileHover={!disabled ? { scale: 1.12 } : {}}
              whileTap={!disabled ? { scale: 0.9 } : {}}
            >
              <div
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
                  position: "relative",
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// QuestionCreator
// ============================================================
const QuestionCreator = ({ onQuestionCreated, lang, t }) => {
  const { addQuestion } = useQuestionStore();
  const [content, setContent] = useState("");
  const [type, setType] = useState(1);
  const [options, setOptions] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(null);
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
  const deleteOption = (i) => {
    setOptions(options.filter((_, idx) => idx !== i));
    if (correctIndex === i) setCorrectIndex(null);
    else if (correctIndex !== null && correctIndex > i)
      setCorrectIndex(correctIndex - 1);
  };

  const handleSaveQuestion = async () => {
    if (!content.trim()) return message.warning("Введите текст вопроса");

    const apiType = getApiTypeString(type);
    let payload;

    if (type === 1) {
      if (!options.length) return message.warning("Добавьте варианты");
      if (options.some((o) => !o.text.trim()))
        return message.warning("Заполните все варианты");
      if (correctIndex === null)
        return message.warning("Выберите правильный вариант");
      payload = {
        contentRu: content,
        contentTj: content,
        type: apiType,
        options: options.map((o, i) => ({
          textRu: o.text,
          textTj: o.text,
          isCorrect: i === correctIndex,
        })),
      };
    } else if (type === 2) {
      payload = {
        contentRu: content,
        contentTj: content,
        type: apiType,
        options: manualAnswer
          ? [{ textRu: manualAnswer, textTj: manualAnswer, isCorrect: true }]
          : [],
      };
    } else {
      if (!ratingAnswer) return message.warning("Выберите рейтинг");
      payload = {
        contentRu: content,
        contentTj: content,
        type: apiType,
        optionId: ratingAnswer,
        options: [],
      };
    }

    setCreating(true);
    try {
      const response = await addQuestion(payload);
      message.success("Вопрос создан! 🎉");
      setContent("");
      setOptions([]);
      setCorrectIndex(null);
      setManualAnswer("");
      setRatingAnswer(null);
      setType(1);
      if (onQuestionCreated && response) onQuestionCreated(response);
    } catch (err) {
      console.error("❌ Error:", err);
      console.error("❌ Payload:", payload);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Ошибка при создании",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <Alert
        message="Создание нового вопроса"
        description="Заполните поля и сохраните вопрос."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 12 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text
          strong
          style={{ fontSize: 15, display: "block", marginBottom: 8 }}
        >
          {t.question}:
        </Text>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          size="large"
          style={{ borderRadius: 10 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text
          strong
          style={{ fontSize: 15, display: "block", marginBottom: 8 }}
        >
          Тип вопроса:
        </Text>
        <Radio.Group
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setOptions([]);
            setCorrectIndex(null);
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
                      <Radio
                        checked={correctIndex === i}
                        onChange={() => setCorrectIndex(i)}
                      >
                        {t.correct} ({letters[i]})
                      </Radio>
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
        icon={<SaveOutlined />}
        style={{
          marginTop: 16,
          width: "100%",
          height: 44,
          borderRadius: 10,
          background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
          border: "none",
        }}
      >
        {creating ? "Сохранение..." : "Создать вопрос"}
      </Button>
    </div>
  );
};

// ============================================================
// TestManager
// ============================================================
export const TestManager = ({ onStartTest }) => {
  const {
    tests = [],
    loading: testsLoading,
    fetchTests,
    addTest,
    editTest,
    removeTest,
  } = useTestStore();
  const { removeQuestion } = useQuestionStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { testAssignments = [], fetchTestAssignments } =
    useTestAssignmentStore();
  const { subdepartments = [], fetchSubDepartments } = useSubDepartmentStore();

  const [lang, setLang] = useState(
    () => localStorage.getItem("language") || "ru",
  );

  useEffect(() => {
    const handler = (e) => {
      const newLang =
        (e?.type === "languagechange" ? e.detail : e?.newValue) ||
        localStorage.getItem("language") ||
        "ru";
      setLang(newLang);
    };
    window.addEventListener("languagechange", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("languagechange", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const [allQuestions, setAllQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
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
  const [pageSize, setPageSize] = useState(9);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedSubDepartmentId, setSelectedSubDepartmentId] = useState(null);
  const [selectedTestDuration, setSelectedTestDuration] = useState(5);
  const [existingSession] = useState(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const roles = useMemo(() => readRoles(), []);
  const isAdmin = useMemo(() => isAdminOrSuper(roles), [roles]);

  const testTests = useMemo(
    () => (tests || []).filter((t) => !isSurvey(t) && t.testType !== 0),
    [tests],
  );

  const totalCount = testTests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTests = testTests.slice(startIndex, startIndex + pageSize);

  const getQuestionText = useCallback((q) => getQTextSafe(q, lang), [lang]);

  const getCorrectAnswerText = useCallback(
    (question) => {
      if (!question) return "—";
      const qType = getNumericType(question.type);
      if (qType === 2) {
        if (question.options?.length > 0) {
          const t = getOptTextSafe(question.options[0], lang);
          return t !== "—" ? t : "Развёрнутый ответ";
        }
        return "Развёрнутый ответ";
      }
      if (qType === 1) {
        const correctOption = question.options?.find(
          (o) => o.isCorrect === true,
        );
        if (correctOption) return getOptTextSafe(correctOption, lang);
        return "—";
      }
      if (qType === 3) {
        return question.optionId
          ? `Рейтинг: ${question.optionId}/10`
          : "Рейтинг 1-10";
      }
      return "—";
    },
    [lang],
  );

  const getTypeLabel = useCallback((type) => {
    const n = getNumericType(type);
    if (n === 1)
      return {
        label: "Тест",
        color: "#52c41a",
        icon: <CheckCircleOutlined />,
      };
    if (n === 2)
      return {
        label: "Открытый",
        color: "#722ed1",
        icon: <FormOutlined />,
      };
    if (n === 3)
      return {
        label: "Рейтинг",
        color: "#faad14",
        icon: <StarOutlined />,
      };
    return { label: "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
  }, []);

  const getUsedQuestionIds = useCallback(
    (excludeTestId = null) => {
      const usedIds = new Set();
      testTests.forEach((test) => {
        if (excludeTestId && Number(test.id) === Number(excludeTestId)) return;
        if (test.questions?.length > 0) {
          test.questions.forEach((q) => {
            const qId = q.id || q.questionId;
            if (qId) usedIds.add(qId);
          });
        }
      });
      return usedIds;
    },
    [testTests],
  );

  const getAvailableQuestions = useCallback(
    (excludeTestId = null) => {
      const usedIds = getUsedQuestionIds(excludeTestId);
      return allQuestions.filter((q) => {
        if (q.id == null) return false;
        if (usedIds.has(q.id)) return false;
        return true;
      });
    },
    [allQuestions, getUsedQuestionIds],
  );

  const getEmployeeSubDepartment = useCallback(
    (employeeId) => {
      const e = employees.find((x) => x.id === employeeId);
      if (e?.subDepartmentId) return e.subDepartmentId;
      const a = testAssignments.find((x) => x.employeeId === employeeId);
      if (a?.subDepartmentId) return a.subDepartmentId;
      return null;
    },
    [employees, testAssignments],
  );

  const getSubDepartmentName = useCallback(
    (id) => {
      if (!id) return "—";
      const s = subdepartments.find((x) => Number(x.id) === Number(id));
      return s?.name || `Отделение ${id}`;
    },
    [subdepartments],
  );

  const groupedEmployees = useMemo(
    () =>
      employees.reduce((g, e) => {
        const d = e.department || "Без отдела";
        if (!g[d]) g[d] = [];
        g[d].push(e);
        return g;
      }, {}),
    [employees],
  );

  const getEmployeeFullName = useCallback((emp) => {
    if (!emp) return "—";
    const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ").trim();
    return name || `ID: ${emp.id}`;
  }, []);

  const loadAllQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const list = await loadAllQuestionsFromApi("Ru");
      setAllQuestions(list);
    } catch (e) {
      console.error("loadAllQuestions error:", e);
      message.error("Ошибка загрузки вопросов");
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          fetchTests(1, 1000),
          fetchEmployee(1, 1000),
          fetchSubDepartments(),
          fetchTestAssignments(1, 1000),
          loadAllQuestions(),
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
    if (selectedEmployeeId) {
      const subId = getEmployeeSubDepartment(selectedEmployeeId);
      setSelectedSubDepartmentId(subId || null);
    } else {
      setSelectedSubDepartmentId(null);
    }
  }, [selectedEmployeeId, dataLoaded, getEmployeeSubDepartment]);

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
    [availableQuestions, searchTerm, filterType, getQuestionText],
  );

  const selectedQuestions = useMemo(
    () =>
      selectedQuestionIds
        .map((id) => allQuestions.find((q) => q.id === id))
        .filter(Boolean),
    [selectedQuestionIds, allQuestions],
  );

  const t = {
    ru: {
      title: "Управление тестами",
      addTest: "Создать тест",
      edit: "Редактировать",
      delete: "Удалить",
      save: "Сохранить",
      cancel: "Отмена",
      deleteConfirm: "Удалить тест?",
      testTitle: "Название теста",
      description: "Описание",
      noTests: "Нет созданных тестов",
      testCreated: "Тест создан",
      testUpdated: "Тест обновлён",
      questionCount: "вопросов",
      createFirst: "Создать первый тест",
      step1: "Информация",
      step2: "Вопросы",
      step3: "Проверка",
      next: "Далее",
      back: "Назад",
      totalQuestions: "Всего вопросов",
      testReady: "Тест готов к публикации",
      fillTitle: "Заполните название",
      selectQuestions: "Выберите хотя бы один вопрос",
      success: "Успешно!",
      info: "Информация",
      test: "Тест",
      manual: "Открытый",
      rating: "Рейтинг",
      selectAll: "Выбрать все",
      clearAll: "Очистить",
      selected: "Выбрано",
      questionsSelected: "вопросов",
      searchPlaceholder: "Поиск...",
      allTypes: "Все типы",
      correctAnswer: "Правильный ответ",
      question: "Вопрос",
      answer: "Ответ",
      correct: "Правильный",
      variant: "Вариант",
      add: "Добавить вариант",
      selectRating: "Выберите рейтинг",
      createQuestionTab: "Создать вопрос",
      selectQuestionsTab: "Выбор вопросов",
      startTest: "Начать тест",
      selectTest: "Выберите тест",
      selectEmployee: "Выберите сотрудника",
      close: "Закрыть",
      selectDuration: "Длительность теста",
      minutesShort: "мин",
      presetTimes: "Быстро:",
      hasUnfinished: "Есть незавершённая сессия",
      continueExisting: "Продолжить?",
      preview: "Просмотр теста",
      noQuestionsInTest: "Нет вопросов",
      clearFilters: "Сбросить",
      noQuestionsFound: "Ничего не найдено",
      noAvailableQuestions: "Нет доступных вопросов",
      createQuestionFirst: "Создайте вопросы",
      customDuration: "Своя длительность",
      noSubDepartments: "У сотрудника не указано отделение",
      creatingAssignment: "Создание назначения...",
      subDepartment: "Отделение",
      assignmentInfo: "Отделение из данных сотрудника",
    },
    tj: {
      title: "Идоракунии тестҳо",
      addTest: "Эҷоди тест",
      edit: "Тағйир",
      delete: "Хориҷ",
      save: "Сабт",
      cancel: "Бекор",
      deleteConfirm: "Тестро нест кунам?",
      testTitle: "Номи тест",
      description: "Тавсиф",
      noTests: "Тестҳо нестанд",
      testCreated: "Тест эҷод шуд",
      testUpdated: "Тест нав шуд",
      questionCount: "савол",
      createFirst: "Эҷоди тести аввал",
      step1: "Маълумот",
      step2: "Саволҳо",
      step3: "Санҷиш",
      next: "Баъдӣ",
      back: "Қаблӣ",
      totalQuestions: "Ҳамагӣ",
      testReady: "Тест омода аст",
      fillTitle: "Номро пур кунед",
      selectQuestions: "Як саволро интихоб кунед",
      success: "Бомуваффақият!",
      info: "Маълумот",
      test: "Тест",
      manual: "Кушод",
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
      selectRating: "Баҳоро интихоб кунед",
      createQuestionTab: "Эҷоди савол",
      selectQuestionsTab: "Интихоби саволҳо",
      startTest: "Оғози тест",
      selectTest: "Тестро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      close: "Пӯшидан",
      selectDuration: "Давомнокии тест",
      minutesShort: "дақ.",
      presetTimes: "Зуд:",
      hasUnfinished: "Сессияи анҷомнаёфта ҳаст",
      continueExisting: "Идома диҳем?",
      preview: "Дидани тест",
      noQuestionsInTest: "Саволҳо нестанд",
      clearFilters: "Тоза",
      noQuestionsFound: "Ёфт нашуд",
      noAvailableQuestions: "Саволҳо нестанд",
      createQuestionFirst: "Саволҳо эҷод кунед",
      customDuration: "Давомнокии худ",
      noSubDepartments: "Кормандра шуъба надорад",
      creatingAssignment: "Сохтани таъинот...",
      subDepartment: "Шуъба",
      assignmentInfo: "Шуъба аз маълумоти корманд",
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
    setCurrentPage(1);
    setOpen(true);
  };

  const openEditModal = (test) => {
    setEditingItem(test);
    setCurrentStep(0);
    setTitleRu(test.titleRu || test.title || "");
    setTitleTj(test.titleTj || test.title || "");
    setDescriptionRu(test.descriptionRu || test.description || "");
    setDescriptionTj(test.descriptionTj || test.description || "");
    const ids =
      test.questions?.map((q) => q.id || q.questionId).filter(Boolean) || [];
    setSelectedQuestionIds(ids);
    setActiveTab("select");
    setOpen(true);
  };

  const openPreview = (test) => {
    setSelectedTest(test);
    setPreviewOpen(true);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      const currentTitle = titleRu || titleTj;
      if (!currentTitle.trim()) return message.warning(t[lang].fillTitle);
    }
    if (currentStep === 1 && selectedQuestionIds.length === 0)
      return message.warning(t[lang].selectQuestions);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => setCurrentStep(currentStep - 1);

  const toggleQuestionSelection = (id) =>
    setSelectedQuestionIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const selectAllQuestions = () => {
    const ids = filteredAvailableQuestions.map((q) => q.id);
    setSelectedQuestionIds((p) => [...new Set([...p, ...ids])]);
  };

  const clearAllQuestions = () => setSelectedQuestionIds([]);

  const handleQuestionCreated = async (nq) => {
    await loadAllQuestions();
    if (nq?.id) {
      setSelectedQuestionIds((p) => (p.includes(nq.id) ? p : [...p, nq.id]));
      message.success("Вопрос добавлен в тест!");
    }
    setActiveTab("select");
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await removeQuestion(questionId);
      setSelectedQuestionIds((p) => p.filter((id) => id !== questionId));
      message.success("Вопрос удалён навсегда");
      await loadAllQuestions();
    } catch (err) {
      console.error("Delete question error:", err);
      message.error("Ошибка удаления вопроса");
    }
  };

  const handleSave = async () => {
    const currentTitle = titleRu || titleTj;
    if (!currentTitle.trim()) return message.warning(t[lang].fillTitle);
    if (selectedQuestionIds.length === 0)
      return message.warning(t[lang].selectQuestions);

    const questionsData = selectedQuestionIds.map((qid, i) => {
      const q = allQuestions.find((x) => x.id === qid);
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

      const result = {
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

      if (nType === 3) result.optionId = q?.optionId;

      return result;
    });

    const payload = {
      titleRu: titleRu || titleTj,
      titleTj: titleTj || titleRu,
      descriptionRu: descriptionRu || descriptionTj,
      descriptionTj: descriptionTj || descriptionRu,
      testType: 1,
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
        if (response?.id) setNewTestId(response.id);
      }

      setCurrentPage(1);
      await fetchTests(1, 1000);

      if (!editingItem && response?.id) {
        setTimeout(() => {
          const el = document.getElementById(`test-${response.id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setNewTestId(null), 3000);
        }, 500);
      }
      setOpen(false);
      resetForm();
      setCurrentStep(0);
    } catch (err) {
      console.error("Save error:", err);
      message.error(
        err.response?.data?.message || "Ошибка при сохранении теста",
      );
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

  const handleStartTest = async () => {
    if (!selectedTestId || !selectedEmployeeId)
      return message.warning("Выберите тест и сотрудника");
    const subId = getEmployeeSubDepartment(selectedEmployeeId);
    if (!subId) return message.warning(t[lang].noSubDepartments);

    let hasAssignment = testAssignments.some(
      (a) => a.employeeId === selectedEmployeeId && a.testId === selectedTestId,
    );

    if (!hasAssignment) {
      setIsCreatingAssignment(true);
      message.loading({
        content: "Создание назначения...",
        key: "creating",
        duration: 0,
      });
      try {
        const url = `${API_BASE}/TestAssignment`;
        await axios.post(url, {
          testId: Number(selectedTestId),
          employeeId: Number(selectedEmployeeId),
        });
        message.destroy("creating");
        message.success("✅ Назначение создано!");
        await fetchTestAssignments(1, 1000);
        hasAssignment = true;
      } catch (error) {
        message.destroy("creating");
        if (error?.response?.status === 409) {
          message.info("ℹ️ Назначение уже существует");
          await fetchTestAssignments(1, 1000);
          hasAssignment = true;
        } else {
          message.error("Ошибка при создании назначения");
          setIsCreatingAssignment(false);
          return;
        }
      } finally {
        setIsCreatingAssignment(false);
      }
    }

    setTestModalOpen(false);
    onStartTest({
      testId: selectedTestId,
      employeeId: selectedEmployeeId,
      duration: selectedTestDuration || 5,
      subDepartmentId: subId,
      action: "start",
    });
  };

  const loading = testsLoading || questionsLoading;

  if (loading && testTests.length === 0 && !dataLoaded) {
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
        <Spin size="middle" tip="Загрузка..." />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1400,
        margin: "0 auto",
        background: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={["#ff416c", "#ff4b2b", "#ff6b4a", "#ff8c6b"]}
        />
      )}

      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 24, padding: "0 8px" }}
        wrap="wrap"
        gap={12}
      >
        <div>
          <Title
            level={2}
            style={{ margin: 10, color: "#f00", fontWeight: 400 }}
          >
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14, paddingLeft: 20 }}>
            {lang === "ru" ? "Всего" : "Ҳамагӣ"} {testTests.length}{" "}
            {lang === "ru"
              ? testTests.length === 1
                ? "тест"
                : "тестов"
              : "тестҳо"}
          </Text>
        </div>
        <Space wrap>
          {/* ⭐ Переключатель RU / TJ */}
          {isAdmin && (
            <>
              <Button
                type={lang === "ru" ? "primary" : "default"}
                onClick={() => {
                  setLang("ru");
                  localStorage.setItem("test_manager_lang", "ru");
                }}
                style={
                  lang === "ru"
                    ? {
                        background: "#ff4b2b",
                        borderColor: "#ff4b2b",
                        borderRadius: 20,
                      }
                    : { borderRadius: 20 }
                }
              >
                RU
              </Button>
              <Button
                type={lang === "tj" ? "primary" : "default"}
                onClick={() => {
                  setLang("tj");
                  localStorage.setItem("test_manager_lang", "tj");
                }}
                style={
                  lang === "tj"
                    ? {
                        background: "#ff4b2b",
                        borderColor: "#ff4b2b",
                        borderRadius: 20,
                      }
                    : { borderRadius: 20 }
                }
              >
                TJ
              </Button>
            </>
          )}

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={() => setTestModalOpen(true)}
            style={{
              background: "#ff4b2b",
              borderColor: "#ff4b2b",
              borderRadius: 20,
            }}
          >
            {t[lang].startTest}
          </Button>

          {isAdmin && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="primary"
                onClick={openCreateModal}
                icon={<RocketOutlined />}
                style={{
                  background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                  border: "none",
                  borderRadius: 20,
                  height: 40,
                  padding: "0 24px",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
                }}
              >
                {t[lang].addTest}
              </Button>
            </motion.div>
          )}
        </Space>
      </Flex>

      <AnimatePresence>
        {!testTests || testTests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card
              style={{ textAlign: "center", padding: 60, borderRadius: 20 }}
            >
              <FileTextOutlined
                style={{ fontSize: 64, color: "#ff4b2b", marginBottom: 20 }}
              />
              <Title level={4}>{t[lang].noTests}</Title>
              {isAdmin && (
                <Button
                  type="primary"
                  onClick={openCreateModal}
                  style={{ background: "#ff4b2b", borderRadius: 20 }}
                  icon={<RocketOutlined />}
                >
                  {t[lang].createFirst}
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Row gutter={[24, 24]}>
              {paginatedTests.map((test, index) => {
                const isHovered = hoveredCard === test.id;
                const isNew = newTestId === test.id;
                const questionCount = test.questions?.length || 0;
                const hasDescription =
                  test.descriptionRu || test.description || test.descriptionTj;

                return (
                  <Col xs={24} md={12} lg={8} key={test.id}>
                    <motion.div
                      id={`test-${test.id}`}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        boxShadow: isNew
                          ? "0 0 0 3px #ff4b2b, 0 0 0 6px rgba(255, 75, 43, 0.3)"
                          : "none",
                      }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                      }}
                      whileHover={{ y: -8 }}
                    >
                      <Card
                        onClick={() => {
                          if (isAdmin) openPreview(test);
                        }}
                        onMouseEnter={() => setHoveredCard(test.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          borderRadius: 20,
                          border: "none",
                          overflow: "hidden",
                          cursor: isAdmin ? "pointer" : "default",
                          boxShadow: isHovered
                            ? "0 16px 40px rgba(255, 75, 43, 0.18)"
                            : "0 6px 20px rgba(0, 0, 0, 0.08)",
                          transition: "all 0.3s ease",
                          position: "relative",
                          background: "#fff",
                        }}
                        styles={{ body: { padding: 0 } }}
                      >
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
                            padding: "22px 24px",
                            color: "#fff",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: -50,
                              right: -50,
                              width: 150,
                              height: 150,
                              borderRadius: "50%",
                              background: "rgba(255, 255, 255, 0.12)",
                            }}
                          />
                          <Flex
                            align="flex-start"
                            gap={14}
                            style={{ position: "relative", zIndex: 1 }}
                          >
                            <div
                              style={{
                                background: "rgba(255, 255, 255, 0.25)",
                                borderRadius: 14,
                                width: 52,
                                height: 52,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontSize: 24,
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                backdropFilter: "blur(6px)",
                              }}
                            >
                              <FileTextOutlined />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                strong
                                style={{
                                  color: "#fff",
                                  fontSize: 16,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {test.titleRu ||
                                  test.title ||
                                  test.titleTj ||
                                  "Без названия"}
                              </Text>

                              <div style={{ marginTop: 10 }}>
                                <Tag
                                  icon={<ClockCircleOutlined />}
                                  style={{
                                    background: "rgba(255, 255, 255, 0.25)",
                                    color: "#fff",
                                    border:
                                      "1px solid rgba(255, 255, 255, 0.35)",
                                    borderRadius: 20,
                                    padding: "3px 12px",
                                    fontSize: 12,
                                  }}
                                >
                                  {questionCount} {t[lang].questionCount}
                                </Tag>
                              </div>
                            </div>
                          </Flex>
                        </div>

                        {hasDescription && (
                          <div
                            style={{
                              padding: "16px 22px 14px",
                              background: "#fff",
                              minHeight: 60,
                            }}
                          >
                            <Text
                              type="secondary"
                              style={{
                                fontSize: 13,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {hasDescription}
                            </Text>
                          </div>
                        )}

                        {isAdmin && (
                          <div
                            style={{
                              padding: "14px 22px",
                              background: "#fafbff",
                              borderTop: "1px solid #f0f2f5",
                            }}
                          >
                            <Flex justify="end">
                              <Space>
                                <Button
                                  icon={<EditOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(test);
                                  }}
                                  style={{
                                    borderRadius: 8,
                                    borderColor: "#ff4b2b",
                                    color: "#ff4b2b",
                                  }}
                                >
                                  {t[lang].edit}
                                </Button>
                                <Popconfirm
                                  title={t[lang].deleteConfirm}
                                  onConfirm={async (e) => {
                                    e?.stopPropagation();
                                    await removeTest(test.id);
                                    message.success("Тест удален");
                                    await fetchTests(1, 1000);
                                  }}
                                  okText="Да"
                                  cancelText="Нет"
                                >
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ borderRadius: 8 }}
                                  >
                                    {t[lang].delete}
                                  </Button>
                                </Popconfirm>
                              </Space>
                            </Flex>
                          </div>
                        )}

                        <div
                          style={{
                            height: 3,
                            background:
                              "linear-gradient(90deg, #ff416c 0%, #ff4b2b 50%, #ff8c6b 100%)",
                          }}
                        />
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </motion.div>
        )}
      </AnimatePresence>

      {testTests.length > 0 && (
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalCount}
            onChange={(page, size) => {
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              } else setCurrentPage(page);
            }}
          />
        </div>
      )}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 20,
              }}
            >
              <PlayCircleOutlined />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {t[lang].startTest}
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>
                Заполните параметры и начните тестирование
              </div>
            </div>
          </div>
        }
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        footer={[
          <Button
            key="start"
            type="primary"
            onClick={handleStartTest}
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              border: "none",
              borderRadius: 10,
              height: 44,
              padding: "0 32px",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
            }}
            disabled={!selectedEmployeeId || isCreatingAssignment}
            loading={isCreatingAssignment}
            icon={<PlayCircleOutlined />}
          >
            {isCreatingAssignment
              ? t[lang].creatingAssignment
              : `${t[lang].startTest} (${selectedTestDuration} мин)`}
          </Button>,
          <Button
            danger
            key="cancel"
            onClick={() => setTestModalOpen(false)}
            style={{ borderRadius: 10, height: 44, padding: "0 24px" }}
          >
            {t[lang].close}
          </Button>,
        ]}
        width={780}
        centered
        styles={{
          body: {
            maxHeight: "75vh",
            overflowY: "auto",
            padding: "24px 28px",
          },
          header: {
            padding: "20px 28px",
            borderBottom: "1px solid #f0f0f0",
          },
          footer: {
            padding: "16px 28px",
            borderTop: "1px solid #f0f0f0",
          },
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* ====== ТЕСТ ====== */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <BookOutlined style={{ color: "#ff4b2b", fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>
                {t[lang].selectTest}:
              </Text>
            </div>
            <Select
              placeholder={t[lang].selectTest}
              value={selectedTestId}
              onChange={setSelectedTestId}
              style={{ width: "100%" }}
              showSearch
              size="large"
              optionFilterProp="label"
              optionLabelProp="label"
              styles={{ popup: { root: { maxHeight: 300 } } }}
            >
              {testTests.map((test) => {
                const label =
                  test.titleRu ||
                  test.title ||
                  test.titleTj ||
                  `ID: ${test.id}`;
                return (
                  <Option key={test.id} value={test.id} label={label}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <BookOutlined style={{ color: "#ff4b2b" }} />
                      <span style={{ flex: 1 }}>{label}</span>
                      <Tag
                        color="blue"
                        style={{ marginLeft: 8, borderRadius: 20 }}
                      >
                        {test.questions?.length || 0} вопр.
                      </Tag>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>

          {/* ====== ДЛИТЕЛЬНОСТЬ ====== */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <HourglassOutlined style={{ color: "#ff4b2b", fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>
                {t[lang].selectDuration}:
              </Text>
            </div>
            <Input
              type="number"
              placeholder={t[lang].customDuration}
              value={selectedTestDuration}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v > 0 && v <= 480) setSelectedTestDuration(v);
                else if (e.target.value === "") setSelectedTestDuration(5);
              }}
              min={1}
              max={480}
              size="large"
              prefix={<HourglassOutlined style={{ color: "#8c8c8c" }} />}
              suffix={t[lang].minutesShort}
              style={{ borderRadius: 10 }}
            />
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t[lang].presetTimes}
              </Text>
              {[5, 10, 15, 20, 30, 45, 60, 90].map((min) => (
                <Button
                  key={min}
                  size="small"
                  type={selectedTestDuration === min ? "primary" : "default"}
                  onClick={() => setSelectedTestDuration(min)}
                  style={{
                    borderRadius: 20,
                    ...(selectedTestDuration === min
                      ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                      : {}),
                  }}
                >
                  {min} мин
                </Button>
              ))}
            </div>
          </div>

          {/* ====== СОТРУДНИК ====== */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <UserOutlined style={{ color: "#ff4b2b", fontSize: 16 }} />
              <Text strong style={{ fontSize: 15 }}>
                {t[lang].selectEmployee}:
              </Text>
            </div>
            <Select
              allowClear
              placeholder={t[lang].selectEmployee}
              value={selectedEmployeeId}
              onChange={(v) => {
                setSelectedEmployeeId(v);
                setSelectedSubDepartmentId(null);
              }}
              style={{ width: "100%" }}
              showSearch
              size="large"
              optionFilterProp="label"
              optionLabelProp="label"
              styles={{ popup: { root: { maxHeight: 320 } } }}
              filterOption={(input, option) => {
                const emp = employees.find((e) => e.id === option?.value);
                if (!emp) return false;
                const haystack = [
                  emp.firstName,
                  emp.lastName,
                  emp.middleName,
                  emp.email,
                  emp.department,
                  emp.subDepartmentId
                    ? getSubDepartmentName(emp.subDepartmentId)
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();
                return haystack.includes(input.toLowerCase());
              }}
              notFoundContent={
                employees.length === 0 ? (
                  <div style={{ padding: 12, textAlign: "center" }}>
                    <Text type="secondary">Сотрудники не загружены</Text>
                  </div>
                ) : null
              }
            >
              {Object.entries(groupedEmployees).map(([dep, list]) => (
                <Select.OptGroup key={dep} label={`Отдел: ${dep}`}>
                  {list.map((e) => {
                    const fullName = getEmployeeFullName(e);
                    return (
                      <Option key={e.id} value={e.id} label={fullName}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <UserOutlined /> {fullName}
                          {e.subDepartmentId && (
                            <Tag color="green" style={{ marginLeft: 4 }}>
                              <ApartmentOutlined />{" "}
                              {getSubDepartmentName(e.subDepartmentId)}
                            </Tag>
                          )}
                        </div>
                      </Option>
                    );
                  })}
                </Select.OptGroup>
              ))}
            </Select>
          </div>

          {/* ====== КАРТОЧКА ОТДЕЛЕНИЯ ====== */}
          {selectedEmployeeId && selectedSubDepartmentId && (
            <Card
              size="small"
              style={{
                background: "linear-gradient(135deg, #f6ffed, #ffffff)",
                borderColor: "#b7eb8f",
                borderRadius: 12,
              }}
              styles={{ body: { padding: "14px 18px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ApartmentOutlined
                    style={{ color: "#52c41a", fontSize: 20 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 15 }}>
                    {getSubDepartmentName(selectedSubDepartmentId)}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t[lang].assignmentInfo}
                  </Text>
                </div>
                <Tag
                  color="green"
                  style={{ borderRadius: 20, padding: "4px 12px" }}
                >
                  <CheckCircleOutlined /> OK
                </Tag>
              </div>
            </Card>
          )}

          {selectedEmployeeId && !selectedSubDepartmentId && dataLoaded && (
            <Alert
              message={t[lang].noSubDepartments}
              type="warning"
              showIcon
              style={{ borderRadius: 12 }}
            />
          )}

          {existingSession && (
            <Alert
              message={t[lang].hasUnfinished}
              description={t[lang].continueExisting}
              type="warning"
              showIcon
              style={{ borderRadius: 12 }}
            />
          )}
        </div>
      </Modal>

      {/* СОЗДАНИЕ/РЕДАКТИРОВАНИЕ ТЕСТА */}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          resetForm();
        }}
        footer={null}
        width={1100}
        centered
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              padding: "24px 30px",
              color: "white",
            }}
          >
            <Flex align="center" gap={12}>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {editingItem ? (
                  <EditOutlined style={{ fontSize: 24 }} />
                ) : (
                  <RocketOutlined style={{ fontSize: 24 }} />
                )}
              </div>
              <div>
                <Title level={3} style={{ color: "white", margin: 0 }}>
                  {editingItem ? t[lang].edit : t[lang].addTest}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  {editingItem
                    ? "Измените параметры теста"
                    : "Заполните информацию о новом тесте"}
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
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <Alert
                    message={t[lang].info}
                    description="Введите основную информацию о тесте."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                  <div style={{ marginBottom: 24 }}>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {t[lang].testTitle}{" "}
                      <span style={{ color: "#ff4b2b" }}>*</span>
                    </Text>
                    <Input
                      value={titleRu || titleTj}
                      onChange={(e) => {
                        setTitleRu(e.target.value);
                        setTitleTj(e.target.value);
                      }}
                      size="large"
                      style={{ borderRadius: 12 }}
                      placeholder="Введите название теста"
                    />
                  </div>
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {t[lang].description}
                    </Text>
                    <TextArea
                      value={descriptionRu || descriptionTj}
                      onChange={(e) => {
                        setDescriptionRu(e.target.value);
                        setDescriptionTj(e.target.value);
                      }}
                      rows={4}
                      size="large"
                      style={{ borderRadius: 12 }}
                      placeholder="Введите описание теста"
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <Alert
                    message={t[lang].info}
                    description={
                      <div>
                        <Text>
                          {editingItem
                            ? "Редактирование теста."
                            : "Выберите вопросы для теста."}
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue" style={{ borderRadius: 20 }}>
                            Доступно: {availableQuestions.length}
                          </Tag>
                          <Tag color="green" style={{ marginLeft: 8 }}>
                            Всего в базе: {allQuestions.length}
                          </Tag>
                          {selectedQuestionIds.length > 0 && (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                              Выбрано: {selectedQuestionIds.length}
                            </Tag>
                          )}
                        </div>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />

                  <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <TabPane
                      tab={
                        <span>
                          <FormOutlined /> {t[lang].selectQuestionsTab}
                        </span>
                      }
                      key="select"
                    >
                      <div
                        style={{
                          background: "#f8f9fa",
                          padding: "16px 20px",
                          borderRadius: 12,
                          marginBottom: 20,
                        }}
                      >
                        <Flex justify="space-between" wrap="wrap" gap={12}>
                          <Space>
                            <Button
                              icon={<PlusOutlined />}
                              onClick={selectAllQuestions}
                              disabled={filteredAvailableQuestions.length === 0}
                              type="primary"
                              ghost
                              style={{ borderRadius: 20 }}
                            >
                              {t[lang].selectAll}
                            </Button>
                            <Button
                              icon={<MinusOutlined />}
                              onClick={clearAllQuestions}
                              disabled={selectedQuestionIds.length === 0}
                              danger
                              ghost
                              style={{ borderRadius: 20 }}
                            >
                              {t[lang].clearAll}
                            </Button>
                          </Space>
                          <Space>
                            <Input
                              placeholder={t[lang].searchPlaceholder}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              prefix={<SearchOutlined />}
                              allowClear
                              style={{ width: 220, borderRadius: 20 }}
                            />
                            <Select
                              value={filterType}
                              onChange={setFilterType}
                              style={{ width: 150 }}
                              suffixIcon={<FilterOutlined />}
                            >
                              <Option value="all">{t[lang].allTypes}</Option>
                              <Option value="1">📝 {t[lang].test}</Option>
                              <Option value="2">✏️ {t[lang].manual}</Option>
                              <Option value="3">⭐ {t[lang].rating}</Option>
                            </Select>
                            {(searchTerm || filterType !== "all") && (
                              <Button
                                icon={<ClearOutlined />}
                                onClick={() => {
                                  setSearchTerm("");
                                  setFilterType("all");
                                }}
                                style={{ borderRadius: 20 }}
                              >
                                {t[lang].clearFilters}
                              </Button>
                            )}
                          </Space>
                        </Flex>
                      </div>

                      {questionsLoading ? (
                        <div style={{ textAlign: "center", padding: 40 }}>
                          <Spin tip="Загрузка вопросов..." />
                        </div>
                      ) : filteredAvailableQuestions.length === 0 ? (
                        <Empty
                          description={
                            searchTerm || filterType !== "all"
                              ? t[lang].noQuestionsFound
                              : allQuestions.length === 0
                                ? t[lang].createQuestionFirst
                                : t[lang].noAvailableQuestions
                          }
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          style={{ padding: 40 }}
                        >
                          {isAdmin && allQuestions.length === 0 && (
                            <Button
                              type="primary"
                              onClick={() => setActiveTab("create")}
                              style={{
                                borderRadius: 20,
                                background: "#ff4b2b",
                                borderColor: "#ff4b2b",
                              }}
                            >
                              {t[lang].createQuestionTab}
                            </Button>
                          )}
                        </Empty>
                      ) : (
                        <div
                          style={{
                            maxHeight: 420,
                            overflow: "auto",
                            padding: "4px",
                          }}
                        >
                          <Row gutter={[12, 12]}>
                            {filteredAvailableQuestions.map((q) => {
                              const sel = selectedQuestionIds.includes(q.id);
                              const tInfo = getTypeLabel(q.type);
                              const nType = getNumericType(q.type);
                              return (
                                <Col xs={24} key={q.id}>
                                  <Card
                                    onClick={() =>
                                      toggleQuestionSelection(q.id)
                                    }
                                    style={{
                                      cursor: "pointer",
                                      borderRadius: 16,
                                      border: sel
                                        ? "2px solid #ff4b2b"
                                        : "1px solid #e8e8e8",
                                      background: sel
                                        ? "linear-gradient(135deg, #fff5f5, #ffffff)"
                                        : "#fff",
                                    }}
                                    styles={{ body: { padding: "14px 18px" } }}
                                  >
                                    <Flex align="flex-start" gap={14}>
                                      <Checkbox
                                        checked={sel}
                                        onChange={() =>
                                          toggleQuestionSelection(q.id)
                                        }
                                        style={{ flexShrink: 0, marginTop: 4 }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <Text
                                          style={{
                                            fontSize: 15,
                                            display: "block",
                                          }}
                                        >
                                          {getQuestionText(q)}
                                        </Text>
                                        <Flex
                                          gap={8}
                                          style={{ marginTop: 8 }}
                                          wrap="wrap"
                                        >
                                          <Tag
                                            color={tInfo.color}
                                            icon={tInfo.icon}
                                            style={{
                                              borderRadius: 20,
                                              border: "none",
                                            }}
                                          >
                                            {tInfo.label}
                                          </Tag>
                                          <Text
                                            type="secondary"
                                            style={{ fontSize: 11 }}
                                          >
                                            ID: {q.id}
                                          </Text>
                                        </Flex>

                                        {nType === 1 &&
                                          q.options?.length > 0 && (
                                            <div
                                              style={{
                                                marginTop: 8,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 4,
                                              }}
                                            >
                                              {q.options.map((o, oi) => (
                                                <div
                                                  key={oi}
                                                  style={{
                                                    fontSize: 12,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                  }}
                                                >
                                                  <span
                                                    style={{
                                                      width: 18,
                                                      height: 18,
                                                      lineHeight: "18px",
                                                      textAlign: "center",
                                                      borderRadius: "50%",
                                                      background: o.isCorrect
                                                        ? "#52c41a"
                                                        : "#f0f0f0",
                                                      color: o.isCorrect
                                                        ? "#fff"
                                                        : "#666",
                                                      fontSize: 10,
                                                      fontWeight: "bold",
                                                    }}
                                                  >
                                                    {
                                                      [
                                                        "A",
                                                        "B",
                                                        "C",
                                                        "D",
                                                        "E",
                                                        "F",
                                                      ][oi]
                                                    }
                                                  </span>
                                                  <Text
                                                    style={{
                                                      color: o.isCorrect
                                                        ? "#52c41a"
                                                        : "#333",
                                                    }}
                                                  >
                                                    {getOptTextSafe(o, lang)}
                                                    {o.isCorrect && " ✅"}
                                                  </Text>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                        {nType === 3 && (
                                          <div style={{ marginTop: 8 }}>
                                            <Text
                                              type="secondary"
                                              style={{ fontSize: 12 }}
                                            >
                                              ⭐{" "}
                                              {q.optionId
                                                ? `Рейтинг: ${q.optionId}/10`
                                                : "Рейтинг 1-10"}
                                            </Text>
                                          </div>
                                        )}
                                      </div>

                                      {isAdmin && (
                                        <Flex
                                          vertical
                                          align="center"
                                          gap={6}
                                          style={{
                                            flexShrink: 0,
                                            marginTop: 4,
                                          }}
                                        >
                                          {sel && (
                                            <div
                                              style={{
                                                background: "#ff4b2b",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: 28,
                                                height: 28,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <CheckOutlined />
                                            </div>
                                          )}
                                          <Popconfirm
                                            title="Удалить вопрос навсегда?"
                                            description="Вопрос исчезнет из базы данных."
                                            onConfirm={(e) => {
                                              e?.stopPropagation();
                                              handleDeleteQuestion(q.id);
                                            }}
                                            onCancel={(e) =>
                                              e?.stopPropagation()
                                            }
                                            okText="Да, удалить"
                                            cancelText="Отмена"
                                            okButtonProps={{ danger: true }}
                                          >
                                            <Button
                                              type="text"
                                              danger
                                              size="small"
                                              icon={<DeleteOutlined />}
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            />
                                          </Popconfirm>
                                        </Flex>
                                      )}
                                    </Flex>
                                  </Card>
                                </Col>
                              );
                            })}
                          </Row>
                        </div>
                      )}

                      {selectedQuestionIds.length > 0 && (
                        <div
                          style={{
                            marginTop: 20,
                            padding: "10px 16px",
                            background: "#fff5f5",
                            borderRadius: 10,
                            border: "1px solid #ffd6d6",
                            textAlign: "center",
                          }}
                        >
                          <Text
                            strong
                            style={{ fontSize: 14, color: "#ff4b2b" }}
                          >
                            <TrophyOutlined style={{ marginRight: 8 }} />
                            {t[lang].selected}: {selectedQuestionIds.length}{" "}
                            {t[lang].questionsSelected}
                          </Text>
                        </div>
                      )}
                    </TabPane>

                    {isAdmin && (
                      <TabPane
                        tab={
                          <span>
                            <PlusOutlined /> {t[lang].createQuestionTab}
                          </span>
                        }
                        key="create"
                      >
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
                            selectRating: t[lang].selectRating,
                          }}
                        />
                      </TabPane>
                    )}
                  </Tabs>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <Alert
                    message={t[lang].success}
                    description={t[lang].testReady}
                    type="success"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                  <div style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #fff5f5, #ffffff)",
                        padding: 20,
                        borderRadius: 16,
                        border: "1px solid #ffe0e0",
                      }}
                    >
                      <Flex align="center" gap={12}>
                        <Avatar style={{ background: "#ff4b2b" }}>
                          <FileTextOutlined />
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: 18 }}>
                            {titleRu || titleTj || "Без названия"}
                          </Text>
                          <div>
                            <Tag
                              color="blue"
                              style={{ marginTop: 4, borderRadius: 20 }}
                            >
                              {selectedQuestionIds.length}{" "}
                              {t[lang].totalQuestions}
                            </Tag>
                          </div>
                        </div>
                      </Flex>
                    </div>
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                          display: "block",
                          marginBottom: 12,
                        }}
                      >
                        📋 Вопросы теста:
                      </Text>
                      <div style={{ maxHeight: 300, overflow: "auto" }}>
                        <Table
                          dataSource={selectedQuestions}
                          rowKey="id"
                          columns={[
                            {
                              title: "#",
                              key: "order",
                              width: 60,
                              render: (_, __, index) => (
                                <Badge
                                  count={index + 1}
                                  style={{ backgroundColor: "#ff4b2b" }}
                                />
                              ),
                            },
                            {
                              title: t[lang].question,
                              key: "questionText",
                              render: (_, record) => (
                                <div>
                                  <Text style={{ fontSize: 14 }}>
                                    {getQuestionText(record)}
                                  </Text>
                                  <div style={{ marginTop: 4 }}>
                                    <Tag
                                      color={
                                        getNumericType(record.type) === 3
                                          ? "orange"
                                          : "green"
                                      }
                                      style={{ fontSize: 12 }}
                                    >
                                      {t[lang].correctAnswer}:{" "}
                                      {getCorrectAnswerText(record)}
                                    </Tag>
                                  </div>
                                </div>
                              ),
                            },
                            {
                              title: "Тип",
                              key: "type",
                              width: 120,
                              render: (_, record) => {
                                const typeInfo = getTypeLabel(record.type);
                                return (
                                  <Tag
                                    color={typeInfo.color}
                                    icon={typeInfo.icon}
                                    style={{
                                      borderRadius: 20,
                                      border: "none",
                                    }}
                                  >
                                    {typeInfo.label}
                                  </Tag>
                                );
                              },
                            },
                            {
                              title: "",
                              key: "actions",
                              width: 60,
                              render: (_, record) => (
                                <Popconfirm
                                  title="Удалить из теста?"
                                  onConfirm={() =>
                                    setSelectedQuestionIds((prev) =>
                                      prev.filter((id) => id !== record.id),
                                    )
                                  }
                                  okText="Да"
                                  cancelText="Нет"
                                >
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                  />
                                </Popconfirm>
                              ),
                            },
                          ]}
                          pagination={false}
                          size="small"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              style={{
                marginTop: 30,
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 20,
              }}
            >
              <Button
                onClick={() => setOpen(false)}
                style={{ borderRadius: 10 }}
              >
                {t[lang].cancel}
              </Button>
              <Space>
                {currentStep > 0 && (
                  <Button onClick={handleBack} style={{ borderRadius: 10 }}>
                    {t[lang].back}
                  </Button>
                )}
                {currentStep < 2 ? (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    style={{ background: "#ff4b2b", borderRadius: 10 }}
                    icon={<ArrowRightOutlined />}
                  >
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleSave}
                    loading={saving}
                    style={{
                      background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                      borderRadius: 10,
                      fontWeight: "bold",
                    }}
                    icon={<RocketOutlined />}
                  >
                    {saving
                      ? "Сохранение..."
                      : editingItem
                        ? t[lang].save
                        : t[lang].addTest}
                  </Button>
                )}
              </Space>
            </div>
          </div>
        </div>
      </Modal>

      {/* ПРЕДПРОСМОТР */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={1200}
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 20px",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {selectedTest?.titleRu ||
                selectedTest?.title ||
                selectedTest?.titleTj ||
                "Без названия"}
            </span>
            <Tag color="blue" style={{ borderRadius: 20 }}>
              <ClockCircleOutlined /> {selectedTest?.questions?.length || 0}{" "}
              {t[lang].questionCount}
            </Tag>
          </div>
        }
      >
        {selectedTest &&
          (selectedTest.descriptionRu ||
            selectedTest.description ||
            selectedTest.descriptionTj) && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 16px",
                background: "#f8f9fa",
                borderRadius: 8,
                borderLeft: "4px solid #ff4b2b",
              }}
            >
              <Text>
                {selectedTest.descriptionRu || selectedTest.description}
              </Text>
            </div>
          )}

        <Table
          dataSource={(selectedTest?.questions || []).map((q) => {
            const id = q.id || q.questionId;
            const found = allQuestions.find((x) => x.id === id);
            return found || normalizeQuestion(q);
          })}
          rowKey={(r) => r.id}
          columns={[
            {
              title: "№",
              key: "index",
              width: 60,
              render: (_, __, index) => (
                <Badge
                  count={index + 1}
                  style={{ backgroundColor: "#ff4b2b" }}
                />
              ),
            },
            {
              title: t[lang].question,
              key: "question",
              render: (_, record) => {
                const qType = getNumericType(record.type);
                return (
                  <div>
                    <Text style={{ fontSize: 15 }}>
                      {getQuestionText(record)}
                    </Text>

                    {qType === 1 &&
                      record.options &&
                      record.options.length > 0 && (
                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {record.options.map((opt, oi) => (
                            <div
                              key={oi}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 22,
                                  height: 22,
                                  lineHeight: "22px",
                                  textAlign: "center",
                                  borderRadius: "50%",
                                  background: opt.isCorrect
                                    ? "#52c41a"
                                    : "#f0f0f0",
                                  color: opt.isCorrect ? "#fff" : "#666",
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  flexShrink: 0,
                                }}
                              >
                                {["A", "B", "C", "D", "E", "F"][oi]}
                              </span>
                              <Text
                                style={{
                                  color: opt.isCorrect ? "#52c41a" : "#333",
                                  fontWeight: opt.isCorrect ? 500 : 400,
                                }}
                              >
                                {getOptTextSafe(opt, lang)}
                              </Text>
                              {opt.isCorrect && (
                                <Tag
                                  color="success"
                                  style={{ marginLeft: 4, borderRadius: 20 }}
                                >
                                  Правильный
                                </Tag>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {qType === 2 && (
                      <div style={{ marginTop: 6 }}>
                        <Tag
                          color="purple"
                          style={{ borderRadius: 20, border: "none" }}
                        >
                          ✏️ Открытый ответ
                        </Tag>
                      </div>
                    )}

                    {qType === 3 && (
                      <div style={{ marginTop: 6 }}>
                        <Tag
                          color="orange"
                          style={{ borderRadius: 20, border: "none" }}
                        >
                          ⭐{" "}
                          {record.optionId
                            ? `Рейтинг: ${record.optionId}/10`
                            : "Рейтинг 1-10"}
                        </Tag>
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              title: "Тип",
              key: "type",
              width: 130,
              render: (_, record) => {
                const typeInfo = getTypeLabel(record.type);
                return (
                  <Tag
                    color={typeInfo.color}
                    icon={typeInfo.icon}
                    style={{ borderRadius: 20, border: "none" }}
                  >
                    {typeInfo.label}
                  </Tag>
                );
              },
            },
          ]}
          pagination={false}
          locale={{ emptyText: t[lang].noQuestionsInTest }}
        />
      </Modal>
    </div>
  );
};

export default TestManager;
