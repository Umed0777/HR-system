import { Button, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const HistoryHeader = ({ title, subtitle, onBack }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
    {onBack && (
      <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
        Назад
      </Button>
    )}
    <div>
      <Title level={3} style={{ margin: 0 }}>
        {title}
      </Title>
      {subtitle && <Text type="secondary">{subtitle}</Text>}
    </div>
  </div>
);

export default HistoryHeader;