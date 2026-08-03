// pages/SurveyResultsPage.jsx – ПОЛНАЯ ВЕРСИЯ (две попытки, после второй disabled)
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Progress,
  Row,
  Col,
  Statistic,
  Empty,
  Descriptions,
  Divider,
  Badge,
  message,
  Avatar,
  List,
  Alert,
} from "antd";
import {
  BarChartOutlined,
  FileExcelOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StarOutlined,
  TrophyOutlined,
  CrownOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";

const { Title, Text } = Typography;

// ============================================================
// 1. МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ОТВЕТОВ
// ============================================================
const SurveyResultDetailModal = ({ visible, result, onClose, lang }) => {
  const t = {
    ru: {
      surveyResults: "Детали ответов",
      employee: "Сотрудник",
      surveyName: "Опрос",
      answeredQuestions: "Отвечено вопросов",
      totalQuestions: "Всего вопросов",
      timeSpent: "Затраченное время",
      status: "Статус",
      completed: "Завершен ✅",
      notCompleted: "Не завершен ❌",
      close: "Закрыть",
      answers: "Ответы",
      rating: "Рейтинг",
      textAnswer: "Текстовый ответ",
      question: "Вопрос",
      answer: "Ответ",
    },
    tj: {
      surveyResults: "Тафсилоти ҷавобҳо",
      employee: "Корманд",
      surveyName: "Пурсиш",
      answeredQuestions: "Саволҳои ҷавобдодашуда",
      totalQuestions: "Ҳамагӣ саволҳо",
      timeSpent: "Вақти сарфшуда",
      status: "Ҳолат",
      completed: "Анҷомёфта ✅",
      notCompleted: "Анҷом наёфта ❌",
      close: "Пӯшидан",
      answers: "Ҷавобҳо",
      rating: "Баҳо",
      textAnswer: "Ҷавоби матнӣ",
      question: "Савол",
      answer: "Ҷавоб",
    },
  };

  if (!result) return null;

  const isCompleted = result.isCompleted !== false;
  const answeredCount = result.answers?.length || 0;
  const totalQuestions = result.totalQuestions || 0;
  const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const getQuestionText = (questionId) => {
    const q = result.questions?.find((q) => q.id === questionId);
    if (!q) return "—";
    return lang === "ru" ? q.contentRu || q.content : q.contentTj || q.content;
  };

  const getAnswerText = (answer) => {
    const q = result.questions?.find((q) => q.id === answer.questionId);
    if (!q) return String(answer.answer);

    if (q.type === 1) {
      const option = q.options?.find((o) => o.id === answer.answer || o.text === answer.answer);
      if (lang === "ru") {
        return option?.textRu || option?.text || String(answer.answer);
      }
      return option?.textTj || option?.text || String(answer.answer);
    }

    if (q.type === 3) {
      return `⭐ ${answer.answer}/10`;
    }

    return String(answer.answer);
  };

  const getQuestionType = (questionId) => {
    const q = result.questions?.find((q) => q.id === questionId);
    if (!q) return "—";
    return q.type;
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isCompleted ? (
            <TrophyOutlined style={{ color: "#1890ff", fontSize: 28 }} />
          ) : (
            <WarningOutlined style={{ color: "#faad14", fontSize: 28 }} />
          )}
          <span style={{ fontSize: 20, fontWeight: 600 }}>{t[lang].surveyResults}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={onClose}
          style={{
            background: isCompleted ? "#1890ff" : "#faad14",
            borderColor: isCompleted ? "#1890ff" : "#faad14",
            borderRadius: 12,
            padding: "0 32px",
            height: 44,
            fontWeight: 600,
          }}
        >
          {t[lang].close}
        </Button>,
      ]}
      width={620}
      centered
      styles={{
        header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 16 },
        body: { paddingTop: 24, paddingBottom: 16, maxHeight: "70vh", overflowY: "auto" },
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Progress
          type="circle"
          percent={completionPercent}
          format={(percent) => (
            <div>
              <div style={{ fontSize: 30, fontWeight: "bold", lineHeight: 1 }}>{percent}%</div>
              <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>Завершено</div>
            </div>
          )}
          strokeColor={isCompleted ? "#1890ff" : "#faad14"}
          trailColor="#f0f0f0"
          width={150}
        />
      </div>

      <div
        style={{
          background: "#f8f9fa",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
        }}
      >
        <Row gutter={[16, 8]}>
          <Col span={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary">{t[lang].employee}:</Text>
              <Text strong>{result.employeeName || `ID: ${result.employeeId}`}</Text>
            </div>
          </Col>
          <Col span={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary">{t[lang].surveyName}:</Text>
              <Text strong>{result.surveyName || `Опрос ${result.surveyId}`}</Text>
            </div>
          </Col>
        </Row>
      </div>

      <Row gutter={[12, 12]}>
        <Col span={12}>
          <div
            style={{
              background: "#e6f7ff",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
              border: "1px solid #91d5ff",
              height: "100%",
            }}
          >
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>{t[lang].answeredQuestions}</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>{answeredCount}</div>
          </div>
        </Col>
        <Col span={12}>
          <div
            style={{
              background: "#f6ffed",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
              border: "1px solid #b7eb8f",
              height: "100%",
            }}
          >
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>{t[lang].totalQuestions}</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>{totalQuestions}</div>
          </div>
        </Col>
      </Row>

      {result.timeSpent && (
        <div
          style={{
            marginTop: 16,
            textAlign: "center",
            padding: "10px 16px",
            background: "#fff7e6",
            borderRadius: 10,
            border: "1px solid #ffd591",
          }}
        >
          <Text type="secondary">
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {t[lang].timeSpent}: {result.timeSpent}
          </Text>
        </div>
      )}

      {result.answers && result.answers.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Divider orientation="left">
            <Text strong>{t[lang].answers}</Text>
          </Divider>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {result.answers.map((answer, idx) => {
              const qType = getQuestionType(answer.questionId);
              return (
                <div
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    marginBottom: 8,
                    background: "#fafafa",
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <Tag color="blue" style={{ borderRadius: 50, minWidth: 24, textAlign: "center" }}>
                      {idx + 1}
                    </Tag>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{getQuestionText(answer.questionId)}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t[lang].answer}:{" "}
                        </Text>
                        <Text style={{ fontSize: 13 }}>{getAnswerText(answer)}</Text>
                        {qType === 3 && (
                          <Tag color="orange" style={{ marginLeft: 8 }}>
                            <StarOutlined /> {t[lang].rating}
                          </Tag>
                        )}
                        {qType === 2 && (
                          <Tag color="purple" style={{ marginLeft: 8 }}>
                            {t[lang].textAnswer}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isCompleted && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message="Опрос не завершён"
            description="Пожалуйста, ответьте на все вопросы в следующий раз."
            type="warning"
            showIcon
            style={{ borderRadius: 10 }}
          />
        </div>
      )}
    </Modal>
  );
};

// ============================================================
// 2. ОСНОВНАЯ СТРАНИЦА РЕЗУЛЬТАТОВ
// ============================================================
export const SurveyResultsPage = () => {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("survey_manager_lang") || "ru";
  });
  const [showRanking, setShowRanking] = useState(true);

  const t = {
    ru: {
      title: "Результаты опросов",
      employee: "Сотрудник",
      surveyName: "Опрос",
      answeredQuestions: "Отвечено",
      totalQuestions: "Всего вопросов",
      timeSpent: "Время",
      status: "Статус",
      completed: "Завершен",
      notCompleted: "Не завершен",
      close: "Закрыть",
      noResults: "Нет результатов опросов",
      exportExcel: "Экспорт в Excel",
      clearAll: "Очистить все",
      refresh: "Обновить",
      details: "Детали",
      participants: "Участников",
      avgCompletion: "Средний процент",
      totalSurveys: "Всего опросов",
      deleteConfirm: "Вы уверены, что хотите удалить все результаты?",
      deleteSuccess: "Все результаты удалены",
      exportSuccess: "Данные экспортированы",
      answers: "Ответы",
      question: "Вопрос",
      answer: "Ответ",
      rating: "Рейтинг",
      textAnswer: "Текстовый ответ",
      completionRate: "Процент завершения",
      timeSpentLabel: "Затраченное время",
      survey: "Опрос",
      viewDetails: "Детали",
      ranking: "Рейтинг участников",
      showRanking: "Показать рейтинг",
      hideRanking: "Скрыть рейтинг",
      id: "ID",
      attempt: "Попытка",
      retake: "Пройти снова",
      retakeConfirm: "Вы уверены, что хотите пройти опрос снова?",
      retakeSuccess: "Опрос запущен повторно",
      maxAttemptsReached: "Максимум попыток достигнут",
    },
    tj: {
      title: "Натиҷаҳои пурсишҳо",
      employee: "Корманд",
      surveyName: "Пурсиш",
      answeredQuestions: "Ҷавоб дода шуд",
      totalQuestions: "Ҳамагӣ саволҳо",
      timeSpent: "Вақт",
      status: "Ҳолат",
      completed: "Анҷомёфта",
      notCompleted: "Анҷом наёфта",
      close: "Пӯшидан",
      noResults: "Натиҷаҳои пурсишҳо нестанд",
      exportExcel: "Содирот ба Excel",
      clearAll: "Тоза кардани ҳама",
      refresh: "Навсозӣ",
      details: "Тафсилот",
      participants: "Иштирокчиён",
      avgCompletion: "Фоизи миёна",
      totalSurveys: "Ҳамагӣ пурсишҳо",
      deleteConfirm: "Шумо боварӣ доред, ки ҳамаи натиҷаҳоро нест кардан мехоҳед?",
      deleteSuccess: "Ҳамаи натиҷаҳо нест карда шуданд",
      exportSuccess: "Маълумот содир карда шуд",
      answers: "Ҷавобҳо",
      question: "Савол",
      answer: "Ҷавоб",
      rating: "Баҳо",
      textAnswer: "Ҷавоби матнӣ",
      completionRate: "Фоизи анҷом",
      timeSpentLabel: "Вақти сарфшуда",
      survey: "Пурсиш",
      viewDetails: "Тафсилот",
      ranking: "Рейтинги иштирокчиён",
      showRanking: "Нишон додани рейтинг",
      hideRanking: "Пинҳон кардани рейтинг",
      id: "ID",
      attempt: "Кӯшиш",
      retake: "Аз нав супоридан",
      retakeConfirm: "Шумо боварӣ доред, ки пурсишро аз нав супоридан мехоҳед?",
      retakeSuccess: "Пурсиш аз нав оғоз шуд",
      maxAttemptsReached: "Ҳадди аксари кӯшишҳо расидааст",
    },
  };

  // Загрузка результатов
  const loadResults = useCallback(() => {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem("survey_results") || "[]");
      setResults(saved);
    } catch (error) {
      console.error("Error loading results:", error);
      message.error("Ошибка загрузки результатов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Экспорт в Excel
  const exportToExcel = () => {
    try {
      const data = results.map((r, index) => {
        const answeredCount = r.answers?.length || 0;
        const totalQuestions = r.totalQuestions || 0;
        const completionPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

        return {
          "ID": index + 1,
          "Сотрудник": r.employeeName || `ID: ${r.employeeId}`,
          "Опрос": r.surveyName || `Опрос ${r.surveyId}`,
          "Отвечено вопросов": answeredCount,
          "Всего вопросов": totalQuestions,
          "Процент завершения": `${completionPercent}%`,
          "Статус": r.isCompleted !== false ? "Завершен" : "Не завершен",
          "Затраченное время": r.timeSpent || "—",
          "Дата": r.completedAt ? new Date(r.completedAt).toLocaleString() : "—",
          "Попытка": r.attemptCount || 1,
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Результаты опросов");

      const totalParticipants = results.length;
      const avgCompletion = totalParticipants > 0
        ? Math.round(
            results.reduce((sum, r) => {
              const answered = r.answers?.length || 0;
              const total = r.totalQuestions || 0;
              return sum + (total > 0 ? (answered / total) * 100 : 0);
            }, 0) / totalParticipants
          )
        : 0;

      const statsData = [
        { "Показатель": "Всего опросов", "Значение": results.length },
        { "Показатель": "Участников", "Значение": totalParticipants },
        { "Показатель": "Средний процент завершения", "Значение": `${avgCompletion}%` },
      ];
      const wsStats = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, "Статистика");

      XLSX.writeFile(wb, `survey_results_${new Date().toISOString().split("T")[0]}.xlsx`);
      message.success(t[lang].exportSuccess);
    } catch (error) {
      console.error("Export error:", error);
      message.error("Ошибка при экспорте");
    }
  };

  // Очистка всех результатов
  const clearAllResults = () => {
    Modal.confirm({
      title: t[lang].clearAll,
      content: t[lang].deleteConfirm,
      okText: "Да",
      cancelText: "Нет",
      onOk: () => {
        localStorage.removeItem("survey_results");
        setResults([]);
        message.success(t[lang].deleteSuccess);
      },
    });
  };

  // Просмотр деталей
  const viewDetails = (record) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

  // Обновление
  const refreshResults = () => {
    loadResults();
    message.success("Данные обновлены");
  };

  // ===== ПОВТОРНОЕ ПРОХОЖДЕНИЕ (разрешено, пока попыток < 2) =====
  const handleRetakeSurvey = (record) => {
    const attemptCount = record.attemptCount || 1;
    if (attemptCount >= 2) {
      message.warning(t[lang].maxAttemptsReached);
      return;
    }
    Modal.confirm({
      title: t[lang].retake,
      content: t[lang].retakeConfirm,
      okText: "Да",
      cancelText: "Нет",
      onOk: () => {
        localStorage.setItem(
          "active_survey_state",
          JSON.stringify({
            surveyId: record.surveyId,
            employeeId: record.employeeId,
          })
        );
        message.success(t[lang].retakeSuccess);
        navigate("/surveys");
      },
    });
  };

  // Статистика
  const totalParticipants = results.length;
  const avgCompletion =
    totalParticipants > 0
      ? Math.round(
          results.reduce((sum, r) => {
            const answered = r.answers?.length || 0;
            const total = r.totalQuestions || 0;
            return sum + (total > 0 ? (answered / total) * 100 : 0);
          }, 0) / totalParticipants
        )
      : 0;

  // Переключение языка
  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("survey_manager_lang", newLang);
  };

  // Рейтинг участников
  const participantStats = results
    .map((r) => {
      const employeeName = r.employeeName || `ID: ${r.employeeId}`;
      const answered = r.answers?.length || 0;
      const total = r.totalQuestions || 0;
      const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
      const isCompleted = r.isCompleted !== false;
      return {
        employeeName,
        employeeId: r.employeeId,
        surveyName: r.surveyName || `Опрос ${r.surveyId}`,
        answered,
        total,
        percent,
        isCompleted,
        timeSpent: r.timeSpent || "—",
        completedAt: r.completedAt,
        attemptCount: r.attemptCount || 1,
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const getRankIcon = (index) => {
    if (index === 0) return <CrownOutlined style={{ color: "#ffd700", fontSize: 20 }} />;
    if (index === 1) return <TrophyOutlined style={{ color: "#c0c0c0", fontSize: 20 }} />;
    if (index === 2) return <TrophyOutlined style={{ color: "#cd7f32", fontSize: 20 }} />;
    return null;
  };

  // ===== КОЛОНКИ ТАБЛИЦЫ (кнопка активна до 2-й попытки) =====
  const columns = [
    {
      title: t[lang].id,
      key: "id",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: t[lang].employee,
      key: "employee",
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text>{record.employeeName || `ID: ${record.employeeId}`}</Text>
        </Space>
      ),
    },
    {
      title: t[lang].surveyName,
      key: "survey",
      render: (_, record) => <Text>{record.surveyName || `Опрос ${record.surveyId}`}</Text>,
    },
    {
      title: t[lang].answeredQuestions,
      key: "progress",
      render: (_, record) => {
        const answered = record.answers?.length || 0;
        const total = record.totalQuestions || 0;
        const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
        return (
          <div style={{ minWidth: 120 }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={percent === 100 ? "#52c41a" : "#1890ff"}
              format={() => `${answered}/${total}`}
            />
          </div>
        );
      },
    },
    {
      title: t[lang].status,
      key: "status",
      render: (_, record) =>
        record.isCompleted !== false ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            {t[lang].completed}
          </Tag>
        ) : (
          <Tag color="warning" icon={<WarningOutlined />}>
            {t[lang].notCompleted}
          </Tag>
        ),
    },
    {
      title: t[lang].timeSpent,
      dataIndex: "timeSpent",
      render: (time) => time || "—",
    },
    {
      title: "Дата",
      dataIndex: "completedAt",
      render: (date) => (date ? new Date(date).toLocaleString() : "—"),
    },
    {
      title: t[lang].attempt,
      dataIndex: "attemptCount",
      render: (count) => count || 1,
    },
    {
      title: t[lang].details,
      key: "actions",
      render: (_, record) => {
        const attemptCount = record.attemptCount || 1;
        const canRetake = attemptCount < 2; // можно пройти снова, если попыток меньше 2
        return (
          <Space size="small">
            <Button size="small" icon={<EyeOutlined />} onClick={() => viewDetails(record)}>
              {t[lang].details}
            </Button>
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => handleRetakeSurvey(record)}
              style={{
                color: canRetake ? "#1890ff" : "#d9d9d9",
                borderColor: canRetake ? "#1890ff" : "#d9d9d9",
              }}
              disabled={!canRetake}
            >
              {t[lang].retake}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Верхняя панель */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ color: "#1890ff", marginRight: 12 }} />
            {t[lang].title}
          </Title>
          <Text type="secondary">Всего {results.length} результатов</Text>
        </div>

        <Space>
          <Button
            type={lang === "ru" ? "primary" : "default"}
            onClick={() => handleSetLang("ru")}
            style={lang === "ru" ? { background: "#1890ff", borderColor: "#1890ff" } : {}}
          >
            RU
          </Button>
          <Button
            type={lang === "tj" ? "primary" : "default"}
            onClick={() => handleSetLang("tj")}
            style={lang === "tj" ? { background: "#1890ff", borderColor: "#1890ff" } : {}}
          >
            TJ
          </Button>
          <Button icon={showRanking ? <StarOutlined /> : <TeamOutlined />} onClick={() => setShowRanking(!showRanking)}>
            {showRanking ? t[lang].hideRanking : t[lang].showRanking}
          </Button>
          {/* <Button icon={<ReloadOutlined />} onClick={refreshResults} loading={loading}>
            {t[lang].refresh}
          </Button> */}
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
            style={{ color: "#52c41a", borderColor: "#52c41a" }}
            disabled={results.length === 0}
          >
            {t[lang].exportExcel}
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={clearAllResults} disabled={results.length === 0}>
            {t[lang].clearAll}
          </Button>
        </Space>
      </div>

      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t[lang].totalSurveys}
              value={results.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t[lang].participants}
              value={totalParticipants}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t[lang].avgCompletion}
              value={avgCompletion}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Рейтинг участников */}
      {showRanking && participantStats.length > 0 && (
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarOutlined style={{ color: "#ffd700" }} />
              <span>{t[lang].ranking}</span>
            </div>
          }
          style={{ borderRadius: 12, marginBottom: 24 }}
        >
          <List
            dataSource={participantStats}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <div style={{ minWidth: 50, textAlign: "center" }}>
                      {getRankIcon(index)}
                      <div style={{ fontSize: 18, fontWeight: "bold", color: index < 3 ? "#1890ff" : "#666" }}>
                        #{index + 1}
                      </div>
                    </div>
                  }
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
                      <Text strong>{item.employeeName}</Text>
                      <Tag color="blue">{item.surveyName}</Tag>
                      {item.isCompleted ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Завершен
                        </Tag>
                      ) : (
                        <Tag color="warning" icon={<WarningOutlined />}>
                          Не завершен
                        </Tag>
                      )}
                      <Tag color="purple">Попытка {item.attemptCount}</Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Отвечено"
                            value={item.answered}
                            suffix={`/ ${item.total}`}
                            valueStyle={{ fontSize: 16 }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Процент"
                            value={item.percent}
                            suffix="%"
                            valueStyle={{
                              fontSize: 16,
                              color: item.percent === 100 ? "#52c41a" : "#1890ff",
                            }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Время"
                            value={item.timeSpent}
                            valueStyle={{ fontSize: 16 }}
                          />
                        </Col>
                      </Row>
                      <Progress
                        percent={item.percent}
                        size="small"
                        strokeColor={item.percent === 100 ? "#52c41a" : "#1890ff"}
                        showInfo={false}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Таблица результатов */}
      <Card>
        {results.length === 0 ? (
          <Empty description={t[lang].noResults} />
        ) : (
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(record, index) => `${record.surveyId}-${record.employeeId}-${index}`}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            loading={loading}
          />
        )}
      </Card>

      {/* Модальное окно деталей */}
      <SurveyResultDetailModal
        visible={detailModalVisible}
        result={selectedResult}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedResult(null);
        }}
        lang={lang}
      />
    </div>
  );
};

export default SurveyResultsPage;