import { useEffect, useState } from "react";
import { Table, Input, Select, Tag, Drawer, Alert, Typography, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useInternHistoryStore } from "../store/useInternHistoryStore";

const { Text } = Typography;

const PAGE_SIZE = 20;
const ATTEMPTS_PAGE_SIZE = 10;

const fmtDate = (v) => (v ? new Date(v).toLocaleString("ru-RU") : "—");
const fullName = (i) =>
  [i.last_name, i.first_name, i.middle_name].filter(Boolean).join(" ");

const StatusTag = ({ needsGrading }) =>
  needsGrading ? <Tag color="orange">Ждёт проверки</Tag> : <Tag color="green">Проверено</Tag>;

const ScoreTag = ({ score }) => {
  if (score === 1) return <Tag color="green">Верно</Tag>;
  if (score === 0) return <Tag color="red">Неверно</Tag>;
  return <Tag color="orange">Не проверен</Tag>;
};

const OneTimeHistory = () => {
  const {
    error,
    branches,
    interns,
    internsTotal,
    internsLoading,
    internDetail,
    internLoading,
    attemptView,
    attemptLoading,
    fetchBranches,
    fetchInterns,
    fetchIntern,
    fetchAttempt,
    clearIntern,
    clearAttempt,
  } = useInternHistoryStore();

  // фильтры списка стажёров
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [branchId, setBranchId] = useState();
  const [page, setPage] = useState(1);

  // drawer стажёра
  const [selectedInternId, setSelectedInternId] = useState(null);
  const [attemptsPage, setAttemptsPage] = useState(1);
  const [attemptsStatus, setAttemptsStatus] = useState();

  // drawer попытки
  const [attemptOpen, setAttemptOpen] = useState(false);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // debounce поиска
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchInterns({
      search: query,
      branchId,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });
  }, [query, branchId, page, fetchInterns]);

  useEffect(() => {
    if (!selectedInternId) return;
    fetchIntern(selectedInternId, {
      status: attemptsStatus,
      limit: ATTEMPTS_PAGE_SIZE,
      offset: (attemptsPage - 1) * ATTEMPTS_PAGE_SIZE,
    });
  }, [selectedInternId, attemptsStatus, attemptsPage, fetchIntern]);

  const openIntern = (id) => {
    setAttemptsPage(1);
    setAttemptsStatus(undefined);
    setSelectedInternId(id);
  };

  const closeIntern = () => {
    setSelectedInternId(null);
    clearIntern();
  };

  const openAttempt = (id) => {
    setAttemptOpen(true);
    fetchAttempt(id);
  };

  const closeAttempt = () => {
    setAttemptOpen(false);
    clearAttempt();
  };

  const internColumns = [
    { title: "ФИО", render: (_, r) => <Text strong>{fullName(r)}</Text> },
    { title: "Телефон", dataIndex: "phone" },
    { title: "Филиал", dataIndex: "branch_name", render: (v) => v || "—" },
    { title: "Попыток", dataIndex: "attempts_count", align: "center" },
    {
      title: "Статус",
      dataIndex: "needs_grading",
      render: (v) => <StatusTag needsGrading={v} />,
    },
    { title: "Обновлён", dataIndex: "updated_at", render: fmtDate },
  ];

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

  const intern = internDetail?.intern;
  const answers = attemptView
    ? [...attemptView.answers].sort((a, b) => a.position - b.position)
    : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Поиск по ФИО или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          allowClear
          placeholder="Все филиалы"
          value={branchId}
          onChange={(v) => {
            setBranchId(v);
            setPage(1);
          }}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          style={{ width: 240 }}
        />
      </div>

      <Table
        rowKey="id"
        columns={internColumns}
        dataSource={interns}
        loading={internsLoading}
        onRow={(r) => ({ onClick: () => openIntern(r.id), style: { cursor: "pointer" } })}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: internsTotal,
          showSizeChanger: false,
          onChange: setPage,
        }}
        locale={{ emptyText: "Стажёров пока нет" }}
      />

      {/* Попытки стажёра */}
      <Drawer
        open={!!selectedInternId}
        onClose={closeIntern}
        width={720}
        title={intern ? fullName(intern) : "Стажёр"}
      >
        {intern && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              {intern.phone}
              {intern.branch_name ? ` · ${intern.branch_name}` : ""}
            </Text>
          </div>
        )}

        <Select
          allowClear
          placeholder="Все попытки"
          value={attemptsStatus}
          onChange={(v) => {
            setAttemptsStatus(v);
            setAttemptsPage(1);
          }}
          options={[
            { value: "graded", label: "Проверенные" },
            { value: "needs_grading", label: "Ждут проверки" },
          ]}
          style={{ width: 200, marginBottom: 16 }}
        />

        <Table
          rowKey="id"
          size="small"
          columns={attemptColumns}
          dataSource={internDetail?.attempts ?? []}
          loading={internLoading}
          onRow={(r) => ({ onClick: () => openAttempt(r.id), style: { cursor: "pointer" } })}
          pagination={{
            current: attemptsPage,
            pageSize: ATTEMPTS_PAGE_SIZE,
            total: internDetail?.attemptsTotal ?? 0,
            showSizeChanger: false,
            onChange: setAttemptsPage,
          }}
          locale={{ emptyText: "Попыток нет" }}
        />

        {/* Ответы по попытке */}
        <Drawer
          open={attemptOpen}
          onClose={closeAttempt}
          width={640}
          title={attemptView ? attemptView.attempt.test_title : "Попытка"}
        >
          <Spin spinning={attemptLoading}>
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

                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {attemptView.score} / {attemptView.total}
                  </Text>
                  <StatusTag needsGrading={attemptView.status === "needs_grading"} />
                  {attemptView.attempt.auto_submitted && <Tag>Время вышло</Tag>}
                  <Text type="secondary" style={{ marginLeft: "auto" }}>
                    {fmtDate(attemptView.attempt.submitted_at)}
                  </Text>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {answers.map((a) => (
                    <div
                      key={a.id}
                      style={{ padding: 12, border: "1px solid #f0f0f0", borderRadius: 8 }}
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
                          {a.graded_by === "auto" ? "Оценено автоматически" : "Оценено вручную"}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Spin>
        </Drawer>
      </Drawer>
    </div>
  );
};

export default OneTimeHistory;