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
  FileTextOutlined,
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
  const { 
    folders, 
    fetchFolders, 
    addFolder,
    updateFolder,
    deleteFolder,
    loading: folderLoading 
  } = useFolderStore();
  
  useEffect(() => {
    fetchFolders();
  }, []);

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
    isVideo: false,
  });
  const [fileList, setFileList] = useState([]);
  const [likedItems, setLikedItems] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [highlightCard, setHighlightCard] = useState(null);

  // Скачивание файла
  const downloadFile = (url, fileName) => {
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const link = document.createElement("a");
    link.href = fullUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Определение типа файла - проверяем и URL и имя файла
  const getFileType = (file) => {
    if (!file) return "other";
    
    // Если file это объект с свойством path или url
    const filePath = typeof file === 'string' ? file : (file.path || file.url || file.filePath || '');
    
    if (!filePath) return "other";
    
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i.test(filePath)) return "image";
    if (/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/i.test(filePath)) return "video";
    if (/\.(doc|docx)$/i.test(filePath)) return "word";
    if (/\.(xls|xlsx)$/i.test(filePath)) return "excel";
    if (/\.(ppt|pptx|pps|ppsx)$/i.test(filePath)) return "powerpoint";
    if (/\.(pdf)$/i.test(filePath)) return "pdf";
    return "other";
  };

  // Получение URL файла
  const getFileUrl = (file) => {
    if (!file) return "";
    if (typeof file === 'string') return file;
    return file.path || file.url || file.filePath || "";
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "word": return <FileWordOutlined style={{ color: "#2b5797", fontSize: 48 }} />;
      case "excel": return <FileExcelOutlined style={{ color: "#217346", fontSize: 48 }} />;
      case "powerpoint": return <FilePptOutlined style={{ color: "#d83b01", fontSize: 48 }} />;
      case "pdf": return <FilePdfOutlined style={{ color: "#ee3a43", fontSize: 48 }} />;
      case "image": return <PictureOutlined style={{ color: "#52c41a", fontSize: 48 }} />;
      case "video": return <VideoCameraOutlined style={{ color: "#1890ff", fontSize: 48 }} />;
      default: return <FileOutlined style={{ color: "#faad14", fontSize: 48 }} />;
    }
  };

  const getFileTypeName = (type) => {
    const names = {
      word: "Документ Word",
      excel: "Таблица Excel",
      powerpoint: "Презентация",
      pdf: "PDF документ",
      image: "Изображение",
      video: "Видео",
    };
    return names[type] || "Файл";
  };

  const getFileName = (file) => {
    if (!file) return "файл";
    const filePath = typeof file === 'string' ? file : (file.path || file.url || file.filePath || '');
    if (!filePath) return "файл";
    
    const parts = filePath.split("/");
    let fileName = parts[parts.length - 1];
    try { fileName = decodeURIComponent(fileName); } catch (e) {}
    if (fileName.length > 30) {
      const ext = fileName.split(".").pop();
      fileName = fileName.substring(0, 27) + "..." + ext;
    }
    return fileName;
  };

  const handlePreview = (file) => {
    const url = file.url || URL.createObjectURL(file.originFileObj);
    const isVideoFile = file.type?.startsWith("video") || /\.(mp4|webm|ogg)$/i.test(file.name);
    const isImageFile = file.type?.startsWith("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    if (isImageFile || isVideoFile) {
      setPreview({ open: true, url, isVideo: isVideoFile });
    } else {
      const fullUrl = file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
      downloadFile(fullUrl, file.name);
    }
  };

  const handleFileClick = (file) => {
    const fileUrl = getFileUrl(file);
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_URL}${fileUrl}`;
    const fileName = getFileName(file);
    const type = getFileType(file);

    if (type === "image") {
      setPreview({ open: true, url: fullUrl, isVideo: false });
    } else if (type === "video") {
      setPreview({ open: true, url: fullUrl, isVideo: true });
    } else {
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
        folderId: item?.folderId ?? null,
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
      const title = values.title || "";
      const content = values.content || "";
      const subDepartmentId = values.subDepartmentId ?? null;
      const employeeId = values.employeeId ?? null;
      const folderId = values.folderId ?? null;
      const files = fileList.map((f) => f.originFileObj).filter(Boolean);

      if (!title) {
        message.error("Введите заголовок объявления");
        return;
      }

      const payload = { title, content, subDepartmentId, employeeId, files, folderId };

      setPublishing(true);

      if (editingItem) {
        await editAnnouncement(editingItem.id, payload);
        message.success("Объявление обновлено!");
      } else {
        const response = await addAnnouncement(payload);
        if (response?.id) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          message.success("Объявление опубликовано! 🎉");
        }
      }

      await fetchAnnouncements();
      closeModal();
    } catch (err) {
      console.error("Ошибка:", err);
      message.error(`Ошибка: ${err.message || "Неизвестная ошибка"}`);
    } finally {
      setPublishing(false);
    }
  };

  const toggleLike = (id) => {
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }));
    if (!likedItems[id]) {
      message.success("❤️ Лайк поставлен!");
    } else {
      message.info("Лайк убран");
    }
  };

  const getSubDepartmentName = (id) => {
    if (!id) return "Без отдела";
    const found = subdepartments.find(s => Number(s.id) === Number(id));
    return found?.name || "Без отдела";
  };

  const getEmployeeName = (id) => {
    if (!id) return "Неизвестный";
    const emp = employees.find(e => Number(e.id) === Number(id));
    return emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email || "Неизвестный" : "Неизвестный";
  };

  // Функции для папок
  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      message.error("Введите название папки");
      return;
    }
    try {
      await addFolder({ name: folderName.trim() });
      await fetchFolders();
      message.success("Папка создана!");
      setFolderName("");
      setOpenFolder(false);
    } catch (error) {
      message.error("Ошибка создания папки");
    }
  };

  const handleEditFolder = async () => {
    if (!editingFolder || !folderName.trim()) {
      message.error("Введите название папки");
      return;
    }
    try {
      await updateFolder(editingFolder.id, { name: folderName.trim() });
      await fetchFolders();
      message.success("Папка обновлена!");
      setFolderName("");
      setEditingFolder(null);
      setOpenEditFolder(false);
    } catch (error) {
      message.error("Ошибка обновления папки");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const hasAnnouncements = announcements.some(item => item.folderId === folderId);
      if (hasAnnouncements) {
        message.warning("Нельзя удалить папку с объявлениями");
        return;
      }
      await deleteFolder(folderId);
      await fetchFolders();
      message.success("Папка удалена!");
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    } catch (error) {
      message.error("Ошибка удаления папки");
    }
  };

  const openEditFolderModal = (folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setOpenEditFolder(true);
  };

  const getFilteredAnnouncements = () => {
    if (selectedFolderId === null) return announcements;
    return announcements.filter(item => item.folderId === selectedFolderId);
  };

  const getFolderStats = (folderId) => {
    return announcements.filter(item => item.folderId === folderId).length;
  };

  const filteredAnnouncements = getFilteredAnnouncements();

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <Skeleton active avatar paragraph={{ rows: 3 }} />
        <Skeleton active avatar paragraph={{ rows: 3 }} style={{ marginTop: 20 }} />
        <Skeleton active avatar paragraph={{ rows: 3 }} style={{ marginTop: 20 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        <Empty description={<span style={{ color: "#ff4d4f" }}>Ошибка: {error}</span>} />
        <Button type="primary" onClick={fetchAnnouncements} style={{ marginTop: 20, background: "#ff4b2b" }}>
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
          colors={["#ff416c", "#ff4b2b", "#ff6b4a", "#ff8c6b", "#ffad8c"]}
        />
      )}

      <Flex justify="space-between" align="center" style={{ marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#1a1a1a" }}>Объявления</Title>
          <Text type="secondary">
            {selectedFolderId !== null 
              ? `В папке: ${folders.find(f => f.id === selectedFolderId)?.name || '...'} (${filteredAnnouncements.length})`
              : `Всего ${announcements.length} объявлений`}
          </Text>
        </div>

        <Flex gap={10} align="center" wrap>
          <Button onClick={() => setOpenFolder(true)} icon={<FolderOutlined />}>
            Создать папку
          </Button>
          {selectedFolderId !== null && (
            <Button onClick={() => setSelectedFolderId(null)} icon={<FolderOpenOutlined />}>
              Все
            </Button>
          )}
          <Button
            type="primary"
            style={{
              background: "linear-gradient(135deg, #ff416c, #ff4b2b)",
              border: "none",
              boxShadow: "0 4px 12px rgba(255, 75, 43, 0.3)",
              fontWeight: "bold",
              height: 40,
              padding: "0 24px",
              borderRadius: 20,
            }}
            onClick={() => openModal()}
          >
            Добавить
          </Button>
        </Flex>
      </Flex>

      {/* Список папок */}
      {folders.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <Flex gap={12} wrap>
            <Card
              style={{ 
                cursor: 'pointer',
                minWidth: 150,
                border: selectedFolderId === null ? '2px solid #ff4b2b' : '1px solid #f0f0f0',
                background: selectedFolderId === null ? '#fff5f5' : 'white'
              }}
              onClick={() => setSelectedFolderId(null)}
              hoverable
            >
              <Flex vertical align="center" gap={4}>
                <FolderOpenOutlined style={{ fontSize: 32, color: '#ff4b2b' }} />
                <Text strong>Все</Text>
                <Tag color="blue">{announcements.length}</Tag>
              </Flex>
            </Card>
            
            {folders.map((folder) => (
              <Card
                key={folder.id}
                style={{ 
                  cursor: 'pointer',
                  minWidth: 150,
                  border: selectedFolderId === folder.id ? '2px solid #ff4b2b' : '1px solid #f0f0f0',
                  background: selectedFolderId === folder.id ? '#fff5f5' : 'white'
                }}
                hoverable
                bodyStyle={{ padding: '16px' }}
              >
                <Flex vertical align="center" gap={4}>
                  <div onClick={() => setSelectedFolderId(folder.id)} style={{ textAlign: 'center', width: '100%' }}>
                    <FolderOutlined style={{ fontSize: 32, color: '#faad14' }} />
                    <Text strong style={{ display: 'block' }}>{folder.name}</Text>
                    <Tag color="blue">{getFolderStats(folder.id)}</Tag>
                  </div>
                  <Flex gap={4}>
                    <Tooltip title="Редактировать папку">
                      <Button 
                        size="small" 
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditFolderModal(folder);
                        }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Удалить папку?"
                      description={`Удалить "${folder.name}"?`}
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
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
            ))}
          </Flex>
        </div>
      )}

      <AnimatePresence>
        {filteredAnnouncements.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Empty 
              description={selectedFolderId !== null ? "В папке нет объявлений" : "Нет объявлений"} 
              style={{ marginTop: 100 }}
            >
              <Button type="primary" onClick={() => openModal()} style={{ background: "#ff4b2b" }}>
                Создать объявление
              </Button>
            </Empty>
          </motion.div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {filteredAnnouncements.map((item) => {
              // Получаем файлы из item
              const fileUrls = item.files || [];
              const folder = folders.find(f => f.id === item.folderId);
              
              return (
                <Card
                  key={item.id}
                  id={`announcement-${item.id}`}
                  style={{
                    borderRadius: 16,
                    boxShadow: highlightCard === item.id 
                      ? "0 0 0 3px #ff4b2b, 0 8px 24px rgba(255,75,43,0.3)" 
                      : "0 4px 12px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  actions={[
                    <Tooltip title="Лайк">
                      <span onClick={() => toggleLike(item.id)}>
                        {likedItems[item.id] ? (
                          <HeartFilled style={{ color: "#ff4d4f", fontSize: 18 }} />
                        ) : (
                          <HeartOutlined style={{ fontSize: 18 }} />
                        )}
                      </span>
                    </Tooltip>,
                    <Tooltip title="Редактировать">
                      <EditOutlined style={{ fontSize: 18 }} onClick={() => openModal(item)} />
                    </Tooltip>,
                    <Tooltip title="Удалить">
                      <DeleteOutlined 
                        style={{ fontSize: 18, color: "#ff4d4f" }} 
                        onClick={() => {
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
                          });
                        }}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Flex vertical gap={12}>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>{item.title}</Title>
                      <Flex gap={8} style={{ marginTop: 8, flexWrap: "wrap" }}>
                        <Tag icon={<UserOutlined />} color="blue">
                          {getEmployeeName(item.employeeId)}
                        </Tag>
                        <Tag icon={<CalendarOutlined />} color="green">
                          {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
                        </Tag>
                        <Tag color="orange">{getSubDepartmentName(item.subDepartmentId)}</Tag>
                        {folder && (
                          <Tag color="gold" icon={<FolderOutlined />}>
                            {folder.name}
                          </Tag>
                        )}
                      </Flex>
                    </div>

                    <Text style={{ fontSize: 15 }}>{item.content}</Text>

                    {fileUrls.length > 0 && (
                      <div>
                        <Divider style={{ margin: "12px 0" }} />
                        <Flex wrap gap={16}>
                          {fileUrls.map((file, index) => {
                            const filePath = getFileUrl(file);
                            const type = getFileType(file);
                            const fileName = getFileName(file);
                            const fullUrl = filePath.startsWith('http') ? filePath : `${BASE_URL}${filePath}`;
                            
                            return (
                              <Card
                                key={index}
                                size="small"
                                style={{
                                  width: 200,
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  border: "1px solid #f0f0f0",
                                }}
                                hoverable
                                onClick={() => handleFileClick(file)}
                                bodyStyle={{ padding: 12 }}
                              >
                                <Flex vertical align="center" gap={8}>
                                  {type === "image" ? (
                                    <div style={{ 
                                      width: "100%", 
                                      height: 140, 
                                      overflow: "hidden",
                                      borderRadius: 8,
                                      background: "#fafafa",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}>
                                      <img
                                        src={fullUrl}
                                        alt={fileName}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const parent = e.target.parentElement;
                                          parent.innerHTML = `
                                            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;">
                                              ${getFileIcon('image')}
                                              <span style="font-size:12px;color:#999;">Изображение</span>
                                            </div>
                                          `;
                                        }}
                                      />
                                    </div>
                                  ) : type === "video" ? (
                                    <div style={{ 
                                      width: "100%", 
                                      height: 140, 
                                      background: "#000",
                                      borderRadius: 8,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexDirection: "column",
                                      gap: 8
                                    }}>
                                      <VideoCameraOutlined style={{ fontSize: 48, color: "#fff" }} />
                                      <span style={{ fontSize: 12, color: "#fff" }}>Видео</span>
                                    </div>
                                  ) : (
                                    <div style={{ 
                                      width: "100%", 
                                      height: 140, 
                                      background: "#fafafa",
                                      borderRadius: 8,
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 8
                                    }}>
                                      {getFileIcon(type)}
                                      <span style={{ fontSize: 12, color: "#666" }}>
                                        {getFileTypeName(type)}
                                      </span>
                                    </div>
                                  )}
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
              );
            })}
          </Space>
        )}
      </AnimatePresence>

      {/* Модалка объявления */}
      <Modal
        title={editingItem ? "Редактировать объявление" : "Новое объявление"}
        open={open}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>Отмена</Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSave}
            loading={publishing}
            style={{ background: "linear-gradient(135deg, #ff416c, #ff4b2b)", border: "none" }}
          >
            {editingItem ? "Сохранить" : "Опубликовать"}
          </Button>,
        ]}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Заголовок" rules={[{ required: true, message: "Введите заголовок" }]}>
            <Input placeholder="Заголовок" size="large" />
          </Form.Item>

          <Form.Item name="content" label="Содержание" rules={[{ required: true, message: "Введите содержание" }]}>
            <Input.TextArea placeholder="Текст..." autoSize={{ minRows: 4 }} size="large" />
          </Form.Item>

          <Form.Item name="subDepartmentId" label="Отдел">
            <Select
              placeholder="Выберите отдел"
              allowClear
              loading={subDeptLoading}
              options={(subdepartments || []).map(s => ({ label: s.name, value: Number(s.id) }))}
            />
          </Form.Item>

          <Form.Item name="employeeId" label="Сотрудник">
            <Select
              placeholder="Выберите сотрудника"
              allowClear
              loading={employeeLoading}
              options={(employees || []).map(emp => ({
                label: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
                value: Number(emp.id),
              }))}
            />
          </Form.Item>

          <Form.Item name="folderId" label="Папка">
            <Select
              placeholder="Выберите папку"
              allowClear
              options={(folders || []).map(f => ({ label: f.name, value: Number(f.id) }))}
            />
          </Form.Item>

          <Form.Item label="Файлы">
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

      {/* Модалка просмотра */}
      <Modal
        open={preview.open}
        footer={null}
        onCancel={() => setPreview({ open: false, url: "", isVideo: false })}
        centered
        width="auto"
        styles={{ body: { padding: 0, backgroundColor: "#000", borderRadius: 16 } }}
      >
        {preview.isVideo ? (
          <video src={preview.url} controls autoPlay style={{ width: "100%", maxHeight: "80vh", borderRadius: 16 }} />
        ) : (
          <img src={preview.url} style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 16 }} alt="preview" />
        )}
      </Modal>

      {/* Модалка создания папки */}
      <Modal
        title="Создать папку"
        open={openFolder}
        onCancel={() => { setOpenFolder(false); setFolderName(""); }}
        onOk={handleCreateFolder}
      >
        <Input placeholder="Название папки" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
      </Modal>

      {/* Модалка редактирования папки */}
      <Modal
        title="Редактировать папку"
        open={openEditFolder}
        onCancel={() => { setOpenEditFolder(false); setFolderName(""); setEditingFolder(null); }}
        onOk={handleEditFolder}
      >
        <Input placeholder="Название папки" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
      </Modal>
    </div>
  );
};