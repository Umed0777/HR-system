import { useEffect, useState } from "react";
import { useAnnouncementStore } from "../store/useAnnouncement";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import { useEmployeeStore } from "../store/useEmployee";
import img from "../assets/image2.jpg";
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
  Avatar,
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
  EyeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  UserOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const { Title, Text } = Typography;
const BASE_URL = "http://localhost:5218";

export const Announcement = () => {
  const {
    announcements,
    fetchAnnouncements,
    addAnnouncement,
    editAnnouncement,
    removeAnnouncement,
    loading,
    error,
  } = useAnnouncementStore();

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
    isVideo: false,
  });
  const [fileList, setFileList] = useState([]);
  const [likedItems, setLikedItems] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);

  // АНИМАЦИЯ И ЭФФЕКТЫ
  const [showConfetti, setShowConfetti] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newAnnouncementId, setNewAnnouncementId] = useState(null);
  const [highlightCard, setHighlightCard] = useState(null);

  // Функция для скачивания файла
  const downloadFile = (url, fileName) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Функции для определения типа файла
  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  const isVideo = (url) => /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
  const isWord = (url) => /\.(doc|docx)$/i.test(url);
  const isExcel = (url) => /\.(xls|xlsx)$/i.test(url);
  const isPowerPoint = (url) => /\.(ppt|pptx|pps|ppsx)$/i.test(url);
  const isPdf = (url) => /\.(pdf)$/i.test(url);
  const isDocument = (url) =>
    isWord(url) || isExcel(url) || isPowerPoint(url) || isPdf(url);

  const getFileType = (url) => {
    if (!url) return "other";
    if (isImage(url)) return "image";
    if (isVideo(url)) return "video";
    if (isWord(url)) return "word";
    if (isExcel(url)) return "excel";
    if (isPowerPoint(url)) return "powerpoint";
    if (isPdf(url)) return "pdf";
    return "other";
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "word":
        return <FileWordOutlined style={{ color: "#2b5797", fontSize: 32 }} />;
      case "excel":
        return <FileExcelOutlined style={{ color: "#217346", fontSize: 32 }} />;
      case "powerpoint":
        return <FilePptOutlined style={{ color: "#d83b01", fontSize: 32 }} />;
      case "pdf":
        return <FilePdfOutlined style={{ color: "#ee3a43", fontSize: 32 }} />;
      case "image":
        return <PictureOutlined style={{ color: "#52c41a", fontSize: 32 }} />;
      case "video":
        return (
          <VideoCameraOutlined style={{ color: "#1890ff", fontSize: 32 }} />
        );
      default:
        return <FileTextOutlined style={{ color: "#faad14", fontSize: 32 }} />;
    }
  };

  const getFileTypeName = (type) => {
    switch (type) {
      case "word":
        return "Документ Word";
      case "excel":
        return "Таблица Excel";
      case "powerpoint":
        return "Презентация PowerPoint";
      case "pdf":
        return "PDF документ";
      case "image":
        return "Изображение";
      case "video":
        return "Видео";
      default:
        return "Файл";
    }
  };

  const getFileName = (url) => {
    if (!url) return "файл";
    const parts = url.split("/");
    let fileName = parts[parts.length - 1];
    fileName = decodeURIComponent(fileName);
    if (fileName.length > 50) {
      const ext = fileName.split(".").pop();
      fileName = fileName.substring(0, 47) + "..." + ext;
    }
    return fileName;
  };

  const handlePreview = (file) => {
    const url = file.url || URL.createObjectURL(file.originFileObj);
    const isVideoFile =
      file.type?.startsWith("video") || /\.(mp4|webm|ogg)$/i.test(file.name);
    const isImageFile =
      file.type?.startsWith("image") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    // Для изображений и видео - показываем预览
    if (isImageFile || isVideoFile) {
      setPreview({ open: true, url, isVideo: isVideoFile });
    } else {
      // Для документов и PDF - сразу скачиваем
      const fullUrl =
        file.url ||
        (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
      downloadFile(fullUrl, file.name);
    }
  };

  // Обработка клика по файлу в объявлении
  const handleFileClick = (fileUrl, fileType) => {
    const fullUrl = `${BASE_URL}${fileUrl}`;
    const fileName = getFileName(fileUrl);

    if (fileType === "image") {
      setPreview({ open: true, url: fullUrl, isVideo: false });
    } else if (fileType === "video") {
      setPreview({ open: true, url: fullUrl, isVideo: true });
    } else {
      // PDF и другие документы - сразу скачиваем
      downloadFile(fullUrl, fileName);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchSubDepartments();
      await fetchEmployee();
      await fetchAnnouncements();
    };
    loadData();
  }, []);

  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        title: item.title,
        content: item.content,
        subDepartmentId: item?.subDepartmentId ?? null,
        employeeId: item?.employeeId ?? null,
      });
    } else {
      form.resetFields();
    }
    setFileList([]);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingItem(null);
    form.resetFields();
    setFileList([]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const title =
        !values.title || values.title === "undefined" ? "" : values.title;
      const content =
        !values.content || values.content === "undefined" ? "" : values.content;
      const subDepartmentId = values.subDepartmentId ?? null;
      const employeeId = values.employeeId ?? null;

      const files = fileList.map((f) => f.originFileObj).filter(Boolean);

      if (!title) {
        message.error("Введите заголовок объявления");
        return;
      }

      const payload = {
        title: title,
        content: content,
        subDepartmentId: subDepartmentId,
        employeeId: employeeId,
        files: files,
      };

      setPublishing(true);

      let response;
      if (editingItem) {
        response = await editAnnouncement(editingItem.id, payload);
        message.success("Объявление успешно обновлено!");
      } else {
        response = await addAnnouncement(payload);

        if (response && response.id) {
          setNewAnnouncementId(response.id);
        }

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);

        message.success({
          content: "Объявление успешно опубликовано! 🎉",
          duration: 3,
        });
      }

      await fetchAnnouncements();

      if (!editingItem && response && response.id) {
        setTimeout(() => {
          setHighlightCard(response.id);
          const element = document.getElementById(
            `announcement-${response.id}`,
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setTimeout(() => setHighlightCard(null), 3000);
        }, 500);
      }

      closeModal();
    } catch (err) {
      console.error("❌ Ошибка в handleSave:", err);
      message.error(
        `Ошибка при сохранении: ${err.message || "Неизвестная ошибка"}`,
      );
    } finally {
      setPublishing(false);
    }
  };

  const toggleLike = (id) => {
    if (likedItems[id]) {
      setLikedItems((prev) => ({ ...prev, [id]: false }));
      message.info("Лайк убран");
    } else {
      setLikedItems((prev) => ({ ...prev, [id]: true }));
      message.success({
        content: "Вы поставили лайк ❤️",
        icon: <HeartFilled style={{ color: "#ff4d4f" }} />,
      });
    }
  };

  const subDeptMap = new Map(
    subdepartments.map((sd) => [Number(sd.id), sd.name]),
  );

  const getSubDepartmentName = (id) => {
    if (id === null || id === undefined) return "Без подотделения";
    return subDeptMap.get(Number(id)) || "Без подотделения";
  };

  const getEmployeeName = (id) => {
    if (!id) return "Неизвестный автор";
    const employee = employees.find((emp) => Number(emp.id) === Number(id));
    if (employee) {
      return (
        `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
        "Неизвестный автор"
      );
    }
    return "Неизвестный автор";
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        <Skeleton active avatar paragraph={{ rows: 3 }} />
        <Skeleton
          active
          avatar
          paragraph={{ rows: 3 }}
          style={{ marginTop: 20 }}
        />
        <Skeleton
          active
          avatar
          paragraph={{ rows: 3 }}
          style={{ marginTop: 20 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Empty
          description={
            <span style={{ color: "#ff4d4f" }}>Ошибка: {error}</span>
          }
        />
        <Button
          type="primary"
          onClick={fetchAnnouncements}
          style={{ marginTop: 20, background: "#ff4b2b" }}
        >
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={["#ff416c", "#ff4b2b", "#ff6b4a", "#ff8c6b", "#ffad8c"]}
        />
      )}

      <Flex
        justify="space-between"
        align="center"
        style={{
          marginBottom: 32,
          padding: "0 8px",
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            Объявления
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Всего {announcements.length} объявлений
          </Text>
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="primary"
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              border: "none",
              boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
              fontWeight: "bold",
              height: "40px",
              padding: "0 24px",
              borderRadius: "20px",
            }}
            onClick={() => openModal()}
            size="middle"
          >
            Добавить
          </Button>
        </motion.div>
      </Flex>

      <AnimatePresence>
        {announcements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Empty description="Нет объявлений" style={{ marginTop: 100 }}>
              <Button
                type="primary"
                onClick={() => openModal()}
                style={{ background: "#ff4b2b" }}
              >
                Создать первое объявление
              </Button>
            </Empty>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {announcements.map((item, index) => {
              const isLiked = likedItems[item.id] || false;
              const isHovered = hoveredCard === item.id;
              const hasMedia = item.profileImagePath;
              const createdAt =
                item.createdAt && item.createdAt !== "0001-01-01T00:00:00"
                  ? dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")
                  : null;

              const fileType = getFileType(item.profileImagePath);
              const employeeName = getEmployeeName(item.employeeId);
              const isNew = newAnnouncementId === item.id;
              const isHighlighted = highlightCard === item.id;
              const isDocumentFile = isDocument(item.profileImagePath);
              const fullFileUrl = hasMedia
                ? `${BASE_URL}${item.profileImagePath}`
                : "";

              return (
                <motion.div
                  key={item.id}
                  id={`announcement-${item.id}`}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    boxShadow: isHighlighted
                      ? "0 0 0 3px #ff4b2b, 0 0 0 6px rgba(255, 75, 43, 0.3)"
                      : "none",
                  }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 80,
                    damping: 15,
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.5 } }}
                  style={{
                    borderRadius: 20,
                    boxShadow: isHighlighted
                      ? "0 0 0 3px #ff4b2b, 0 0 0 6px rgba(255, 75, 43, 0.3)"
                      : "none",
                  }}
                >
                  {isNew && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: 12,
                        fontWeight: "bold",
                        zIndex: 1,
                      }}
                    >
                      NEW! 🎉
                    </motion.div>
                  )}

                  <Card
                    onMouseEnter={() => setHoveredCard(item.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      borderRadius: 20,
                      boxShadow: isHovered
                        ? "0 12px 24px rgba(0, 0, 0, 0.12)"
                        : "0 4px 12px rgba(0, 0, 0, 0.08)",
                      transition: "all 0.3s ease",
                      border: "none",
                      overflow: "hidden",
                      backgroundImage: `url(${img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    styles={{ body: { padding: 0, background: "transparent" } }}
                  >
                    <div
                      style={{
                        padding: "20px 24px 12px 24px",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                        background: "rgba(255, 255, 255, 0.9)",
                      }}
                    >
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap={12}>
                          <Avatar
                            style={{
                              background:
                                "linear-gradient(135deg, #ff416c, #ff4b2b)",
                              verticalAlign: "middle",
                            }}
                            size={40}
                          >
                            {item.title?.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text
                              strong
                              style={{
                                fontSize: 18,
                                display: "block",
                                color: "#1a1a1a",
                              }}
                            >
                              {item.title}
                            </Text>
                            <Flex
                              gap={8}
                              align="center"
                              style={{ marginTop: 4 }}
                            >
                              {createdAt && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  <CalendarOutlined
                                    style={{ marginRight: 4 }}
                                  />
                                  {createdAt}
                                </Text>
                              )}
                              <Tag
                                color={
                                  item.subDepartmentId ? "blue" : "default"
                                }
                              >
                                {getSubDepartmentName(item.subDepartmentId)}
                              </Tag>
                              <Tag icon={<UserOutlined />} color="purple">
                                {employeeName}
                              </Tag>
                            </Flex>
                          </div>
                        </Flex>
                        <Tag
                          color="orange"
                          style={{ borderRadius: 12, fontSize: 12 }}
                        >
                          №{index + 1}
                        </Tag>
                      </Flex>
                    </div>

                    <div style={{ padding: "20px 24px" }}>
                      {item.content && item.content !== "undefined" && (
                        <div
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: 12,
                            padding: "8px 20px",
                            marginBottom: hasMedia ? 20 : 0,
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            wordBreak: "break-word",
                          }}
                        >
                          <Text
                            style={{
                              whiteSpace: "pre-wrap",
                              fontSize: 15,
                              lineHeight: 1.7,
                              color: "#333",
                              display: "block",
                            }}
                          >
                            {item.content}
                          </Text>
                        </div>
                      )}

                      {hasMedia && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ marginBottom: 8 }}>
                            <Space>
                              {getFileIcon(fileType)}
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {getFileTypeName(fileType)}
                              </Text>
                            </Space>
                          </div>

                          <div style={{ textAlign: "center" }}>
                            {fileType === "image" ? (
                              <div
                                style={{
                                  position: "relative",
                                  cursor: "pointer",
                                  borderRadius: 12,
                                  overflow: "hidden",
                                  display: "inline-block",
                                }}
                                onClick={() =>
                                  handleFileClick(
                                    item.profileImagePath,
                                    fileType,
                                  )
                                }
                              >
                                <img
                                  src={fullFileUrl}
                                  alt="preview"
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: 400,
                                    borderRadius: 12,
                                    transition: "transform 0.3s ease",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      "scale(1.02)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      "scale(1)")
                                  }
                                />
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: 10,
                                    right: 10,
                                    background: "rgba(0,0,0,0.6)",
                                    borderRadius: 20,
                                    padding: "4px 12px",
                                    color: "white",
                                    fontSize: 12,
                                  }}
                                >
                                  <EyeOutlined /> Увеличить
                                </div>
                              </div>
                            ) : fileType === "video" ? (
                              <video
                                src={fullFileUrl}
                                controls
                                style={{
                                  maxWidth: "100%",
                                  borderRadius: 12,
                                  maxHeight: 400,
                                  display: "inline-block",
                                  overflow: "hidden",
                                }}
                              />
                            ) : (
                              // Документы, PDF - показываем кнопку скачивания
                              <div style={{ textAlign: "center" }}>
                                <div
                                  style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: "24px 48px",
                                    background: "rgba(255, 255, 255, 0.95)",
                                    borderRadius: 16,
                                    border: "1px solid rgba(0, 0, 0, 0.1)",
                                  }}
                                >
                                  {getFileIcon(fileType)}
                                  <Text strong style={{ fontSize: 16 }}>
                                    {getFileTypeName(fileType)}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 13 }}
                                  >
                                    {getFileName(item.profileImagePath)}
                                  </Text>
                                  <a
                                    href={`${BASE_URL}${item.profileImagePath}`}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "none" }}
                                  >
                                    <Button
                                      type="primary"
                                      icon={<DownloadOutlined />}
                                      style={{
                                        background:
                                          "linear-gradient(135deg, #ff416c, #ff4b2b)",
                                        border: "none",
                                        borderRadius: 20,
                                        marginTop: 8,
                                      }}
                                    >
                                      Cкачать файл
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Divider
                      style={{
                        margin: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                      }}
                    />

                    <div
                      style={{
                        padding: "12px 24px",
                        background: "rgba(255, 255, 255, 0.9)",
                      }}
                    >
                      <Flex justify="space-between" align="center">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Tooltip
                            title={isLiked ? "Убрать лайк" : "Поставить лайк"}
                          >
                            <Button
                              type="text"
                              icon={
                                isLiked ? (
                                  <HeartFilled
                                    style={{ color: "#ff4d4f", fontSize: 22 }}
                                  />
                                ) : (
                                  <HeartOutlined style={{ fontSize: 22 }} />
                                )
                              }
                              onClick={() => toggleLike(item.id)}
                              style={{
                                padding: "4px 16px",
                                height: "auto",
                                transition: "all 0.3s",
                              }}
                            >
                              {isLiked ? "Вам нравится" : "Нравится"}
                            </Button>
                          </Tooltip>
                        </motion.div>

                        <Space>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              icon={<EditOutlined />}
                              onClick={() => openModal(item)}
                              style={{ borderRadius: 8 }}
                            >
                              Редактировать
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={async () => {
                                await removeAnnouncement(item.id);
                                message.success("Объявление удалено");
                                await fetchAnnouncements();
                              }}
                              style={{ borderRadius: 8 }}
                            >
                              Удалить
                            </Button>
                          </motion.div>
                        </Space>
                      </Flex>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </Space>
        )}
      </AnimatePresence>

      <Modal
        title={
          <div style={{ fontSize: 20, fontWeight: 600, color: "#ff4b2b" }}>
            {editingItem ? "Редактировать объявление" : "Новое объявление"}
          </div>
        }
        open={open}
        onCancel={closeModal}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={handleSave}
            loading={publishing}
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              border: "none",
              borderRadius: 8,
            }}
          >
            {editingItem
              ? "Сохранить"
              : publishing
                ? "Публикация..."
                : "Опубликовать"}
          </Button>,
          <Button key="cancel" onClick={closeModal} style={{ borderRadius: 8 }}>
            Отмена
          </Button>,
        ]}
        width={720}
        styles={{ body: { padding: "24px" } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Заголовок"
            rules={[{ required: true, message: "Введите заголовок" }]}
          >
            <Input
              placeholder="Введите заголовок объявления"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Содержание"
            rules={[{ required: true, message: "Введите содержание" }]}
          >
            <Input.TextArea
              placeholder="Текст объявления..."
              autoSize={{ minRows: 4 }}
              size="large"
              style={{ borderRadius: 10 }}
            />
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
              placeholder="Выберите cотрудника"
              allowClear
              loading={employeeLoading}
              options={(employees || []).map((emp) => ({
                label:
                  `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                  emp.email,
                value: Number(emp.id),
              }))}
            />
          </Form.Item>

          <Form.Item label="Файлы (изображения, видео, документы, презентации)">
            <Upload
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={(info) => setFileList(info.fileList)}
              onPreview={handlePreview}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Загрузить</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={preview.open}
        footer={null}
        onCancel={() => setPreview({ open: false, url: "", isVideo: false })}
        centered
        width="auto"
        styles={{
          body: { padding: 0, backgroundColor: "#000", borderRadius: 16 },
        }}
      >
        {preview.isVideo ? (
          <video
            src={preview.url}
            controls
            autoPlay
            style={{
              width: "100%",
              maxHeight: "80vh",
              borderRadius: 16,
            }}
          />
        ) : (
          <img
            src={preview.url}
            style={{
              width: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: 16,
            }}
            alt="preview"
          />
        )}
      </Modal>
    </div>
  );
};
