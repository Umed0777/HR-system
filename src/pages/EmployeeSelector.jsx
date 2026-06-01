import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployeeStore } from "../store/useEmployee";
import { 
  Card, Typography, Input, Avatar, Button, Row, Col, ConfigProvider, Spin, Alert, Flex
} from "antd";
import { 
  SearchOutlined, 
  ArrowRightOutlined, 
  UserOutlined, 
  LogoutOutlined,
  HomeOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

export const EmployeeSelector = () => {
  const navigate = useNavigate();
  const { employees, fetchEmployee, loading, error } = useEmployeeStore();
  const [searchText, setSearchText] = useState("");

  useEffect(() => { 
    fetchEmployee(); 
  }, []);

  const filtered = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleLogout = () => {
    // Очищаем localStorage если нужно
    // localStorage.clear();
    navigate("/"); // Переход на главную страницу (HRSystemLayout)
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Spin size="small" tip="Загрузка сотрудников..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: "40px" }}>
        <Alert message="Ошибка" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <ConfigProvider theme={{ 
      token: { 
        borderRadius: 20, 
        colorPrimary: "#ef4444"
      } 
    }}>
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "60px 20px" 
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          
          {/* Кнопка выхода */}
          <Flex justify="flex-end" style={{ marginBottom: 20 }}>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 20,
                height: 40,
                fontWeight: 500
              }}
            >
              Выйти
            </Button>
          </Flex>

          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            style={{ textAlign: 'center', marginBottom: 50 }}
          >
            <Title level={1} style={{ fontWeight: 800, color: 'white', marginBottom: 16 }}>
              Личный кабинет сотрудников
            </Title>
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
              Выберите профиль для просмотра объявлений
            </Text>
            
            <div style={{ marginTop: 32, maxWidth: 450, margin: '32px auto 0' }}>
              <Input 
                size="large" 
                placeholder="Поиск по имени..." 
                prefix={<SearchOutlined style={{ color: '#9ca3af' }} />} 
                onChange={e => setSearchText(e.target.value)}
                style={{ 
                  border: 'none', 
                  height: 54, 
                  borderRadius: 27,
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                allowClear
              />
            </div>
          </motion.div>

          <Row gutter={[24, 24]}>
            {filtered.map((emp, index) => (
              <Col xs={24} sm={12} lg={8} key={emp.id}>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    hoverable 
                    style={{ 
                      borderRadius: 24, 
                      border: 'none', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'white'
                    }}
                    bodyStyle={{ padding: '32px 24px' }}
                  >
                    <Avatar 
                      size={100} 
                      src={emp.profileImagePath ? `http://localhost:5218${emp.profileImagePath}` : null}
                      icon={!emp.profileImagePath && <UserOutlined />}
                      style={{ 
                        background: '#fee2e2', 
                        color: '#ef4444', 
                        fontWeight: 700, 
                        fontSize: 32,
                        marginBottom: 16
                      }}
                    >
                      {!emp.profileImagePath && emp.firstName?.[0]}
                    </Avatar>
                    <Title level={4} style={{ marginTop: 8, marginBottom: 4 }}>{emp.firstName} {emp.lastName}</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>{emp.position || "Сотрудник"}</Text>
                    <Button 
                      type="primary" 
                      shape="round" 
                      block 
                      icon={<ArrowRightOutlined />} 
                      onClick={() => navigate(`/employee/${emp.id}/dashboard`)}
                      style={{ 
                        height: 44,
                        background: "#ef4444",
                        border: "none",
                        fontWeight: 600
                      }}
                    >
                      Войти в кабинет
                    </Button>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', marginTop: 50 }}
            >
              <Card style={{ borderRadius: 24, background: 'rgba(255,255,255,0.9)' }}>
                <Title level={4}>Сотрудник не найден</Title>
                <Text type="secondary">Попробуйте изменить поисковый запрос</Text>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};