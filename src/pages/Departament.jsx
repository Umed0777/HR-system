import { useEffect, useState } from "react";
import { useDepartmentStore } from "../store/useDepartment";
import {
  Button,
  Modal,
  Input,
  Space,
  Card,
  Typography,
  Popconfirm,
  Pagination,
} from "antd";

const { Title, Text } = Typography;

export const Departament = () => {
  const {
    departments,
    fetchDepartments,
    addDepartment,
    editDepartment,
    removeDepartment,
    loading,
    error,
    totalRecords,
  } = useDepartmentStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchDepartments(currentPage, pageSize);
  }, [fetchDepartments, currentPage, pageSize]);

  const openModal = (item = null) => {
    setEditingItem(item);
    setName(item?.name || "");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setName("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const payload = { name };

    if (editingItem) {
      await editDepartment(editingItem.id, payload);
    } else {
      await addDepartment(payload);
    }
    await fetchDepartments(currentPage, pageSize);
    closeModal();
  };
  const handleCancel = () => {
    closeModal();
  };
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const departmentList = departments?.data || [];
  const totalItems = totalRecords;
  return (
    <div
      style={{
        padding: 30,
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Управление
        </Title>

        <Button type="primary" danger onClick={() => openModal()}>
          Добавить
        </Button>
      </div>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {departmentList.map((dep) => (
          <Card
            key={dep.id}
            hoverable
            style={{
              borderRadius: 12,
              transition: "0.2s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                {/* <div style={{ fontSize: 12, color: "#888" }}>
                  №: {dep.id}
                </div> */}
                <Text strong style={{ fontSize: 16 }}>
                  {dep.name}
                </Text>
              </div>

              <Space>
                <Button onClick={() => openModal(dep)}>Редактировать</Button>
                <Popconfirm
                  onConfirm={async () => {
                    await removeDepartment(dep.id);
                    await fetchDepartments(currentPage, pageSize); // 🔥 главное
                  }}
                  title="Хотите удалить управление?"
                  okText="да"
                  cancelText="нет"
                  // onConfirm={() => removeDepartment(dep.id)}
                >
                  <Button danger>Удалить</Button>
                </Popconfirm>
              </Space>
            </div>
          </Card>
        ))}
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
      </Space>

      <Modal
        title={editingItem ? "Редактирование" : "Добавление"}
        open={open}
        onCancel={closeModal}
        onOk={handleSave}
        okText="Save"
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={handleSave}
            style={{ background: "#ff4b2b" }}
          >
            {" "}
            {editingItem ? "Изменить" : "Сохранить"}{" "}
          </Button>,
          <Button key="cancel" onClick={handleCancel}>
            {" "}
            Отменить{" "}
          </Button>,
        ]}
      >
        <Input
          placeholder="Название Управление"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Modal>
    </div>
  );
};
