import { useEffect, useState } from "react";
import { Descriptions, Empty, Select, Table, Tag, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useInternHistoryStore } from "../store/useInternHistoryStore";
import { useGoBack } from "../hooks/useGoBack";
import {
  ATTEMPTS_PAGE_SIZE,
  ATTEMPT_STATUS_OPTIONS,
  HISTORY_ROUTES,
  fmtDate,
  fullName,
} from "../utils/oneTimeHistory";
import HistoryHeader from "./HistoryHeader";
import { StatusTag } from "./HistoryTags";

const attemptColumns = [
  { title: "Тест", dataIndex: "test_title" },
  {
    title: "Баллы",
    render: (_, r) => `${r.scored} / ${r.total_questions}`,
    align: "center",
  },
  {
    title: "Статус",
    render: (_, r) => (
      <>
        <StatusTag needsGrading={r.needs_grading} />
        {r.auto_submitted && <Tag>Время вышло</Tag>}
      </>
    ),
  },
  { title: "Отправлено", dataIndex: "submitted_at", render: fmtDate },
];

const InternHistoryPage = () => {
  const { internId } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack(HISTORY_ROUTES.list);

  const [attemptsPage, setAttemptsPage] = useState(1);
  const [status, setStatus] = useState();

  const { error, internDetail, internLoading, fetchIntern, clearIntern } =
    useInternHistoryStore();

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => {
    fetchIntern(internId, {
      status,
      limit: ATTEMPTS_PAGE_SIZE,
      offset: (attemptsPage - 1) * ATTEMPTS_PAGE_SIZE,
    });
  }, [internId, status, attemptsPage, fetchIntern]);

  // при уходе со страницы сбрасываем данные, чтобы не мелькал прошлый стажёр
  useEffect(() => () => clearIntern(), [clearIntern]);

  const intern = internDetail?.intern;

  if (!intern && !internLoading && error) {
    return (
      <div>
        <HistoryHeader title="Стажёр" onBack={goBack} />
        <Empty description="Стажёр не найден" />
      </div>
    );
  }

  return (
    <div>
      <HistoryHeader
        title={intern ? fullName(intern) : "Стажёр"}
        subtitle="Попытки прохождения тестов"
        onBack={goBack}
      />

      {intern && (
        <Descriptions
          bordered
          size="small"
          column={3}
          style={{ marginBottom: 20 }}
          items={[
            { key: "phone", label: "Телефон", children: intern.phone },
            { key: "branch", label: "Филиал", children: intern.branch_name || "—" },
            { key: "created", label: "В системе с", children: fmtDate(intern.created_at) },
          ]}
        />
      )}

      <Select
        allowClear
        placeholder="Все попытки"
        value={status}
        onChange={(v) => {
          setStatus(v);
          setAttemptsPage(1);
        }}
        options={ATTEMPT_STATUS_OPTIONS}
        style={{ width: 200, marginBottom: 16 }}
      />

      <Table
        rowKey="id"
        columns={attemptColumns}
        dataSource={internDetail?.attempts ?? []}
        loading={internLoading}
        onRow={(r) => ({
          onClick: () => navigate(HISTORY_ROUTES.attempt(r.id)),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: attemptsPage,
          pageSize: ATTEMPTS_PAGE_SIZE,
          total: internDetail?.attemptsTotal ?? 0,
          showSizeChanger: false,
          onChange: setAttemptsPage,
        }}
        locale={{ emptyText: "Попыток нет" }}
      />
    </div>
  );
};

export default InternHistoryPage;