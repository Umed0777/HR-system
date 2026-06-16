import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTestStore } from "../store/useTest";
import { useQuestionStore } from "../store/useQuestion";
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
  StarOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import img from '../assets/image2.jpg';

const { Title, Text } = Typography;
const { Option } = Select;

export const TestManager = () => {
  const navigate = useNavigate();
  const { 
    tests = [], 
    loading, 
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

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem("test_manager_lang");
    return savedLang || "ru";
  });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newTestId, setNewTestId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const [titleRu, setTitleRu] = useState("");
  const [titleTj, setTitleTj] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");
  const [descriptionTj, setDescriptionTj] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchTests();
    fetchQuestions(1, 1000);
  }, []);

  // Получаем ID вопросов, которые уже используются в тестах
  const getUsedQuestionIds = () => {
    const usedIds = new Set();
    tests.forEach(test => {
      if (test.questions && test.questions.length > 0) {
        test.questions.forEach(q => {
          if (q.id) usedIds.add(q.id);
        });
      }
    });
    return usedIds;
  };

  // Получаем доступные вопросы (не используются в тестах)
  const getAvailableQuestions = () => {
    const usedIds = getUsedQuestionIds();
    return questions.filter(q => !usedIds.has(q.id));
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("test_manager_lang", newLang);
  };

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
      fillTitle: "Пожалуйста, заполните название теста",
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
      rating: "Рейтинг",
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
      fillTitle: "Лутфан, номи тестро пур кунед",
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
      rating: "Баҳо",
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
    setOpen(true);
  };

  const openEditModal = (test) => {
    setEditingItem(test);
    setCurrentStep(0);
    setTitleRu(test.titleRu || test.title || "");
    setTitleTj(test.titleTj || test.title || "");
    setDescriptionRu(test.descriptionRu || test.description || "");
    setDescriptionTj(test.descriptionTj || test.description || "");
    
    const questionIds = test.questions?.map(q => q.id).filter(Boolean) || [];
    setSelectedQuestionIds(questionIds);
    setOpen(true);
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
    const allIds = filteredAvailableQuestions.map(q => q.id);
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

    const questionsData = selectedQuestionIds.map((questionId, index) => {
      const question = questions.find(q => q.id === questionId);
      let correctAnswer = null;
      
      if (question) {
        if (question.type === 2 && question.options?.length > 0) {
          const option = question.options[0];
          correctAnswer = {
            textRu: option.textRu || option.text || "",
            textTj: option.textTj || option.text || "",
          };
        } else if (question.type === 1) {
          const correctOption = question.options?.find(o => o.isCorrect === true);
          if (correctOption) {
            correctAnswer = {
              textRu: correctOption.textRu || correctOption.text || "",
              textTj: correctOption.textTj || correctOption.text || "",
            };
          }
        } else if (question.type === 3) {
          correctAnswer = { optionId: question.optionId || null };
        }
      }
      
      return {
        questionId: questionId,
        order: index + 1,
        type: question?.type || 1,
        correctAnswer: correctAnswer,
      };
    });

    const payload = {
      titleRu: titleRu || titleTj,
      titleTj: titleTj || titleRu,
      descriptionRu: descriptionRu || descriptionTj,
      descriptionTj: descriptionTj || descriptionRu,
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
        
        if (response && response.id) {
          setNewTestId(response.id);
        }
      }
      
      await fetchTests();
      
      if (!editingItem && response && response.id) {
        setTimeout(() => {
          const element = document.getElementById(`test-${response.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setTimeout(() => setNewTestId(null), 3000);
        }, 500);
      }
      
      setOpen(false);
      resetForm();
      setCurrentStep(0);
    } catch (err) {
      console.error("Save error:", err);
      message.error(err.response?.data?.message || "Ошибка при сохранении теста");
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
  };

  const getQuestionText = (question) => {
    if (!question) return "—";
    if (lang === "ru") {
      return question.contentRu || question.content || "—";
    }
    return question.contentTj || question.content || "—";
  };

  const getCorrectAnswerText = (question) => {
    if (!question) return "—";
    
    if (question.type === 2 && question.options?.length > 0) {
      const option = question.options[0];
      if (lang === "ru") {
        return option.textRu || option.text || "—";
      }
      return option.textTj || option.text || "—";
    }
    
    if (question.type === 1) {
      const correctOption = question.options?.find(o => o.isCorrect === true);
      if (correctOption) {
        if (lang === "ru") {
          return correctOption.textRu || correctOption.text || "—";
        }
        return correctOption.textTj || correctOption.text || "—";
      }
    }
    
    if (question.type === 3 && question.optionId) {
      return `${question.optionId}/10`;
    }
    
    return "—";
  };

  const getTypeLabel = (type) => {
    if (type === 1) return { label: t[lang].test, color: "#52c41a", icon: <CheckCircleOutlined /> };
    if (type === 2) return { label: t[lang].manual, color: "#722ed1", icon: <QuestionCircleOutlined /> };
    return { label: t[lang].rating, color: "#faad14", icon: <StarOutlined /> };
  };

  // Получаем доступные вопросы (не используются в тестах)
  const availableQuestions = getAvailableQuestions();

  // Фильтруем доступные вопросы для отображения
  const filteredAvailableQuestions = availableQuestions.filter(q => {
    const searchMatch = getQuestionText(q).toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === "all" || q.type === parseInt(filterType);
    return searchMatch && typeMatch;
  });

  // Для редактирования - показываем все вопросы теста
  const selectedQuestions = questions.filter(q => selectedQuestionIds.includes(q.id));

  // Для отображения в модалке: вопросы теста + отфильтрованные доступные
  const getDisplayQuestions = () => {
    if (editingItem) {
      // При редактировании показываем ВСЕ вопросы теста + отфильтрованные доступные
      const testQuestionIds = new Set(selectedQuestionIds);
      const displayIds = new Set();
      
      // Добавляем вопросы теста
      testQuestionIds.forEach(id => displayIds.add(id));
      
      // Добавляем отфильтрованные доступные вопросы
      filteredAvailableQuestions.forEach(q => displayIds.add(q.id));
      
      return questions.filter(q => displayIds.has(q.id));
    }
    return filteredAvailableQuestions;
  };

  const displayQuestions = getDisplayQuestions();

  // Проверяем, есть ли результаты поиска
  const hasSearchResults = displayQuestions.length > 0;

  const columns = [
    {
      title: t[lang].order,
      key: "order",
      width: 80,
      render: (_, __, index) => (
        <Badge count={index + 1} style={{ backgroundColor: "#ff4b2b" }} />
      ),
    },
    {
      title: t[lang].questionText,
      key: "questionText",
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 14 }}>{getQuestionText(record)}</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="green" style={{ fontSize: 12 }}>
              ✅ {t[lang].manualAnswer}: {getCorrectAnswerText(record)}
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
          <Tag color={typeInfo.color} icon={typeInfo.icon} style={{ borderRadius: 20, border: 'none' }}>
            {typeInfo.label}
          </Tag>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <Spin size="large" tip={t[lang].loading}>
          <div style={{ padding: 50, background: "rgba(255,255,255,0.9)", borderRadius: 20 }} />
        </Spin>
      </div>
    );
  }

  const totalItems = totalRecords;

  // Компонент выбора вопросов
  const QuestionSelector = () => {
    const usedIds = getUsedQuestionIds();
    const isEditing = !!editingItem;
    
    return (
      <div>
        <Alert
          message={t[lang].info}
          description={
            <div>
              <Text>
                {isEditing 
                  ? "Редактирование теста. Вы можете добавлять новые вопросы или удалять существующие."
                  : "Выберите вопросы для теста из доступных (не используются в других тестах)."
                }
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue" style={{ borderRadius: 20 }}>
                  {isEditing 
                    ? `В тесте: ${selectedQuestionIds.length} вопросов`
                    : `Доступно: ${availableQuestions.length} вопросов`
                  }
                </Tag>
                {!isEditing && questions.length > 0 && (
                  <Tag color="orange" style={{ borderRadius: 20 }}>
                    Используется в тестах: {questions.length - availableQuestions.length}
                  </Tag>
                )}
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />

        {/* Панель управления с фильтрами */}
        <div style={{ 
          background: "#f8f9fa", 
          padding: "16px 20px", 
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Space size="middle" wrap>
              <Button 
                icon={<PlusOutlined />} 
                onClick={selectAllQuestions}
                style={{ borderRadius: 20 }}
                disabled={filteredAvailableQuestions.length === 0}
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
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                size="middle"
              />
              
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: 150, borderRadius: 20 }}
                size="middle"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">{t[lang].allTypes}</Option>
                <Option value="1">
                  <span style={{ color: "#52c41a" }}>📝 {t[lang].test}</span>
                </Option>
                <Option value="2">
                  <span style={{ color: "#722ed1" }}>✏️ {t[lang].manual}</span>
                </Option>
                <Option value="3">
                  <span style={{ color: "#faad14" }}>⭐ {t[lang].rating}</span>
                </Option>
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
          
          {/* Статистика поиска */}
          {availableQuestions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t[lang].showing} {displayQuestions.length} {t[lang].of} {availableQuestions.length} {t[lang].questionsFound}
                {selectedQuestionIds.length > 0 && (
                  <span style={{ marginLeft: 16 }}>
                    <Tag color="red" style={{ borderRadius: 20 }}>
                      {t[lang].selected}: {selectedQuestionIds.length}
                    </Tag>
                  </span>
                )}
              </Text>
            </div>
          )}
        </div>

        {/* Список вопросов */}
        {displayQuestions.length === 0 ? (
          <Empty
            description={
              searchTerm || filterType !== "all"
                ? t[lang].noQuestionsFound
                : isEditing 
                  ? "В этом тесте нет вопросов"
                  : questions.length === 0 
                    ? t[lang].createQuestionFirst
                    : t[lang].noAvailableQuestions
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 40 }}
          >
            {!isEditing && questions.length === 0 && (
              <Button type="primary" onClick={() => navigate("/question")} style={{ borderRadius: 20 }}>
                Создать вопросы
              </Button>
            )}
            {(searchTerm || filterType !== "all") && (
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                style={{ borderRadius: 20 }}
              >
                {t[lang].clearFilters}
              </Button>
            )}
          </Empty>
        ) : (
          <div style={{ maxHeight: 450, overflow: "auto", padding: "4px" }}>
            <Row gutter={[16, 16]}>
              {displayQuestions.map((question) => {
                const isSelected = selectedQuestionIds.includes(question.id);
                const isUsed = usedIds.has(question.id) && !isSelected && !editingItem;
                const typeInfo = getTypeLabel(question.type);
                const isInTest = editingItem && selectedQuestionIds.includes(question.id);
                
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
                            message.warning("Этот вопрос уже используется в другом тесте");
                            return;
                          }
                          toggleQuestionSelection(question.id);
                        }}
                        style={{
                          cursor: isUsed ? "not-allowed" : "pointer",
                          borderRadius: 16,
                          border: isSelected ? "2px solid #ff4b2b" : "1px solid #e8e8e8",
                          background: isSelected 
                            ? "linear-gradient(135deg, #fff5f5, #ffffff)" 
                            : isUsed 
                              ? "#f5f5f5" 
                              : "white",
                          transition: "all 0.3s ease",
                          boxShadow: isSelected ? "0 4px 12px rgba(255, 75, 43, 0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                          opacity: isUsed ? 0.6 : 1,
                        }}
                        styles={{ body: { padding: "16px 20px" } }}
                      >
                        <Flex align="center" gap={16}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {
                              if (isUsed) {
                                message.warning("Этот вопрос уже используется в другом тесте");
                                return;
                              }
                              toggleQuestionSelection(question.id);
                            }}
                            disabled={isUsed}
                            style={{ flexShrink: 0 }}
                          />
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontSize: 15, display: "block", fontWeight: isSelected ? 500 : 400 }}>
                              {getQuestionText(question)}
                            </Text>
                            <Flex gap={8} style={{ marginTop: 8 }} wrap="wrap">
                              <Tag color={typeInfo.color} icon={typeInfo.icon} style={{ borderRadius: 20, border: 'none' }}>
                                {typeInfo.label}
                              </Tag>
                              {question.type !== 3 && (
                                <Tag color="green" style={{ borderRadius: 20, fontSize: 12, border: 'none' }}>
                                  ✅ {getCorrectAnswerText(question)}
                                </Tag>
                              )}
                              {question.type === 3 && (
                                <Tag color="gold" style={{ borderRadius: 20, fontSize: 12, border: 'none' }}>
                                  ⭐ {getCorrectAnswerText(question)}
                                </Tag>
                              )}
                              {isUsed && !isSelected && (
                                <Tag color="red" style={{ borderRadius: 20, border: 'none' }}>
                                  🔒 {t[lang].usedInTests}
                                </Tag>
                              )}
                              {isInTest && (
                                <Tag color="blue" style={{ borderRadius: 20, border: 'none' }}>
                                  📝 В текущем тесте
                                </Tag>
                              )}
                            </Flex>
                          </div>

                          {isSelected && (
                            <div style={{
                              background: "#ff4b2b",
                              color: "white",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: "0 2px 8px rgba(255, 75, 43, 0.3)",
                            }}>
                              <CheckOutlined />
                            </div>
                          )}
                        </Flex>
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* Прогресс выбора */}
        {displayQuestions.length > 0 && (
          <div style={{ 
            marginTop: 24, 
            padding: "16px 20px", 
            background: "linear-gradient(135deg, #f8f9fa, #ffffff)", 
            borderRadius: 12,
            border: "1px solid #f0f0f0",
          }}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  <TrophyOutlined style={{ marginRight: 8, color: "#ff4b2b" }} />
                  {t[lang].selected}: {selectedQuestionIds.length} {t[lang].questionsSelected}
                </Text>
              </div>
              <div style={{ width: 250 }}>
                <Progress 
                  percent={Math.round((selectedQuestionIds.length / Math.max(1, (editingItem ? questions.length : availableQuestions.length))) * 100)} 
                  strokeColor="#ff4b2b"
                  size="small"
                  showInfo={false}
                />
              </div>
            </Flex>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={['#ff416c', '#ff4b2b', '#ff6b4a', '#ff8c6b']}
        />
      )}

      <Flex justify="space-between" align="center" style={{ marginBottom: 32, padding: "0 8px" }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            📋 {t[lang].title}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {tests.length} {tests.length === 1 ? "тест" : "тестов"}
          </Text>
        </div>

        <Space size="middle">
          <Button
            type={lang === "ru" ? "primary" : "default"}
            onClick={() => handleSetLang("ru")}
            style={lang === "ru" ? { background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 } : { borderRadius: 20 }}
          >
            RU
          </Button>
          <Button
            type={lang === "tj" ? "primary" : "default"}
            onClick={() => handleSetLang("tj")}
            style={lang === "tj" ? { background: "#ff4b2b", borderColor: "#ff4b2b", borderRadius: 20 } : { borderRadius: 20 }}
          >
            TJ
          </Button>
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
        </Space>
      </Flex>

      <AnimatePresence>
        {!tests || tests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card style={{ textAlign: "center", padding: 60, borderRadius: 20 }}>
              <FileTextOutlined style={{ fontSize: 64, color: "#ff4b2b", marginBottom: 20 }} />
              <Title level={4}>{t[lang].noTests}</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
                Нажмите кнопку "Создать тест" чтобы создать первый тест
              </Text>
              <Button 
                type="primary" 
                onClick={openCreateModal} 
                style={{ background: "#ff4b2b", borderRadius: 20 }}
                icon={<RocketOutlined />}
              >
                {t[lang].createFirst}
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Row gutter={[24, 24]}>
              {tests.map((test, index) => {
                const isHovered = hoveredCard === test.id;
                const isNew = newTestId === test.id;
                const questionCount = test.questions?.length || 0;
                
                return (
                  <Col xs={24} md={12} lg={8} key={test.id}>
                    <motion.div
                      id={`test-${test.id}`}
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        boxShadow: isNew ? "0 0 0 3px #ff4b2b, 0 0 0 6px rgba(255, 75, 43, 0.3)" : "none"
                      }}
                      transition={{ 
                        duration: 0.6, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ y: -8 }}
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
                            zIndex: 10,
                          }}
                        >
                          <Tag color="red" style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>
                            NEW! 🎉
                          </Tag>
                        </motion.div>
                      )}
                      
                      <Card
                        onMouseEnter={() => setHoveredCard(test.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          borderRadius: 20,
                          boxShadow: isHovered
                            ? "0 12px 24px rgba(0, 0, 0, 0.12)"
                            : "0 4px 12px rgba(0, 0, 0, 0.08)",
                          transition: "all 0.3s ease",
                          border: "none",
                          overflow: "hidden",
                          cursor: "pointer",
                          backgroundImage: `url(${img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                        styles={{ body: { padding: 0, background: 'transparent' } }}
                      >
                        <div
                          style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                            background: "rgba(255, 255, 255, 0.9)",
                          }}
                        >
                          <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
                            <Avatar
                              style={{
                                background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                                verticalAlign: "middle",
                              }}
                              size={50}
                            >
                              <FileTextOutlined />
                            </Avatar>
                            <div style={{ flex: 1 }}>
                              <Title level={4} style={{ margin: 0, color: "#1a1a1a", fontSize: 18 }}>
                                {lang === "ru" ? test.titleRu || test.title : test.titleTj || test.title}
                              </Title>
                              <Flex gap={8} align="center" style={{ marginTop: 8 }}>
                                <Tag icon={<ClockCircleOutlined />} color="blue" style={{ borderRadius: 20 }}>
                                  {questionCount} {t[lang].questionCount}
                                </Tag>
                              </Flex>
                            </div>
                          </Flex>
                          
                          {(lang === "ru" ? test.descriptionRu || test.description : test.descriptionTj || test.description) && (
                            <Text 
                              type="secondary" 
                              ellipsis={{ rows: 2 }}
                              style={{ marginTop: 12, marginBottom: 0, display: "block" }}
                            >
                              {lang === "ru" ? test.descriptionRu || test.description : test.descriptionTj || test.description}
                            </Text>
                          )}
                        </div>

                        <div style={{ padding: "16px 24px", background: "rgba(255, 255, 255, 0.9)" }}>
                          <Flex justify="end" align="center">
                            <Space>
                              <Button
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(test);
                                }}
                                style={{ borderRadius: 8 }}
                              >
                                {t[lang].edit}
                              </Button>
                              <Popconfirm
                                title={t[lang].deleteConfirm}
                                onConfirm={async (e) => {
                                  e?.stopPropagation();
                                  await removeTest(test.id);
                                  message.success("Тест удален");
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
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </motion.div>
        )}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            display: "flex",
            justifyContent: "end",
          }}
        >
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            showSizeChanger={false}
            showQuickJumper={false}
            pageSizeOptions={[5, 10, 20, 50]}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </AnimatePresence>

      {/* Модальное окно */}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          resetForm();
        }}
        footer={null}
        width={1000}
        centered
        styles={{
          header: { display: "none" },
          body: { padding: 0 },
        }}
      >
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <div style={{
            background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
            padding: "24px 30px",
            color: "white",
          }}>
            <Flex align="center" gap={12}>
              <div style={{
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {editingItem ? <EditOutlined style={{ fontSize: 24 }} /> : <RocketOutlined style={{ fontSize: 24 }} />}
              </div>
              <div>
                <Title level={3} style={{ color: "white", margin: 0 }}>
                  {editingItem ? t[lang].edit : t[lang].addTest}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                  {editingItem ? "Измените параметры теста" : "Заполните информацию о новом тесте"}
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
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    message={t[lang].info}
                    description="Введите основную информацию о тесте."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                  
                  <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                      {t[lang].testTitle} <span style={{ color: "#ff4b2b" }}>*</span>
                    </Text>
                    <Input
                      value={lang === "ru" ? titleRu : titleTj}
                      onChange={(e) => {
                        if (lang === "ru") {
                          setTitleRu(e.target.value);
                        } else {
                          setTitleTj(e.target.value);
                        }
                      }}
                      placeholder={lang === "ru" ? "Введите название теста" : "Номи тестро ворид кунед"}
                      size="large"
                      style={{ borderRadius: 12 }}
                    />
                  </div>

                  <div>
                    <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                      {t[lang].description}
                    </Text>
                    <Input.TextArea
                      value={lang === "ru" ? descriptionRu : descriptionTj}
                      onChange={(e) => {
                        if (lang === "ru") {
                          setDescriptionRu(e.target.value);
                        } else {
                          setDescriptionTj(e.target.value);
                        }
                      }}
                      placeholder={lang === "ru" ? "Введите описание теста" : "Тавсифи тестро ворид кунед"}
                      rows={4}
                      size="large"
                      style={{ borderRadius: 12 }}
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
                  transition={{ duration: 0.3 }}
                >
                  <QuestionSelector />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    message={t[lang].success}
                    description={t[lang].testReady}
                    type="success"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 12 }}
                  />
                  
                  <div style={{ marginBottom: 24 }}>
                    <div style={{
                      background: "linear-gradient(135deg, #fff5f5, #ffffff)",
                      padding: 20,
                      borderRadius: 16,
                      border: "1px solid #ffe0e0"
                    }}>
                      <Flex align="center" gap={12} style={{ marginBottom: 16 }}>
                        <Avatar style={{ background: "#ff4b2b" }}>
                          <FileTextOutlined />
                        </Avatar>
                        <div>
                          <Text strong style={{ fontSize: 18 }}>
                            {lang === "ru" ? titleRu || "Без названия" : titleTj || "Безунвон"}
                          </Text>
                          <div>
                            <Tag color="blue" style={{ marginTop: 4, borderRadius: 20 }}>
                              {selectedQuestionIds.length} {t[lang].totalQuestions}
                            </Tag>
                          </div>
                        </div>
                      </Flex>
                    </div>
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div>
                      <Text strong style={{ fontSize: 16, display: "block", marginBottom: 12 }}>
                        📋 {t[lang].questionsInfo}:
                      </Text>
                      <div style={{ maxHeight: 300, overflow: "auto" }}>
                        <Table
                          dataSource={selectedQuestions}
                          columns={columns}
                          pagination={false}
                          size="small"
                          style={{ borderRadius: 12 }}
                          rowKey="id"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
              <Button onClick={() => setOpen(false)} style={{ borderRadius: 10 }}>
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
                    style={{ 
                      background: "#ff4b2b",
                      borderRadius: 10,
                    }}
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
                      fontWeight: "bold"
                    }}
                    icon={<RocketOutlined />}
                  >
                    {saving ? "Сохранение..." : (editingItem ? t[lang].save : t[lang].addTest)}
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