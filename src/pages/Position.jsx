import { useEffect, useState } from "react";
import { usePositionStore } from "../store/usePosition";
import { Button, Modal, Input, Space, Card, Typography, Popconfirm, message, Pagination, Spin } from "antd";

const { Title, Text } = Typography;

export const Position = () => {
  const {
    positions,
    fetchPositions,
    addPosition,
    editPosition,
    removePosition,
    loading,
    error,
    totalRecords,
    currentPage,
    pageSize,
  } = usePositionStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchPositions(1, 10);
  }, [fetchPositions]);

  const openModal = (item = null) => {
    setEditingItem(item);
    setName(item?.title || "");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    setName("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      message.warning("Пожалуйста, введите название должности");
      return;
    }

    try {
      if (editingItem) {
        const updateData = {
          id: editingItem.id,
          title: name
        };
        await editPosition(editingItem.id, updateData);
        message.success("Должность успешно обновлена");
      } else {
        await addPosition({ title: name });
        message.success("Должность успешно добавлена");
      }
      
      closeModal();
    } catch (err) {
      console.error("Ошибка:", err);
      message.error("Ошибка при сохранении");
    }
  };

  const handleDelete = async (id) => {
    try {
      await removePosition(id);
      message.success("Должность успешно удалена");
    } catch (err) {
      message.error("Ошибка при удалении");
    }
  };

  const handlePageChange = (page, newPageSize) => {
    fetchPositions(page, newPageSize);
  };

  const handleCancel = () => { 
    closeModal(); 
  };

  if (loading && positions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="small" tip="Загрузка..." style={{display: 'flex', justifyContent: 'center',alignItems: "center", height: "60vh"}} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 50, color: 'red' }}>
        Ошибка: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
        <Title level={3} style={{ margin: 0 }}>Должности</Title>
        <Button type="primary" danger onClick={() => openModal()}>
          Добавить должность
        </Button>
      </div>

      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          {positions && positions.length > 0 ? (
            positions.map((pos) => (
              <Card key={pos.id} hoverable>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text strong style={{ fontSize: 16 }}>{pos.title}</Text>
                  <Space>
                    <Button onClick={() => openModal(pos)}>Редактировать</Button>
                    <Popconfirm
                      title="Удаление должности"
                      description={`Вы уверены, что хотите удалить должность "${pos.title}"?`}
                      onConfirm={() => handleDelete(pos.id)}
                      okText="Да"
                      cancelText="Нет"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger>Удалить</Button>
                    </Popconfirm>
                  </Space>
                </div>
              </Card>
            ))
          ) : (
            !loading && (
              <Card>
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text type="secondary">Нет добавленных должностей</Text>
                </div>
              </Card>
            )
          )}
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
            showTotal={(total) => `Всего ${total} записей`}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      <Modal
        title={editingItem ? "Редактирование должности" : "Добавление должности"}
        open={open}
        onCancel={closeModal}
        footer={[
          <Button key="ok" type="primary" danger onClick={handleSave}>
            {editingItem ? "Изменить" : "Сохранить"}
          </Button>,
          <Button key="cancel" danger onClick={handleCancel}>
            Отменить
          </Button>,
        ]}
      >
        <div>
          <Text strong>Название должности:</Text>
          <Input
            placeholder="Введите название должности"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSave}
            autoFocus
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
};