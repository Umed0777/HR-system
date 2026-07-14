import { useEffect, useState } from "react";
import { useQuestionStore } from "../store/useQuestion";
import {
  Button,
  Modal,
  Input,
  Space,
  Card,
  Typography,
  Popconfirm,
  Radio,
  Row,
  Col,
  message,
  Tag,
  Flex,
  Avatar,
  Divider,
  Pagination,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  RocketOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import img from "../assets/image2.jpg"; 
const { Title, Text } = Typography;
const letters = ["A", "B", "C", "D", "E", "F"];

// Компонент для красивого отображения выбора рейтинга
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
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

                  border: active
                    ? "3px solid #ffd6d6"
                    : "1px solid #e8e8e8",

                  boxShadow: active
                    ? "0 8px 20px rgba(255, 77, 79, 0.35)"
                    : "0 2px 6px rgba(0,0,0,0.08)",

                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,77,79,0.4)",
                    }}
                  />
                )}

                {num}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const Question = () => {
  const {
    questions = [],
    fetchQuestions,
    addQuestion,
    editQuestion,
    removeQuestion,
    totalRecords,
  } = useQuestionStore();
 const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("question_lang");
    return savedLang || "ru";
  });
  const [content, setContent] = useState("");
  const [type, setType] = useState(1);
  const [options, setOptions] = useState([]);
  const [manualAnswer, setManualAnswer] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newQuestionId, setNewQuestionId] = useState(null);
  const [ratingAnswer, setRatingAnswer] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [userRatings, setUserRatings] = useState({});
  const [selectedQuestionId, setSelectedQuestionId] = useState(null); // Добавляем состояние для выбранного вопроса
  
  useEffect(() => {
    fetchQuestions(page, pageSize);
  }, [page, pageSize]);

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("question_lang", newLang);
  };

  const t = {
    ru: {
      question: "Вопрос",
      answer: "Ответ",
      correct: "Правильный",
      variant: "Вариант",
      add: "Добавить вариант",
      edit: "Редактировать",
      delete: "Удалить",
      title: "Вопросы",
      rating: "Рейтинг",
      manual: "Ручной ввод",
      test: "Тест",
      save: "Сохранить",
      cancel: "Отмена",
      addQuestion: "Добавить вопрос",
      deleteConfirm: "Вы уверены, что хотите удалить этот вопрос?",
      questionNumber: "Вопрос",
      correctAnswer: "Правильный ответ",
      selectRating: "Выберите рейтинг вопроса",
      yourRating: "Ваша оценка",
      saveRating: "Сохранить оценку",
      ratingSaved: "Оценка сохранена",
      expectedRating: "Ожидаемый рейтинг",
      showAnswer: "Показать ответ",
      hideAnswer: "Скрыть ответ",
    },
    tj: {
      question: "Савол",
      answer: "Ҷавоб",
      correct: "Дуруст",
      rating: "баҳо",    
      variant: "Вариант",
      add: "Илова вариант",
      edit: "Тағйир додан",
      delete: "Хориҷ",
      title: "Саволҳо",
      manual: "Вориди дастӣ",
      test: "Тест",
      save: "Сабт кардан",
      cancel: "Бекор кардан",
      addQuestion: "Илова савол",
      deleteConfirm: "Шумо боварӣ доред, ки ин саволро нест кардан мехоҳед?",
      questionNumber: "Савол",
      correctAnswer: "Ҷавоби дуруст",
      selectRating: "Баҳои саволро интихоб кунед",
      yourRating: "Баҳои шумо",
      saveRating: "Баҳоро сабт кунед",
      ratingSaved: "Баҳо сабт шуд",
      expectedRating: "Баҳои интизоришаванда",
      showAnswer: "Нишон додани ҷавоб",
      hideAnswer: "Пинҳон кардани ҷавоб",
    },
  };

  const openModal = (item = null) => {
    setEditingItem(item);

    if (item) {
      const questionText =
        lang === "ru"
          ? item.contentRu || item.content || ""
          : item.contentTj || item.content || "";
      setContent(questionText);
      setType(item.type || 1);

      if (item.type === 3) {
        setRatingAnswer(item.optionId || null);
        setOptions([]);
        setManualAnswer("");
      }
      else if (item.type === 2) {
        if (item.options && item.options.length > 0) {
          const option = item.options[0];
          const answerText =
            lang === "ru"
              ? option.textRu || option.text || ""
              : option.textTj || option.text || "";
          setManualAnswer(answerText);
        } else {
          setManualAnswer("");
        }
        setOptions([]);
        setRatingAnswer(null);
      } 
      else {
        const loadedOptions = (
          item.options && Array.isArray(item.options) ? item.options : []
        ).map((o) => ({
          text:
            lang === "ru" ? o.textRu || o.text || "" : o.textTj || o.text || "",
          isCorrect: o.isCorrect || false,
        }));
        setOptions(loadedOptions);
        setManualAnswer("");
        setRatingAnswer(null);
      }
    } else {
      setContent("");
      setType(1);
      setOptions([]);
      setManualAnswer("");
      setRatingAnswer(null);
    }

    setOpen(true);
  };

  const handleSave = async () => {
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
    }
    else if (type === 3) {
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
    }
    else {
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

    try {
      if (editingItem) {
        await editQuestion(editingItem.id, payload);
        message.success("Вопрос успешно обновлен!");
      } else {
        const response = await addQuestion(payload);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        message.success("Вопрос успешно добавлен! 🎉");
        if (response?.id) {
          setNewQuestionId(response.id);
        }
      }

      await fetchQuestions(page, pageSize);
      setOpen(false);
      setContent("");
      setOptions([]);
      setManualAnswer("");
      setRatingAnswer(null);
      setEditingItem(null);
    } catch (err) {
      console.log("ERROR:", err);
      message.error("Ошибка при сохранении вопроса");
    }
  };

  const getQuestionText = (q) => {
    if (lang === "ru") return q.contentRu || q.content || "—";
    return q.contentTj || q.content || "—";
  };

  const getCorrectAnswer = (q) => {
    if (q.type === 2) {
      if (q.options && q.options.length > 0) {
        const answer = q.options[0];
        if (lang === "ru") {
          return answer.textRu || answer.text || "Ответ не указан";
        }
        return answer.textTj || answer.text || "Ҷавоб нишон дода нашудааст";
      }
      return lang === "ru"
        ? "Ответ не указан"
        : "Ҷавоб нишон дода нашудааст";
    }

    if (q.type === 1 && q.options && q.options.length > 0) {
      const correctOption = q.options.find((opt) => opt.isCorrect === true);
      if (correctOption) {
        if (lang === "ru") {
          return correctOption.textRu || correctOption.text || "—";
        }
        return correctOption.textTj || correctOption.text || "—";
      }
    }

    return "—";
  };

  const getOptionText = (o) => {
    if (!o) return "—";
    if (lang === "ru") return o.textRu || o.text || "—";
    return o.textTj || o.text || "—";
  };

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

  const handleUserRating = (questionId, value) => {
    setUserRatings(prev => ({
      ...prev,
      [questionId]: value,
    }));
    message.success(`${t[lang].ratingSaved}: ${value}`);
    
    // Здесь можно отправить оценку пользователя на сервер
    // saveUserRating(questionId, value);
  };

  // Функция для переключения выбора вопроса
  const toggleQuestionSelection = (questionId) => {
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(null); // Скрываем ответ
    } else {
      setSelectedQuestionId(questionId); // Показываем ответ
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
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
        style={{ marginBottom: 32, padding: "0 8px" }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {questions.length}{" "}
            {questions.length === 1 ? "вопрос" : "вопросов"}
          </Text>
        </div>

        <Space>
          <Button
            type={lang === "ru" ? "primary" : "default"}
            onClick={() => handleSetLang("ru")}
            style={
              lang === "ru"
                ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                : {}
            }
          >
            RU
          </Button>
          <Button
            type={lang === "tj" ? "primary" : "default"}
            onClick={() => handleSetLang("tj")}
            style={
              lang === "tj"
                ? { background: "#ff4b2b", borderColor: "#ff4b2b" }
                : {}
            }
          >
            TJ
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="primary"
              onClick={() => openModal()}
              style={{
                background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                border: "none",
                boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
                fontWeight: "bold",
                height: "40px",
                padding: "0 24px",
                borderRadius: "20px",
              }}
            >
              {t[lang].addQuestion}
            </Button>
          </motion.div>
        </Space>
      </Flex>

      <AnimatePresence>
        {questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card
              style={{ textAlign: "center", padding: 50, borderRadius: 20 }}
            >
              <QuestionCircleOutlined
                style={{ fontSize: 64, color: "#ff4b2b", marginBottom: 20 }}
              />
              <Title level={4}>Нет вопросов</Title>
              <Text type="secondary">
                Нажмите кнопку "Добавить вопрос" чтобы создать первый вопрос
              </Text>
              <div style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  onClick={() => openModal()}
                  style={{ background: "#ff4b2b", borderRadius: 20 }}
                >
                  Создать первый вопрос
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {questions.map((q, index) => {
              const isHovered = hoveredCard === q.id;
              const isNew = newQuestionId === q.id;
              const isSelected = selectedQuestionId === q.id; // Проверяем, выбран ли вопрос

              return (
                <motion.div
                  key={q.id}
                  id={`question-${q.id}`}
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
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: 12,
                        fontWeight: "bold",
                        zIndex: 1,
                      }}
                    >
                      NEW! 🎉
                    </motion.div>
                  )}

                  <Card
                    onMouseEnter={() => setHoveredCard(q.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      borderRadius: 20,
                      boxShadow: isHovered
                        ? "0 12px 24px rgba(0, 0, 0, 0.12)"
                        : "0 4px 12px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s ease",
                      border: isSelected ? "2px solid #ff4b2b" : "none", // Добавляем рамку для выбранного вопроса
                      overflow: "hidden",
                      backgroundImage: `url(${img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    styles={{ body: { padding: 0, background: "transparent" } }}
                  >
                    <div
                      style={{
                        padding: "20px 24px 12px 24px",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                        background: "rgba(255, 255, 255, 0.9)",
                      }}
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap={12}>
                          <Avatar
                            style={{
                              background:
                                "linear-gradient(135deg, #ff416c, #ff4b2b)",
                              verticalAlign: "middle",
                            }}
                            size={40}
                          >
                            {index + 1}
                          </Avatar>
                          <div>
                            <Text
                              strong
                              style={{
                                fontSize: 18,
                                display: "block",
                                color: "#1a1a1a",
                              }}
                            >
                              {getQuestionText(q)}
                            </Text>
                            <Flex
                              gap={8}
                              align="center"
                              style={{ marginTop: 4 }}
                            >
                              <Tag color={q.type === 1 ? "blue" : q.type === 2 ? "purple" : "green"}>
                                {q.type === 1 ? t[lang].test : q.type === 2 ? t[lang].manual : t[lang].rating}
                              </Tag>
                            </Flex>
                          </div>
                        </Flex>
                        <Tag
                          color="orange"
                          style={{ borderRadius: 12, fontSize: 12 }}
                        >
                          Вопрос {index + 1}
                        </Tag>
                      </Flex>
                    </div>

                    <div style={{ padding: "20px 24px" }}>
                      {/* Тип 1: Тестовый вопрос */}
                      {q.type === 1 && (
                        <div>
                          {q.options && q.options.length > 0 ? (
                            q.options.map((o, i) => (
                              <motion.div
                                key={o.id || i}
                                style={{
                                  marginBottom: 12,
                                  padding: "8px 12px",
                                  background: isSelected && o.isCorrect
                                    ? "rgba(82, 196, 26, 0.2)"
                                    : "rgba(255, 255, 255, 0.95)",
                                  borderRadius: 8,
                                  border: isSelected && o.isCorrect
                                    ? "2px solid #52c41a"
                                    : "1px solid rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <Text>
                                  <strong>{letters[i]}.</strong>{" "}
                                  {getOptionText(o)}
                                </Text>
                                {isSelected && o.isCorrect && (
                                  <Tag color="success" style={{ marginLeft: 10 }}>
                                    <CheckCircleOutlined /> {t[lang].correct}
                                  </Tag>
                                )}
                              </motion.div>
                            ))
                          ) : (
                            <Text type="secondary">Нет вариантов</Text>
                          )}
                          
                          {/* Кнопка для показа/скрытия ответа */}
                          <Button
                            type={isSelected ? "primary" : "default"}
                            onClick={() => toggleQuestionSelection(q.id)}
                            style={{
                              marginTop: 12,
                              borderRadius: 8,
                              background: isSelected ? "#ff4b2b" : undefined,
                              borderColor: isSelected ? "#ff4b2b" : undefined,
                              color: isSelected ? "white" : undefined,
                            }}
                          >
                            {isSelected ? t[lang].hideAnswer : t[lang].showAnswer}
                          </Button>
                        </div>
                      )}

                      {/* Тип 2: Ручной ввод */}
                      {q.type === 2 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div
                            style={{
                              padding: "12px 16px",
                              background: isSelected 
                                ? "linear-gradient(135deg, #f0f9ff, #e6f4ff)"
                                : "rgba(255, 255, 255, 0.9)",
                              borderRadius: 10,
                              border: isSelected 
                                ? "2px solid #91d5ff"
                                : "1px solid rgba(0, 0, 0, 0.1)",
                            }}
                          >
                            <RocketOutlined style={{ color: "#1890ff", marginRight: 8 }} />
                            <Text strong style={{ color: "#1890ff" }}>
                              📖 {t[lang].correctAnswer}:
                            </Text>
                            {isSelected ? (
                              <Text style={{ marginLeft: 8, fontWeight: "bold", fontSize: 15 }}>
                                {getCorrectAnswer(q)}
                              </Text>
                            ) : (
                              <Text style={{ marginLeft: 8, color: "#999" }}>
                                Нажмите кнопку чтобы показать ответ
                              </Text>
                            )}
                          </div>
                          
                          {/* Кнопка для показа/скрытия ответа */}
                          <Button
                            type={isSelected ? "primary" : "default"}
                            onClick={() => toggleQuestionSelection(q.id)}
                            style={{
                              marginTop: 12,
                              borderRadius: 8,
                              background: isSelected ? "#ff4b2b" : undefined,
                              borderColor: isSelected ? "#ff4b2b" : undefined,
                              color: isSelected ? "white" : undefined,
                            }}
                          >
                            {isSelected ? t[lang].hideAnswer : t[lang].showAnswer}
                          </Button>
                        </motion.div>
                      )}

                      {/* Тип 3: Рейтинг */}
                      {q.type === 3 && (
                        <div>
                          {/* Ожидаемый рейтинг (от автора) */}
                          {q.optionId && (
                            <div
                              style={{
                                marginBottom: 20,
                                padding: "12px",
                                background: "rgba(255, 75, 43, 0.1)",
                                borderRadius: 10,
                                border: "1px solid #ff4b2b",
                              }}
                            >
                              <Text strong style={{ color: "#ff4b2b" }}>
                                🎯 {t[lang].expectedRating}:
                              </Text>
                              <div style={{ marginTop: 8 }}>
                                <RatingSelector
                                  value={q.optionId}
                                  onChange={() => {}}
                                  disabled={true}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Выбор рейтинга пользователем */}
                          <div
                            style={{
                              padding: "12px",
                              background: "#f6ffed",
                              borderRadius: 10,
                              border: "1px solid #b7eb8f",
                            }}
                          >
                            <RatingSelector
                              label={t[lang].yourRating}
                              value={userRatings[q.id] || null}
                              onChange={(value) => handleUserRating(q.id, value)}
                            />
                          </div>
                          
                          {/* Кнопка для показа/скрытия ответа (рейтинг всегда виден) */}
                          <Button
                            type={isSelected ? "primary" : "default"}
                            onClick={() => toggleQuestionSelection(q.id)}
                            style={{
                              marginTop: 12,
                              borderRadius: 8,
                              background: isSelected ? "#ff4b2b" : undefined,
                              borderColor: isSelected ? "#ff4b2b" : undefined,
                              color: isSelected ? "white" : undefined,
                            }}
                          >
                            {isSelected ? t[lang].hideAnswer : t[lang].showAnswer}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Divider style={{ margin: 0, backgroundColor: "rgba(0, 0, 0, 0.1)" }} />

                    <div
                      style={{
                        padding: "12px 24px",
                        background: "rgba(255, 255, 255, 0.9)",
                      }}
                    >
                      <Flex justify="flex-end" align="center">
                        <Space>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => openModal(q)}
                              style={{ borderRadius: 8 }}
                            >
                              {t[lang].edit}
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Popconfirm
                              title={t[lang].deleteConfirm}
                              onConfirm={() => removeQuestion(q.id)}
                              okText="Да"
                              cancelText="Нет"
                            >
                              <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                                {t[lang].delete}
                              </Button>
                            </Popconfirm>
                          </motion.div>
                        </Space>
                      </Flex>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </Space>
        )}
        <Flex   justify="space-between" color = 'primary' style={{ alignItems: 'flex-end' }}>
          <Button onClick={() => navigate('/test')} danger size="middle" style={{padding: '10px 30px', height: 32}}>Cоздать тесты</Button>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={totalRecords}
          onChange={(page, size) => {
            setPage(page);
            setPageSize(size);
          }}
          showSizeChanger={false}
          showQuickJumper={false}
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "flex-end",
          }}
        />
        </Flex>
      </AnimatePresence>

      {/* Модальное окно для создания/редактирования */}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        title={
          <div style={{ fontSize: 20, fontWeight: 600, color: "#ff4b2b" }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            {editingItem ? t[lang].edit : t[lang].addQuestion}
          </div>
        }
        width={700}
        okText={t[lang].save}
        cancelText={t[lang].cancel}
        styles={{
          header: {
            borderBottom: "2px solid #f0f0f0",
            paddingBottom: 16,
          },
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
            {t[lang].question}:
          </Text>
          <Input.TextArea
            placeholder={t[lang].question}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            size="large"
            style={{ borderRadius: 10 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
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
            <Radio value={1}>{t[lang].test}</Radio>
            <Radio value={2}>{t[lang].manual}</Radio>
            <Radio value={3}>{t[lang].rating}</Radio>
          </Radio.Group>
        </div>

        {/* Тип 1: Тестовый вопрос */}
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
              {t[lang].add}
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
                          {t[lang].correct} ({letters[i]})
                        </Radio>
                      </Col>
                      <Col flex="auto">
                        <Input
                          placeholder={`${t[lang].variant} ${letters[i]}`}
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

        {/* Тип 2: Ручной ввод */}
        {type === 2 && (
          <div>
            <Text strong style={{ display: "block", marginBottom: 8 }}>
              {t[lang].correctAnswer}:
            </Text>
            <Input
              placeholder={t[lang].answer}
              value={manualAnswer}
              onChange={(e) => setManualAnswer(e.target.value)}
              size="large"
              style={{ borderRadius: 10 }}
            />
          </div>
        )}
        
        {/* Тип 3: Рейтинг */}
        {type === 3 && (
          <RatingSelector
            label={t[lang].selectRating}
            value={ratingAnswer}
            onChange={setRatingAnswer}
          />
        )}
      </Modal>
    </div>
  );
};