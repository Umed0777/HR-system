import { useEffect } from "react";
import { Alert, Descriptions, Empty, Spin, Tag, Typography, message } from "antd";
import { useParams } from "react-router-dom";
import { useInternHistoryStore } from "../store/useInternHistoryStore";
import { useGoBack } from "../hooks/useGoBack";
import {
  GRADED_BY_LABEL,
  HISTORY_ROUTES,
  fmtDate,
  sortAnswers,
} from "../utils/oneTimeHistory";
import HistoryHeader from "./HistoryHeader";
import { ScoreTag, StatusTag } from "./HistoryTags";

const { Text } = Typography;

const AttemptHistoryPage = () => {
  const { attemptId } = useParams();
  const goBack = useGoBack(HISTORY_ROUTES.list);

  const { error, attemptView, attemptLoading, fetchAttempt, clearAttempt } =
    useInternHistoryStore();

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => {
    fetchAttempt(attemptId);
    return () => clearAttempt();
  }, [attemptId, fetchAttempt, clearAttempt]);

  const attempt = attemptView?.attempt;

  return (
    <div>
      <HistoryHeader
        title={attempt?.test_title ?? "Попытка"}
        subtitle="Ответы стажёра"
        onBack={goBack}
      />

      {attemptLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      )}

      {!attemptLoading && !attemptView && error && (
        <Empty description="Попытка не найдена" />
      )}

      {attemptView && (
        <>
          {!attemptView.source_available && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Источник тестов недоступен: тексты вопросов и правильные ответы не показаны"
            />
          )}

          <Descriptions
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 20 }}
            items={[
              { key: "intern", label: "Стажёр", children: attempt.intern_name ?? "—" },
              { key: "phone", label: "Телефон", children: attempt.intern_phone ?? "—" },
              { key: "branch", label: "Филиал", children: attempt.branch_name ?? "—" },
              { key: "date", label: "Отправлено", children: fmtDate(attempt.submitted_at) },
              {
                key: "score",
                label: "Баллы",
                children: (
                  <Text strong>
                    {attemptView.score} / {attemptView.total}
                  </Text>
                ),
              },
              {
                key: "status",
                label: "Статус",
                children: (
                  <>
                    <StatusTag needsGrading={attemptView.status === "needs_grading"} />
                    {attempt.auto_submitted && <Tag>Время вышло</Tag>}
                  </>
                ),
              },
            ]}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sortAnswers(attemptView.answers).map((a) => (
              <div
                key={a.id}
                style={{ padding: 14, border: "1px solid #f0f0f0", borderRadius: 8 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <Text strong>
                    {a.position}. {a.question_text ?? `Вопрос #${a.question_id}`}
                  </Text>
                  <ScoreTag score={a.score} />
                </div>

                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Ответ: </Text>
                  <Text>{a.answer_text || "—"}</Text>
                </div>

                {a.score !== 1 && a.correct_answers?.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">Правильный: </Text>
                    <Text>{a.correct_answers.join(", ")}</Text>
                  </div>
                )}

                {a.graded_by && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {GRADED_BY_LABEL[a.graded_by]}
                  </Text>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AttemptHistoryPage;