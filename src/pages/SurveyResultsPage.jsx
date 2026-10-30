// pages/SurveyResultsPage.jsx – КРАСНАЯ ТЕМА, БЕЗ РЕЙТИНГА
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
  Divider,
  message,
  Avatar,
  Alert,
  Tooltip,
} from "antd";
import {
  BarChartOutlined,
  FileExcelOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StarOutlined,
  TrophyOutlined,
  RedoOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { useTestSessionStore } from "../store/useTestSession";
import { useTestStore } from "../store/useTest";
import { useEmployeeStore } from "../store/useEmployee";

const { Title, Text } = Typography;

// Красная тема
const RED = "#ff4b2b";
const RED_DARK = "#ff416c";
const RED_GRADIENT = "linear-gradient(135deg, #ff416c, #ff4b2b)";

// ============================================================
// УТИЛИТЫ
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

const isSameId = (a, b) =>
  a != null && b != null && String(a) === String(b);

// "САИДМАҲМУД БОБОЕВ" -> "Саидмаҳмуд Бобоев"
const formatName = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])(\S)/g, (_, sep, ch) => sep + ch.toUpperCase());

// опрос (Quiz) — та же логика, что в SurveyManager
const isSurvey = (t) => {
  if (!t) return false;
  const v = t.testType ?? t.test_type ?? t.categoryType;
  if (v === undefined || v === null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  if (s === "quiz" || s === "survey" || s === "опрос" || s === "questionnaire")
    return true;
  const n = Number(s);
  return !Number.isNaN(n) && n >= 2;
};

const getManualCorrectAnswer = (q) => {
  if (!q) return null;
  if (q.correctAnswer) return q.correctAnswer;
  const firstOption = Array.isArray(q.options) && q.options[0];
  if (firstOption) {
    return firstOption.textRu || firstOption.text || firstOption.textTj || null;
  }
  return null;
};

const checkManualAnswer = (q, userAnswer) => {
  const correct = getManualCorrectAnswer(q);
  if (!correct) return null;
  const a = String(userAnswer ?? "").trim().toLowerCase();
  const c = String(correct).trim().toLowerCase();
  if (!a) return false;
  return a === c;
};

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
      close: "Закрыть",
      answers: "Ответы",
      rating: "Рейтинг",
      question: "Вопрос",
      answer: "Ответ",
      correct: "Правильно",
      wrong: "Неправильно",
      noStandard: "Эталон не задан",
      yourAnswer: "Ваш ответ",
      standardAnswer: "Эталон",
      completed: "Завершено",
    },
    tj: {
      surveyResults: "Тафсилоти ҷавобҳо",
      employee: "Корманд",
      surveyName: "Пурсиш",
      answeredQuestions: "Саволҳои ҷавобдодашуда",
      totalQuestions: "Ҳамагӣ саволҳо",
      timeSpent: "Вақти сарфшуда",
      status: "Ҳолат",
      close: "Пӯшидан",
      answers: "Ҷавобҳо",
      rating: "Баҳо",
      question: "Савол",
      answer: "Ҷавоб",
      correct: "Дуруст",
      wrong: "Нодуруст",
      noStandard: "Ҷавоби дуруст муайян нашудааст",
      yourAnswer: "Ҷавоби шумо",
      standardAnswer: "Ҷавоби дуруст",
      completed: "Анҷомёфта",
    },
  };

  if (!result) return null;

  const isCompleted = result.isCompleted !== false;
  const answeredCount = result.answers?.length || 0;
  const totalQuestions = result.totalQuestions || 0;
  const completionPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const findQuestion = (qid) =>
    result.questions?.find((q) => isSameId(q.id, qid));

  const getQuestionText = (questionId) => {
    const q = findQuestion(questionId);
    if (!q) return "—";
    return lang === "ru"
      ? q.contentRu || q.content
      : q.contentTj || q.content;
  };

  const getAnswerText = (answer) => {
    const q = findQuestion(answer.questionId);
    if (!q) return String(answer.answer);

    const nType = getNumericType(q.type);
    if (nType === 1) {
      const option = q.options?.find(
        (o) => isSameId(o.id, answer.answer) || o.text === answer.answer
      );
      if (lang === "ru") {
        return option?.textRu || option?.text || String(answer.answer);
      }
      return option?.textTj || option?.text || String(answer.answer);
    }
    if (nType === 3) return `⭐ ${answer.answer}/10`;
    return String(answer.answer);
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isCompleted ? (
            <TrophyOutlined style={{ color: RED, fontSize: 28 }} />
          ) : (
            <WarningOutlined style={{ color: "#faad14", fontSize: 28 }} />
          )}
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {t[lang].surveyResults}
          </span>
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
            background: RED_GRADIENT,
            border: "none",
            borderRadius: 12,
            padding: "0 32px",
            height: 44,
            fontWeight: 600,
          }}
        >
          {t[lang].close}
        </Button>,
      ]}
      width={680}
      centered
      styles={{
        header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 16 },
        body: {
          paddingTop: 24,
          paddingBottom: 16,
          maxHeight: "70vh",
          overflowY: "auto",
        },
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Progress
          type="circle"
          percent={completionPercent}
          format={(percent) => (
            <div>
              <div
                style={{ fontSize: 30, fontWeight: "bold", lineHeight: 1, color: RED }}
              >
                {percent}%
              </div>
              <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
                {t[lang].completed}
              </div>
            </div>
          )}
          strokeColor={isCompleted ? RED : "#faad14"}
          trailColor="#f0f0f0"
          width={150}
        />
      </div>

      <div
        style={{
          background: "#fff5f5",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
          border: "1px solid #ffd6d6",
        }}
      >
        <Row gutter={[16, 8]}>
          <Col span={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text type="secondary">{t[lang].employee}:</Text>
              <Text strong>
                {formatName(result.employeeName) || `ID: ${result.employeeId}`}
              </Text>
            </div>
          </Col>
          <Col span={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text type="secondary">{t[lang].surveyName}:</Text>
              <Text strong>
                {result.surveyName || `Опрос ${result.surveyId}`}
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      <Row gutter={[12, 12]}>
        <Col span={12}>
          <div
            style={{
              background: "#fff1f0",
              borderRadius: 10,
              padding: "14px 16px",
              textAlign: "center",
              border: "1px solid #ffccc7",
              height: "100%",
            }}
          >
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              {t[lang].answeredQuestions}
            </div>
            <div
              style={{ fontSize: 24, fontWeight: "bold", color: RED }}
            >
              {answeredCount}
            </div>
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
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              {t[lang].totalQuestions}
            </div>
            <div
              style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}
            >
              {totalQuestions}
            </div>
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
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {result.answers.map((answer, idx) => {
              const q = findQuestion(answer.questionId);
              const qType = q ? getNumericType(q.type) : 1;
              const isCorrect =
                qType === 2 ? checkManualAnswer(q, answer.answer) : null;
              const correctRef = qType === 2 ? getManualCorrectAnswer(q) : null;

              return (
                <div
                  key={idx}
                  style={{
                    padding: "12px 14px",
                    marginBottom: 8,
                    background:
                      qType === 2
                        ? isCorrect === true
                          ? "#f6ffed"
                          : isCorrect === false
                          ? "#fff1f0"
                          : "#fafafa"
                        : "#fafafa",
                    borderRadius: 8,
                    border:
                      qType === 2
                        ? isCorrect === true
                          ? "1px solid #b7eb8f"
                          : isCorrect === false
                          ? "1px solid #ffccc7"
                          : "1px solid #f0f0f0"
                        : "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                  >
                    <Tag
                      color="red"
                      style={{
                        borderRadius: 50,
                        minWidth: 24,
                        textAlign: "center",
                      }}
                    >
                      {idx + 1}
                    </Tag>
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>
                        {getQuestionText(answer.questionId)}
                      </Text>

                      <div style={{ marginTop: 6 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {qType === 2
                            ? `${t[lang].yourAnswer}: `
                            : `${t[lang].answer}: `}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: qType === 2 ? 500 : 400,
                          }}
                        >
                          {getAnswerText(answer)}
                        </Text>

                        {qType === 3 && (
                          <Tag color="orange" style={{ marginLeft: 8 }}>
                            <StarOutlined /> {t[lang].rating}
                          </Tag>
                        )}
                        {qType === 2 && (
                          <>
                            {isCorrect === true && (
                              <Tag
                                color="success"
                                icon={<CheckCircleOutlined />}
                                style={{ marginLeft: 8 }}
                              >
                                {t[lang].correct}
                              </Tag>
                            )}
                            {isCorrect === false && (
                              <Tag
                                color="error"
                                icon={<CloseCircleOutlined />}
                                style={{ marginLeft: 8 }}
                              >
                                {t[lang].wrong}
                              </Tag>
                            )}
                            {isCorrect === null && (
                              <Tag
                                color="default"
                                icon={<QuestionCircleOutlined />}
                                style={{ marginLeft: 8 }}
                              >
                                {t[lang].noStandard}
                              </Tag>
                            )}
                          </>
                        )}
                      </div>

                      {qType === 2 && correctRef && (
                        <div style={{ marginTop: 6 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t[lang].standardAnswer}:{" "}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#52c41a",
                              fontWeight: 500,
                            }}
                          >
                            {correctRef}
                          </Text>
                        </div>
                      )}
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

  const fetchSessions = useTestSessionStore((s) => s.fetchSessions);
  const fetchTests = useTestStore((s) => s.fetchTests);
  const fetchEmployee = useEmployeeStore((s) => s.fetchEmployee);
 // язык берётся из общего меню (HRSystemLayout)
 const [lang, setLang] = useState(
  () => localStorage.getItem("language") || "ru"
);
useEffect(() => {
  const syncLang = () => {
    setLang(localStorage.getItem("language") || "ru");
  };
  window.addEventListener("app-language-change", syncLang);
  window.addEventListener("storage", syncLang);
  window.addEventListener("focus", syncLang);
  return () => {
    window.removeEventListener("app-language-change", syncLang);
    window.removeEventListener("storage", syncLang);
    window.removeEventListener("focus", syncLang);
  };
}, []);

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
      details: "Детали",
      participants: "Участников",
      avgCompletion: "Средний процент",
      totalSurveys: "Всего опросов",
      exportSuccess: "Данные экспортированы",
      attempt: "Попытка",
      retake: "Пройти снова",
      retakeConfirm: "Вы уверены, что хотите пройти опрос снова?",
      retakeSuccess: "Опрос запущен повторно",
      maxAttemptsReached: "Максимум попыток достигнут",
      totalSessions: "Всего сессий",
      inProgress: "В процессе",
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
      details: "Тафсилот",
      participants: "Иштирокчиён",
      avgCompletion: "Фоизи миёна",
      totalSurveys: "Ҳамагӣ пурсишҳо",
      exportSuccess: "Маълумот содир карда шуд",
      attempt: "Кӯшиш",
      retake: "Аз нав супоридан",
      retakeConfirm: "Шумо боварӣ доред, ки пурсишро аз нав супоридан мехоҳед?",
      retakeSuccess: "Пурсиш аз нав оғоз шуд",
      maxAttemptsReached: "Ҳадди аксари кӯшишҳо расидааст",
      totalSessions: "Ҳамагӣ сессияҳо",
      inProgress: "Дар ҷараён",
    },
  };

  // результаты опросов — сессии TestSession по тестам с testType "Quiz"
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const [sessions, tests] = await Promise.all([
        fetchSessions(1, 1000),
        fetchTests(1, 1000, lang),
        // без сотрудников покажем ID вместо имени
        fetchEmployee(1, 1000).catch(() => null),
      ]);
      const employees = useEmployeeStore.getState().employees || [];
      const surveys = new Map(
        (useTestStore.getState().tests || tests || [])
          .filter(isSurvey)
          .map((sv) => [Number(sv.id), sv]),
      );

      // бэк отдаёт testType в сессии; если его нет — смотрим тип теста
      const surveySessions = (sessions || []).filter((s) =>
        s.testType != null ? isSurvey(s) : surveys.has(Number(s.testId)),
      );
      const attemptsOf = (s) =>
        surveySessions.filter(
          (x) =>
            isSameId(x.employeeId, s.employeeId) &&
            isSameId(x.testId, s.testId) &&
            x.id <= s.id,
        ).length;

      const mapped = surveySessions.map((s) => {
        const sv = surveys.get(Number(s.testId));
        const emp = employees.find((e) => isSameId(e.id, s.employeeId));
        const questions = sv?.questions || [];
        const finished = String(s.status).toLowerCase() === "finished";
        return {
          sessionId: s.id,
          surveyId: s.testId,
          employeeId: s.employeeId,
          employeeName: emp
            ? `${emp.firstName} ${emp.lastName}`
            : `ID: ${s.employeeId}`,
          // без названия таблица покажет "Опрос {id}"
          surveyName:
            (lang === "ru"
              ? sv?.titleRu || sv?.title
              : sv?.titleTj || sv?.title) || null,
          questions,
          totalQuestions: questions.length,
          answers: (s.answers || []).map((a) => ({
            questionId: a.questionId,
            answer: a.optionId ?? a.textAnswer,
          })),
          completedAt: s.finishedAt || s.startedAt,
          timeSpent: Math.round((s.durationMinutes || 0) * 60),
          isCompleted: finished,
          attemptCount: attemptsOf(s),
        };
      });
      setResults(mapped);
    } catch (error) {
      console.error("Error loading results:", error);
      message.error("Ошибка загрузки результатов");
    } finally {
      setLoading(false);
    }
  }, [lang, fetchSessions, fetchTests, fetchEmployee]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // ============================================================
  // ЭКСПОРТ В EXCEL
  // ============================================================
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Лист 1 — Сводка
      const summaryRows = results.map((r, index) => {
        const answered = r.answers?.length || 0;
        const total = r.totalQuestions || 0;
        const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

        let manualTotal = 0;
        let manualCorrect = 0;
        (r.answers || []).forEach((a) => {
          const q = (r.questions || []).find((x) =>
            isSameId(x.id, a.questionId)
          );
          if (!q) return;
          const nType = getNumericType(q.type);
          if (nType !== 2) return;
          const check = checkManualAnswer(q, a.answer);
          if (check !== null) {
            manualTotal += 1;
            if (check) manualCorrect += 1;
          }
        });

        return {
          "№": index + 1,
          "Сотрудник": r.employeeName || `ID: ${r.employeeId}`,
          "Опрос": r.surveyName || `Опрос ${r.surveyId}`,
          "Отвечено": answered,
          "Всего вопросов": total,
          "Процент завершения": `${percent}%`,
          "Правильных (ручных)": manualTotal
            ? `${manualCorrect} / ${manualTotal}`
            : "—",
          "Статус": r.isCompleted !== false ? "Завершён" : "Не завершён",
          "Затраченное время": r.timeSpent || "—",
          "Дата": r.completedAt
            ? new Date(r.completedAt).toLocaleString()
            : "—",
          "Попытка": r.attemptCount || 1,
        };
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [
        { wch: 5 }, { wch: 30 }, { wch: 35 }, { wch: 10 }, { wch: 15 },
        { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 22 },
        { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Сводка");

      // Лист 2 — Статистика
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

      let totalManual = 0;
      let totalManualCorrect = 0;
      results.forEach((r) => {
        (r.answers || []).forEach((a) => {
          const q = (r.questions || []).find((x) =>
            isSameId(x.id, a.questionId)
          );
          if (!q) return;
          const nType = getNumericType(q.type);
          if (nType !== 2) return;
          const check = checkManualAnswer(q, a.answer);
          if (check !== null) {
            totalManual += 1;
            if (check) totalManualCorrect += 1;
          }
        });
      });

      const statsRows = [
        { Показатель: "Всего результатов", Значение: results.length },
        { Показатель: "Участников", Значение: totalParticipants },
        { Показатель: "Средний % завершения", Значение: `${avgCompletion}%` },
        {
          Показатель: "Правильных (ручных)",
          Значение: `${totalManualCorrect} / ${totalManual}`,
        },
        {
          Показатель: "Дата экспорта",
          Значение: new Date().toLocaleString(),
        },
      ];
      const wsStats = XLSX.utils.json_to_sheet(statsRows);
      wsStats["!cols"] = [{ wch: 28 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsStats, "Статистика");

      // Лист 3 — Детали ответов
      const detailRows = [];
      results.forEach((r) => {
        const empName = r.employeeName || `ID: ${r.employeeId}`;
        const surveyName = r.surveyName || `Опрос ${r.surveyId}`;
        (r.answers || []).forEach((a, idx) => {
          const q = (r.questions || []).find((x) =>
            isSameId(x.id, a.questionId)
          );
          const nType = q ? getNumericType(q.type) : 1;
          const typeLabel =
            nType === 1
              ? "Тест"
              : nType === 2
              ? "Открытый"
              : nType === 3
              ? "Рейтинг"
              : "—";

          const qText = q
            ? lang === "ru"
              ? q.contentRu || q.content || "—"
              : q.contentTj || q.content || "—"
            : "—";

          let answerText = "";
          if (nType === 1 && q) {
            const opt = q.options?.find(
              (o) => isSameId(o.id, a.answer) || o.text === a.answer
            );
            answerText =
              (lang === "ru"
                ? opt?.textRu || opt?.text
                : opt?.textTj || opt?.text) || String(a.answer ?? "—");
          } else if (nType === 3) {
            answerText = `⭐ ${a.answer}/10`;
          } else {
            answerText = String(a.answer ?? "—");
          }

          let correctness = "—";
          let standard = "";
          if (nType === 1 && q) {
            const opt = q.options?.find(
              (o) => isSameId(o.id, a.answer) || o.text === a.answer
            );
            correctness = opt?.isCorrect
              ? "✅ Правильно"
              : "❌ Неправильно";
            const correctOpt = q.options?.find((o) => o.isCorrect);
            standard = correctOpt
              ? lang === "ru"
                ? correctOpt.textRu || correctOpt.text
                : correctOpt.textTj || correctOpt.text
              : "";
          } else if (nType === 2) {
            const check = checkManualAnswer(q, a.answer);
            correctness =
              check === true
                ? "✅ Правильно"
                : check === false
                ? "❌ Неправильно"
                : "— (нет эталона)";
            standard = getManualCorrectAnswer(q) || "";
          } else if (nType === 3) {
            correctness = `⭐ Оценка ${a.answer}/10`;
          }

          detailRows.push({
            "№": idx + 1,
            "Сотрудник": empName,
            "Опрос": surveyName,
            "Тип": typeLabel,
            "Вопрос": qText,
            "Ответ": answerText,
            "Правильность": correctness,
            "Эталон": standard,
          });
        });
      });

      const wsDetail = XLSX.utils.json_to_sheet(detailRows);
      wsDetail["!cols"] = [
        { wch: 5 }, { wch: 28 }, { wch: 30 }, { wch: 12 },
        { wch: 60 }, { wch: 40 }, { wch: 22 }, { wch: 40 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, "Детали ответов");

      XLSX.writeFile(
        wb,
        `survey_results_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      message.success(t[lang].exportSuccess);
    } catch (error) {
      console.error("Export error:", error);
      message.error("Ошибка при экспорте");
    }
  };

  const viewDetails = (record) => {
    setSelectedResult(record);
    setDetailModalVisible(true);
  };

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
      okButtonProps: { style: { background: RED, borderColor: RED } },
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

  const totalParticipants = results.length;
  const totalCompleted = results.filter(
    (r) => r.isCompleted !== false
  ).length;
  const totalInProgress = results.filter(
    (r) => r.isCompleted === false
  ).length;
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

  // Колонки
  const columns = [
    {
      title: "ID",
      key: "id",
      width: 60,
      render: (_, __, index) => (
        <Tag color="red" style={{ borderRadius: 20 }}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: t[lang].employee,
      key: "employee",
      width: 260,
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{ background: RED_GRADIENT, flexShrink: 0 }}
          />
          <Text strong style={{ wordBreak: "normal", lineHeight: 1.3 }}>
            {formatName(record.employeeName) || `ID: ${record.employeeId}`}
          </Text>
        </div>
      ),
    },
    {
      title: t[lang].surveyName,
      key: "survey",
      render: (_, record) => (
        <Tag color="red" style={{ borderRadius: 20 }}>
          {record.surveyName || `Опрос ${record.surveyId}`}
        </Tag>
      ),
    },
    {
      title: t[lang].answeredQuestions,
      key: "progress",
      render: (_, record) => {
        const answered = record.answers?.length || 0;
        const total = record.totalQuestions || 0;
        const percent =
          total > 0 ? Math.round((answered / total) * 100) : 0;
        return (
          <div style={{ minWidth: 120 }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={percent === 100 ? "#52c41a" : RED}
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
      render: (count) => (
        <Tag color="orange" style={{ borderRadius: 20 }}>
          {count || 1}
        </Tag>
      ),
    },
    {
      title: t[lang].details,
      key: "actions",
      render: (_, record) => {
        const attemptCount = record.attemptCount || 1;
        const canRetake = attemptCount < 2;
        return (
          <Space size="small">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => viewDetails(record)}
              style={{
                color: RED,
                borderColor: RED,
                borderRadius: 8,
              }}
            >
              {t[lang].details}
            </Button>
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => handleRetakeSurvey(record)}
              style={{
                color: canRetake ? "#fff" : "#d9d9d9",
                background: canRetake ? RED : "transparent",
                borderColor: canRetake ? RED : "#d9d9d9",
                borderRadius: 8,
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
    <div
      style={{
        padding: 24,
        background: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <style>{`
        .red-pagination .ant-pagination-item-active {
          background: ${RED} !important;
          border-color: ${RED} !important;
        }
        .red-pagination .ant-pagination-item-active a {
          color: #fff !important;
        }
        .red-pagination .ant-pagination-item:hover {
          border-color: ${RED} !important;
        }
        .red-pagination .ant-pagination-item:hover a {
          color: ${RED} !important;
        }
      `}</style>

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* Верхняя панель */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
              <BarChartOutlined
                style={{ color: RED, marginRight: 12 }}
              />
              {t[lang].title}
            </Title>
            <Text type="secondary">
              Всего {results.length} сессий
            </Text>
          </div>

          <Space wrap>
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              style={{
                color: "#fff",
                background: "#217346",
                borderColor: "#217346",
                fontWeight: 500,
                borderRadius: 20,
              }}
              disabled={results.length === 0}
            >
              {t[lang].exportExcel}
            </Button>
          </Space>
        </motion.div>

        {/* Статистика — 4 карточки */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                style={{
                  borderRadius: 16,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <Statistic
                  title={t[lang].totalSessions}
                  value={results.length}
                  prefix={<FileTextOutlined style={{ color: RED }} />}
                  valueStyle={{ color: RED, fontWeight: 700 }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card
                style={{
                  borderRadius: 16,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <Statistic
                  title={t[lang].completed}
                  value={totalCompleted}
                  prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                  valueStyle={{ color: "#52c41a", fontWeight: 700 }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card
                style={{
                  borderRadius: 16,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <Statistic
                  title={t[lang].inProgress}
                  value={totalInProgress}
                  prefix={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
                  valueStyle={{ color: "#1890ff", fontWeight: 700 }}
                />
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card
                style={{
                  borderRadius: 16,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <Statistic
                  title={t[lang].avgCompletion}
                  value={avgCompletion}
                  suffix="%"
                  prefix={<TrophyOutlined style={{ color: "#faad14" }} />}
                  valueStyle={{ color: "#faad14", fontWeight: 700 }}
                />
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Таблица результатов */}
        <Card
          style={{
            borderRadius: 16,
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          {results.length === 0 ? (
            <Empty
              description={t[lang].noResults}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: 40 }}
            />
          ) : (
            <Table
              dataSource={results}
              columns={columns}
              rowKey={(record, index) =>
                record.sessionId ??
                `${record.surveyId}-${record.employeeId}-${index}`
              }
              pagination={{
                pageSize: 10,
                className: "red-pagination",
                showSizeChanger: false,
              }}
              scroll={{ x: 1300 }}
              loading={loading}
            />
          )}
        </Card>

        {/* Модалка деталей */}
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
    </div>
  );
};

export default SurveyResultsPage;