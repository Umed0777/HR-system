import { Form, Input, Button, message, Card, Typography } from "antd";
import { useAccountStore } from "../store/useAccount";
import { Link } from "react-router-dom";
const { Title, Text } = Typography;
import { useNavigate } from "react-router-dom";
const Login = () => {
    const { loginUser } = useAccountStore();
    const navigate = useNavigate();

  const onFinish = async (values) => {
     console.log("LOGIN VALUES:", values);
    try {
      await loginUser(values);
      message.success("Успешный вход");
      navigate("/");
    } catch {
      message.error("Ошибка входа");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
       background: "linear-gradient(135deg, #fff1f0, #ffccc7)"
      }}
    >
      <Card
        style={{
          width: 380,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 6 }}>
          Вход в систему
        </Title>
        <Text
          type="secondary"
          style={{ display: "block", textAlign: "center", marginBottom: 20 }}
        >
          Введите ваши данные
        </Text>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="userName"
            label="Имя пользователя"
            rules={[{ required: true, message: "Введите имя пользователя" }]}
          >
            <Input placeholder="" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password placeholder="" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              danger
              block
              size="large"
              style={{ borderRadius: 8 }}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
        <Form.Item style={{ textAlign: "center", marginTop: 10 }}>
          <Text>
            Нет аккаунта? <Link to="/register" style={{color: '#f00'}}>Регистрация</Link>
          </Text>
        </Form.Item>
      </Card>
    </div>
  );
};

export default Login;
