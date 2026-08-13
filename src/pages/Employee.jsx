import { useEffect, useState } from "react";
import { useEmployeeStore } from "../store/useEmployee";
import { useDepartmentStore } from "../store/useDepartment";
import { usePositionStore } from "../store/usePosition";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import { Table, Button, Modal, Input, Space, message, Select, Typography, Descriptions, Tag, Pagination } from "antd";
import { EditOutlined, DeleteOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";
const { Title } = Typography;

export const Employee = () => {
    const {
        employees = [],
        fetchEmployee,
        addEmployee,
        editEmployee,
        removeEmployee,
        totalRecords,
        currentPage,
        pageSize,
        loading
    } = useEmployeeStore();

    const { departments = [], fetchDepartments } = useDepartmentStore();
    const { subdepartments = [], fetchSubDepartments } = useSubDepartmentStore();
    const { positions = [], fetchPositions } = usePositionStore();
    const [editOpen, setEditOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        departmentId: null,
        subDepartmentId: null,
        positionId: null,
    });

    useEffect(() => {
        fetchEmployee(1, 10);
        fetchDepartments(1,100);
        fetchSubDepartments(1,100);
        fetchPositions(1,100);
    }, []);

    // Обработчик смены страницы
    const handlePageChange = (page, pageSize) => {
        fetchEmployee(page, pageSize);
    };

    // Открыть для редактирования
    const handleEdit = (e, record = null) => {
        e.stopPropagation();
        setEditing(record);
        setForm({
            firstName: record?.firstName || "",
            lastName: record?.lastName || "",
            email: record?.email || "",
            phone: record?.phone || "",
            address: record?.address || "",
            departmentId: record?.departmentId ?? null,
            subDepartmentId: record?.subDepartmentId ?? null,
            positionId: record?.positionId ?? null,
        });
        setEditOpen(true);
    };

    // Открыть для просмотра
    const handleView = (record) => {
        setViewingEmployee(record);
        setViewOpen(true);
    };

    // Открыть для добавления
    const handleAdd = () => {
        setEditing(null);
        setForm({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            departmentId: null,
            subDepartmentId: null,
            positionId: null,
        });
        setEditOpen(true);
    };

    // Удалить
    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await removeEmployee(id);
            message.success("Сотрудник удален");
        } catch (err) {
            message.error("Ошибка при удалении");
        }
    };

    const handleSave = async () => {
        try {
            if (editing) {
                await editEmployee(editing.id, form);
                message.success("Обновлено");
            } else {
                await addEmployee(form);
                message.success("Добавлено");
            }
            setEditOpen(false);
        } catch (err) {
            message.error("Ошибка");
            console.log(err);
        }
    };

    const handleCancel = () => {
        setEditOpen(false);
        setEditing(null);
    };

    // Получаем массивы данных
    const departmentsArray = Array.isArray(departments) ? departments : (departments?.data || []);
    const subdepartmentsArray = Array.isArray(subdepartments) ? subdepartments : (subdepartments?.data || []);
    const positionsArray = Array.isArray(positions) ? positions : (positions?.data || []);

    const getDepartmentName = (id) => {
        const dep = departmentsArray.find((d) => Number(d.id) === Number(id));
        return dep?.name || "-";
    };

    const getSubDepartmentName = (id) => {
        const sub = subdepartmentsArray.find((s) => Number(s.id) === Number(id));
        return sub?.name || "-";
    };

    const getPositionName = (id) => {
        const pos = positionsArray.find((p) => Number(p.id) === Number(id));
        return pos?.title || "-";
    };

    const columns = [
        { title: "Имя", dataIndex: "firstName", key: "firstName" },
        { title: "Фамилия", dataIndex: "lastName", key: "lastName" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Телефон", dataIndex: "phone", key: "phone" },
        { title: "Адрес", dataIndex: "address", key: "address" },
        {
            title: "Управление",
            key: "department",
            render: (_, record) => getDepartmentName(record?.departmentId),
        },
        {
            title: "Отделение",
            key: "subdepartment",
            render: (_, record) => getSubDepartmentName(record?.subDepartmentId),
        },
        {
            title: "Должность",
            key: "position",
            render: (_, record) => getPositionName(record?.positionId),
        },
        {
            title: "Действие",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={(e) => handleEdit(e, record)}
                        size="middle"
                        type="primary"
                        danger
                    >
                        Редактировать
                    </Button>
                    <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={(e) => handleDelete(e, record.id)}
                        size="middle"
                    >
                        Удалить
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>Сотрудники</Title>
                <Button type="primary" danger onClick={handleAdd}>
                    Добавить сотрудника
                </Button>
            </div>

            <Table
                dataSource={employees || []}
                columns={columns}
                rowKey={(record) => record?.id}
                onRow={(record) => ({
                    onClick: () => handleView(record),
                    style: { cursor: "pointer" },
                })}
                loading={loading}
                pagination={false}
                scroll={{ x: 1300 }}
            />

            {/* Пагинация */}
            <div style={{ marginTop: 16, textAlign: "right", display: 'flex', justifyContent: 'end' }}>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalRecords}
                    onChange={handlePageChange}
                    // showSizeChanger
                    // showQuickJumper
                    showTotal={(total) => `Всего ${total} записей`}
                    pageSizeOptions={[5, 10, 20, 50]}
                />
            </div>

            {/* Модальное окно для просмотра */}
            <Modal
                title="Информация о сотруднике"
                open={viewOpen}
                onCancel={() => setViewOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setViewOpen(false)}>
                        Закрыть
                    </Button>
                ]}
                width={600}
            >
                {viewingEmployee && (
                    <Descriptions bordered column={1} size="middle">
                        <Descriptions.Item label="Имя">
                            {viewingEmployee.firstName || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Фамилия">
                            {viewingEmployee.lastName || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            <a href={`mailto:${viewingEmployee.email}`}>{viewingEmployee.email || "-"}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Телефон">
                            <a href={`tel:${viewingEmployee.phone}`}>{viewingEmployee.phone || "-"}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Адрес">
                            {viewingEmployee.address || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Управление">
                            <Tag color="green">{getDepartmentName(viewingEmployee.departmentId)}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Отделение">
                            <Tag color="cyan">{getSubDepartmentName(viewingEmployee.subDepartmentId)}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Должность">
                            <Tag color="orange">{getPositionName(viewingEmployee.positionId)}</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Модальное окно для редактирования/добавления */}
            <Modal
                title={editing ? "Редактировать сотрудника" : "Добавить сотрудника"}
                open={editOpen}
                onCancel={handleCancel}
                width={500}
                footer={[
                    <Button key="ok" danger type="primary" onClick={handleSave}>
                        {editing ? "Изменить" : "Сохранить"}
                    </Button>,
                    <Button key="cancel" danger onClick={handleCancel}>
                        Отменить
                    </Button>,
                ]}
            >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <Input
                        placeholder="Имя"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        prefix={<UserOutlined />}
                    />
                    <Input
                        placeholder="Фамилия"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        prefix={<UserOutlined />}
                    />
                    <Input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        prefix={<MailOutlined />}
                    />
                    <Input
                        placeholder="Телефон"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        prefix={<PhoneOutlined />}
                        maxLength={9}
                    />
                    <Input
                        placeholder="Адрес"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        prefix={<HomeOutlined />}
                    />
                    <Select
                        placeholder="Управление"
                        value={form.departmentId}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                departmentId: value,
                                subDepartmentId: null,
                            })
                        }
                        style={{ width: "100%" }}
                        options={departmentsArray.map((d) => ({
                            label: d.name,
                            value: d.id,
                        }))}
                        allowClear
                    />
                    <Select
                        placeholder="Отделение"
                        value={form.subDepartmentId}
                        onChange={(value) => setForm({ ...form, subDepartmentId: value })}
                        style={{ width: "100%" }}
                        options={subdepartmentsArray.map((s) => ({
                            label: s.name,
                            value: s.id,
                        }))}
                        allowClear
                    />
                    <Select
                        placeholder="Должность"
                        value={form.positionId}
                        onChange={(value) => setForm({ ...form, positionId: value })}
                        style={{ width: "100%" }}
                        options={positionsArray.map((p) => ({
                            label: p.title,
                            value: p.id,
                        }))}
                        allowClear
                    />
                </Space>
            </Modal>
        </div>
    );
};