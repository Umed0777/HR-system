import { useMemo } from "react";
import { Select, Button, Space, Tag, Typography, message } from "antd";
import {
  UserOutlined,
  ApartmentOutlined,
  TeamOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

const T = {
  ru: {
    employees: "Сотрудники",
    placeholder: "Выберите сотрудников",
    selectAll: "Выбрать всех",
    clear: "Очистить",
    addGroup: "Добавить весь отдел / отделение",
    departments: "Отделы",
    subdepartments: "Отделения",
    selected: "Выбрано",
    willAssign: "будет назначено",
    willSkip: "пропустим (уже назначено / прошли)",
    assigned: "уже назначено",
    passed: "уже прошёл",
    groupAdded: "Добавлено сотрудников",
    noDepartment: "Без отдела",
  },
  tj: {
    employees: "Кормандон",
    placeholder: "Кормандонро интихоб кунед",
    selectAll: "Ҳамаро интихоб кардан",
    clear: "Тоза кардан",
    addGroup: "Илова кардани тамоми шуъба / зершуъба",
    departments: "Шуъбаҳо",
    subdepartments: "Зершуъбаҳо",
    selected: "Интихоб шуд",
    willAssign: "таъин мешавад",
    willSkip: "гузаронида мешавад (аллакай таъин / супоридаанд)",
    assigned: "аллакай таъин шудааст",
    passed: "аллакай супоридааст",
    groupAdded: "Кормандон илова шуданд",
    noDepartment: "Бе шуъба",
  },
};

const EMPTY = new Map();

const fullName = (e) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ").trim() || `ID: ${e.id}`;

// Множественный выбор сотрудников для массового назначения тестов / опросов:
// поиск, «выбрать всех», добавление целого отдела или отделения.
// excludedIds — Map(employeeId → "assigned" | "passed"): кому выбранный тест уже назначен / кто прошёл.
// Выбор не фильтруется: такие сотрудники остаются в поле с пометкой и пропускаются при назначении.
export const BulkEmployeeSelect = ({
  employees = [],
  value = [],
  onChange,
  getSubDepartmentName,
  excludedIds,
  lang = "ru",
}) => {
  const t = T[lang] || T.ru;
  const excluded = excludedIds || EMPTY;

  const grouped = useMemo(
    () =>
      employees.reduce((g, e) => {
        const d = e.department || t.noDepartment;
        (g[d] ||= []).push(e);
        return g;
      }, {}),
    [employees, t.noDepartment],
  );

  const subDeptIds = useMemo(
    () => [
      ...new Set(employees.map((e) => e.subDepartmentId).filter(Boolean)),
    ],
    [employees],
  );

  const groupMembers = (key) => {
    // название отдела может содержать ":", поэтому режем только по первому
    const sep = key.indexOf(":");
    const kind = key.slice(0, sep);
    const id = key.slice(sep + 1);
    return employees.filter((e) =>
      kind === "dep"
        ? (e.department || t.noDepartment) === id
        : Number(e.subDepartmentId) === Number(id),
    );
  };

  const handleAddGroup = (key) => {
    const ids = groupMembers(key)
      .filter((e) => !value.includes(e.id))
      .map((e) => e.id);
    onChange([...value, ...ids]);
    message.success(`${t.groupAdded}: ${ids.length}`);
  };

  const reasonTag = (id) => {
    const reason = excluded.get(id);
    if (!reason) return null;
    return (
      <Tag color={reason === "passed" ? "blue" : "default"}>
        {reason === "passed" ? t.passed : t.assigned}
      </Tag>
    );
  };

  const skipped = value.filter((id) => excluded.has(id)).length;

  return (
    <div>
      <Text strong>{t.employees}:</Text>

      <Space wrap style={{ marginTop: 8, width: "100%" }}>
        <Button
          icon={<TeamOutlined />}
          onClick={() => onChange(employees.map((e) => e.id))}
          disabled={employees.length === 0}
        >
          {t.selectAll} ({employees.length})
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={() => onChange([])}
          disabled={value.length === 0}
        >
          {t.clear}
        </Button>
        <Select
          value={null}
          placeholder={t.addGroup}
          onChange={handleAddGroup}
          style={{ minWidth: 260 }}
          showSearch
          optionFilterProp="label"
        >
          <Select.OptGroup label={t.departments}>
            {Object.keys(grouped).map((dep) => (
              <Option key={`dep:${dep}`} value={`dep:${dep}`} label={dep}>
                <TeamOutlined /> {dep} ({grouped[dep].length})
              </Option>
            ))}
          </Select.OptGroup>
          {subDeptIds.length > 0 && (
            <Select.OptGroup label={t.subdepartments}>
              {subDeptIds.map((id) => {
                const name = getSubDepartmentName(id);
                return (
                  <Option key={`sub:${id}`} value={`sub:${id}`} label={name}>
                    <ApartmentOutlined /> {name} (
                    {groupMembers(`sub:${id}`).length})
                  </Option>
                );
              })}
            </Select.OptGroup>
          )}
        </Select>
      </Space>

      <Select
        mode="multiple"
        value={value}
        onChange={onChange}
        placeholder={t.placeholder}
        size="large"
        style={{ width: "100%", marginTop: 8 }}
        maxTagCount="responsive"
        allowClear
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
            emp.subDepartmentId ? getSubDepartmentName(emp.subDepartmentId) : "",
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(input.toLowerCase());
        }}
        optionLabelProp="label"
        // тех, кому тест уже назначен, показываем в поле серым и зачёркнутым
        tagRender={({ label, value: id, closable, onClose }) => (
          <Tag
            closable={closable}
            onClose={onClose}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              marginInlineEnd: 4,
              opacity: excluded.has(id) ? 0.55 : 1,
              textDecoration: excluded.has(id) ? "line-through" : undefined,
            }}
          >
            {label}
          </Tag>
        )}
      >
        {Object.entries(grouped).map(([dep, list]) => (
          <Select.OptGroup key={dep} label={dep}>
            {list.map((e) => {
              const name = fullName(e);
              return (
                <Option key={e.id} value={e.id} label={name}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <UserOutlined /> {name}
                    {e.email && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {e.email}
                      </Text>
                    )}
                    {e.subDepartmentId && (
                      <Tag color="green">
                        <ApartmentOutlined />{" "}
                        {getSubDepartmentName(e.subDepartmentId)}
                      </Tag>
                    )}
                    {reasonTag(e.id)}
                  </div>
                </Option>
              );
            })}
          </Select.OptGroup>
        ))}
      </Select>

      <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
        {t.selected}: {value.length}
        {skipped > 0 && (
          <>
            {" · "}
            {t.willAssign}: {value.length - skipped}
            {" · "}
            <Text type="warning">
              {t.willSkip}: {skipped}
            </Text>
          </>
        )}
      </Text>
    </div>
  );
};
