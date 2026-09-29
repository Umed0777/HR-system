import { useCallback, useEffect, useState } from "react";
import { Table, Input, Select, Typography, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInternHistoryStore } from "../store/useInternHistoryStore";
import {
  PAGE_SIZE,
  HISTORY_ROUTES,
  fmtDate,
  fullName,
} from "../utils/oneTimeHistory";
import HistoryHeader from "./HistoryHeader";
import { StatusTag } from "./HistoryTags";

const { Text } = Typography;

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

const OneTimeHistoryPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const branchId = params.get("branch")
    ? Number(params.get("branch"))
    : undefined;
  const page = Number(params.get("page")) || 1;

  const [search, setSearch] = useState(query);

  const {
    error,
    branches,
    interns,
    internsTotal,
    internsLoading,
    fetchBranches,
    fetchInterns,
  } = useInternHistoryStore();

  const updateParams = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) =>
            v ? next.set(k, String(v)) : next.delete(k),
          );
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // debounce поиска
  useEffect(() => {
    const value = search.trim();
    if (value === query) return;
    const t = setTimeout(
      () => updateParams({ q: value, page: undefined }),
      400,
    );
    return () => clearTimeout(t);
  }, [search, query, updateParams]);

  useEffect(() => {
    fetchInterns({
      search: query,
      branchId,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    });
  }, [query, branchId, page, fetchInterns]);

  return (
    <div>
      <HistoryHeader
        title="История прохождения"
        subtitle="Стажёры и результаты их попыток"
      />

      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Поиск по ФИО или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          value={branchId ?? "all"}
          onChange={(v) =>
            updateParams({
              branch: v === "all" ? undefined : v,
              page: undefined,
            })
          }
          options={[
            { value: "all", label: "Все филиалы" },
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
          style={{ width: 240 }}
        />
      </div>

      <Table
        rowKey="id"
        columns={internColumns}
        dataSource={interns}
        loading={internsLoading}
        onRow={(r) => ({
          onClick: () => navigate(HISTORY_ROUTES.intern(r.id)),
          style: { cursor: "pointer" },
        })}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: internsTotal,
          showSizeChanger: false,
          onChange: (p) => updateParams({ page: p > 1 ? p : undefined }),
        }}
        locale={{ emptyText: "Стажёров пока нет" }}
      />
    </div>
  );
};

export default OneTimeHistoryPage;
