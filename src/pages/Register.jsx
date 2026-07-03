import {
  Form,
  Input,
  Button,
  message,
  Card,
  Typography,
  Row,
  Col,
  Flex,
} from "antd";
import { useAccountStore } from "../store/useAccount";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const { Title, Text } = Typography;

const Register = () => {
  const { registerUser, loginUser } = useAccountStore();
  const navigate = useNavigate();
  const onFinish = async (values) => {
    try {
      await registerUser({
        ...values,
        roleId: "",
      });

      await loginUser({
       userName: values.userName,
        password: values.password,
      });

      message.success("Регистрация успешна");
      navigate("/");
    } catch (err) {
  console.log(err.response?.data);
  console.log(err.response);

  message.error(
    err.response?.data?.message ||
    err.response?.data?.title ||
    "Ошибка регистрации"
  );
}
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #fff1f0, #ffccc7)",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 550,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 6 }}>
          Регистрация
        </Title>

        <Text
          type="secondary"
          style={{ display: "block", textAlign: "center", marginBottom: 20 }}
        >
          Создайте новый аккаунт
        </Text>
        <Flex justify="center">
          <Form
            layout="vertical"
            onFinish={onFinish}
            style={{ width: "100%", maxWidth: 420 }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="firstName" label="Имя">
                  <Input size="large" placeholder="" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="lastName" label="Фамилия">
                  <Input size="large" placeholder="" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="email" label="Email">
                  <Input size="large" placeholder="" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="userName" label="Имя пользователя">
                  <Input size="large" placeholder="" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="phoneNumber" label="Телефон" initialValue="+992">
                  <Input size="large" placeholder="" maxLength={13} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="password"
                  label="Пароль"
                  rules={[{ required: true, message: "Введите пароль" }]}
                >
                  <Input.Password size="large" placeholder="" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="confirmPassword"
                  label="Подтверждение"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Подтвердите пароль" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject("Пароли не совпадают");
                      },
                    }),
                  ]}
                >
                  <Input.Password size="large" placeholder="" />
                </Form.Item>
              </Col>
            </Row>

            <Button
              type="primary"
              htmlType="submit"
              danger
              block
              size="large"
              style={{ borderRadius: 8, marginTop: 10 }}
            >
              Зарегистрироваться
            </Button>
          </Form>
        </Flex>
        <div style={{ textAlign: "center", marginTop: 15 }}>
          <Text>
            Уже есть аккаунт?{" "}
            <Link to="/login" style={{ color: "#f00" }}>
              Войти
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
