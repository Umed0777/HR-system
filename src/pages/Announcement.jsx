import { useEffect, useState } from "react";
import { useAnnouncementStore } from "../store/useAnnouncement";
import { useSubDepartmentStore } from "../store/useSubdepartment";
import { useEmployeeStore } from "../store/useEmployee";
import { useFolderStore } from "../store/useFolder";
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
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  UserOutlined,
  DownloadOutlined,
  FileOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API;

// ─── Утилита: строим полный URL ───────────────────────────────────────────────
const buildFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BASE_URL}${path}`;
};

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
  const { folders, fetchFolders, addFolder, updateFolder, deleteFolder } =
    useFolderStore();

  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [openFolder, setOpenFolder] = useState(false);
  const [openEditFolder, setOpenEditFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [form] = Form.useForm();
  const [preview, setPreview] = useState({
    open: false,
    url: "",
    type: "image",
  });
  const [fileList, setFileList] = useState([]);
  const [likedItems, setLikedItems] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      await fetchSubDepartments();
      await fetchEmployee();
      await fetchFolders();
      await fetchAnnouncements();
    };
    loadData();
  }, []);

  // 🔥 ИСПРАВЛЕНО: Автоматический выбор первой папки
  useEffect(() => {
    if (folders.length > 0) {
      const folderExists = folders.some(
        (f) => Number(f.id) === Number(selectedFolderId),
      );
      if (selectedFolderId === null || !folderExists) {
        setSelectedFolderId(Number(folders[0].id));
      }
    } else {
      setSelectedFolderId(null);
    }
  }, [folders]);

  // ─── Определение типа файла ───────────────────────────────────────────────
  const getFileType = (filePath) => {
    if (!filePath || typeof filePath !== "string") return "other";
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(filePath))
      return "image";
    if (/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(filePath)) return "video";
    if (/\.(doc|docx)$/i.test(filePath)) return "word";
    if (/\.(xls|xlsx)$/i.test(filePath)) return "excel";
    if (/\.(ppt|pptx|pps|ppsx)$/i.test(filePath)) return "powerpoint";
    if (/\.(pdf)$/i.test(filePath)) return "pdf";
    return "other";
  };

  // ─── Получаем путь из разных форматов ────────────────────────────────────
  const extractPath = (file) => {
    if (!file) return "";
    if (typeof file === "string") return file;
    return (
      file.profileImagePath || file.path || file.url || file.filePath || ""
    );
  };

  // ─── Все файлы объявления (строки-пути) ──────────────────────────────────
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
    if (!filePath || typeof filePath !== "string") return "файл";
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
    switch (type) {
      case "word":
        return <FileWordOutlined style={{ ...iconStyle, color: "#2b5797" }} />;
      case "excel":
        return <FileExcelOutlined style={{ ...iconStyle, color: "#217346" }} />;
      case "powerpoint":
        return <FilePptOutlined style={{ ...iconStyle, color: "#d83b01" }} />;
      case "pdf":
        return <FilePdfOutlined style={{ ...iconStyle, color: "#ee3a43" }} />;
      case "image":
        return <PictureOutlined style={{ ...iconStyle, color: "#52c41a" }} />;
      case "video":
        return (
          <VideoCameraOutlined style={{ ...iconStyle, color: "#1890ff" }} />
        );
      default:
        return <FileOutlined style={{ ...iconStyle, color: "#faad14" }} />;
    }
  };

  const getFileTypeName = (type) => {
    const names = {
      word: "Word",
      excel: "Excel",
      powerpoint: "PowerPoint",
      pdf: "PDF",
      image: "Изображение",
      video: "Видео",
    };
    return names[type] || "Файл";
  };

  // ─── Клик по файлу — открываем правильный preview ─────────────────────────
  const handleFileClick = (filePath) => {
    if (!filePath) {
      message.error("URL файла не найден");
      return;
    }
    const fullUrl = buildFullUrl(filePath);
    const type = getFileType(filePath);

    if (type === "image") {
      setPreview({ open: true, url: fullUrl, type: "image" });
    } else if (type === "video") {
      setPreview({ open: true, url: fullUrl, type: "video" });
    } else {
      downloadFile(fullUrl, getFileName(filePath));
    }
  };

  // ─── Превью в Upload (новые файлы перед сохранением) ─────────────────────
  const handleUploadPreview = (file) => {
    const url =
      file.url ||
      (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
    const isVideo =
      file.type?.startsWith("video") ||
      /\.(mp4|webm|ogg)$/i.test(file.name || "");
    const isImage =
      file.type?.startsWith("image") ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "");

    if (isImage) {
      setPreview({ open: true, url, type: "image" });
    } else if (isVideo) {
      setPreview({ open: true, url, type: "video" });
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

  // ─── ФИЛЬТРАЦИЯ: показываем только объявления выбранной папки ─────────────
  const getFilteredAnnouncements = () => {
    if (!selectedFolderId) return [];

    return announcements.filter((item) => {
      if (item.folderId === null || item.folderId === undefined) return false;
      return Number(item.folderId) === Number(selectedFolderId);
    });
  };

  const getFolderStats = (folderId) =>
    announcements.filter((item) => Number(item.folderId) === Number(folderId))
      .length;

  const filteredAnnouncements = getFilteredAnnouncements();

  // ─── Modal helpers ────────────────────────────────────────────────────────
  const openModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue({
        title: item.title,
        content: item.content,
        subDepartmentId: item.subDepartmentId ?? null,
        employeeId: item.employeeId ?? null,
        folderId: item.folderId != null ? Number(item.folderId) : null,
      });
      const files = getFiles(item);
      setFileList(
        files.map((path, i) => ({
          uid: `existing-${i}`,
          name: getFileName(path),
          status: "done",
          url: buildFullUrl(path),
          originFileObj: null,
        })),
      );
    } else {
      form.resetFields();
      if (selectedFolderId !== null) {
        form.setFieldsValue({ folderId: Number(selectedFolderId) });
      }
      setFileList([]);
    }
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

      if (!values.folderId) {
        message.error("Пожалуйста, выберите папку");
        return;
      }

      const payload = {
        title: values.title || "",
        content: values.content || "",
        subDepartmentId: values.subDepartmentId ?? null,
        employeeId: values.employeeId ?? null,
        folderId: Number(values.folderId),
        files: fileList
          .filter((f) => f.originFileObj)
          .map((f) => f.originFileObj),
      };

      setPublishing(true);
      if (editingItem) {
        await editAnnouncement(editingItem.id, payload);
        message.success("Объявление обновлено!");
      } else {
        const response = await addAnnouncement(payload);
        if (response?.id) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          message.success("Объявление опубликовано!");
        }
      }
      await fetchAnnouncements();
      closeModal();
    } catch (err) {
      console.error("Error:", err);
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
    return (
      subdepartments.find((s) => Number(s.id) === Number(id))?.name ||
      "Без отдела"
    );
  };

  const getEmployeeName = (id) => {
    if (!id) return "Неизвестный";
    const emp = employees.find((e) => Number(e.id) === Number(id));
    return emp
      ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
          emp.email ||
          "Неизвестный"
      : "Неизвестный";
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00")
      return "Дата не указана";
    try {
      return dayjs(dateString).format("DD.MM.YYYY HH:mm");
    } catch (_) {
      return "Дата не указана";
    }
  };

  // 🔥 ИСПРАВЛЕНО: Создание папки
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error("Введите название папки");
      return;
    }

    try {
      const newFolderName = folderName.trim();

      // Создаем папку
      const response = await addFolder({ name: newFolderName });

      // Обновляем список папок
      await fetchFolders();

      message.success("Папка создана!");
      setFolderName("");
      setOpenFolder(false);

      // Получаем обновленный список папок из store
      const updatedFolders = useFolderStore.getState().folders;

      // Ищем созданную папку
      let createdFolder = updatedFolders.find((f) => f.name === newFolderName);

      // Если не нашли по имени, пробуем использовать response
      if (!createdFolder && response?.id) {
        createdFolder = updatedFolders.find(
          (f) => Number(f.id) === Number(response.id),
        );
      }

      // Устанавливаем выбранную папку
      if (createdFolder) {
        setSelectedFolderId(Number(createdFolder.id));
        console.log(
          "✅ Папка выбрана:",
          createdFolder.name,
          "ID:",
          createdFolder.id,
        );
      } else if (updatedFolders.length > 0) {
        // Если не нашли, выбираем первую
        setSelectedFolderId(Number(updatedFolders[0].id));
        console.log(
          "⚠️ Папка не найдена, выбрана первая:",
          updatedFolders[0].name,
        );
      }
    } catch (error) {
      console.error("Ошибка создания папки:", error);
      message.error("Ошибка создания папки");
    }
  };

  // 🔥 ИСПРАВЛЕНО: Редактирование папки
  const handleEditFolder = async () => {
    if (!editingFolder || !folderName.trim()) {
      message.error("Введите название");
      return;
    }

    try {
      const oldName = editingFolder.name;
      const newName = folderName.trim();

      await updateFolder(editingFolder.id, { name: newName });
      await fetchFolders();

      message.success("Папка обновлена!");
      setFolderName("");
      setEditingFolder(null);
      setOpenEditFolder(false);

      // Если переименовали выбранную папку, обновляем её название
      if (Number(selectedFolderId) === Number(editingFolder.id)) {
        const updatedFolders = useFolderStore.getState().folders;
        const updatedFolder = updatedFolders.find(
          (f) => Number(f.id) === Number(editingFolder.id),
        );
        if (updatedFolder) {
          // selectedFolderId остается тем же, но название обновится через currentFolder
          console.log("✅ Папка переименована в:", updatedFolder.name);
        }
      }
    } catch (error) {
      console.error("Ошибка обновления папки:", error);
      message.error("Ошибка обновления папки");
    }
  };

  // 🔥 ИСПРАВЛЕНО: Удаление папки
  const handleDeleteFolder = async (folderId) => {
    if (announcements.some((a) => Number(a.folderId) === Number(folderId))) {
      message.warning("Нельзя удалить папку с объявлениями");
      return;
    }

    try {
      await deleteFolder(folderId);
      await fetchFolders();
      message.success("Папка удалена!");

      // Обновляем выбранную папку
      const updatedFolders = useFolderStore.getState().folders;

      if (Number(selectedFolderId) === Number(folderId)) {
        if (updatedFolders.length > 0) {
          setSelectedFolderId(Number(updatedFolders[0].id));
          console.log(
            "✅ Переключено на первую папку:",
            updatedFolders[0].name,
          );
        } else {
          setSelectedFolderId(null);
          console.log("ℹ️ Папок не осталось");
        }
      }
    } catch (error) {
      console.error("Ошибка удаления папки:", error);
      message.error("Ошибка удаления папки");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", height: 'auto' }}>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            active
            avatar
            paragraph={{ rows: 3 }}
            style={{ marginBottom: 20 }}
          />
        ))}
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

  // Если нет папок, показываем сообщение
  if (folders.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <Card>
          <Empty description="Нет созданных папок" style={{ marginTop: 50 }}>
            <Button
              type="primary"
              onClick={() => setOpenFolder(true)}
              style={{ background: "#ff4b2b" }}
              icon={<FolderOutlined />}
            >
              Создать первую папку
            </Button>
          </Empty>
        </Card>

        {/* Модалка создания папки */}
        <Modal
          title="Создать папку"
          open={openFolder}
          onCancel={() => {
            setOpenFolder(false);
            setFolderName("");
          }}
          footer={[
            <Button
              danger
              key="create"
              type="primary"
              onClick={handleCreateFolder}
            >
              Создать
            </Button>,
            <Button
              danger
              key="cancel"
              onClick={() => {
                setOpenFolder(false);
                setFolderName("");
              }}
            >
              Отмена
            </Button>,
          ]}
        >
          <Input
            placeholder="Введите название папки"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </Modal>
      </div>
    );
  }

  const currentFolder = folders.find(
    (f) => Number(f.id) === Number(selectedFolderId),
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          colors={["#ff416c", "#ff4b2b", "#ff6b4a", "#ff8c6b", "#ffad8c"]}
        />
      )}

      {/* ── Шапка ── */}
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 32, flexWrap: "wrap", gap: 16 }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>
            {currentFolder ? currentFolder.name : "Объявления"}
          </Title>
          <Text type="secondary">
            {filteredAnnouncements.length} объявлений в папке
          </Text>
        </div>
        <Flex gap={10} align="center" wrap>
          <Button
            danger
            onClick={() => setOpenFolder(true)}
            icon={<FolderOutlined />}
          >
            Создать папку
          </Button>
          <Button
            type="primary"
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              border: "none",
              boxShadow: "0 4px 12px rgba(255,75,43,0.3)",
              fontWeight: "bold",
              height: 40,
              padding: "0 24px",
              borderRadius: 20,
            }}
            onClick={() => openModal()}
          >
            Добавить объявление
          </Button>
        </Flex>
      </Flex>

      {/* ── Папки ── */}
      <div style={{ marginBottom: 32 }}>
        <Flex gap={12} wrap>
          {folders.map((folder) => {
            const isActive = Number(selectedFolderId) === Number(folder.id);
            const stats = getFolderStats(folder.id);

            return (
              <Card
                key={folder.id}
                hoverable
                style={{
                  cursor: "pointer",
                  minWidth: 150,
                  border: isActive ? "2px solid #ff4b2b" : "1px solid #f0f0f0",
                  background: isActive ? "#fff5f5" : "white",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Flex vertical align="center" gap={4}>
                  <div
                    onClick={() => setSelectedFolderId(Number(folder.id))}
                    style={{ textAlign: "center", width: "100%" }}
                  >
                    <FolderOutlined
                      style={{ fontSize: 32, color: "#faad14" }}
                    />
                    <Text strong style={{ display: "block" }}>
                      {folder.name}
                    </Text>
                    <Tag color="blue">{stats}</Tag>
                  </div>
                  <Flex gap={4}>
                    <Tooltip title="Редактировать папку">
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                          setFolderName(folder.name);
                          setOpenEditFolder(true);
                        }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Удалить папку?"
                      description={`Удалить "${folder.name}"?`}
                      onConfirm={() => handleDeleteFolder(folder.id)}
                      okText="Да"
                      cancelText="Нет"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      </div>

      {/* ── Список объявлений в выбранной папке ── */}
      <AnimatePresence>
        {filteredAnnouncements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Empty
              description={`В папке "${currentFolder?.name}" нет объявлений`}
              style={{ marginTop: 100 }}
            >
              <Button
                type="primary"
                onClick={() => openModal()}
                style={{ background: "#ff4b2b" }}
              >
                Создать объявление
              </Button>
            </Empty>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {filteredAnnouncements.map((item) => {
              const files = getFiles(item);
              const folder = folders.find(
                (f) => Number(f.id) === Number(item.folderId),
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    actions={[
                      <Tooltip title="Лайк" key="like">
                        <span onClick={() => toggleLike(item.id)}>
                          {likedItems[item.id] ? (
                            <HeartFilled
                              style={{ color: "#ff4d4f", fontSize: 18 }}
                            />
                          ) : (
                            <HeartOutlined style={{ fontSize: 18 }} />
                          )}
                        </span>
                      </Tooltip>,
                      <Tooltip title="Редактировать" key="edit">
                        <EditOutlined
                          style={{ fontSize: 18 }}
                          onClick={() => openModal(item)}
                        />
                      </Tooltip>,
                      <Tooltip title="Удалить" key="delete">
                        <DeleteOutlined
                          style={{ fontSize: 18, color: "#ff4d4f" }}
                          onClick={() =>
                            Modal.confirm({
                              title: "Удалить объявление?",
                              content: "Вы уверены?",
                              okText: "Да",
                              cancelText: "Нет",
                              onOk: async () => {
                                await removeAnnouncement(item.id);
                                await fetchAnnouncements();
                                message.success("Объявление удалено");
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
                        <Flex
                          gap={8}
                          style={{ marginTop: 8, flexWrap: "wrap" }}
                        >
                          <Tag icon={<UserOutlined />} color="blue">
                            {getEmployeeName(item.employeeId)}
                          </Tag>
                          <Tag icon={<CalendarOutlined />} color="green">
                            {formatDate(item.createdAt)}
                          </Tag>
                          <Tag color="orange">
                            {getSubDepartmentName(item.subDepartmentId)}
                          </Tag>
                          {folder && (
                            <Tag color="gold" icon={<FolderOutlined />}>
                              {folder.name}
                            </Tag>
                          )}
                        </Flex>
                      </div>

                      <Text style={{ fontSize: 15 }}>{item.content}</Text>

                      {/* ── Файлы ── */}
                      {files.length > 0 && (
                        <div>
                          <Divider style={{ margin: "12px 0" }} />
                          <Flex wrap gap={16}>
                            {files.map((filePath, index) => {
                              const type = getFileType(filePath);
                              const fileName = getFileName(filePath);
                              const fullUrl = buildFullUrl(filePath);
                              const fileId = `${item.id}-${index}`;
                              const hasError = imageErrors[fileId];

                              return (
                                <Card
                                  key={fileId}
                                  size="small"
                                  hoverable
                                  style={{
                                    width: 200,
                                    cursor: "pointer",
                                    border: "1px solid #f0f0f0",
                                  }}
                                  bodyStyle={{ padding: 12 }}
                                  onClick={() => handleFileClick(filePath)}
                                >
                                  <Flex vertical align="center" gap={8}>
                                    {/* Превью */}
                                    {type === "image" &&
                                    fullUrl &&
                                    !hasError ? (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: 140,
                                          overflow: "hidden",
                                          borderRadius: 8,
                                          background: "#fafafa",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <img
                                          src={fullUrl}
                                          alt={fileName}
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                          }}
                                          onError={() =>
                                            setImageErrors((prev) => ({
                                              ...prev,
                                              [fileId]: true,
                                            }))
                                          }
                                        />
                                      </div>
                                    ) : type === "video" ? (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: 140,
                                          background: "#000",
                                          borderRadius: 8,
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 8,
                                        }}
                                      >
                                        <VideoCameraOutlined
                                          style={{
                                            fontSize: 48,
                                            color: "#fff",
                                          }}
                                        />
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: "#fff",
                                          }}
                                        >
                                          Видео
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: 140,
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
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: "#666",
                                          }}
                                        >
                                          {getFileTypeName(type)}
                                        </span>
                                      </div>
                                    )}

                                    <Tooltip title={fileName}>
                                      <Text
                                        ellipsis
                                        style={{
                                          fontSize: 13,
                                          maxWidth: 180,
                                          textAlign: "center",
                                        }}
                                      >
                                        {fileName}
                                      </Text>
                                    </Tooltip>

                                    <Flex gap={4} wrap>
                                      <Tag
                                        color="blue"
                                        style={{ fontSize: 10, margin: 0 }}
                                      >
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

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* Создать / редактировать объявление */}
      <Modal
        title={editingItem ? "Редактировать объявление" : "Новое объявление"}
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
            label="Содержание"
            rules={[{ required: true, message: "Введите содержание" }]}
          >
            <Input.TextArea
              placeholder="Текст..."
              autoSize={{ minRows: 4 }}
              size="large"
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
              placeholder="Выберите сотрудника"
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
          <Form.Item
            name="folderId"
            label="Папка"
            rules={[{ required: true, message: "Пожалуйста, выберите папку" }]}
          >
            <Select
              placeholder="Выберите папку"
              options={(folders || []).map((f) => ({
                label: f.name,
                value: Number(f.id),
              }))}
            />
          </Form.Item>
          <Form.Item label="Файлы">
            <Upload
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={(info) => setFileList(info.fileList)}
              onPreview={handleUploadPreview}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Загрузить</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Превью - изображение или видео */}
      <Modal
        open={preview.open}
        footer={null}
        onCancel={() => setPreview({ open: false, url: "", type: "image" })}
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

      {/* Создать папку */}
      <Modal
        title="Создать папку"
        open={openFolder}
        onCancel={() => {
          setOpenFolder(false);
          setFolderName("");
        }}
        footer={[
          <Button
            key="create"
            type="primary"
            danger
            onClick={handleCreateFolder}
          >
            Создать
          </Button>,
          <Button
            danger
            key="cancel"
            onClick={() => {
              setOpenFolder(false);
              setFolderName("");
            }}
          >
            Отмена
          </Button>,
        ]}
      >
        <Input
          placeholder="Название папки"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
        />
      </Modal>

      {/* Редактировать папку */}
      <Modal
        title="Редактировать папку"
        open={openEditFolder}
        onCancel={() => {
          setOpenEditFolder(false);
          setFolderName("");
          setEditingFolder(null);
        }}
        onOk={handleEditFolder}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          placeholder="Название папки"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onPressEnter={handleEditFolder}
        />
      </Modal>
    </div>
  );
};
