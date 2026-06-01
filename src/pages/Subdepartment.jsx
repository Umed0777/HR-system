import { useEffect, useState } from "react";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import { useDepartmentStore } from "../store/useDepartment";
import {
  Card,
  Typography,
  Space,
  Button,
  Modal,
  Input,
  Popconfirm,
  Select,
  Spin,
  Empty,
  Pagination,
  message,
} from "antd";

const { Title, Text } = Typography;

export const Subdepartment = () => {
  const {
    subdepartments,
    fetchSubDepartments,
    addSubDepartment,
    editSubDepartment,
    removeSubDepartment,
    loading,
    error,
    totalRecords,
    currentPage,
    pageSize,
  } = useSubDepartmentStore();

  const { departments, fetchDepartments } = useDepartmentStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState(null);

  useEffect(() => {
    fetchSubDepartments(1, 10);
    fetchDepartments();
  }, [fetchDepartments, fetchSubDepartments]);

  const openModal = (item = null) => {
    setEditingItem(item);
    setName(item?.name || "");
    setDepartmentId(item?.departmentId || null);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setName("");
    setDepartmentId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      message.warning("Пожалуйста, введите название отделения");
      return;
    }

    if (!departmentId) {
      message.warning("Пожалуйста, выберите департамент");
      return;
    }

    const payload = {
      name: name.trim(),
      departmentId,
    };

    try {
      if (editingItem) {
        await editSubDepartment(editingItem.id, payload);
        message.success("Отделение успешно обновлено");
      } else {
        await addSubDepartment(payload);
        message.success("Отделение успешно добавлено");
      }
      
      closeModal();
    } catch (err) {
      console.error("Ошибка:", err);
      message.error("Ошибка при сохранении отделения");
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await removeSubDepartment(id);
      message.success(`Отделение "${name}" успешно удалено`);
    } catch (err) {
      console.error("Ошибка:", err);
      message.error("Ошибка при удалении отделения");
    }
  };

  const handlePageChange = (page, newPageSize) => {
    fetchSubDepartments(page, newPageSize);
  };

  const handleCancel = () => { 
    closeModal(); 
  };

  // Получаем массивы данных
  const subdepartmentsArray = Array.isArray(subdepartments) 
    ? subdepartments 
    : (subdepartments?.data || []);
  
  const departmentsArray = Array.isArray(departments) 
    ? departments 
    : (departments?.data || []);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Text type="danger" style={{ fontSize: 16 }}>Ошибка: {error}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>Отделения</Title>
        <Button type="primary" danger onClick={() => openModal()}>
          Добавить отделение
        </Button>
      </div>

      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {subdepartmentsArray.length === 0 && !loading && (
            <Empty description="Нет добавленных отделений" />
          )}

          {subdepartmentsArray.map((item) => {
            const department = departmentsArray.find(
              (dep) => Number(dep.id) === Number(item.departmentId)
            );

            return (
              <Card key={item.id} hoverable>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      {item.name}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Управление: {department?.name || "Не найден"}
                    </Text>
                  </div>

                  <Space>
                    <Button onClick={() => openModal(item)}>
                      Редактировать
                    </Button>

                    <Popconfirm
                      title="Удаление отделения"
                      description={`Вы уверены, что хотите удалить отделение "${item.name}"?`}
                      onConfirm={() => handleDelete(item.id, item.name)}
                      okText="Да"
                      cancelText="Нет"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger>Удалить</Button>
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            );
          })}
        </Space>
      </Spin>

      {/* Пагинация */}
      {totalRecords > 0 && (
        <div style={{ marginTop: 20, textAlign: "right", display: 'flex', justifyContent: 'end' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalRecords}
            onChange={handlePageChange}
            // showSizeChanger
            // showQuickJumper

            showTotal={(total) => `Всего ${total} отделений`}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      <Modal
        title={editingItem ? "Редактирование отделения" : "Добавление отделения"}
        open={open}
        onCancel={closeModal}
        footer={[
          <Button key="ok" danger type="primary" onClick={handleSave}>
            {editingItem ? "Изменить" : "Сохранить"}
          </Button>,
          <Button key="cancel" danger onClick={handleCancel}>
            Отменить
          </Button>,
        ]}
      >
        <div>
          <Text strong>Название отделения:</Text>
          <Input
            placeholder="Введите название отделения"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSave}
            autoFocus
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <Text strong>Выберите департамент:</Text>
          <Select
            placeholder="Выберите департамент"
            value={departmentId}
            onChange={(value) => setDepartmentId(value)}
            style={{ width: "100%", marginTop: 8 }}
            options={departmentsArray.map((dep) => ({
              label: dep.name,
              value: dep.id,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      </Modal>
    </div>
  );
};