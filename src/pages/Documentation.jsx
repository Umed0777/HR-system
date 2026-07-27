// src/pages/Documentation.jsx
import { useEffect, useState } from "react";
import { useDocumentationStore } from "../store/useDocumentation";
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
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FolderOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API;

// Папки которые нужно исключить из Документации
const EXCLUDED_FOLDERS = ["ВидеоУрок", "видеоурок", "Видеоурок"];

const buildFullUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${BASE_URL}${path}`;
};

export const Documentation = () => {
  const {
    documents,
    allFolders,
    fetchDocuments,
    fetchAllFolders,
    addDocument,
    editDocument,
    removeDocument,
    createNewFolder,
    updateFolder,
    deleteFolder,
    moveDocumentToFolder,
    loading,
    error,
  } = useDocumentationStore();

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
    type: "document",
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
      console.log("🔄 Documentation - Загрузка данных...");
      setLoadingFolders(true);
      try {
        await fetchSubDepartments();
        await fetchEmployee();
        await fetchAllFolders();
        await fetchDocuments();
        console.log("✅ Documentation - Данные загружены");
      } catch (error) {
        console.error("❌ Ошибка загрузки:", error);
        message.error("Ошибка загрузки данных");
      } finally {
        setLoadingFolders(false);
      }
    };
    loadData();
  }, []);

  // Безопасная проверка
  const allDocs = Array.isArray(documents) ? documents : [];
  const allFoldersList = Array.isArray(allFolders) ? allFolders : [];

  // ФИЛЬТРУЕМ папки - исключаем "ВидеоУрок"
  const filteredFolders = allFoldersList.filter(folder => {
    const isExcluded = EXCLUDED_FOLDERS.some(excluded => 
      folder.name?.toLowerCase() === excluded.toLowerCase()
    );
    return !isExcluded;
  });

  // ФИЛЬТРУЕМ документы - исключаем все, что в папке "ВидеоУрок"
  const filteredDocuments = allDocs.filter(doc => {
    // Если у документа нет folderId - показываем
    if (!doc.folderId) return true;
    
    // Находим папку документа
    const folder = allFoldersList.find(f => Number(f.id) === Number(doc.folderId));
    
    // Если папка не найдена - показываем
    if (!folder) return true;
    
    // Проверяем, не является ли папка исключенной
    const isExcluded = EXCLUDED_FOLDERS.some(excluded => 
      folder.name?.toLowerCase() === excluded.toLowerCase()
    );
    
    return !isExcluded;
  });

  const getFilteredDocumentsByFolder = () => {
    if (!selectedFolderId) {
      return filteredDocuments;
    }
    return filteredDocuments.filter(doc => Number(doc.folderId) === Number(selectedFolderId));
  };

  const displayedDocuments = getFilteredDocumentsByFolder();

  const getFolderName = (id) => {
    if (!id) return "Без папки";
    const folder = filteredFolders.find(f => Number(f.id) === Number(id));
    return folder ? folder.name : "Неизвестная папка";
  };

  const getFolderCount = (folderId) => {
    return filteredDocuments.filter(doc => Number(doc.folderId) === Number(folderId)).length;
  };

  const getFileType = (filePath) => {
    if (!filePath || typeof filePath !== "string") return "document";
    if (/\.(pdf)$/i.test(filePath)) return "pdf";
    if (/\.(doc|docx)$/i.test(filePath)) return "word";
    if (/\.(xls|xlsx)$/i.test(filePath)) return "excel";
    if (/\.(ppt|pptx|pps|ppsx)$/i.test(filePath)) return "powerpoint";
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(filePath)) return "image";
    if (/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(filePath)) return "video";
    return "document";
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
    if (!filePath || typeof filePath !== "string") return "документ";
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
      case "pdf":
        return <FilePdfOutlined style={{ ...iconStyle, color: "#ee3a43" }} />;
      case "word":
        return <FileWordOutlined style={{ ...iconStyle, color: "#2b5797" }} />;
      case "excel":
        return <FileExcelOutlined style={{ ...iconStyle, color: "#217346" }} />;
      case "powerpoint":
        return <FilePptOutlined style={{ ...iconStyle, color: "#d83b01" }} />;
      case "image":
        return <FileOutlined style={{ ...iconStyle, color: "#52c41a" }} />;
      case "video":
        return <FileOutlined style={{ ...iconStyle, color: "#1890ff" }} />;
      default:
        return <FileOutlined style={{ ...iconStyle, color: "#faad14" }} />;
    }
  };

  const getFileTypeName = (type) => {
    const names = {
      pdf: "PDF",
      word: "Word",
      excel: "Excel",
      powerpoint: "PowerPoint",
      image: "Изображение",
      video: "Видео",
    };
    return names[type] || "Документ";
  };

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

  const handleUploadPreview = (file) => {
    const url = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
    const isVideo = file.type?.startsWith("video") || /\.(mp4|webm|ogg)$/i.test(file.name || "");
    const isImage = file.type?.startsWith("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "");

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
        response = await editDocument(editingItem.id, payload);
        message.success("Документ обновлен!");
      } else {
        response = await addDocument(payload);
        if (response?.id) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          message.success("Документ опубликован!");
        }
      }
      
      await fetchDocuments();
      await fetchAllFolders();
      closeModal();
    } catch (err) {
      console.error("❌ Documentation - Ошибка:", err);
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
    
    // Запрещаем создание папки "ВидеоУрок"
    if (EXCLUDED_FOLDERS.some(excluded => folderName.trim().toLowerCase() === excluded.toLowerCase())) {
      message.error("Название папки занято");
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
    
    // Запрещаем переименование в "ВидеоУрок"
    if (EXCLUDED_FOLDERS.some(excluded => folderName.trim().toLowerCase() === excluded.toLowerCase())) {
      message.error("Название папки занято");
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
      
      message.success(`Папка "${folderName}" и ${count} документов удалены`);
      await fetchDocuments();
      await fetchAllFolders();
    } catch (error) {
      message.error("Ошибка удаления папки");
      console.error(error);
    }
  };

  const handleFolderSelect = (folderId) => {
    setSelectedFolderId(selectedFolderId === folderId ? null : folderId);
  };

  const handleRemoveFromFolder = async (docId) => {
    try {
      await moveDocumentToFolder(docId, null);
      message.success("Документ удален из папки");
      await fetchDocuments();
      await fetchAllFolders();
    } catch (error) {
      message.error("Ошибка удаления из папки");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchAllFolders();
      await fetchDocuments();
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
        <Button type="primary" onClick={handleRefresh} style={{ marginTop: 20, background: "#52c41a" }}>
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
          colors={["#52c41a", "#73d13d", "#95de64", "#b7eb8f", "#d9f7be"]}
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
                📚 Документация
              </Title>
            </Flex>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {selectedFolderId 
                ? `${getFolderCount(selectedFolderId)} документов в папке "${getFolderName(selectedFolderId)}"`
                : `${displayedDocuments.length} документов всего`
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
                background: "linear-gradient(135deg, #52c41a, #73d13d)",
                border: "none",
                fontWeight: "bold"
              }}
            >
              Добавить документ
            </Button>
          </Space>
        </Flex>
      </div>

      {/* Папки - показываем только отфильтрованные */}
      {filteredFolders.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontSize: 13, color: "#999" }}>
            Все папок: {filteredFolders.length}
          </div>
          <Flex wrap="wrap" gap={12}>
            {filteredFolders.map(folder => {
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
                      content: `В папке ${count} документов. Они тоже будут удалены.`,
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
                    background: isSelected ? "#52c41a" : "white",
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

      {/* Документы */}
      <AnimatePresence>
        {displayedDocuments.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Empty 
              description={
                selectedFolderId 
                  ? `В папке "${getFolderName(selectedFolderId)}" нет документов`
                  : "Нет документов. Создайте первый документ!"
              } 
              style={{ marginTop: 60 }}
            >
              <Button type="primary" onClick={() => openModal()} style={{ background: "#52c41a" }}>
                {selectedFolderId ? "Добавить документ в папку" : "Создать первый документ"}
              </Button>
            </Empty>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {displayedDocuments.map((item) => {
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
                      <Tooltip title="Удалить из папки" key="remove">
                        <span 
                          onClick={() => {
                            if (item.folderId) {
                              Modal.confirm({
                                title: "Удалить документ из папки?",
                                content: "Документ останется в общем списке",
                                okText: "Да",
                                cancelText: "Отмена",
                                onOk: () => handleRemoveFromFolder(item.id),
                              });
                            } else {
                              message.info("Документ не привязан к папке");
                            }
                          }}
                        >
                          <FolderOutlined style={{ fontSize: 18, color: item.folderId ? "#faad14" : "#d9d9d9" }} />
                        </span>
                      </Tooltip>,
                      <Tooltip title="Удалить" key="delete">
                        <Popconfirm
                          title="Удалить документ?"
                          description="Это действие нельзя отменить"
                          okText="Да"
                          cancelText="Отмена"
                          okButtonProps={{ danger: true }}
                          onConfirm={async () => {
                            await removeDocument(item.id);
                            await fetchDocuments();
                            await fetchAllFolders();
                            message.success("Документ удален");
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
                            <Tag icon={<FolderOutlined />} color="green" style={{ fontSize: 12 }}>
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

      {/* Модалка создания/редактирования документа */}
      <Modal
        title={editingItem ? "Редактировать документ" : "Новый документ"}
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
              background: "linear-gradient(135deg, #52c41a, #73d13d)",
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
            <Input.TextArea placeholder="Описание документа..." autoSize={{ minRows: 4 }} size="large" />
          </Form.Item>
          <Form.Item name="folderId" label="Папка">
            <Select
              placeholder="Выберите папку"
              allowClear
              options={[
                { label: "Без папки", value: null },
                ...filteredFolders.map((f) => ({
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
          <Form.Item label="Документы">
            <Upload
              multiple
              listType="picture-card"
              beforeUpload={() => false}
              fileList={fileList}
              onChange={(info) => setFileList(info.fileList)}
              onPreview={handleUploadPreview}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Загрузить документ</div>
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
            style={{ background: "#52c41a" }}
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
          prefix={<FolderOutlined style={{ color: "#52c41a" }} />}
          autoFocus
        />
        <div style={{ marginTop: 12, color: "#999", fontSize: 13 }}>
          {editingFolder ? "Введите новое название для папки" : "Введите название для новой папки"}
        </div>
      </Modal>

      {/* Превью */}
      <Modal
        open={preview.open}
        footer={null}
        onCancel={() => setPreview({ open: false, url: "", type: "document" })}
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
        ) : preview.type === "image" ? (
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
        ) : null}
      </Modal>
    </div>
  );
};