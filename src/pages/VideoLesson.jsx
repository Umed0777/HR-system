// src/pages/VideoLesson.jsx
import { useEffect, useState } from "react";
import { useVideoLessonStore } from "../store/useVideoLesson";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import { useEmployeeStore } from "../store/useEmployee";
import {
  Card,
  Button,
  Modal,
  Input,
  Space,
  Upload,
  Flex,
  Form,
  message,
  Tooltip,
  Tag,
  Divider,
  Empty,
  Skeleton,
  Typography,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  VideoCameraOutlined,
  UserOutlined,
  DownloadOutlined,
  FileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API;

const buildFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BASE_URL}${path}`;
};

export const VideoLesson = () => {
  const {
    videoLessons,
    fetchVideoLessons,
    addVideoLesson,
    editVideoLesson,
    removeVideoLesson,
    loading,
    error,
  } = useVideoLessonStore();

  const {
    subdepartments,
    fetchSubDepartments,
    loading: subDeptLoading,
  } = useSubDepartmentStore();
  const {
    employees,
    fetchEmployee,
    loading: employeeLoading,
  } = useEmployeeStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [preview, setPreview] = useState({
    open: false,
    url: "",
    type: "video",
  });
  const [fileList, setFileList] = useState([]);
  const [likedItems, setLikedItems] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 VideoLesson - Загрузка данных...");
      await fetchSubDepartments();
      await fetchEmployee();
      await fetchVideoLessons();
      console.log("✅ VideoLesson - Данные загружены");
    };
    loadData();
  }, []);

  const getFileType = (filePath) => {
    if (!filePath || typeof filePath !== "string") return "video";
    if (/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(filePath)) return "video";
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(filePath)) return "image";
    return "video";
  };

  const extractPath = (file) => {
    if (!file) return "";
    if (typeof file === "string") return file;
    if (file.profileImagePath) return file.profileImagePath;
    if (file.path) return file.path;
    if (file.url) return file.url;
    if (file.filePath) return file.filePath;
    return "";
  };

  const getFiles = (item) => {
    if (!item) return [];
    const result = [];
    if (item.profileImagePath) result.push(item.profileImagePath);
    if (Array.isArray(item.files)) {
      item.files.forEach((f) => {
        const p = extractPath(f);
        if (p) result.push(p);
      });
    }
    return result;
  };

  const getFileName = (filePath) => {
    if (!filePath || typeof filePath !== "string") return "видео";
    const parts = filePath.split("/");
    let name = parts[parts.length - 1];
    try {
      name = decodeURIComponent(name);
    } catch (_) {}
    if (name.length > 30) {
      const ext = name.split(".").pop();
      name = name.substring(0, 27) + "..." + ext;
    }
    return name;
  };

  const getFileIcon = (type) => {
    const iconStyle = { fontSize: 48 };
    if (type === "video") {
      return <VideoCameraOutlined style={{ ...iconStyle, color: "#1890ff" }} />;
    }
    return <FileOutlined style={{ ...iconStyle, color: "#faad14" }} />;
  };

  const getFileTypeName = (type) => {
    return type === "video" ? "Видео" : "Файл";
  };

  const handleFileClick = (filePath) => {
    if (!filePath) {
      message.error("URL файла не найден");
      return;
    }
    const fullUrl = buildFullUrl(filePath);
    const type = getFileType(filePath);

    if (type === "video") {
      setPreview({ open: true, url: fullUrl, type: "video" });
    } else if (type === "image") {
      setPreview({ open: true, url: fullUrl, type: "image" });
    } else {
      downloadFile(fullUrl, getFileName(filePath));
    }
  };

  const handleUploadPreview = (file) => {
    const url = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
    const isVideo = file.type?.startsWith("video") || /\.(mp4|webm|ogg)$/i.test(file.name || "");
    const isImage = file.type?.startsWith("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "");

    if (isVideo) {
      setPreview({ open: true, url, type: "video" });
    } else if (isImage) {
      setPreview({ open: true, url, type: "image" });
    } else {
      downloadFile(url, file.name);
    }
  };

  const downloadFile = (url, fileName) => {
    if (!url) {
      message.error("URL файла не найден");
      return;
    }
    const link = document.createElement("a");
    link.href = buildFullUrl(url);
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openModal = (item = null) => {
    console.log("📝 VideoLesson - openModal:", item ? "Редактирование" : "Создание");

    setEditingItem(item);

    if (item) {
      form.setFieldsValue({
        title: item.title,
        content: item.content,
        subDepartmentId: item.subDepartmentId ?? null,
        employeeId: item.employeeId ?? null,
      });
      const files = getFiles(item);
      setFileList(
        files.map((path, i) => ({
          uid: `existing-${i}`,
          name: getFileName(path),
          status: "done",
          url: buildFullUrl(path),
          originFileObj: null,
        }))
      );
    } else {
      form.resetFields();
      setFileList([]);
    }
    setOpen(true);
  };

  const closeModal = () => {
    console.log("❌ VideoLesson - Закрытие модалки");
    setOpen(false);
    setEditingItem(null);
    form.resetFields();
    setFileList([]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("📝 VideoLesson - handleSave, values:", values);

      // ✅ Исправлено: формируем payload без folderId
      // Store сам добавит folderId
      const payload = {
        title: values.title || "",
        content: values.content || "",
        subDepartmentId: values.subDepartmentId ?? null,
        employeeId: values.employeeId ?? null,
        // folderId НЕ УКАЗЫВАЕМ - Store сам найдет папку "ВидеоУрок"
        files: fileList
          .filter((f) => f.originFileObj)
          .map((f) => f.originFileObj),
      };

      console.log("📤 VideoLesson - Отправляем payload:", payload);

      setPublishing(true);
      
      let response;
      if (editingItem) {
        response = await editVideoLesson(editingItem.id, payload);
        message.success("Видеоурок обновлен!");
      } else {
        response = await addVideoLesson(payload);
        console.log("✅ Ответ от сервера:", response);
        if (response?.id) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          message.success("Видеоурок опубликован!");
        }
      }
      
      await fetchVideoLessons();
      closeModal();
    } catch (err) {
      console.error("❌ VideoLesson - Ошибка:", err);
      message.error(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    } finally {
      setPublishing(false);
    }
  };

  const toggleLike = (id) => {
    setLikedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!likedItems[id]) message.success("Лайк поставлен!");
    else message.info("Лайк убран");
  };

  const getSubDepartmentName = (id) => {
    if (!id) return "Без отдела";
    return subdepartments.find((s) => Number(s.id) === Number(id))?.name || "Без отдела";
  };

  const getEmployeeName = (id) => {
    if (!id) return "Неизвестный";
    const emp = employees.find((e) => Number(e.id) === Number(id));
    return emp
      ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email || "Неизвестный"
      : "Неизвестный";
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "Дата не указана";
    try {
      return dayjs(dateString).format("DD.MM.YYYY HH:mm");
    } catch (_) {
      return "Дата не указана";
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", height: "auto" }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} active avatar paragraph={{ rows: 3 }} style={{ marginBottom: 20 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Empty description={<span style={{ color: "#ff4d4f" }}>Ошибка: {error}</span>} />
        <Button type="primary" onClick={fetchVideoLessons} style={{ marginTop: 20, background: "#1890ff" }}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={["#1890ff", "#40a9ff", "#69c0ff", "#91d5ff", "#bae7ff"]}
        />
      )}

      <Flex justify="space-between" align="center" style={{ marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            Видеоуроки
          </Title>
          <Text type="secondary">
            {videoLessons.length} видеоуроков
          </Text>
        </div>
        <Button
          type="primary"
          style={{
            background: "linear-gradient(135deg, #1890ff, #40a9ff)",
            border: "none",
            boxShadow: "0 4px 12px rgba(24,144,255,0.3)",
            fontWeight: "bold",
            height: 40,
            padding: "0 24px",
            borderRadius: 20,
          }}
          onClick={() => openModal()}
        >
          Добавить видеоурок
        </Button>
      </Flex>

      <AnimatePresence>
        {videoLessons.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Empty description="Нет видеоуроков" style={{ marginTop: 100 }}>
              <Button type="primary" onClick={() => openModal()} style={{ background: "#1890ff" }}>
                Создать видеоурок
              </Button>
            </Empty>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {videoLessons.map((item) => {
              const files = getFiles(item);

              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    actions={[
                      <Tooltip title="Лайк" key="like">
                        <span onClick={() => toggleLike(item.id)}>
                          {likedItems[item.id] ? (
                            <HeartFilled style={{ color: "#ff4d4f", fontSize: 18 }} />
                          ) : (
                            <HeartOutlined style={{ fontSize: 18 }} />
                          )}
                        </span>
                      </Tooltip>,
                      <Tooltip title="Редактировать" key="edit">
                        <EditOutlined style={{ fontSize: 18 }} onClick={() => openModal(item)} />
                      </Tooltip>,
                      <Tooltip title="Удалить" key="delete">
                        <DeleteOutlined
                          style={{ fontSize: 18, color: "#ff4d4f" }}
                          onClick={() =>
                            Modal.confirm({
                              title: "Удалить видеоурок?",
                              content: "Вы уверены?",
                              okText: "Да",
                              cancelText: "Нет",
                              onOk: async () => {
                                await removeVideoLesson(item.id);
                                await fetchVideoLessons();
                                message.success("Видеоурок удален");
                              },
                            })
                          }
                        />
                      </Tooltip>,
                    ]}
                  >
                    <Flex vertical gap={12}>
                      <div>
                        <Title level={4} style={{ margin: 0 }}>
                          {item.title}
                        </Title>
                        <Flex gap={8} style={{ marginTop: 8, flexWrap: "wrap" }}>
                          <Tag color="orange">{getSubDepartmentName(item.subDepartmentId)}</Tag>
                          <Tag icon={<UserOutlined />} color="blue">
                            {getEmployeeName(item.employeeId)}
                          </Tag>
                          <Tag icon={<CalendarOutlined />} color="green">
                            {formatDate(item.createdAt)}
                          </Tag>
                        </Flex>
                      </div>

                      <Text style={{ fontSize: 15 }}>{item.content}</Text>

                      {files.length > 0 && (
                        <div>
                          <Divider style={{ margin: "12px 0" }} />
                          <Flex wrap gap={16}>
                            {files.map((filePath, index) => {
                              const type = getFileType(filePath);
                              const fileName = getFileName(filePath);
                              const fullUrl = buildFullUrl(filePath);
                              const fileId = `${item.id}-${index}`;

                              return (
                                <Card
                                  key={fileId}
                                  size="small"
                                  hoverable
                                  style={{
                                    width: 250,
                                    cursor: "pointer",
                                    border: "1px solid #f0f0f0",
                                  }}
                                  bodyStyle={{ padding: 12 }}
                                  onClick={() => handleFileClick(filePath)}
                                >
                                  <Flex vertical align="center" gap={8}>
                                    {type === "video" ? (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: 160,
                                          background: "#000",
                                          borderRadius: 8,
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 8,
                                          position: "relative",
                                        }}
                                      >
                                        <VideoCameraOutlined style={{ fontSize: 64, color: "#fff" }} />
                                        <div
                                          style={{
                                            position: "absolute",
                                            bottom: 10,
                                            right: 10,
                                            background: "rgba(0,0,0,0.7)",
                                            color: "#fff",
                                            padding: "2px 8px",
                                            borderRadius: 4,
                                            fontSize: 12,
                                          }}
                                        >
                                          ▶ Видео
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: 160,
                                          background: "#fafafa",
                                          borderRadius: 8,
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 8,
                                        }}
                                      >
                                        {getFileIcon(type)}
                                        <span style={{ fontSize: 12, color: "#666" }}>
                                          {getFileTypeName(type)}
                                        </span>
                                      </div>
                                    )}

                                    <Tooltip title={fileName}>
                                      <Text ellipsis style={{ fontSize: 13, maxWidth: 220, textAlign: "center" }}>
                                        {fileName}
                                      </Text>
                                    </Tooltip>

                                    <Flex gap={4} wrap>
                                      <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                                        {getFileTypeName(type)}
                                      </Tag>
                                      <Tooltip title="Скачать">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<DownloadOutlined />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            downloadFile(fullUrl, fileName);
                                          }}
                                        />
                                      </Tooltip>
                                    </Flex>
                                  </Flex>
                                </Card>
                              );
                            })}
                          </Flex>
                        </div>
                      )}
                    </Flex>
                  </Card>
                </motion.div>
              );
            })}
          </Space>
        )}
      </AnimatePresence>

      {/* Модалка создания/редактирования */}
      <Modal
        title={editingItem ? "Редактировать видеоурок" : "Новый видеоурок"}
        open={open}
        onCancel={closeModal}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={handleSave}
            loading={publishing}
            style={{
              background: "linear-gradient(135deg, #1890ff, #40a9ff)",
              border: "none",
            }}
          >
            {editingItem ? "Сохранить" : "Опубликовать"}
          </Button>,
          <Button key="cancel" onClick={closeModal}>
            Отмена
          </Button>,
        ]}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Заголовок"
            rules={[{ required: true, message: "Введите заголовок" }]}
          >
            <Input placeholder="Заголовок" size="large" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Описание"
            rules={[{ required: true, message: "Введите описание" }]}
          >
            <Input.TextArea placeholder="Описание видео..." autoSize={{ minRows: 4 }} size="large" />
          </Form.Item>
          <Form.Item name="subDepartmentId" label="Отдел">
            <Select
              placeholder="Выберите отдел"
              allowClear
              loading={subDeptLoading}
              options={(subdepartments || []).map((s) => ({
                label: s.name,
                value: Number(s.id),
              }))}
            />
          </Form.Item>
          <Form.Item name="employeeId" label="Сотрудник">
            <Select
              placeholder="Выберите Сотрудник"
              allowClear
              loading={employeeLoading}
              options={(employees || []).map((emp) => ({
                label: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
                value: Number(emp.id),
              }))}
            />
          </Form.Item>
          <Form.Item label="Видеофайлы">
            <Upload
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={(info) => setFileList(info.fileList)}
              onPreview={handleUploadPreview}
              accept="video/*,image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Загрузить видео</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Превью */}
      <Modal
        open={preview.open}
        footer={null}
        onCancel={() => setPreview({ open: false, url: "", type: "video" })}
        centered
        width={preview.type === "video" ? 860 : 700}
        bodyStyle={{
          padding: 0,
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {preview.type === "video" ? (
          <video
            src={preview.url}
            controls
            autoPlay
            style={{
              width: "100%",
              maxHeight: "80vh",
              display: "block",
              borderRadius: 12,
            }}
          />
        ) : (
          <img
            src={preview.url}
            alt="preview"
            style={{
              width: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              display: "block",
              borderRadius: 12,
            }}
          />
        )}
      </Modal>
    </div>
  );
};