import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  Progress,
  Pagination,
  Checkbox,
  Badge,
  Select,
  Radio,
  Divider,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  RocketOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SaveOutlined,
  StarOutlined,
  UserOutlined,
  ApartmentOutlined,
  PlayCircleOutlined,
  FormOutlined,
  SendOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { BilingualInput } from "../components/BilingualInput";
import {
  isBilingualFilled,
  isBilingualPartial,
} from "../utils/bilingual";
import { getCurrentEmployeeId } from "../utils/currentEmployee";
import { BulkEmployeeSelect } from "../components/BulkEmployeeSelect";
import { createTestAssignmentsBulk } from "../services/api.service.testAssignment";
import {
  startTestSession,
  submitSessionAnswer,
  finishTestSession,
} from "../services/api.service.testSession";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const API_BASE = "http://10.65.10.22:8525/api";
const SURVEY_TEST_TYPE = "Quiz";

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

const normalizeTypeForApi = (type) => {
  const n = getNumericType(type);
  if (n === 2) return 2;
  if (n === 3) return 3;
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
    const flat = [];
    for (const item of raw) {
      if (item && typeof item === "object" && Array.isArray(item.$values)) {
        flat.push(...item.$values);
      } else {
        flat.push(item);
      }
    }
    return flat;
  }
  const keys = [
    "data",
    "items",
    "results",
    "$values",
    "Data",
    "Items",
    "Results",
  ];
  for (const k of keys) {
    if (raw[k] !== undefined) {
      const r = extractItems(raw[k]);
      if (r.length > 0) return r;
    }
  }
  return [];
};

const normalizeQuestion = (q) => {
  if (!q) return q;
  const content = (
    q.content ||
    q.contentRu ||
    q.contentTj ||
    q.Content ||
    q.ContentRu ||
    q.ContentTj ||
    ""
  ).trim();

  const rawOptions = Array.isArray(q.options)
    ? q.options
    : Array.isArray(q.Options)
      ? q.Options
      : Array.isArray(q.$values)
        ? q.$values
        : [];

  return {
    ...q,
    id: q.id ?? q.Id ?? q.questionId ?? q.QuestionId,
    content,
    contentRu: q.contentRu || q.ContentRu || content,
    contentTj: q.contentTj || q.ContentTj || content,
    type: getNumericType(q.type ?? q.Type),
    optionId: q.optionId ?? q.OptionId,
    options: rawOptions.map((o) => ({
      ...o,
      id: o.id ?? o.Id,
      text: o.text || o.textRu || o.textTj || "",
      textRu: o.textRu || o.TextRu || o.text || o.textTj || "",
      textTj: o.textTj || o.TextTj || o.text || o.textRu || "",
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

const getSurveyTitle = (sv, lang = "ru") =>
  (lang === "ru"
    ? sv?.titleRu || sv?.title || sv?.titleTj
    : sv?.titleTj || sv?.title || sv?.titleRu) || "";

const getSurveyDesc = (sv, lang = "ru") =>
  (lang === "ru"
    ? sv?.descriptionRu || sv?.description || sv?.descriptionTj
    : sv?.descriptionTj || sv?.description || sv?.descriptionRu) || "";

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
// ⭐ ЗАГРУЗКА ВОПРОСОВ
// ============================================================
const loadAllQuestionsFromApi = async (language = "ru") => {
  const tryFetch = async (params) => {
    try {
      const r = await axios.get(`${API_BASE}/Question`, { params });
      return extractItems(r.data);
    } catch (e) {
      console.warn("Fetch failed:", params, e?.message);
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

  if (items.length === 0) {
    items = await tryFetch({ PageNumber: 1, PageSize: 2000 });
  }

  const seen = new Set();
  const unique = [];
  for (const q of items) {
    const id = q?.id ?? q?.Id ?? q?.questionId ?? q?.QuestionId;
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
// QuestionCreator — 3 типа
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
  const [creating, setCreating] = useState(false);

  const letters = ["A", "B", "C", "D", "E", "F"];

  const addOption = () => {
    if (options.length >= 6) return message.warning("Максимум 6 вариантов");
    setOptions([...options, { textRu: "", textTj: "" }]);
  };
  const updateOption = (i, field, v) => {
    setOptions(options.map((o, idx) => (idx === i ? { ...o, [field]: v } : o)));
  };
  const deleteOption = (i) => {
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!isBilingualFilled(contentRu, contentTj))
      return message.warning("Введите текст вопроса на двух языках (RU и TJ)");

    const apiType = normalizeTypeForApi(type);
    const nType = getNumericType(type);

    let payload;
    if (nType === 1) {
      if (!options.length) return message.warning("Добавьте варианты");
      if (options.some((o) => !isBilingualFilled(o.textRu, o.textTj)))
        return message.warning("Заполните все варианты на двух языках (RU и TJ)");

      const hasCorrect = options.some((o) => o.isCorrect);
      payload = {
        contentRu,
        contentTj,
        type: apiType,
        isSurvey: false,
        options: options.map((o, i) => ({
          textRu: o.textRu,
          textTj: o.textTj,
          isCorrect: hasCorrect ? !!o.isCorrect : i === 0,
          questionId: isEdit ? initialQuestion.id : 0,
        })),
      };
    } else if (nType === 2) {
      if (isBilingualPartial(manualAnswerRu, manualAnswerTj))
        return message.warning(
          "Введите эталонный ответ на двух языках (RU и TJ)",
        );
      payload = {
        contentRu,
        contentTj,
        type: apiType,
        isSurvey: true,
        options: manualAnswerRu.trim()
          ? [
              {
                textRu: manualAnswerRu,
                textTj: manualAnswerTj,
                isCorrect: true,
                questionId: isEdit ? initialQuestion.id : 0,
              },
            ]
          : [],
      };
    } else {
      payload = {
        contentRu,
        contentTj,
        type: apiType,
        isSurvey: true,
        options: [],
      };
    }

    setCreating(true);
    try {
      if (isEdit) {
        const res = await editQuestion(initialQuestion.id, payload);
        message.success("Вопрос обновлён");
        if (onQuestionUpdated) onQuestionUpdated(res, initialQuestion.id);
        return;
      }
      const res = await addQuestion(payload);
      message.success("Вопрос создан! 🎉");
      setContentRu("");
      setContentTj("");
      setOptions([]);
      setManualAnswerRu("");
      setManualAnswerTj("");
      setType(1);
      if (onQuestionCreated) onQuestionCreated(res);
    } catch (err) {
      console.error("❌ Error saving question:", err);
      console.error("❌ Response:", err?.response);
      console.error("❌ Payload was:", payload);
      message.error(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          (isEdit ? "Ошибка при сохранении" : "Ошибка при создании"),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <Alert
        message={isEdit ? "Редактирование вопроса" : "Создание нового вопроса"}
        description="«Тест» — с выбором ответа, «Ручной» — открытый, «Рейтинг» — оценка от 1 до 10."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 12 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
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
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Тип вопроса:
        </Text>
        <Radio.Group
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setOptions([]);
            setManualAnswerRu("");
            setManualAnswerTj("");
          }}
        >
          <Radio value={1}>{t.test}</Radio>
          <Radio value={2}>{t.manual}</Radio>
          <Radio value={3}>{t.rating}</Radio>
        </Radio.Group>
      </div>

      {getNumericType(type) === 1 && (
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
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#f0f0f0",
                          color: "#666",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: 14,
                        }}
                      >
                        {letters[i]}
                      </div>
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

      {getNumericType(type) === 2 && (
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

      {getNumericType(type) === 3 && (
        <Alert
          message="Рейтинг"
          description="Вопрос-оценка. При прохождении сотрудник выберет число от 1 до 10. Правильный ответ не требуется."
          type="warning"
          showIcon
          icon={<StarOutlined />}
          style={{ borderRadius: 10 }}
        />
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
          onClick={handleSave}
          loading={creating}
          icon={<SaveOutlined />}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 10,
            background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
            border: "none",
          }}
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
// SurveyTaking
// ============================================================
const SurveyTaking = ({
  survey,
  questions,
  onComplete,
  onClose,
  employeeId,
  lang,
}) => {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(true);

  // сессия на бэке создаётся сразу при открытии опроса
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const res = await startTestSession(survey.id, employeeId);
        setSession(res?.data || res);
      } catch (e) {
        message.error(
          e?.response?.data?.message || "Ошибка при начале опроса",
        );
      } finally {
        setStarting(false);
      }
    })();
  }, [survey.id, employeeId]);

  const total = questions.length;

  const currentQuestion = questions[idx];
  const answered = Object.keys(answers).length;

  const handleAnswer = (qid, val) => setAnswers((p) => ({ ...p, [qid]: val }));
  const next = () => idx < total - 1 && setIdx(idx + 1);
  const prev = () => idx > 0 && setIdx(idx - 1);

  const handleComplete = async () => {
    if (answered < total) {
      message.warning(`Ответьте на все вопросы. Осталось ${total - answered}`);
      return;
    }
    if (!session?.id) {
      message.error("Сессия опроса не создана");
      return;
    }
    setIsSubmitting(true);
    try {
      // ответы в том же формате, что и в TestSession
      for (const q of questions) {
        const v = answers[q.id];
        const qType = getNumericType(q.type);
        if (qType === 1) await submitSessionAnswer(session.id, q.id, v);
        else if (qType === 2)
          await submitSessionAnswer(session.id, q.id, null, String(v));
        else if (qType === 3)
          await submitSessionAnswer(session.id, q.id, v, `Рейтинг: ${v}/10`);
      }
      await finishTestSession(session.id, employeeId);

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
          String(r.employeeId) === String(result.employeeId),
      );
      if (i !== -1) all[i] = { ...all[i], ...result };
      else all.push(result);
      localStorage.setItem("survey_results", JSON.stringify(all));

      setIsCompleted(true);
      message.success("Опрос завершён!");
      if (onComplete) onComplete(result);
      setTimeout(() => onClose && onClose(), 1500);
    } catch (e) {
      message.error(e?.response?.data?.message || "Ошибка завершения");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (starting)
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );

  if (!session)
    return <Empty description="Не удалось начать опрос" />;

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

  return (
    <div>
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
        strokeColor="#ff4b2b"
        style={{ marginBottom: 16 }}
      />

      <Card style={{ borderRadius: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">Вопрос {idx + 1}</Tag>
          {ctype === 1 && <Tag color="green">Тест</Tag>}
          {ctype === 2 && <Tag color="purple">Ручной</Tag>}
          {ctype === 3 && <Tag color="orange">Рейтинг</Tag>}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 500,
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
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
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: sel ? "#fff5f5" : "#fafafa",
                      border: sel ? "2px solid #ff4b2b" : "1px solid #e8e8e8",
                      cursor: "pointer",
                    }}
                  >
                    <Radio value={o.id || i}>
                      <Text style={{ fontSize: 15 }}>
                        {getOptTextSafe(o, lang)}
                      </Text>
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
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const active = Number(answers[currentQuestion.id]) === num;
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
                      background: active
                        ? "linear-gradient(135deg, #ff416c, #ff4b2b)"
                        : "#f5f5f5",
                      color: active ? "#fff" : "#333",
                      border: active
                        ? "3px solid #ffd6d6"
                        : "1px solid #d9d9d9",
                      transition: "0.2s",
                      userSelect: "none",
                    }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
            {answers[currentQuestion.id] !== undefined && (
              <div style={{ marginTop: 12 }}>
                <Tag color="orange" style={{ borderRadius: 20 }}>
                  <StarOutlined /> Ваша оценка: {answers[currentQuestion.id]}
                </Tag>
              </div>
            )}
          </div>
        )}
      </Card>

      <Flex justify="space-between">
        <Button
          icon={<LeftOutlined />}
          onClick={prev}
          disabled={idx === 0}
          size="large"
        >
          Назад
        </Button>
        {idx === total - 1 ? (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => handleComplete()}
            loading={isSubmitting}
            size="large"
            style={{
              background: "#52c41a",
              borderColor: "transparent",
            }}
          >
            Завершить
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<RightOutlined />}
            onClick={next}
            size="large"
            style={{ background: "#ff4b2b" }}
          >
            Далее
          </Button>
        )}
      </Flex>

      <div style={{ marginTop: 24 }}>
        <Text
          type="secondary"
          style={{ display: "block", marginBottom: 10, fontSize: 13 }}
        >
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
                  background:
                    isA && !isC ? "#52c41a" : isC ? "#ff4b2b" : undefined,
                  borderColor: isC ? "#ff4b2b" : undefined,
                  color: isA && !isC ? "#fff" : undefined,
                  width: 32,
                  height: 32,
                  padding: 0,
                  borderRadius: 8,
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
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState([]);

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [takingOpen, setTakingOpen] = useState(false);
  const [takingSurvey, setTakingSurvey] = useState(null);
  const [takingEmpId, setTakingEmpId] = useState(null);

  const roles = useMemo(() => readRoles(), []);
  const isAdmin = useMemo(() => isAdminOrSuper(roles), [roles]);

  // админ назначает опрос, обычный пользователь проходит его сам за себя
  const currentEmployeeId = useMemo(
    () => (isAdmin ? null : getCurrentEmployeeId(employees, tests)),
    [isAdmin, tests, employees],
  );
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isAdmin) setSelEmpId(currentEmployeeId);
  }, [isAdmin, currentEmployeeId]);

  const surveyItems = useMemo(() => (tests || []).filter(isSurvey), [tests]);

  const loadSurveyQuestions = useCallback(async () => {
    setSurveyQuestionsLoading(true);
    try {
      const list = await loadAllQuestionsFromApi(lang);
      setSurveyQuestions(list);
    } catch (e) {
      console.error("loadSurveyQuestions error:", e);
      message.error("Ошибка загрузки вопросов");
    } finally {
      setSurveyQuestionsLoading(false);
    }
  }, [lang]);

  const totalCount = surveyItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSurveys = surveyItems.slice(startIndex, startIndex + pageSize);

  const getQuestionText = useCallback((q) => getQTextSafe(q, lang), [lang]);

  // ⭐ Тег "Тест" — ЗЕЛЁНЫЙ (как вы просили)
  const getTypeLabel = useCallback(
    (type) => {
      const n = getNumericType(type);
      if (n === 1)
        return {
          label: lang === "ru" ? "Тест" : "Тест",
          color: "#52c41a", // ⭐ зелёный
          icon: <CheckCircleOutlined />,
        };
      if (n === 2)
        return {
          label: lang === "ru" ? "Ручной" : "Дастӣ",
          color: "#722ed1",
          icon: <FormOutlined />,
        };
      if (n === 3)
        return {
          label: lang === "ru" ? "Рейтинг" : "Баҳо",
          color: "#faad14",
          icon: <StarOutlined />,
        };
      return {
        label: "Тест",
        color: "#52c41a",
        icon: <CheckCircleOutlined />,
      };
    },
    [lang],
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
    [surveyItems],
  );

  const getAvailableQuestions = useCallback(
    (excludeId = null) => {
      const usedIds = getUsedQuestionIds(excludeId);
      return surveyQuestions.filter((q) => {
        if (q.id == null) return false;
        if (usedIds.has(q.id)) return false;
        return true;
      });
    },
    [surveyQuestions, getUsedQuestionIds],
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

  // кому выбранный опрос уже назначен напрямую — повторно не назначаем
  const excludedEmployeeIds = useMemo(() => {
    const ids = new Map();
    if (!selSurveyId) return ids;
    testAssignments.forEach((a) => {
      if (a.testId === selSurveyId && a.employeeId)
        ids.set(a.employeeId, "assigned");
    });
    return ids;
  }, [selSurveyId, testAssignments]);

  const assignEmployeeIds = useMemo(
    () => bulkEmployeeIds.filter((id) => !excludedEmployeeIds.has(id)),
    [bulkEmployeeIds, excludedEmployeeIds],
  );

  useEffect(() => {
    (async () => {
      try {
        // allSettled: у обычного пользователя часть справочников может быть недоступна
        await Promise.allSettled([
          fetchTests(1, 1000, lang),
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

  // при смене языка бэк отдаёт опросы и вопросы на этом языке — перезапрашиваем
  const langMounted = useRef(false);
  useEffect(() => {
    if (!langMounted.current) {
      langMounted.current = true;
      return;
    }
    fetchTests(1, 1000, lang);
    loadSurveyQuestions();
    // eslint-disable-next-line
  }, [lang]);

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
      selectedQIds
        .map((id) => surveyQuestions.find((q) => q.id === id))
        .filter(Boolean),
    [selectedQIds, surveyQuestions],
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
      fillTitle: "Заполните название на двух языках (RU и TJ)",
      fillDescription:
        "Заполните описание на двух языках (RU и TJ) или оставьте оба поля пустыми",
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
      assignSurvey: "Назначить опрос",
      assign: "Назначить",
      noEmployeeProfile: "Профиль сотрудника не найден",
      noAssignedSurveys: "Вам пока не назначено ни одного опроса",
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
      addQuestion: "Добавить вопрос",
      editQuestion: "Редактировать вопрос",
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
      fillTitle: "Номро бо ду забон (RU ва TJ) пур кунед",
      fillDescription:
        "Тавсифро бо ду забон (RU ва TJ) пур кунед ё ҳарду майдонро холӣ гузоред",
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
      assignSurvey: "Таъин кардани пурсиш",
      assign: "Таъин кардан",
      noEmployeeProfile: "Профили корманд ёфт нашуд",
      noAssignedSurveys: "Ба шумо ҳоло ягон пурсиш таъин нашудааст",
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
      addQuestion: "Илова кардани савол",
      editQuestion: "Тағйири савол",
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
    const ids =
      sv.questions?.map((q) => q.id || q.questionId).filter(Boolean) || [];
    setSelectedQIds(ids);
    setActiveTab("select");
    setOpen(true);
  };

  const openPreview = (sv) => {
    setSelectedSurvey(sv);
    setPreviewOpen(true);
  };

  // Из предпросмотра: сразу на шаг «Вопросы» → вкладка создания
  const openAddQuestions = (sv) => {
    setPreviewOpen(false);
    openEdit(sv);
    setStep(1);
    setActiveTab("create");
  };

  const handleQuestionUpdated = async () => {
    setEditingQuestion(null);
    await loadSurveyQuestions();
  };

  const handleNext = () => {
    if (step === 0) {
      if (!isBilingualFilled(titleRu, titleTj))
        return message.warning(t[lang].fillTitle);
      if (isBilingualPartial(descRu, descTj))
        return message.warning(t[lang].fillDescription);
    }
    if (step === 1 && selectedQIds.length === 0)
      return message.warning(t[lang].selectQuestions);
    setStep(step + 1);
  };

  const toggleQ = (id) =>
    setSelectedQIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
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
    if (!isBilingualFilled(titleRu, titleTj))
      return message.warning(t[lang].fillTitle);
    if (selectedQIds.length === 0)
      return message.warning(t[lang].selectQuestions);

    const questionsData = selectedQIds.map((qid, i) => {
      const q = surveyQuestions.find((x) => x.id === qid);
      const nType = getNumericType(q?.type);
      const apiType = normalizeTypeForApi(nType);

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
          questionId: qid,
        })),
      };
    });

    const payload = {
      titleRu,
      titleTj,
      descriptionRu: descRu,
      descriptionTj: descTj,
      testType: SURVEY_TEST_TYPE,
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
          "Ошибка сохранения",
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

  // ==================== НАЗНАЧЕНИЕ ОПРОСА (админ) ====================
  // админ назначает опрос одному или сразу нескольким сотрудникам
  const handleAssignSurvey = async () => {
    const ids = assignEmployeeIds;
    const skipped = bulkEmployeeIds.length - ids.length;
    if (!selSurveyId || bulkEmployeeIds.length === 0)
      return message.warning("Выберите опрос и сотрудников");
    if (ids.length === 0)
      return message.info("Всем выбранным сотрудникам этот опрос уже назначен");

    setAssigning(true);
    try {
      const { created, failed } = await createTestAssignmentsBulk(
        selSurveyId,
        ids,
      );
      await fetchTestAssignments(1, 1000);
      if (failed === 0) {
        message.success(
          `✅ Опрос назначен сотрудникам: ${created}` +
            (skipped ? `, пропущено (уже назначено): ${skipped}` : ""),
        );
        setBulkEmployeeIds([]);
        setStartOpen(false);
      } else {
        message.warning(`Назначено: ${created}, с ошибкой: ${failed}`);
      }
    } catch (e) {
      message.error("❌ Ошибка: " + (e?.response?.data?.message || e.message));
    } finally {
      setAssigning(false);
    }
  };

  // ==================== ПРОХОЖДЕНИЕ (пользователь) ====================
  const handleStartSurvey = async () => {
    if (!selEmpId) return message.error(t[lang].noEmployeeProfile);
    if (!selSurveyId) return message.warning(t[lang].selectSurvey);
    const subId = getEmployeeSubDepartment(selEmpId);

    const sv = surveyItems.find((s) => s.id === selSurveyId);
    if (!sv) return message.error("Опрос не найден");

    setStartOpen(false);

    if (onStartSurvey) {
      onStartSurvey({
        surveyId: selSurveyId,
        employeeId: selEmpId,
        subDepartmentId: subId,
        survey: sv,
      });
      return;
    }

    setTakingSurvey(sv);
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
    [surveyQuestions],
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
        String(r.employeeId) === String(result.employeeId),
    );
    if (i !== -1) all[i] = { ...all[i], ...withNames };
    else all.push(withNames);
    localStorage.setItem("survey_results", JSON.stringify(all));
    message.success("Результат сохранён");
  };

  const loading = testsLoading || surveyQuestionsLoading;

  if (loading && surveyItems.length === 0 && !dataLoaded) {
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
        <Spin size="large" tip="Загрузка..." />
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
            {lang === "ru" ? "Всего" : "Ҳамагӣ"} {surveyItems.length}{" "}
            {lang === "ru"
              ? surveyItems.length === 1
                ? "опрос"
                : "опросов"
              : "пурсиш"}
          </Text>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            size="large"
            onClick={() => setStartOpen(true)}
            style={{
              background: "#ff4b2b",
              borderColor: "#ff4b2b",
              borderRadius: 20,
            }}
          >
            {isAdmin ? t[lang].assignSurvey : t[lang].startSurvey}
          </Button>

          {isAdmin && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="primary"
                onClick={openCreate}
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
                {t[lang].addSurvey}
              </Button>
            </motion.div>
          )}
        </Space>
      </Flex>

      <AnimatePresence>
        {!surveyItems || surveyItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card
              style={{ textAlign: "center", padding: 60, borderRadius: 20 }}
            >
              <FileTextOutlined
                style={{
                  fontSize: 64,
                  color: "#ff4b2b",
                  marginBottom: 20,
                }}
              />
              <Title level={4}>{t[lang].noSurveys}</Title>
              {isAdmin && (
                <Button
                  type="primary"
                  onClick={openCreate}
                  icon={<RocketOutlined />}
                  style={{ borderRadius: 20, background: "#ff4b2b" }}
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
              {paginatedSurveys.map((sv, index) => {
                const isHovered = hoveredCard === sv.id;
                const isNew = newSurveyId === sv.id;
                const questionCount = sv.questions?.length || 0;
                const hasDescription = getSurveyDesc(sv, lang);

                return (
                  <Col xs={24} md={12} lg={8} key={sv.id}>
                    <motion.div
                      id={`survey-${sv.id}`}
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
                          if (isAdmin) openPreview(sv);
                        }}
                        onMouseEnter={() => setHoveredCard(sv.id)}
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
                                {getSurveyTitle(sv, lang) || "Без названия"}
                              </Text>

                              <div style={{ marginTop: 10 }}>
                                <Tag
                                  icon={<FileTextOutlined />}
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
                                    openEdit(sv);
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
                                    await handleDelete(sv.id);
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

      {surveyItems.length > 0 && (
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

      {/* МОДАЛКА СТАРТА */}
      <Modal
        open={startOpen}
        onCancel={() => setStartOpen(false)}
        centered
        width={650}
        footer={null}
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              padding: "24px 30px",
              color: "#fff",
            }}
          >
            <Flex align="center" gap={12}>
              <PlayCircleOutlined style={{ fontSize: 24 }} />
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                {isAdmin ? t[lang].assignSurvey : t[lang].startSurvey}
              </Title>
            </Flex>
          </div>

          <div
            style={{
              padding: "24px 30px 30px",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {!isAdmin && dataLoaded && !selEmpId && (
              <Alert
                message={t[lang].noEmployeeProfile}
                type="error"
                showIcon
              />
            )}
            {!isAdmin && dataLoaded && surveyItems.length === 0 && (
              <Alert message={t[lang].noAssignedSurveys} type="info" showIcon />
            )}
            <div>
              <Text strong>{t[lang].selectSurvey}:</Text>
              <Select
                value={selSurveyId}
                onChange={setSelSurveyId}
                showSearch
                size="large"
                style={{ width: "100%", marginTop: 8 }}
                placeholder={t[lang].selectSurvey}
                optionFilterProp="label"
                optionLabelProp="label"
              >
                {surveyItems.map((s) => {
                  const label = getSurveyTitle(s, lang) || `ID: ${s.id}`;
                  return (
                    <Option key={s.id} value={s.id} label={label}>
                      {label}
                    </Option>
                  );
                })}
              </Select>
            </div>

            {isAdmin && (
              <BulkEmployeeSelect
                employees={employees}
                value={bulkEmployeeIds}
                onChange={setBulkEmployeeIds}
                getSubDepartmentName={getSubDepartmentName}
                excludedIds={excludedEmployeeIds}
                lang={lang}
              />
            )}

            <Flex justify="flex-end" gap={8}>
              <Button
                onClick={() => setStartOpen(false)}
                style={{ borderRadius: 10 }}
              >
                {t[lang].close}
              </Button>
              <Button
                type="primary"
                onClick={isAdmin ? handleAssignSurvey : handleStartSurvey}
                disabled={
                  !selSurveyId ||
                  (isAdmin ? bulkEmployeeIds.length === 0 : !selEmpId) ||
                  assigning
                }
                loading={assigning}
                icon={isAdmin ? <UserOutlined /> : <PlayCircleOutlined />}
                style={{
                  background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                  border: "none",
                  borderRadius: 10,
                }}
              >
                {isAdmin ? t[lang].assign : t[lang].startSurvey}
              </Button>
            </Flex>
          </div>
        </div>
      </Modal>

      {/* ПРОХОЖДЕНИЕ */}
      <Modal
        open={takingOpen}
        footer={null}
        width={700}
        centered
        title={
          <Space>
            <FormOutlined style={{ color: "#ff4b2b" }} />
            {getSurveyTitle(takingSurvey, lang) || "Опрос"}
          </Space>
        }
        onCancel={() => {
          setTakingOpen(false);
          setTakingSurvey(null);
          setTakingEmpId(null);
        }}
        styles={{ body: { maxHeight: "80vh", overflow: "auto" } }}
      >
        {takingSurvey && (
          <SurveyTaking
            survey={takingSurvey}
            questions={getSurveyQuestions(takingSurvey)}
            onComplete={handleComplete}
            onClose={() => {
              setTakingOpen(false);
              setTakingSurvey(null);
              setTakingEmpId(null);
            }}
            employeeId={takingEmpId}
            lang={lang}
          />
        )}
      </Modal>

      {/* СОЗДАНИЕ / РЕДАКТИРОВАНИЕ */}
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
              color: "#fff",
            }}
          >
            <Flex align="center" gap={12}>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                {editingItem ? t[lang].edit : t[lang].addSurvey}
              </Title>
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
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <Alert
                    message={t[lang].info}
                    description="Введите информацию об опросе."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                  <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      {t[lang].surveyTitle}{" "}
                      <span style={{ color: "#ff4b2b" }}>*</span>
                    </Text>
                    <BilingualInput
                      valueRu={titleRu}
                      valueTj={titleTj}
                      onChangeRu={setTitleRu}
                      onChangeTj={setTitleTj}
                      placeholder={t[lang].surveyTitle}
                    />
                  </div>
                  <div>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      {t[lang].description}
                    </Text>
                    <BilingualInput
                      textarea
                      rows={4}
                      valueRu={descRu}
                      valueTj={descTj}
                      onChangeRu={setDescRu}
                      onChangeTj={setDescTj}
                      placeholder={t[lang].description}
                    />
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <Alert
                    message={t[lang].info}
                    description={
                      <div>
                        <Text>
                          Все типы вопросов доступны (Тест / Ручной / Рейтинг).
                        </Text>
                        <div style={{ marginTop: 6 }}>
                          <Tag color="blue">
                            Доступно: {availableQuestions.length}
                          </Tag>
                          <Tag color="green" style={{ marginLeft: 8 }}>
                            Всего: {surveyQuestions.length}
                          </Tag>
                          {selectedQIds.length > 0 && (
                            <Tag color="red" style={{ marginLeft: 8 }}>
                              Выбрано: {selectedQIds.length}
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
                              onClick={selectAll}
                              disabled={filteredAvailableQuestions.length === 0}
                              type="primary"
                              ghost
                              style={{ borderRadius: 20 }}
                            >
                              {t[lang].selectAll}
                            </Button>
                            <Button
                              icon={<MinusOutlined />}
                              onClick={() => setSelectedQIds([])}
                              disabled={selectedQIds.length === 0}
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

                      {surveyQuestionsLoading ? (
                        <div style={{ textAlign: "center", padding: 40 }}>
                          <Spin tip="Загрузка вопросов..." />
                        </div>
                      ) : filteredAvailableQuestions.length === 0 ? (
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
                          {isAdmin && surveyQuestions.length === 0 && (
                            <Button
                              type="primary"
                              onClick={() => setActiveTab("create")}
                              style={{
                                borderRadius: 20,
                                background: "#ff4b2b",
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
                              const sel = selectedQIds.includes(q.id);
                              const tInfo = getTypeLabel(q.type);
                              const nType = getNumericType(q.type);
                              return (
                                <Col xs={24} key={q.id}>
                                  <Card
                                    onClick={() => toggleQ(q.id)}
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
                                        onChange={() => toggleQ(q.id)}
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

                                        {/* ⭐ Все варианты серые, без ✅ и зелёного */}
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
                                                      background: "#f0f0f0",
                                                      color: "#666",
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
                                                    style={{ color: "#333" }}
                                                  >
                                                    {getOptTextSafe(o, lang)}
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
                                              ⭐ Рейтинг 1-10 — оценка при
                                              прохождении
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
                                                color: "#fff",
                                                borderRadius: "50%",
                                                width: 28,
                                                height: 28,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <CheckCircleOutlined />
                                            </div>
                                          )}
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            style={{ color: "#ff4b2b" }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingQuestion(q);
                                            }}
                                          />
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

                      {selectedQIds.length > 0 && (
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
                            {t[lang].selected}: {selectedQIds.length}{" "}
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
                            correctAnswer: t[lang].correctAnswer,
                            selectRating: t[lang].selectRating,
                          }}
                        />
                      </TabPane>
                    )}
                  </Tabs>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <Alert
                    message={t[lang].success}
                    description={t[lang].surveyReady}
                    type="success"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                  <Card
                    style={{
                      background: "#fff5f5",
                      borderColor: "#ffd6d6",
                      marginBottom: 16,
                    }}
                  >
                    <Space>
                      <Avatar style={{ background: "#ff4b2b" }}>
                        <FileTextOutlined />
                      </Avatar>
                      <div>
                        <Text strong>{lang === "ru" ? titleRu : titleTj}</Text>
                        <div>
                          <Tag color="blue">
                            {selectedQIds.length} {t[lang].totalQuestions}
                          </Tag>
                        </div>
                      </div>
                    </Space>
                  </Card>
                  {selectedQuestions.length > 0 && (
                    <div style={{ maxHeight: 260, overflow: "auto" }}>
                      {selectedQuestions.map((q, idx) => (
                        <Flex
                          key={q.id}
                          align="center"
                          gap={10}
                          onClick={() => toggleQ(q.id)}
                          style={{
                            padding: "8px 12px",
                            marginBottom: 6,
                            background: "#fafafa",
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                            cursor: "pointer",
                          }}
                        >
                          <Checkbox checked onChange={() => toggleQ(q.id)} />
                          <Badge
                            count={idx + 1}
                            style={{ backgroundColor: "#ff4b2b" }}
                          />
                          <Text style={{ fontSize: 13, flex: 1 }}>
                            {getQuestionText(q)}
                          </Text>
                          <Tag
                            color={getTypeLabel(q.type).color}
                            style={{ borderRadius: 20 }}
                          >
                            {getTypeLabel(q.type).label}
                          </Tag>
                        </Flex>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Flex
              justify="space-between"
              style={{ marginTop: 30, paddingTop: 20 }}
            >
              <Button
                onClick={() => setOpen(false)}
                style={{ borderRadius: 10 }}
              >
                {t[lang].cancel}
              </Button>
              <Space>
                {step > 0 && (
                  <Button
                    onClick={() => setStep(step - 1)}
                    style={{ borderRadius: 10 }}
                  >
                    {t[lang].back}
                  </Button>
                )}
                {step < 2 ? (
                  <Button
                    type="primary"
                    onClick={handleNext}
                    icon={<ArrowRightOutlined />}
                    style={{ background: "#ff4b2b", borderRadius: 10 }}
                  >
                    {t[lang].next}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={handleSave}
                    loading={saving}
                    icon={<RocketOutlined />}
                    style={{
                      background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                      borderRadius: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {saving
                      ? "Сохранение..."
                      : editingItem
                        ? t[lang].save
                        : t[lang].addSurvey}
                  </Button>
                )}
              </Space>
            </Flex>
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
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <span style={{ fontSize: 18, fontWeight: 600 }}>
              {getSurveyTitle(selectedSurvey, lang)}
            </span>
            <Space style={{ marginRight: 24 }}>
              <Tag color="blue" style={{ borderRadius: 20 }}>
                <FileTextOutlined />{" "}
                {selectedSurvey?.questions?.length || 0}{" "}
                {t[lang].questionCount}
              </Tag>
              {isAdmin && selectedSurvey && (
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => openAddQuestions(selectedSurvey)}
                  style={{ background: "#ff4b2b", borderRadius: 20 }}
                >
                  {t[lang].addQuestion}
                </Button>
              )}
            </Space>
          </div>
        }
      >
        <Table
          dataSource={getSurveyQuestions(selectedSurvey)}
          rowKey={(r) => r.id}
          columns={[
            {
              title: "№",
              width: 60,
              render: (_, __, i) => (
                <Badge count={i + 1} style={{ backgroundColor: "#ff4b2b" }} />
              ),
            },
            {
              title: "Вопрос",
              key: "q",
              render: (_, r) => {
                const nType = getNumericType(r.type);
                const tInfo = getTypeLabel(r.type);
                return (
                  <div>
                    <Text style={{ fontSize: 15 }}>{getQuestionText(r)}</Text>
                    <div style={{ marginTop: 6 }}>
                      <Tag color={tInfo.color} icon={tInfo.icon}>
                        {tInfo.label}
                      </Tag>
                    </div>
                    {/* ⭐ Все варианты серые, без ✅ и зелёного */}
                    {nType === 1 && r.options?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {r.options.map((o, oi) => (
                          <div
                            key={oi}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              fontSize: 13,
                            }}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: "#f0f0f0",
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: "bold",
                              }}
                            >
                              {["A", "B", "C", "D", "E", "F"][oi]}
                            </span>
                            <Text style={{ color: "#333" }}>
                              {getOptTextSafe(o, lang)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                    {nType === 2 && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          display: "block",
                        }}
                      >
                        ✏️ Ручной ответ
                        {r.options?.[0] &&
                          ` — эталон: ${getOptTextSafe(r.options[0], lang)}`}
                      </Text>
                    )}
                    {nType === 3 && (
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          display: "block",
                        }}
                      >
                        ⭐ Рейтинг 1-10 — сотрудник выберет оценку
                      </Text>
                    )}
                  </div>
                );
              },
            },
            ...(isAdmin
              ? [
                  {
                    title: "",
                    key: "actions",
                    width: 60,
                    render: (_, r) => (
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        style={{ color: "#ff4b2b" }}
                        onClick={() => setEditingQuestion(r)}
                      />
                    ),
                  },
                ]
              : []),
          ]}
          pagination={false}
          locale={{ emptyText: t[lang].noQuestionsInSurvey }}
        />
      </Modal>

      {/* РЕДАКТИРОВАНИЕ ВОПРОСА */}
      <Modal
        open={!!editingQuestion}
        onCancel={() => setEditingQuestion(null)}
        footer={null}
        width={700}
        centered
        destroyOnClose
        title={
          <Space>
            <EditOutlined style={{ color: "#ff4b2b" }} />
            {t[lang].editQuestion}
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
              variant: t[lang].variant,
              add: t[lang].add,
              test: t[lang].test,
              manual: t[lang].manual,
              rating: t[lang].rating,
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default SurveyManager;
