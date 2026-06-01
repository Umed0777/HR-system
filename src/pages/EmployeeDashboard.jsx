import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAnnouncementStore } from "../store/useAnnouncement";
import { useEmployeeStore } from "../store/useEmployee";
import { 
  Card, Typography, Avatar, Flex, Button, Row, Col, Divider, Space, message, Empty, Modal 
} from "antd";
import { 
  ArrowLeftOutlined, 
  HeartFilled, 
  HeartOutlined, 
  ClockCircleOutlined, 
  EyeOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  DownloadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import "dayjs/locale/ru";

dayjs.locale("ru");

const { Title, Text, Paragraph } = Typography;
const BASE_URL = "http://localhost:5218";

export const EmployeeDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { announcements, fetchAnnouncements } = useAnnouncementStore();
  const { employees, fetchEmployee } = useEmployeeStore();
  
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [userLikes, setUserLikes] = useState({});
  const [employeeAnnouncements, setEmployeeAnnouncements] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewIsVideo, setPreviewIsVideo] = useState(false);

  // Функции для определения типа файла
  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  const isVideo = (url) => /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
  const isWord = (url) => /\.(doc|docx)$/i.test(url);
  const isExcel = (url) => /\.(xls|xlsx)$/i.test(url);
  const isPowerPoint = (url) => /\.(ppt|pptx|pps|ppsx)$/i.test(url);
  const isPdf = (url) => /\.(pdf)$/i.test(url);

  const getFileType = (url) => {
    if (!url) return 'other';
    if (isImage(url)) return 'image';
    if (isVideo(url)) return 'video';
    if (isWord(url)) return 'word';
    if (isExcel(url)) return 'excel';
    if (isPowerPoint(url)) return 'powerpoint';
    if (isPdf(url)) return 'pdf';
    return 'other';
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'word': return <FileWordOutlined style={{ color: "#2b5797", fontSize: 28 }} />;
      case 'excel': return <FileExcelOutlined style={{ color: "#217346", fontSize: 28 }} />;
      case 'powerpoint': return <FilePptOutlined style={{ color: "#d83b01", fontSize: 28 }} />;
      case 'pdf': return <FilePdfOutlined style={{ color: "#ee3a43", fontSize: 28 }} />;
      case 'image': return <PictureOutlined style={{ color: "#52c41a", fontSize: 28 }} />;
      case 'video': return <VideoCameraOutlined style={{ color: "#1890ff", fontSize: 28 }} />;
      default: return <FileTextOutlined style={{ color: "#faad14", fontSize: 28 }} />;
    }
  };

  const getFileTypeName = (type) => {
    switch(type) {
      case 'word': return "Документ Word";
      case 'excel': return "Таблица Excel";
      case 'powerpoint': return "Презентация PowerPoint";
      case 'pdf': return "PDF документ";
      case 'image': return "Изображение";
      case 'video': return "Видео";
      default: return "Файл";
    }
  };

  const getFileName = (url) => {
    if (!url) return 'файл';
    const parts = url.split('/');
    let fileName = parts[parts.length - 1];
    fileName = decodeURIComponent(fileName);
    if (fileName.length > 50) {
      const ext = fileName.split('.').pop();
      fileName = fileName.substring(0, 47) + '...' + ext;
    }
    return fileName;
  };

  const handlePreview = (url, isVideoFile) => {
    setPreviewUrl(`${BASE_URL}${url}`);
    setPreviewIsVideo(isVideoFile);
    setPreviewOpen(true);
  };

  // Функция для открытия файла в новой вкладке
  const handleOpenFile = (filePath) => {
    const fullUrl = `${BASE_URL}${filePath}`;
    window.open(fullUrl, '_blank');
    // message.info("Файл открывается в новой вкладке");
  };

  useEffect(() => {
    fetchEmployee();
    fetchAnnouncements();
    
    const savedLikes = localStorage.getItem(`likes_employee_${id}`);
    if (savedLikes) setUserLikes(JSON.parse(savedLikes));
  }, [id]);

  useEffect(() => {
    const emp = employees.find(e => e.id === parseInt(id));
    if (emp) setCurrentEmployee(emp);
  }, [id, employees]);

  useEffect(() => {
    if (announcements.length > 0 && currentEmployee) {
      const filtered = announcements.filter(ann => ann.employeeId === currentEmployee.id);
      setEmployeeAnnouncements(filtered);
    }
  }, [announcements, currentEmployee]);

  const toggleLike = (annId) => {
    const newLikes = { ...userLikes, [annId]: !userLikes[annId] };
    setUserLikes(newLikes);
    localStorage.setItem(`likes_employee_${id}`, JSON.stringify(newLikes));
    
    if (newLikes[annId]) {
      message.success("Сохранено в избранное ❤️");
    } else {
      message.info("Убрано из избранного");
    }
  };

  if (!currentEmployee) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "40px 20px", textAlign: "center" }}>
        <Title level={3}>Загрузка...</Title>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/select-employee")}
            style={{ 
              borderRadius: 12, 
              fontWeight: 600,
              background: "#ef4444",
              color: "white",
              border: "none",
              height: 40,
              padding: "0 20px"
            }}
          >
            К списку сотрудников
          </Button>
          
          <Flex align="center" gap={12}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{currentEmployee.firstName} {currentEmployee.lastName}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{currentEmployee.position}</Text>
            </div>
            <Avatar 
              src={currentEmployee.profileImagePath ? `${BASE_URL}${currentEmployee.profileImagePath}` : null} 
              style={{ background: '#ef4444' }}
              size={48}
            >
              {currentEmployee.firstName?.[0]}
            </Avatar>
          </Flex>
        </Flex>

        <Divider style={{ margin: '0 0 40px 0' }} />

        <Flex justify="space-between" align="center" style={{ marginBottom: 30 }}>
          <Title level={2} style={{ margin: 0 }}>Мои объявления</Title>
        </Flex>

        {employeeAnnouncements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Empty 
              description={
                <span>
                  У вас пока нет объявлений<br />
                  <Text type="secondary" style={{ fontSize: 14 }}>Нет созданных объявлений</Text>
                </span>
              }
              style={{ marginTop: 100 }}
            />
          </motion.div>
        ) : (
          <Row gutter={[24, 24]}>
            {employeeAnnouncements.map((ann, index) => {
              const fileType = getFileType(ann.profileImagePath);
              const hasMedia = ann.profileImagePath;
              
              return (
                <Col xs={24} key={ann.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      style={{ 
                        borderRadius: 24, 
                        border: 'none', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease'
                      }}
                      bodyStyle={{ padding: 24 }}
                      hoverable
                    >
                      <Flex gap={24} align="start" wrap="wrap">
                        {hasMedia && (
                          <div style={{ 
                            width: 200, 
                            minWidth: 200,
                            borderRadius: 20, 
                            overflow: 'hidden', 
                            background: '#f3f4f6', 
                            flexShrink: 0,
                            cursor: fileType === 'image' || fileType === 'video' ? 'pointer' : 'default'
                          }}>
                            {fileType === 'image' && (
                              <img 
                                src={`${BASE_URL}${ann.profileImagePath}`} 
                                style={{ width: '100%', height: 150, objectFit: 'cover' }} 
                                alt="announcement"
                                onClick={() => handlePreview(ann.profileImagePath, false)}
                              />
                            )}
                            {fileType === 'video' && (
                              <div 
                                style={{ position: 'relative', height: 150, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => handlePreview(ann.profileImagePath, true)}
                              >
                                <video 
                                  src={`${BASE_URL}${ann.profileImagePath}`}
                                  style={{ width: '100%', height: 150, objectFit: 'cover' }}
                                  preload="metadata"
                                />
                                <VideoCameraOutlined style={{ position: 'absolute', fontSize: 48, color: 'white', opacity: 0.8 }} />
                              </div>
                            )}
                            {(fileType === 'word' || fileType === 'excel' || fileType === 'powerpoint' || fileType === 'pdf' || fileType === 'other') && (
                              <div style={{ 
                                height: 150, 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: '#f0f0f0'
                              }}>
                                {getFileIcon(fileType)}
                                <Text style={{ marginTop: 8, fontSize: 12 }}>{getFileTypeName(fileType)}</Text>
                                <Button 
                                  type="primary"
                                  icon={<DownloadOutlined />}
                                  onClick={() => handleOpenFile(ann.profileImagePath)}
                                  size="small"
                                  style={{
                                    marginTop: 8,
                                    background: "#ef4444",
                                    border: "none"
                                  }}
                                >
                                  Скачать
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div style={{ flex: 1, minWidth: 280 }}>
                          <Flex justify="space-between" align="start">
                            <div>
                              <Title level={4} style={{ margin: 0 }}>{ann.title}</Title>
                              <Space style={{ marginTop: 4 }}>
                                <ClockCircleOutlined style={{ color: '#9ca3af' }} />
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                  {dayjs(ann.createdAt).format('D MMMM YYYY')}
                                </Text>
                              </Space>
                            </div>
                            
                            <Button 
                              shape="circle" 
                              size="large"
                              icon={userLikes[ann.id] ? <HeartFilled /> : <HeartOutlined />}
                              onClick={() => toggleLike(ann.id)}
                              style={{ 
                                border: 'none', 
                                background: userLikes[ann.id] ? '#fee2e2' : '#f3f4f6',
                                color: userLikes[ann.id] ? '#ef4444' : undefined
                              }}
                            />
                          </Flex>
                          
                          <Paragraph style={{ marginTop: 16, fontSize: 15, color: '#4b5563', maxWidth: 800 }}>
                            {ann.content}
                          </Paragraph>
                          
                          {hasMedia && fileType !== 'image' && fileType !== 'video' && (
                            <div style={{ marginTop: 12 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {getFileTypeName(fileType)}: {ann.profileImagePath?.split('/').pop()}
                              </Text>
                            </div>
                          )}
                        </div>
                      </Flex>
                    </Card>
                  </motion.div>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Modal для просмотра изображений и видео */}
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        centered
        width="auto"
        style={{ maxWidth: '90vw' }}
        bodyStyle={{ padding: 0, background: '#000', borderRadius: 12 }}
      >
        {previewIsVideo ? (
          <video
            src={previewUrl}
            controls
            autoPlay
            style={{
              width: '100%',
              maxHeight: '80vh',
              borderRadius: 12
            }}
          />
        ) : (
          <img
            src={previewUrl}
            style={{
              width: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 12
            }}
            alt="preview"
          />
        )}
      </Modal>
    </div>
  );
};