import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
import { useTestSessionStore } from "../store/useTestSession";
import { useEmployeeStore } from "../store/useEmployee";
import { useTestAssignmentStore } from "../store/useTestAssignment";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import OneTimeLinkModal from "./OneTimeLinkModal";
import { BilingualInput } from "../components/BilingualInput";
import { isBilingualFilled, isBilingualPartial } from "../utils/bilingual";
import { getCurrentEmployeeId } from "../utils/currentEmployee";
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
  LinkOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const API_BASE = "http://10.65.10.22:8525/api";

// ============================================================
// 🔥 ХЕЛПЕРЫ
// ============================================================
const getNumericType = (type) => {
  if (type === 1 || type === "MultipleChoice") return 1;
  if (type === 2 || type === "OpenEnded" || type === "Manual") return 2;
  if (type === 3 || type === "Rating") return 3;
  return 1;
};

const getApiTypeString = (nType) => {
  if (nType === 2) return "OpenEnded";
  if (nType === 3) return "Rating";
  return "MultipleChoice";
};

const getQTextSafe = (q, lang = "ru") => {
  if (!q) return "—";
  const text =
    lang === "ru"
      ? q.contentRu || q.content || q.contentTj
      : q.contentTj || q.content || q.contentRu;
  return text && text.trim() ? text : "—";
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
// QuestionCreator
// ============================================================
const QuestionCreator = ({
  onQuestionCreated,
  onQuestionUpdated,
  onCancel,
  initialQuestion = null,
  t,
}) => {
  const { addQuestion, editQuestion } = useQuestionStore();
  const isEdit = !!initialQuestion;
  const initialType = isEdit ? getNumericType(initialQuestion.type) : 1;
  const [contentRu, setContentRu] = useState(() =>
    isEdit ? initialQuestion.contentRu || initialQuestion.content || "" : "",
  );
  const [contentTj, setContentTj] = useState(() =>
    isEdit ? initialQuestion.contentTj || initialQuestion.content || "" : "",
  );
  const [type, setType] = useState(initialType);
  const [options, setOptions] = useState(() =>
    isEdit && initialType === 1
      ? (initialQuestion.options || []).map((o) => ({
          textRu: o.textRu || o.text || "",
          textTj: o.textTj || o.text || "",
          isCorrect: !!o.isCorrect,
        }))
      : [],
  );
  const initialManual =
    isEdit && initialType === 2 ? initialQuestion.options?.[0] : null;
  const [manualAnswerRu, setManualAnswerRu] = useState(
    () => initialManual?.textRu || initialManual?.text || "",
  );
  const [manualAnswerTj, setManualAnswerTj] = useState(
    () => initialManual?.textTj || initialManual?.text || "",
  );
  const [ratingAnswer, setRatingAnswer] = useState(() =>
    isEdit && initialType === 3 ? (initialQuestion.optionId ?? null) : null,
  );
  const [creating, setCreating] = useState(false);

  const letters = ["A", "B", "C", "D", "E", "F"];

  const addOption = () => {
    if (options.length >= 6) {
      message.warning("Максимум 6 вариантов");
      return;
    }
    setOptions([...options, { textRu: "", textTj: "", isCorrect: false }]);
  };

  const updateOption = (i, field, value) => {
    setOptions(
      options.map((o, idx) => (idx === i ? { ...o, [field]: value } : o)),
    );
  };

  const setCorrectOption = (index) => {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === index })));
  };

  const deleteOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSaveQuestion = async () => {
    if (!isBilingualFilled(contentRu, contentTj)) {
      message.warning("Введите текст вопроса на двух языках (RU и TJ)");
      return;
    }

    let payload;

    if (type === 2) {
      if (isBilingualPartial(manualAnswerRu, manualAnswerTj)) {
        message.warning("Введите эталонный ответ на двух языках (RU и TJ)");
        return;
      }
      payload = {
        contentRu,
        contentTj,
        type: "OpenEnded",
        options: manualAnswerRu.trim()
          ? [
              {
                textRu: manualAnswerRu,
                textTj: manualAnswerTj,
                isCorrect: true,
              },
            ]
          : [],
      };
    } else if (type === 3) {
      if (!ratingAnswer) {
        message.warning("Выберите рейтинг");
        return;
      }
      payload = {
        contentRu,
        contentTj,
        type: "Rating",
        optionId: ratingAnswer,
        options: [],
      };
    } else {
      if (options.length === 0) {
        message.warning("Добавьте хотя бы один вариант");
        return;
      }
      if (!options.some((o) => o.isCorrect)) {
        message.warning("Выберите правильный вариант");
        return;
      }
      if (options.some((o) => !isBilingualFilled(o.textRu, o.textTj))) {
        message.warning("Заполните все варианты на двух языках (RU и TJ)");
        return;
      }

      payload = {
        contentRu,
        contentTj,
        type: "MultipleChoice",
        options: options.map((o) => ({
          textRu: o.textRu,
          textTj: o.textTj,
          isCorrect: !!o.isCorrect,
        })),
      };
    }

    setCreating(true);
    try {
      if (isEdit) {
        const response = await editQuestion(initialQuestion.id, payload);
        message.success("Вопрос обновлён");
        if (onQuestionUpdated) onQuestionUpdated(response, initialQuestion.id);
        return;
      }
      const response = await addQuestion(payload);
      message.success("Вопрос создан! 🎉");
      setContentRu("");
      setContentTj("");
      setOptions([]);
      setManualAnswerRu("");
      setManualAnswerTj("");
      setRatingAnswer(null);
      setType(1);
      if (onQuestionCreated && response) onQuestionCreated(response);
    } catch (err) {
      console.error("Error saving question:", err);
      message.error(
        err?.response?.data?.message ||
          (isEdit
            ? "Ошибка при сохранении вопроса"
            : "Ошибка при создании вопроса"),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <Alert
        message={isEdit ? "Редактирование вопроса" : "Создание нового вопроса"}
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
        <BilingualInput
          textarea
          placeholder={t.question}
          valueRu={contentRu}
          valueTj={contentTj}
          onChangeRu={setContentRu}
          onChangeTj={setContentTj}
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
            setManualAnswerRu("");
            setManualAnswerTj("");
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
                      <Radio
                        checked={o.isCorrect}
                        onChange={() => setCorrectOption(i)}
                      >
                        {t.correct} ({letters[i]})
                      </Radio>
                    </Col>
                    <Col flex="auto">
                      <BilingualInput
                        placeholder={`${t.variant} ${letters[i]}`}
                        valueRu={o.textRu}
                        valueTj={o.textTj}
                        onChangeRu={(v) => updateOption(i, "textRu", v)}
                        onChangeTj={(v) => updateOption(i, "textTj", v)}
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
          <BilingualInput
            placeholder={t.answer}
            valueRu={manualAnswerRu}
            valueTj={manualAnswerTj}
            onChangeRu={setManualAnswerRu}
            onChangeTj={setManualAnswerTj}
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
                  background:
                    ratingAnswer === num
                      ? "linear-gradient(135deg, #ff4d4f, #ff7875)"
                      : "rgba(255,255,255,0.9)",
                  color: ratingAnswer === num ? "#fff" : "#333",
                  border:
                    ratingAnswer === num
                      ? "3px solid #ffd6d6"
                      : "1px solid #e8e8e8",
                }}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      )}

      <Flex gap={8} style={{ marginTop: 16 }}>
        {onCancel && (
          <Button
            onClick={onCancel}
            style={{ height: 44, borderRadius: 10, flex: "0 0 auto" }}
          >
            Отмена
          </Button>
        )}
        <Button
          type="primary"
          onClick={handleSaveQuestion}
          loading={creating}
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
            border: "none",
            borderRadius: 10,
            height: 44,
          }}
          icon={<SaveOutlined />}
        >
          {creating
            ? "Сохранение..."
            : isEdit
              ? "Сохранить изменения"
              : "Создать вопрос"}
        </Button>
      </Flex>
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
  const { questions = [], fetchQuestions, removeQuestion } = useQuestionStore();
  const {
    sessions = [],
    loading: sessionsLoading,
    fetchSessions,
    getStats,
  } = useTestSessionStore();
  const { employees = [], fetchEmployee } = useEmployeeStore();
  const { testAssignments = [], fetchTestAssignments } =
    useTestAssignmentStore();
  const { subdepartments = [], fetchSubDepartments } = useSubDepartmentStore();

  // язык берётся из общего меню (HRSystemLayout)
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
  const [canStartTest, setCanStartTest] = useState(true);
  const [existingSession, setExistingSession] = useState(null);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  // ---- Редактирование вопроса / добавление вопросов в готовый тест ----
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [addToTestOpen, setAddToTestOpen] = useState(false);
  const [addTab, setAddTab] = useState("select");
  const [addSelectedIds, setAddSelectedIds] = useState([]);
  const [addSearch, setAddSearch] = useState("");
  const [previewSaving, setPreviewSaving] = useState(false);

  // ---- Модалка генерации одноразовой ссылки для стажёра ----
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForTest, setLinkForTest] = useState(null);

  const roles = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  }, []);
  const isAdmin = roles.includes("Admin") || roles.includes("SuperAdmin");

  // сотрудник текущего пользователя — обычный пользователь проходит тест сам за себя
  const currentEmployeeId = useMemo(
    () => (isAdmin ? null : getCurrentEmployeeId(employees, tests)),
    [isAdmin, tests, employees],
  );

  useEffect(() => {
    if (!isAdmin) setSelectedEmployeeId(currentEmployeeId);
  }, [isAdmin, currentEmployeeId]);

  const testTests = tests.filter((test) => test.testType !== 0);

  const totalCount = testTests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTests = testTests.slice(startIndex, endIndex);

  const getQuestionText = useCallback(
    (question) => getQTextSafe(question, lang),
    [lang],
  );

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
      if (qType === 3) return "Рейтинг 1-10";
      return "—";
    },
    [lang],
  );

  const getTypeLabel = useCallback(
    (type) => {
      const n = getNumericType(type);
      if (n === 1)
        return {
          label: lang === "ru" ? "Тест" : "Тест",
          color: "#52c41a",
          icon: <CheckCircleOutlined />,
        };
      if (n === 2)
        return {
          label: lang === "ru" ? "Открытый" : "Кушод",
          color: "#722ed1",
          icon: <FormOutlined />,
        };
      if (n === 3)
        return {
          label: lang === "ru" ? "Рейтинг" : "Баҳо",
          color: "#faad14",
          icon: <StarOutlined />,
        };
      return { label: "Тест", color: "#52c41a", icon: <CheckCircleOutlined /> };
    },
    [lang],
  );

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
      return questions.filter((q) => !usedIds.has(q.id));
    },
    [questions, getUsedQuestionIds],
  );

  const getEmployeeSubDepartment = useCallback(
    (employeeId) => {
      const employee = employees.find((e) => e.id === employeeId);
      if (employee?.subDepartmentId) return employee.subDepartmentId;
      const assignment = testAssignments.find(
        (a) => a.employeeId === employeeId,
      );
      if (assignment?.subDepartmentId) return assignment.subDepartmentId;
      return null;
    },
    [employees, testAssignments],
  );

  const getSubDepartmentName = useCallback(
    (id) => {
      if (!id) return "—";
      const sub = subdepartments.find((s) => Number(s.id) === Number(id));
      return sub?.name || `Отделение ${id}`;
    },
    [subdepartments],
  );

  const checkCanStartTest = useCallback(
    (employeeId, testId) => {
      const completed = sessions.filter(
        (s) =>
          s.employeeId === employeeId && s.testId === testId && s.status === 2,
      );
      return completed.length === 0;
    },
    [sessions],
  );

  const groupedEmployees = employees.reduce((groups, employee) => {
    const department = employee.department || "Без отдела";
    if (!groups[department]) groups[department] = [];
    groups[department].push(employee);
    return groups;
  }, {});

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // allSettled: у обычного пользователя часть справочников может быть недоступна
        await Promise.allSettled([
          fetchSessions(),
          fetchTests(1, 1000, lang),
          fetchEmployee(1, 1000),
          fetchQuestions(1, 1000, null, lang),
          fetchSubDepartments(),
          fetchTestAssignments(1, 1000),
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        message.error("Ошибка загрузки данных");
      }
    };
    loadAllData();
  }, []);

  // при смене языка бэк отдаёт тесты и вопросы на этом языке — перезапрашиваем
  const langMounted = useRef(false);
  useEffect(() => {
    if (!langMounted.current) {
      langMounted.current = true;
      return;
    }
    fetchTests(1, 1000, lang);
    fetchQuestions(1, 1000, null, lang);
  }, [lang]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (selectedEmployeeId) {
      const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);
      setSelectedSubDepartmentId(subDeptId || null);
    } else {
      setSelectedSubDepartmentId(null);
    }
  }, [selectedEmployeeId, dataLoaded, getEmployeeSubDepartment]);

  useEffect(() => {
    if (selectedEmployeeId && selectedTestId) {
      setCanStartTest(checkCanStartTest(selectedEmployeeId, selectedTestId));
      setExistingSession(
        sessions.find(
          (s) =>
            s.employeeId === selectedEmployeeId &&
            s.testId === selectedTestId &&
            s.status === 1,
        ),
      );
    }
  }, [selectedEmployeeId, selectedTestId, sessions, checkCanStartTest]);

  const stats = getStats();
  const currentEditingId = editingItem?.id;
  const usedIds = getUsedQuestionIds(currentEditingId);
  const availableQuestions = getAvailableQuestions(currentEditingId);

  const filteredAvailableQuestions = availableQuestions.filter((q) => {
    const searchMatch = getQuestionText(q)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const typeMatch =
      filterType === "all" || getNumericType(q.type) === parseInt(filterType);
    return searchMatch && typeMatch;
  });

  const selectedQuestions = questions.filter((q) =>
    selectedQuestionIds.includes(q.id),
  );
  const displayQuestions = filteredAvailableQuestions;

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
      fillTitle:
        "Пожалуйста, заполните название теста на двух языках (RU и TJ)",
      fillDescription:
        "Заполните описание на двух языках (RU и TJ) или оставьте оба поля пустыми",
      selectQuestions: "Пожалуйста, выберите хотя бы один вопрос",
      success: "Успешно!",
      warning: "Внимание",
      info: "Информация",
      questionType: "Тип вопроса",
      test: "Тест",
      manual: "Открытый ответ",
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
      assignTest: "Назначить тест",
      assign: "Назначить",
      noEmployeeProfile: "Профиль сотрудника не найден",
      noAssignedTests: "Вам пока не назначено ни одного теста",
      selectTest: "Выберите тест",
      selectEmployee: "Выберите сотрудника",
      selectTestDuration: "Длительность теста",
      minutes: "минут",
      minutesShort: "мин",
      noSubDepartments: "У сотрудника не указано отделение",
      creatingAssignment: "Создание назначения...",
      close: "Закрыть",
      alreadyPassed: "Сотрудник уже прошел этот тест",
      cannotRetake: "Повторная сдача недоступна",
      hasUnfinished: "У сотрудника есть незавершенная сессия",
      continueExisting: "Продолжить существующую сессию",
      continue: "Продолжить",
      presetTimes: "Быстрый выбор:",
      customDuration: "Своя длительность",
      attemptsLeft: "Осталось попыток",
      of2: "из",
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
      fillTitle: "Лутфан, номи тестро бо ду забон (RU ва TJ) пур кунед",
      fillDescription:
        "Тавсифро бо ду забон (RU ва TJ) пур кунед ё ҳарду майдонро холӣ гузоред",
      selectQuestions: "Лутфан, ҳадди ақал як саволро интихоб кунед",
      success: "Бомуваффақият!",
      warning: "Диққат",
      info: "Маълумот",
      questionType: "Навъи савол",
      test: "Тест",
      manual: "Ҷавоби кушод",
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
      assignTest: "Таъин кардани тест",
      assign: "Таъин кардан",
      noEmployeeProfile: "Профили корманд ёфт нашуд",
      noAssignedTests: "Ба шумо ҳоло ягон тест таъин нашудааст",
      selectTest: "Тестро интихоб кунед",
      selectEmployee: "Кормандра интихоб кунед",
      selectTestDuration: "Давомнокии тест",
      minutes: "дақиқа",
      minutesShort: "дақ.",
      noSubDepartments: "Шуъбаи корманд муайян нашудааст",
      creatingAssignment: "Эҷоди таъинот...",
      close: "Пӯшидан",
      alreadyPassed: "Корманд аллакай ин тестро супоридааст",
      cannotRetake: "Супоридани дубора дастрас нест",
      hasUnfinished: "Корманд сессияи нотамом дорад",
      continueExisting: "Давом додани сессияи мавҷуда",
      continue: "Давом додан",
      presetTimes: "Интихоби зуд:",
      customDuration: "Давомнокии худ",
      attemptsLeft: "Кӯшишҳои боқимонда",
      of2: "аз",
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
    const questionIds =
      test.questions?.map((q) => q.id || q.questionId).filter(Boolean) || [];
    setSelectedQuestionIds(questionIds);
    setActiveTab("select");
    setOpen(true);
  };

  const openPreview = (test) => {
    setSelectedTest(test);
    setPreviewOpen(true);
  };

  // ---- Открытие модалки генерации одноразовой ссылки ----
  const openLinkModal = (test) => {
    setLinkForTest(test);
    setLinkModalOpen(true);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!isBilingualFilled(titleRu, titleTj)) {
        message.warning(t[lang].fillTitle);
        return;
      }
      if (isBilingualPartial(descriptionRu, descriptionTj)) {
        message.warning(t[lang].fillDescription);
        return;
      }
    }
    if (currentStep === 1 && selectedQuestionIds.length === 0) {
      message.warning(t[lang].selectQuestions);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => setCurrentStep(currentStep - 1);

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const selectAllQuestions = () => {
    const allIds = filteredAvailableQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => {
      const newIds = [...prev];
      allIds.forEach((id) => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      return newIds;
    });
  };

  const clearAllQuestions = () => setSelectedQuestionIds([]);

  const handleQuestionCreated = (newQuestion) => {
    fetchQuestions(1, 1000);
    if (newQuestion?.id) {
      setSelectedQuestionIds((prev) =>
        prev.includes(newQuestion.id) ? prev : [...prev, newQuestion.id],
      );
      message.success("Вопрос добавлен в тест!");
    }
    setActiveTab("select");
  };

  const getTestQuestionId = (q) => q?.id || q?.questionId;

  // актуальная версия теста из стора (после сохранений)
  const previewTest = useMemo(() => {
    if (!selectedTest) return null;
    return tests.find((x) => x.id === selectedTest.id) || selectedTest;
  }, [tests, selectedTest]);

  // вопросы теста: берём свежую версию из банка вопросов, если она есть
  const previewQuestions = useMemo(
    () =>
      (previewTest?.questions || []).map(
        (q) => questions.find((x) => x.id === getTestQuestionId(q)) || q,
      ),
    [previewTest, questions],
  );

  const buildQuestionsData = (questionIds, questionList) =>
    questionIds.map((questionId, index) => {
      const question = questionList.find((q) => q.id === questionId);
      const nType = getNumericType(question?.type);
      const apiType = getApiTypeString(nType);

      let correctAnswer = null;
      if (question) {
        if (nType === 2 && question.options?.length > 0) {
          const option = question.options[0];
          correctAnswer = {
            textRu: option.textRu || option.text || "",
            textTj: option.textTj || option.text || "",
          };
        } else if (nType === 1) {
          const correctOption = question.options?.find(
            (o) => o.isCorrect === true,
          );
          if (correctOption) {
            correctAnswer = {
              textRu: correctOption.textRu || correctOption.text || "",
              textTj: correctOption.textTj || correctOption.text || "",
            };
          }
        }
      }

      return {
        questionId,
        order: index + 1,
        type: apiType,
        correctAnswer,
        options: (question?.options || []).map((o) => ({
          textRu: o.textRu || o.text || "",
          textTj: o.textTj || o.text || "",
          isCorrect: !!o.isCorrect,
        })),
      };
    });

  const buildTestPayload = (test, questionIds, questionList) => ({
    titleRu: test.titleRu || test.title || test.titleTj || "",
    titleTj: test.titleTj || test.title || test.titleRu || "",
    descriptionRu: test.descriptionRu || test.description || "",
    descriptionTj: test.descriptionTj || test.description || "",
    testType: test.testType ?? 1,
    questions: buildQuestionsData(questionIds, questionList),
  });

  const saveTestQuestions = async (test, questionIds, questionList) => {
    await editTest(test.id, buildTestPayload(test, questionIds, questionList));
    await fetchTests(1, 1000);
  };

  const openEditQuestion = (question) => {
    const fresh =
      questions.find((q) => q.id === getTestQuestionId(question)) || question;
    setEditingQuestion({ ...fresh, id: getTestQuestionId(fresh) });
  };

  const handleQuestionUpdated = async (_, questionId) => {
    setEditingQuestion(null);
    await fetchQuestions(1, 1000);
    const freshQuestions = useQuestionStore.getState().questions || [];
    // тест хранит копию вариантов и правильного ответа — пересохраняем тест,
    // где используется вопрос (тест, открытый в мастере, сохранится сам)
    const owners = testTests.filter(
      (test) =>
        (!editingItem || test.id !== editingItem.id) &&
        test.questions?.some((q) => getTestQuestionId(q) === questionId),
    );
    try {
      for (const test of owners) {
        const ids = test.questions.map(getTestQuestionId).filter(Boolean);
        await editTest(test.id, buildTestPayload(test, ids, freshQuestions));
      }
      if (owners.length) await fetchTests(1, 1000);
    } catch (err) {
      console.error("Resync test error:", err);
      message.error("Вопрос сохранён, но тест не удалось обновить");
    }
  };

  const openAddToTest = () => {
    setAddSelectedIds([]);
    setAddSearch("");
    setAddTab("select");
    setAddToTestOpen(true);
  };

  const previewQuestionIds = (previewTest?.questions || [])
    .map(getTestQuestionId)
    .filter(Boolean);

  const addCandidates = previewTest
    ? getAvailableQuestions(previewTest.id).filter(
        (q) =>
          !previewQuestionIds.includes(q.id) &&
          getQuestionText(q).toLowerCase().includes(addSearch.toLowerCase()),
      )
    : [];

  const handleAddQuestionsToTest = async (
    extraIds,
    questionList = questions,
  ) => {
    if (!previewTest || extraIds.length === 0) return;
    setPreviewSaving(true);
    try {
      const ids = [
        ...previewQuestionIds,
        ...extraIds.filter((id) => !previewQuestionIds.includes(id)),
      ];
      await saveTestQuestions(previewTest, ids, questionList);
      message.success(
        extraIds.length === 1
          ? "Вопрос добавлен в тест"
          : `Добавлено вопросов: ${extraIds.length}`,
      );
      setAddToTestOpen(false);
      setAddSelectedIds([]);
    } catch (err) {
      console.error("Add questions to test error:", err);
      message.error(err.response?.data?.message || "Ошибка добавления");
    } finally {
      setPreviewSaving(false);
    }
  };

  const handleCreatedForTest = async (newQuestion) => {
    await fetchQuestions(1, 1000);
    if (newQuestion?.id) {
      await handleAddQuestionsToTest(
        [newQuestion.id],
        useQuestionStore.getState().questions || [],
      );
    }
  };

  const handleRemoveFromTest = async (questionId) => {
    if (!previewTest) return;
    const ids = previewQuestionIds.filter((id) => id !== questionId);
    if (ids.length === 0) {
      message.warning("В тесте должен остаться хотя бы один вопрос");
      return;
    }
    setPreviewSaving(true);
    try {
      await saveTestQuestions(previewTest, ids, questions);
      message.success("Вопрос убран из теста");
    } catch (err) {
      console.error("Remove from test error:", err);
      message.error(err.response?.data?.message || "Ошибка сохранения");
    } finally {
      setPreviewSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await removeQuestion(questionId);
      setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
      message.success("Вопрос удалён навсегда");
      await fetchQuestions(1, 1000);
    } catch (err) {
      console.error("Delete question error:", err);
      message.error("Ошибка удаления вопроса");
    }
  };

  // ==================== СОХРАНЕНИЕ ====================
  const handleSave = async () => {
    if (!isBilingualFilled(titleRu, titleTj)) {
      message.warning(t[lang].fillTitle);
      return;
    }
    if (selectedQuestionIds.length === 0) {
      message.warning(t[lang].selectQuestions);
      return;
    }

    const questionsData = buildQuestionsData(selectedQuestionIds, questions);

    const payload = {
      titleRu,
      titleTj,
      descriptionRu,
      descriptionTj,
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
          const element = document.getElementById(`test-${response.id}`);
          if (element)
            element.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // ==================== НАЗНАЧЕНИЕ ТЕСТА (админ) ====================
  // админ только назначает тест сотруднику, сам тест не проходит
  const handleAssignTest = async () => {
    if (!selectedTestId || !selectedEmployeeId) {
      message.warning("Выберите тест и сотрудника");
      return;
    }
    if (!canStartTest) {
      message.error("Сотрудник уже прошел этот тест.");
      return;
    }

    const hasAssignment = testAssignments.some(
      (a) => a.employeeId === selectedEmployeeId && a.testId === selectedTestId,
    );
    if (hasAssignment) {
      message.info("ℹ️ Тест уже назначен этому сотруднику");
      return;
    }

    setIsCreatingAssignment(true);
    message.loading({
      content: "Создание назначения...",
      key: "creating",
      duration: 0,
    });
    try {
      const url = `${API_BASE}/TestAssignment`;
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          testId: Number(selectedTestId),
          employeeId: Number(selectedEmployeeId),
        }),
      });
      const text = await response.text();
      message.destroy("creating");
      if (response.ok) {
        message.success("✅ Тест назначен!");
        await fetchTestAssignments(1, 1000);
        setTestModalOpen(false);
      } else if (response.status === 409) {
        message.info("ℹ️ Назначение уже существует");
        await fetchTestAssignments(1, 1000);
      } else {
        message.error("❌ Ошибка: " + (text || "Неизвестная ошибка"));
      }
    } catch (error) {
      message.destroy("creating");
      message.error("Ошибка при создании назначения: " + error.message);
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  // ==================== НАЧАЛО ТЕСТА (пользователь) ====================
  // пользователь проходит только назначенные ему тесты (список из /api/Test/my)
  const handleStartTest = () => {
    if (!selectedEmployeeId) {
      message.error(t[lang].noEmployeeProfile);
      return;
    }
    if (!selectedTestId) {
      message.warning(t[lang].selectTest);
      return;
    }
    if (!canStartTest) {
      message.error(t[lang].alreadyPassed);
      return;
    }
    const subDeptId = getEmployeeSubDepartment(selectedEmployeeId);

    if (existingSession) {
      Modal.confirm({
        title: "Незавершенная сессия",
        content: "У вас есть незавершенная сессия. Продолжить?",
        okText: "Продолжить",
        cancelText: "Отмена",
        onOk: () => {
          onStartTest({
            testId: selectedTestId,
            employeeId: selectedEmployeeId,
            duration: selectedTestDuration,
            subDepartmentId: subDeptId,
            session: existingSession,
            action: "continue",
          });
          setTestModalOpen(false);
        },
      });
      return;
    }

    setTestModalOpen(false);
    onStartTest({
      testId: selectedTestId,
      employeeId: selectedEmployeeId,
      duration: selectedTestDuration || 5,
      subDepartmentId: subDeptId,
      action: "start",
    });
  };

  const handleDurationChange = (value) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 480)
      setSelectedTestDuration(numValue);
    else if (value === "") setSelectedTestDuration(5);
  };

  const loading = testsLoading || sessionsLoading;

  // ==================== РЕНДЕР ====================
  if (loading && sessions.length === 0 && testTests.length === 0) {
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
      >
        <div>
          <Title
            level={2}
            style={{ margin: 0, color: "#f00", fontWeight: 400 }}
          >
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {testTests.length}{" "}
            {testTests.length === 1 ? "тест" : "тестов"}
          </Text>
        </div>
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => setTestModalOpen(true)}
            icon={isAdmin ? <UserOutlined /> : <PlayCircleOutlined />}
            size="large"
            style={{
              background: "#ff4b2b",
              borderColor: "#ff4b2b",
              borderRadius: 20,
            }}
          >
            {isAdmin ? t[lang].assignTest : t[lang].startTest}
          </Button>

          {isAdmin && (
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
                  lang === "ru"
                    ? test.descriptionRu || test.description
                    : test.descriptionTj || test.description;

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
                        {/* ═══ ВЕРХНИЙ БЛОК — красный градиент ═══ */}
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
                          {/* Декоративные круги */}
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
                          <div
                            style={{
                              position: "absolute",
                              bottom: -60,
                              right: 80,
                              width: 100,
                              height: 100,
                              borderRadius: "50%",
                              background: "rgba(255, 255, 255, 0.08)",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              top: 40,
                              left: -30,
                              width: 70,
                              height: 70,
                              borderRadius: "50%",
                              background: "rgba(255, 255, 255, 0.06)",
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
                                  textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                }}
                              >
                                {lang === "ru"
                                  ? test.titleRu || test.title || "Без названия"
                                  : test.titleTj || test.title || "Безунвон"}
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
                                    fontWeight: 500,
                                    backdropFilter: "blur(6px)",
                                  }}
                                >
                                  {questionCount} {t[lang].questionCount}
                                </Tag>
                              </div>
                            </div>
                          </Flex>

                          {isNew && (
                            <div
                              style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                zIndex: 3,
                                background: "rgba(255, 255, 255, 0.95)",
                                color: "#ff4b2b",
                                fontSize: 10,
                                fontWeight: 800,
                                padding: "3px 10px",
                                borderRadius: 10,
                                letterSpacing: 0.5,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              }}
                            >
                              NEW 🎉
                            </div>
                          )}
                        </div>

                        {/* ═══ ОПИСАНИЕ ═══ */}
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
                                lineHeight: 1.55,
                              }}
                            >
                              {hasDescription}
                            </Text>
                          </div>
                        )}

                        {/* ═══ НИЖНИЙ БЛОК — кнопки ═══ */}
                        {isAdmin && (
                          <div
                            style={{
                              padding: "14px 22px",
                              background: "#fafbff",
                              borderTop: "1px solid #f0f2f5",
                            }}
                          >
                            <Flex justify="end">
                              <Space wrap>
                                <Button
                                  icon={<LinkOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLinkModal(test);
                                  }}
                                  style={{
                                    borderRadius: 8,
                                    borderColor: "#ff4b2b", // было #722ed1
                                    color: "#ff4b2b", // было #722ed1
                                    fontWeight: 500,
                                  }}
                                >
                                  Для стажёра
                                </Button>

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
                                    fontWeight: 500,
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
                                    const newTotal = testTests.length - 1;
                                    const newTotalPages = Math.max(
                                      1,
                                      Math.ceil(newTotal / pageSize),
                                    );
                                    if (currentPage > newTotalPages)
                                      setCurrentPage(newTotalPages);
                                    await fetchTests(1, 1000);
                                  }}
                                  okText="Да"
                                  cancelText="Нет"
                                >
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ borderRadius: 8, fontWeight: 500 }}
                                  >
                                    {t[lang].delete}
                                  </Button>
                                </Popconfirm>
                              </Space>
                            </Flex>
                          </div>
                        )}

                        {/* ═══ Тонкая полоска снизу ═══ */}
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
              } else {
                setCurrentPage(page);
              }
            }}
          />
        </div>
      )}

      {/* ==================== МОДАЛКА "НАЧАТЬ ТЕСТ" ==================== */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircleOutlined style={{ color: "#ff4b2b" }} />
            <span>{isAdmin ? t[lang].assignTest : t[lang].startTest}</span>
          </div>
        }
        open={testModalOpen}
        onCancel={() => setTestModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setTestModalOpen(false)}>
            {t[lang].close}
          </Button>,
          isAdmin ? (
            <Button
              key="assign"
              type="primary"
              onClick={handleAssignTest}
              style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              disabled={
                !selectedTestId ||
                !selectedEmployeeId ||
                !canStartTest ||
                isCreatingAssignment
              }
              loading={isCreatingAssignment}
            >
              {isCreatingAssignment
                ? t[lang].creatingAssignment
                : t[lang].assign}
            </Button>
          ) : (
            <Button
              key="start"
              type="primary"
              onClick={handleStartTest}
              style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
              disabled={!selectedTestId || !selectedEmployeeId || !canStartTest}
            >
              {`${t[lang].startTest} (${selectedTestDuration} мин)`}
            </Button>
          ),
        ]}
        width={650}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {!isAdmin && dataLoaded && !selectedEmployeeId && (
            <Alert message={t[lang].noEmployeeProfile} type="error" showIcon />
          )}
          {!isAdmin && dataLoaded && testTests.length === 0 && (
            <Alert message={t[lang].noAssignedTests} type="info" showIcon />
          )}
          <div>
            <Text strong>{t[lang].test}:</Text>
            <Select
              placeholder={t[lang].selectTest}
              value={selectedTestId}
              onChange={(value) => setSelectedTestId(value)}
              style={{ width: "100%", marginTop: 8 }}
              showSearch
              // по умолчанию antd ищет по value (id), ищем по названию
              filterOption={(input, option) => {
                const test = testTests.find((x) => x.id === option?.value);
                if (!test) return false;
                return [test.titleRu, test.titleTj, test.title]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
                  .includes(input.toLowerCase());
              }}
              size="large"
            >
              {testTests.map((test) => (
                <Option key={test.id} value={test.id}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <BookOutlined />
                    {lang === "ru"
                      ? test.titleRu || test.title
                      : test.titleTj || test.title}
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {!isAdmin && (
            <>
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
                  {[5, 10, 15, 20, 30, 45, 60, 90].map((min) => (
                    <Button
                      key={min}
                      size="small"
                      type={
                        selectedTestDuration === min ? "primary" : "default"
                      }
                      onClick={() => setSelectedTestDuration(min)}
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
                description={`На прохождение теста дается ${selectedTestDuration} минут.`}
                type="info"
                showIcon
                icon={<HourglassOutlined />}
              />
            </>
          )}

          {isAdmin && (
            <>
              <div>
                <Text strong>Сотрудника</Text>
                <Select
                  placeholder={t[lang].selectEmployee}
                  value={selectedEmployeeId}
                  onChange={(value) => {
                    setSelectedEmployeeId(value);
                    setSelectedSubDepartmentId(null);
                  }}
                  style={{ width: "100%", marginTop: 8 }}
                  showSearch
                  // по умолчанию antd ищет по value (id), ищем по ФИО, email и отделу
                  filterOption={(input, option) => {
                    const emp = employees.find((e) => e.id === option?.value);
                    if (!emp) return false;
                    return [
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
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                  size="large"
                >
                  {Object.entries(groupedEmployees).map(
                    ([department, deptEmployees]) => (
                      <Select.OptGroup
                        key={department}
                        label={`Отдел: ${department}`}
                      >
                        {deptEmployees.map((emp) => (
                          <Option key={emp.id} value={emp.id}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <UserOutlined /> {emp.firstName} {emp.lastName}
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {emp.email}
                              </Text>
                              {emp.subDepartmentId && (
                                <Tag color="green" style={{ marginLeft: 4 }}>
                                  <ApartmentOutlined />{" "}
                                  {getSubDepartmentName(emp.subDepartmentId)}
                                </Tag>
                              )}
                            </div>
                          </Option>
                        ))}
                      </Select.OptGroup>
                    ),
                  )}
                </Select>
              </div>

              <div>
                <Text strong>Отделение</Text>
                {selectedEmployeeId ? (
                  selectedSubDepartmentId ? (
                    <Card
                      size="small"
                      style={{
                        marginTop: 8,
                        background: "#f6ffed",
                        borderColor: "#b7eb8f",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <ApartmentOutlined
                          style={{ color: "#52c41a", fontSize: 20 }}
                        />
                        <Text strong style={{ fontSize: 16 }}>
                          {getSubDepartmentName(selectedSubDepartmentId)}
                        </Text>
                        <Tag color="green" style={{ marginLeft: "auto" }}>
                          <CheckCircleOutlined />
                        </Tag>
                      </div>
                    </Card>
                  ) : (
                    <Alert
                      message="У сотрудника не указано отделение"
                      type="warning"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )
                ) : (
                  <Select
                    placeholder="Выберите отделение"
                    disabled
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    <Option value="">Сначала выберите сотрудника</Option>
                  </Select>
                )}
              </div>
            </>
          )}

          {selectedEmployeeId && selectedTestId && !canStartTest && (
            <Alert
              message={t[lang].alreadyPassed}
              description={t[lang].cannotRetake}
              type="error"
              showIcon
              icon={<StopOutlined />}
            />
          )}

          {!isAdmin &&
            selectedEmployeeId &&
            selectedTestId &&
            existingSession && (
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
                      onStartTest({
                        testId: selectedTestId,
                        employeeId: selectedEmployeeId,
                        duration: selectedTestDuration,
                        subDepartmentId: selectedSubDepartmentId,
                        session: existingSession,
                        action: "continue",
                      });
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

      {/* ==================== МОДАЛКА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ТЕСТА ==================== */}
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
                    <BilingualInput
                      valueRu={titleRu}
                      valueTj={titleTj}
                      onChangeRu={setTitleRu}
                      onChangeTj={setTitleTj}
                      placeholder={t[lang].testTitle}
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
                    <BilingualInput
                      textarea
                      rows={4}
                      valueRu={descriptionRu}
                      valueTj={descriptionTj}
                      onChangeRu={setDescriptionRu}
                      onChangeTj={setDescriptionTj}
                      placeholder={t[lang].description}
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
                  <div>
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
                              {editingItem
                                ? `В тесте: ${selectedQuestionIds.length} вопросов`
                                : `Доступно: ${availableQuestions.length} вопросов`}
                            </Tag>
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
                          <Flex
                            justify="space-between"
                            align="center"
                            wrap="wrap"
                            gap={12}
                          >
                            <Space size="middle" wrap>
                              <Button
                                icon={<PlusOutlined />}
                                onClick={selectAllQuestions}
                                style={{ borderRadius: 20 }}
                                disabled={
                                  filteredAvailableQuestions.length === 0
                                }
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
                                prefix={
                                  <SearchOutlined
                                    style={{ color: "#bfbfbf" }}
                                  />
                                }
                                size="middle"
                              />
                              <Select
                                value={filterType}
                                onChange={setFilterType}
                                style={{ width: 150 }}
                                size="middle"
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
                                {t[lang].showing} {displayQuestions.length}{" "}
                                {t[lang].of} {availableQuestions.length}{" "}
                                {t[lang].questionsFound}
                                {selectedQuestionIds.length > 0 && (
                                  <Tag
                                    color="red"
                                    style={{ marginLeft: 16, borderRadius: 20 }}
                                  >
                                    {t[lang].selected}:{" "}
                                    {selectedQuestionIds.length}
                                  </Tag>
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
                                : editingItem
                                  ? "В этом тесте нет вопросов"
                                  : questions.length === 0
                                    ? t[lang].createQuestionFirst
                                    : t[lang].noAvailableQuestions
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ padding: 40 }}
                          >
                            {!editingItem && questions.length === 0 && (
                              <Button
                                type="primary"
                                onClick={() => setActiveTab("create")}
                                style={{
                                  borderRadius: 20,
                                  background: "#ff4b2b",
                                  borderColor: "#ff4b2b",
                                }}
                              >
                                {t[lang].createQuestion}
                              </Button>
                            )}
                          </Empty>
                        ) : (
                          <div
                            style={{
                              maxHeight: 450,
                              overflow: "auto",
                              padding: "4px",
                            }}
                          >
                            <Row gutter={[16, 16]}>
                              {displayQuestions.map((question) => {
                                const isSelected = selectedQuestionIds.includes(
                                  question.id,
                                );
                                const isUsed =
                                  usedIds.has(question.id) &&
                                  !isSelected &&
                                  !editingItem;
                                const typeInfo = getTypeLabel(question.type);
                                const qType = getNumericType(question.type);
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
                                            message.warning(
                                              "Этот вопрос уже используется",
                                            );
                                            return;
                                          }
                                          toggleQuestionSelection(question.id);
                                        }}
                                        style={{
                                          cursor: isUsed
                                            ? "not-allowed"
                                            : "pointer",
                                          borderRadius: 16,
                                          border: isSelected
                                            ? "2px solid #ff4b2b"
                                            : "1px solid #e8e8e8",
                                          background: isSelected
                                            ? "linear-gradient(135deg, #fff5f5, #ffffff)"
                                            : isUsed
                                              ? "#f5f5f5"
                                              : "white",
                                          boxShadow: isSelected
                                            ? "0 4px 12px rgba(255, 75, 43, 0.15)"
                                            : "0 2px 8px rgba(0,0,0,0.06)",
                                          opacity: isUsed ? 0.6 : 1,
                                        }}
                                        styles={{
                                          body: { padding: "16px 20px" },
                                        }}
                                      >
                                        <Flex align="flex-start" gap={16}>
                                          <Checkbox
                                            checked={isSelected}
                                            onChange={() => {
                                              if (isUsed) {
                                                message.warning(
                                                  "Этот вопрос уже используется",
                                                );
                                                return;
                                              }
                                              toggleQuestionSelection(
                                                question.id,
                                              );
                                            }}
                                            disabled={isUsed}
                                            style={{
                                              flexShrink: 0,
                                              marginTop: 4,
                                            }}
                                          />
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text
                                              style={{
                                                fontSize: 15,
                                                display: "block",
                                                fontWeight: isSelected
                                                  ? 500
                                                  : 400,
                                              }}
                                            >
                                              {getQuestionText(question)}
                                            </Text>
                                            <Flex
                                              gap={8}
                                              style={{ marginTop: 8 }}
                                              wrap="wrap"
                                            >
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
                                              {isUsed && !isSelected && (
                                                <Tag
                                                  color="red"
                                                  style={{
                                                    borderRadius: 20,
                                                    border: "none",
                                                  }}
                                                >
                                                  🔒 {t[lang].usedInTests}
                                                </Tag>
                                              )}
                                              {editingItem && isSelected && (
                                                <Tag
                                                  color="blue"
                                                  style={{
                                                    borderRadius: 20,
                                                    border: "none",
                                                  }}
                                                >
                                                  📝 В текущем тесте
                                                </Tag>
                                              )}
                                            </Flex>

                                            {qType === 1 &&
                                              question.options &&
                                              question.options.length > 0 && (
                                                <div
                                                  style={{
                                                    marginTop: 10,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                  }}
                                                >
                                                  {question.options.map(
                                                    (opt, oi) => (
                                                      <div
                                                        key={oi}
                                                        style={{
                                                          fontSize: 13,
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: 6,
                                                        }}
                                                      >
                                                        <span
                                                          style={{
                                                            display:
                                                              "inline-block",
                                                            width: 20,
                                                            height: 20,
                                                            lineHeight: "20px",
                                                            textAlign: "center",
                                                            borderRadius: "50%",
                                                            background:
                                                              opt.isCorrect
                                                                ? "#52c41a"
                                                                : "#f0f0f0",
                                                            color: opt.isCorrect
                                                              ? "#fff"
                                                              : "#666",
                                                            fontSize: 11,
                                                            fontWeight: "bold",
                                                            flexShrink: 0,
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
                                                            color: opt.isCorrect
                                                              ? "#52c41a"
                                                              : "#333",
                                                            fontWeight:
                                                              opt.isCorrect
                                                                ? 500
                                                                : 400,
                                                          }}
                                                        >
                                                          {getOptTextSafe(
                                                            opt,
                                                            lang,
                                                          )}
                                                          {opt.isCorrect &&
                                                            " ✅"}
                                                        </Text>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              )}

                                            {qType === 2 && (
                                              <div style={{ marginTop: 8 }}>
                                                <Text
                                                  type="secondary"
                                                  style={{ fontSize: 12 }}
                                                >
                                                  ✏️{" "}
                                                  {lang === "ru"
                                                    ? "Открытый ответ"
                                                    : "Ҷавоби кушод"}
                                                  {getCorrectAnswerText(
                                                    question,
                                                  ) !== "—" &&
                                                    getCorrectAnswerText(
                                                      question,
                                                    ) !==
                                                      "Развёрнутый ответ" && (
                                                      <>
                                                        {" "}
                                                        — эталон:{" "}
                                                        {getCorrectAnswerText(
                                                          question,
                                                        )}
                                                      </>
                                                    )}
                                                </Text>
                                              </div>
                                            )}

                                            {qType === 3 && (
                                              <div style={{ marginTop: 8 }}>
                                                <Text
                                                  type="secondary"
                                                  style={{ fontSize: 12 }}
                                                >
                                                  ⭐{" "}
                                                  {lang === "ru"
                                                    ? "Рейтинг от 1 до 10"
                                                    : "Баҳо аз 1 то 10"}
                                                </Text>
                                              </div>
                                            )}
                                          </div>

                                          <Flex
                                            vertical
                                            align="center"
                                            gap={6}
                                            style={{
                                              flexShrink: 0,
                                              marginTop: 4,
                                            }}
                                          >
                                            {isSelected && (
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
                                                  boxShadow:
                                                    "0 2px 8px rgba(255, 75, 43, 0.3)",
                                                }}
                                              >
                                                <CheckOutlined />
                                              </div>
                                            )}

                                            {isSelected && (
                                              <Popconfirm
                                                title="Убрать из теста?"
                                                description="Вопрос останется в базе данных"
                                                onConfirm={(e) => {
                                                  e?.stopPropagation();
                                                  toggleQuestionSelection(
                                                    question.id,
                                                  );
                                                }}
                                                onCancel={(e) =>
                                                  e?.stopPropagation()
                                                }
                                                okText="Да"
                                                cancelText="Нет"
                                              >
                                                <Button
                                                  type="text"
                                                  size="small"
                                                  icon={<MinusOutlined />}
                                                  title="Убрать из теста"
                                                  onClick={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  style={{ color: "#faad14" }}
                                                />
                                              </Popconfirm>
                                            )}

                                            <Button
                                              type="text"
                                              size="small"
                                              icon={<EditOutlined />}
                                              title="Редактировать вопрос"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditQuestion(question);
                                              }}
                                              style={{ color: "#1677ff" }}
                                            />

                                            <Popconfirm
                                              title="Удалить вопрос навсегда?"
                                              description="Вопрос исчезнет из базы данных. Действие нельзя отменить!"
                                              onConfirm={(e) => {
                                                e?.stopPropagation();
                                                handleDeleteQuestion(
                                                  question.id,
                                                );
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
                                                title="Удалить вопрос навсегда"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              />
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
                            correctAnswer: t[lang].correctAnswer,
                            selectRating: t[lang].selectRating,
                          }}
                        />
                      </TabPane>
                    </Tabs>
                  </div>
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
                            {lang === "ru"
                              ? titleRu || "Без названия"
                              : titleTj || "Безунвон"}
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
                        📋 {t[lang].questionsInfo}:
                      </Text>
                      <div style={{ maxHeight: 300, overflow: "auto" }}>
                        <Table
                          dataSource={selectedQuestions}
                          rowKey="id"
                          columns={[
                            {
                              title: t[lang].order,
                              key: "order",
                              width: 80,
                              render: (_, __, index) => (
                                <Badge
                                  count={index + 1}
                                  style={{ backgroundColor: "#ff4b2b" }}
                                />
                              ),
                            },
                            {
                              title: t[lang].questionText,
                              key: "questionText",
                              render: (_, record) => (
                                <div>
                                  <Text style={{ fontSize: 14 }}>
                                    {getQuestionText(record)}
                                  </Text>
                                  <div style={{ marginTop: 4 }}>
                                    <Tag color="green" style={{ fontSize: 12 }}>
                                      {t[lang].manualAnswer}:{" "}
                                      {getCorrectAnswerText(record)}
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
                            {
                              title: "",
                              key: "actions",
                              width: 60,
                              render: (_, record) => (
                                <Popconfirm
                                  title="Удалить вопрос из теста?"
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
                                    title="Удалить вопрос из теста"
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

      {/* ==================== МОДАЛКА ПРЕДПРОСМОТРА ==================== */}
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
              {lang === "ru"
                ? previewTest?.titleRu || previewTest?.title || "Без названия"
                : previewTest?.titleTj || previewTest?.title || "Безунвон"}
            </span>
            <Space wrap>
              <Tag
                color="blue"
                style={{ borderRadius: 20, padding: "4px 12px" }}
              >
                <ClockCircleOutlined /> {previewTest?.questions?.length || 0}{" "}
                {t[lang].questionCount}
              </Tag>
              {isAdmin && (
                <>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={openAddToTest}
                    style={{ borderRadius: 8 }}
                  >
                    {lang === "ru" ? "Добавить вопрос" : "Илова кардани савол"}
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      setPreviewOpen(false);
                      openEditModal(previewTest);
                    }}
                    style={{
                      borderRadius: 8,
                      borderColor: "#ff4b2b",
                      color: "#ff4b2b",
                    }}
                  >
                    {t[lang].edit}
                  </Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        {previewTest &&
          (previewTest.descriptionRu ||
            previewTest.description ||
            previewTest.descriptionTj) && (
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
                {lang === "ru"
                  ? previewTest.descriptionRu || previewTest.description
                  : previewTest.descriptionTj || previewTest.description}
              </Text>
            </div>
          )}

        <Table
          dataSource={previewQuestions}
          loading={previewSaving}
          rowKey={(r) => r.id || r.questionId}
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
              title: lang === "ru" ? "Вопрос" : "Савол",
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
                          ✏️ {lang === "ru" ? "Открытый ответ" : "Ҷавоби кушод"}
                        </Tag>
                      </div>
                    )}

                    {qType === 3 && (
                      <div style={{ marginTop: 6 }}>
                        <Tag
                          color="orange"
                          style={{ borderRadius: 20, border: "none" }}
                        >
                          ⭐ {lang === "ru" ? "Рейтинг 1-10" : "Баҳо 1-10"}
                        </Tag>
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              title: lang === "ru" ? "Тип" : "Навъ",
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
            ...(isAdmin
              ? [
                  {
                    title: "",
                    key: "actions",
                    width: 100,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          title="Редактировать вопрос"
                          onClick={() => openEditQuestion(record)}
                          style={{ color: "#1677ff" }}
                        />
                        <Popconfirm
                          title="Убрать из теста?"
                          description="Вопрос останется в базе данных"
                          onConfirm={() =>
                            handleRemoveFromTest(getTestQuestionId(record))
                          }
                          okText="Да"
                          cancelText="Нет"
                        >
                          <Button
                            type="text"
                            icon={<MinusOutlined />}
                            title="Убрать из теста"
                            style={{ color: "#faad14" }}
                          />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]
              : []),
          ]}
          pagination={false}
          locale={{ emptyText: t[lang].noQuestionsInTest }}
        />

        <div
          style={{
            marginTop: 20,
            padding: "16px 20px",
            background: "#f8f9fa",
            borderRadius: 12,
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div style={{ textAlign: "center" }}>
                <QuestionCircleOutlined
                  style={{ fontSize: 24, color: "#ff4b2b" }}
                />
                <div style={{ fontSize: 20, fontWeight: "bold" }}>
                  {previewTest?.questions?.length || 0}
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                  {t[lang].totalQuestionsLabel}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ textAlign: "center" }}>
                <ClockCircleOutlined
                  style={{ fontSize: 24, color: "#1890ff" }}
                />
                <div style={{ fontSize: 20, fontWeight: "bold" }}>
                  {previewTest?.createdAt
                    ? new Date(previewTest.createdAt).toLocaleDateString(
                        lang === "ru" ? "ru-RU" : "tj-TJ",
                      )
                    : "—"}
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                  {t[lang].created}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Modal>

      {/* ==================== ДОБАВЛЕНИЕ ВОПРОСОВ В ТЕСТ ==================== */}
      <Modal
        open={addToTestOpen}
        onCancel={() => setAddToTestOpen(false)}
        width={800}
        destroyOnClose
        title={
          <Space>
            <PlusOutlined style={{ color: "#ff4b2b" }} />
            {lang === "ru" ? "Добавить вопросы в тест" : "Илова ба тест"}
          </Space>
        }
        footer={
          addTab === "select" ? (
            <Flex justify="space-between" align="center">
              <Text type="secondary">
                {t[lang].selected}: {addSelectedIds.length}
              </Text>
              <Space>
                <Button onClick={() => setAddToTestOpen(false)}>
                  {t[lang].cancel}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={previewSaving}
                  disabled={addSelectedIds.length === 0}
                  onClick={() => handleAddQuestionsToTest(addSelectedIds)}
                  style={{ background: "#ff4b2b", borderColor: "#ff4b2b" }}
                >
                  {lang === "ru" ? "Добавить" : "Илова"}
                </Button>
              </Space>
            </Flex>
          ) : null
        }
      >
        <Tabs activeKey={addTab} onChange={setAddTab}>
          <TabPane
            key="select"
            tab={
              <span>
                <FormOutlined /> {t[lang].selectQuestionsTab}
              </span>
            }
          >
            <Input
              placeholder={t[lang].searchPlaceholder}
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              style={{ marginBottom: 12, borderRadius: 20 }}
            />
            {addCandidates.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t[lang].noAvailableQuestions}
              >
                <Button
                  type="primary"
                  onClick={() => setAddTab("create")}
                  style={{ borderRadius: 20, background: "#ff4b2b" }}
                >
                  {t[lang].createQuestionTab}
                </Button>
              </Empty>
            ) : (
              <div style={{ maxHeight: 400, overflow: "auto" }}>
                {addCandidates.map((q) => {
                  const checked = addSelectedIds.includes(q.id);
                  const typeInfo = getTypeLabel(q.type);
                  return (
                    <Flex
                      key={q.id}
                      align="center"
                      gap={10}
                      onClick={() =>
                        setAddSelectedIds((prev) =>
                          prev.includes(q.id)
                            ? prev.filter((id) => id !== q.id)
                            : [...prev, q.id],
                        )
                      }
                      style={{
                        padding: "10px 12px",
                        marginBottom: 6,
                        borderRadius: 10,
                        cursor: "pointer",
                        border: checked
                          ? "2px solid #ff4b2b"
                          : "1px solid #f0f0f0",
                        background: checked ? "#fff5f5" : "#fafafa",
                      }}
                    >
                      <Checkbox checked={checked} />
                      <Text style={{ flex: 1 }}>{getQuestionText(q)}</Text>
                      <Tag
                        color={typeInfo.color}
                        style={{ borderRadius: 20, border: "none" }}
                      >
                        {typeInfo.label}
                      </Tag>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        title="Редактировать вопрос"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditQuestion(q);
                        }}
                        style={{ color: "#1677ff" }}
                      />
                    </Flex>
                  );
                })}
              </div>
            )}
          </TabPane>
          <TabPane
            key="create"
            tab={
              <span>
                <PlusOutlined /> {t[lang].createQuestionTab}
              </span>
            }
          >
            <QuestionCreator
              onQuestionCreated={handleCreatedForTest}
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
      </Modal>

      {/* ==================== РЕДАКТИРОВАНИЕ ВОПРОСА ==================== */}
      <Modal
        open={!!editingQuestion}
        onCancel={() => setEditingQuestion(null)}
        footer={null}
        width={720}
        destroyOnClose
        title={
          <Space>
            <EditOutlined style={{ color: "#ff4b2b" }} />
            {lang === "ru" ? "Редактирование вопроса" : "Тағйири савол"}
          </Space>
        }
      >
        {editingQuestion && (
          <QuestionCreator
            key={editingQuestion.id}
            initialQuestion={editingQuestion}
            onQuestionUpdated={handleQuestionUpdated}
            onCancel={() => setEditingQuestion(null)}
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
        )}
      </Modal>

      <OneTimeLinkModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        test={linkForTest}
        apiBase={API_BASE}
        lang={lang}
      />
    </div>
  );
};

export default TestManager;
