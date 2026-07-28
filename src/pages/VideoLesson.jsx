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
  Badge,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  UserOutlined,
  DownloadOutlined,
  FileOutlined,
  FilePptOutlined,
  FolderOutlined,
  PlayCircleOutlined,
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
    allFolders,
    fetchVideoLessons,
    fetchAllFolders,
    addVideoLesson,
    editVideoLesson,
    removeVideoLesson,
    createNewFolder,
    updateFolder,
    deleteFolder,
    moveVideoToFolder,
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
  });
  const [fileList, setFileList] = useState([]);
  const [likedItems, setLikedItems] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      console.log("🔄 VideoLesson - Загрузка данных...");
      setLoadingFolders(true);
      try {
        await fetchSubDepartments();
        await fetchEmployee();
        await fetchAllFolders();
        await fetchVideoLessons();
        console.log("✅ VideoLesson - Данные загружены");
      } catch (error) {
        console.error("❌ Ошибка загрузки:", error);
        message.error("Ошибка загрузки данных");
      } finally {
        setLoadingFolders(false);
      }
    };
    loadData();
  }, []);

  // Безопасная проверка на undefined
  const allVideos = Array.isArray(videoLessons) ? videoLessons : [];
  const allFoldersList = Array.isArray(allFolders) ? allFolders : [];

  const getFilteredVideosByFolder = () => {
    if (!selectedFolderId) {
      return allVideos;
    }
    return allVideos.filter(video => Number(video.folderId) === Number(selectedFolderId));
  };

  const displayedVideos = getFilteredVideosByFolder();

  const getFolderName = (id) => {
    if (!id) return "Без папки";
    const folder = allFoldersList.find(f => Number(f.id) === Number(id));
    return folder ? folder.name : "Неизвестная папка";
  };

  const getFolderCount = (folderId) => {
    return allVideos.filter(video => Number(video.folderId) === Number(folderId)).length;
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

  const getVideoFiles = (item) => {
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

  // Определение типа файла
  const getFileType = (filePath) => {
    if (!filePath || typeof filePath !== "string") return "document";
    if (/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(filePath)) return "video";
    if (/\.(ppt|pptx|pps|ppsx)$/i.test(filePath)) return "powerpoint";
    if (/\.(pdf)$/i.test(filePath)) return "pdf";
    if (/\.(doc|docx)$/i.test(filePath)) return "word";
    if (/\.(xls|xlsx)$/i.test(filePath)) return "excel";
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(filePath)) return "image";
    return "document";
  };

  // Иконка для файла
  const getFileIcon = (type) => {
    const iconStyle = { fontSize: 48 };
    switch (type) {
      case "video":
        return <PlayCircleOutlined style={{ ...iconStyle, color: "#1890ff" }} />;
      case "powerpoint":
        return <FilePptOutlined style={{ ...iconStyle, color: "#d83b01" }} />;
      case "pdf":
        return <FileOutlined style={{ ...iconStyle, color: "#ee3a43" }} />;
      case "word":
        return <FileOutlined style={{ ...iconStyle, color: "#2b5797" }} />;
      case "excel":
        return <FileOutlined style={{ ...iconStyle, color: "#217346" }} />;
      case "image":
        return <FileOutlined style={{ ...iconStyle, color: "#52c41a" }} />;
      default:
        return <FileOutlined style={{ ...iconStyle, color: "#faad14" }} />;
    }
  };

  // Название типа файла
  const getFileTypeName = (type) => {
    const names = {
      video: "Видео",
      powerpoint: "PowerPoint",
      pdf: "PDF",
      word: "Word",
      excel: "Excel",
      image: "Изображение",
    };
    return names[type] || "Документ";
  };

  // Цвет фона для файла
  const getFileBackground = (type) => {
    switch (type) {
      case "video":
        return "#000";
      case "powerpoint":
        return "#fdf0e6";
      case "pdf":
        return "#fde8e8";
      case "word":
        return "#e8f0f8";
      case "excel":
        return "#e8f5ed";
      case "image":
        return "#f0faf0";
      default:
        return "#fafafa";
    }
  };

  const handleFileClick = (filePath) => {
    if (!filePath) {
      message.error("URL файла не найден");
      return;
    }
    const fullUrl = buildFullUrl(filePath);
    const type = getFileType(filePath);

    if (type === "video") {
      setPreview({ open: true, url: fullUrl });
    } else {
      downloadFile(fullUrl, getFileName(filePath));
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
    setEditingItem(item);

    if (item) {
      form.setFieldsValue({
        title: item.title,
        content: item.content,
        subDepartmentId: item.subDepartmentId ?? null,
        employeeId: item.employeeId ?? null,
        folderId: item.folderId ?? null,
      });
      const files = getVideoFiles(item);
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
      if (selectedFolderId) {
        form.setFieldsValue({ folderId: selectedFolderId });
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

      const payload = {
        title: values.title || "",
        content: values.content || "",
        subDepartmentId: values.subDepartmentId ?? null,
        employeeId: values.employeeId ?? null,
        folderId: values.folderId ?? null,
        files: fileList
          .filter((f) => f.originFileObj)
          .map((f) => f.originFileObj),
      };

      setPublishing(true);
      
      let response;
      if (editingItem) {
        response = await editVideoLesson(editingItem.id, payload);
        message.success("Видеоурок обновлен!");
      } else {
        response = await addVideoLesson(payload);
        if (response?.id) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          message.success("Видеоурок опубликован!");
        }
      }
      
      await fetchVideoLessons();
      await fetchAllFolders();
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
    return subdepartments?.find((s) => Number(s.id) === Number(id))?.name || "Без отдела";
  };

  const getEmployeeName = (id) => {
    if (!id) return "Неизвестный";
    const emp = employees?.find((e) => Number(e.id) === Number(id));
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

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error("Введите название папки");
      return;
    }
    
    try {
      await createNewFolder({
        name: folderName.trim(),
      });
      setFolderName("");
      setShowFolderModal(false);
      message.success(`Папка "${folderName}" создана!`);
      await fetchAllFolders();
    } catch (error) {
      message.error("Ошибка создания папки");
      console.error(error);
    }
  };

  const handleEditFolder = async () => {
    if (!folderName.trim()) {
      message.error("Введите название папки");
      return;
    }
    
    try {
      await updateFolder(editingFolder.id, {
        name: folderName.trim(),
      });
      setFolderName("");
      setEditingFolder(null);
      setShowFolderModal(false);
      message.success(`Папка переименована!`);
      await fetchAllFolders();
    } catch (error) {
      message.error("Ошибка обновления папки");
      console.error(error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const folderName = getFolderName(folderId);
      const count = getFolderCount(folderId);
      
      await deleteFolder(folderId);
      
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      
      message.success(`Папка "${folderName}" и ${count} видео удалены`);
      await fetchVideoLessons();
      await fetchAllFolders();
    } catch (error) {
      message.error("Ошибка удаления папки");
      console.error(error);
    }
  };

  const handleFolderSelect = (folderId) => {
    setSelectedFolderId(selectedFolderId === folderId ? null : folderId);
  };

  const handleRemoveFromFolder = async (videoId) => {
    try {
      await moveVideoToFolder(videoId, null);
      message.success("Видео удалено из папки");
      await fetchVideoLessons();
      await fetchAllFolders();
    } catch (error) {
      message.error("Ошибка удаления из папки");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchAllFolders();
      await fetchVideoLessons();
      message.success("Данные обновлены");
    } catch (error) {
      message.error("Ошибка обновления");
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
        <Button type="primary" onClick={handleRefresh} style={{ marginTop: 20, background: "#1890ff" }}>
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

      {/* Шапка */}
      <div style={{ 
        background: "#fafafa", 
        borderRadius: 12, 
        padding: "20px 24px",
        marginBottom: 24,
        border: "1px solid #f0f0f0"
      }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Flex align="center" gap={12}>
              <Title level={4} style={{ margin: 0, color: "#1a1a1a" }}>
                🎬 Видеоуроки
              </Title>
            </Flex>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {selectedFolderId 
                ? `${getFolderCount(selectedFolderId)} файлов в папке "${getFolderName(selectedFolderId)}"`
                : `${displayedVideos.length} файлов всего`
              }
            </Text>
          </div>
          <Space size="middle" wrap>
            <Button 
              icon={<FolderOutlined />}
              onClick={() => {
                setEditingFolder(null);
                setFolderName("");
                setShowFolderModal(true);
              }}
            >
              Создать папку
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              style={{ 
                background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                border: "none",
                fontWeight: "bold"
              }}
            >
              Добавить файл
            </Button>
          </Space>
        </Flex>
      </div>

      {/* Папки */}
      {allFoldersList.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#999" }}>
            Все папок: {allFoldersList.length}
          </div>
          <Flex wrap="wrap" gap={12}>
            {allFoldersList.map(folder => {
              const isSelected = Number(selectedFolderId) === Number(folder.id);
              const count = getFolderCount(folder.id);
              
              return (
                <Tag
                  key={folder.id}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    Modal.confirm({
                      title: `Удалить папку "${folder.name}"?`,
                      content: `В папке ${count} файлов. Они тоже будут удалены.`,
                      okText: "Да, удалить",
                      cancelText: "Отмена",
                      okButtonProps: { danger: true },
                      onOk: () => handleDeleteFolder(folder.id),
                    });
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: 14,
                    borderRadius: 20,
                    cursor: "pointer",
                    background: isSelected ? "#1890ff" : "white",
                    color: isSelected ? "white" : "#666",
                    border: isSelected ? "none" : "1px solid #d9d9d9",
                    transition: "all 0.3s",
                    fontWeight: isSelected ? "bold" : "normal",
                  }}
                  onClick={() => handleFolderSelect(folder.id)}
                >
                  <FolderOutlined style={{ marginRight: 6 }} />
                  {folder.name}
                  <Badge 
                    count={count} 
                    style={{ 
                      marginLeft: 8,
                      background: isSelected ? "rgba(255,255,255,0.3)" : "#f0f0f0",
                      color: isSelected ? "white" : "#666",
                    }}
                  />
                  <EditOutlined 
                    style={{ 
                      marginLeft: 8, 
                      fontSize: 12,
                      opacity: 0.7
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFolder(folder);
                      setFolderName(folder.name);
                      setShowFolderModal(true);
                    }}
                  />
                </Tag>
              );
            })}
          </Flex>
        </div>
      ) : (
        <div style={{ marginBottom: 24, padding: "20px", background: "#fafafa", borderRadius: 12, textAlign: "center" }}>
          <Text type="secondary">Нет созданных папок</Text>
          <br />
          <Button 
            type="dashed" 
            icon={<FolderOutlined />}
            onClick={() => {
              setEditingFolder(null);
              setFolderName("");
              setShowFolderModal(true);
            }}
            style={{ marginTop: 8 }}
          >
            Создать первую папку
          </Button>
        </div>
      )}

      {/* Файлы */}
      <AnimatePresence>
        {displayedVideos.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Empty 
              description={
                selectedFolderId 
                  ? `В папке "${getFolderName(selectedFolderId)}" нет файлов`
                  : "Нет файлов. Создайте первый файл!"
              } 
              style={{ marginTop: 60 }}
            >
              <Button type="primary" onClick={() => openModal()} style={{ background: "#1890ff" }}>
                {selectedFolderId ? "Добавить файл в папку" : "Создать первый файл"}
              </Button>
            </Empty>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {displayedVideos.map((item) => {
              const videoFiles = getVideoFiles(item);

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
                      <Tooltip title="Удалить из папки" key="remove">
                        <span 
                          onClick={() => {
                            if (item.folderId) {
                              Modal.confirm({
                                title: "Удалить файл из папки?",
                                content: "Файл останется в общем списке",
                                okText: "Да",
                                cancelText: "Отмена",
                                onOk: () => handleRemoveFromFolder(item.id),
                              });
                            } else {
                              message.info("Файл не привязан к папке");
                            }
                          }}
                        >
                          <FolderOutlined style={{ fontSize: 18, color: item.folderId ? "#faad14" : "#d9d9d9" }} />
                        </span>
                      </Tooltip>,
                      <Tooltip title="Удалить" key="delete">
                        <Popconfirm
                          title="Удалить файл?"
                          description="Это действие нельзя отменить"
                          okText="Да"
                          cancelText="Отмена"
                          okButtonProps={{ danger: true }}
                          onConfirm={async () => {
                            await removeVideoLesson(item.id);
                            await fetchVideoLessons();
                            await fetchAllFolders();
                            message.success("Файл удален");
                          }}
                        >
                          <DeleteOutlined style={{ fontSize: 18, color: "#ff4d4f" }} />
                        </Popconfirm>
                      </Tooltip>,
                    ]}
                  >
                    <Flex vertical gap={12}>
                      <div>
                        <Flex justify="space-between" align="start" wrap="wrap" gap={8}>
                          <Title level={4} style={{ margin: 0 }}>
                            {item.title}
                          </Title>
                          {item.folderId && (
                            <Tag icon={<FolderOutlined />} color="blue" style={{ fontSize: 12 }}>
                              {getFolderName(item.folderId)}
                            </Tag>
                          )}
                        </Flex>
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

                      {videoFiles.length > 0 && (
                        <div>
                          <Divider style={{ margin: "12px 0" }} />
                          <Flex wrap gap={16}>
                            {videoFiles.map((filePath, index) => {
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
                                    width: 200,
                                    cursor: "pointer",
                                    border: "1px solid #f0f0f0",
                                  }}
                                  bodyStyle={{ padding: 12 }}
                                  onClick={() => handleFileClick(filePath)}
                                >
                                  <Flex vertical align="center" gap={8}>
                                    <div
                                      style={{
                                        width: "100%",
                                        height: 140,
                                        background: getFileBackground(type),
                                        borderRadius: 8,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                      }}
                                    >
                                      {getFileIcon(type)}
                                      <span style={{ 
                                        fontSize: 12, 
                                        color: type === "video" ? "#fff" : "#666" 
                                      }}>
                                        {getFileTypeName(type)}
                                      </span>
                                    </div>

                                    <Tooltip title={fileName}>
                                      <Text ellipsis style={{ fontSize: 13, maxWidth: 180, textAlign: "center" }}>
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
        title={editingItem ? "Редактировать файл" : "Новый файл"}
        open={open}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Отмена
          </Button>,
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
            <Input.TextArea placeholder="Описание файла..." autoSize={{ minRows: 4 }} size="large" />
          </Form.Item>
          <Form.Item name="folderId" label="Папка">
            <Select
              placeholder="Выберите папку"
              allowClear
              options={[
                { label: "Без папки", value: null },
                ...allFoldersList.map((f) => ({
                  label: `${f.name} (${getFolderCount(f.id)})`,
                  value: f.id,
                }))
              ]}
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
                label: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
                value: Number(emp.id),
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
              onPreview={(file) => {
                const url = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
                const type = file.type || "";
                if (type.startsWith("video/")) {
                  setPreview({ open: true, url });
                } else {
                  downloadFile(url, file.name);
                }
              }}
              accept="video/*,.ppt,.pptx,.pps,.ppsx,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Загрузить файл</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модалка создания/редактирования папки */}
      <Modal
        title={editingFolder ? "Редактировать папку" : "Создать папку"}
        open={showFolderModal}
        onCancel={() => {
          setShowFolderModal(false);
          setFolderName("");
          setEditingFolder(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowFolderModal(false);
            setFolderName("");
            setEditingFolder(null);
          }}>
            Отмена
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={editingFolder ? handleEditFolder : handleCreateFolder}
            style={{ background: "#1890ff" }}
            loading={loadingFolders}
          >
            {editingFolder ? "Сохранить" : "Создать"}
          </Button>,
        ]}
      >
        <Input
          placeholder="Введите название папки"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onPressEnter={editingFolder ? handleEditFolder : handleCreateFolder}
          size="large"
          prefix={<FolderOutlined style={{ color: "#1890ff" }} />}
          autoFocus
        />
        <div style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
          {editingFolder ? "Введите новое название для папки" : "Введите название для новой папки"}
        </div>
      </Modal>

      {/* Превью видео */}
      <Modal
        open={preview.open}
        footer={null}
        onCancel={() => setPreview({ open: false, url: "" })}
        centered
        width={860}
        bodyStyle={{
          padding: 0,
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
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
      </Modal>
    </div>
  );
};