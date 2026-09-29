import { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Input,
  InputNumber,
  Typography,
  message,
  Spin,
  Space,
} from "antd";
import {
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  HourglassOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useOneTimeLinkStore } from "../store/useOneTimeLinkStore";


const { Text } = Typography;

const PRESET_DURATIONS = [5, 10, 15, 20, 30, 45, 60, 90];
const ACCENT = "#ff4b2b";
const accentBtn = { background: ACCENT, borderColor: ACCENT };

const OneTimeLinkModal = ({ open, onClose, test, lang = "ru" }) => {
  const [duration, setDuration] = useState(5);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);

  const link = useOneTimeLinkStore((s) => s.link);
  const generating = useOneTimeLinkStore((s) => s.generating);
  const error = useOneTimeLinkStore((s) => s.error);
  const generateLink = useOneTimeLinkStore((s) => s.generateLink);
  const resetLink = useOneTimeLinkStore((s) => s.resetLink);

  const testTitle = test
    ? lang === "ru"
      ? test.titleRu || test.title
      : test.titleTj || test.title
    : "";

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const handleGenerate = async () => {
    if (!test || !duration) return;
    try {
      await generateLink(test.id, duration);
    } catch {
      // ошибка уже в store (error) и показывается через useEffect
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      message.success("Ссылка скопирована");
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error("Не удалось скопировать");
    }
  };

  const handleClose = () => {
    setDuration(5);
    setCopied(false);
    resetLink();
    onClose();
  };

 

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LinkOutlined style={{ color: ACCENT }} />
          <span>Ссылка для стажёра{testTitle ? ` — ${testTitle}` : ""}</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={
        <Button key="close" onClick={handleClose}>
          Закрыть
        </Button>
      }
      width={520}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Text strong>Длительность теста:</Text>
          <Space.Compact size="large" style={{ width: "100%" }}>
            <Space.Addon>
              <HourglassOutlined />
            </Space.Addon>
            <InputNumber
              value={duration}
              onChange={setDuration}
              min={1}
              max={480}
              precision={0}
              style={{ width: "100%" }}
              disabled={!!link || generating}
            />
            <Space.Addon>мин</Space.Addon>
          </Space.Compact>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Быстрый выбор:
            </Text>
            {PRESET_DURATIONS.map((min) => (
              <Button
                key={min}
                size="small"
                type={duration === min ? "primary" : "default"}
                onClick={() => setDuration(min)}
                disabled={!!link || generating}
                style={duration === min ? accentBtn : {}}
              >
                {min} мин
              </Button>
            ))}
          </div>
        </div>

        {/* 1. Кнопка генерации */}
        {!link && !generating && (
          <Button
            type="primary"
            onClick={handleGenerate}
            disabled={!duration}
            icon={<LinkOutlined />}
            size="large"
            style={{ ...accentBtn, borderRadius: 10 }}
          >
            Сгенерировать ссылку
          </Button>
        )}

        {/* 2. Загрузка, пока ответа нет (запрос идёт ~15 секунд) */}
        {generating && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: 24,
              borderRadius: 10,
              border: "1px dashed #d9d9d9",
              background: "#fafafa",
            }}
          >
            <Spin
              indicator={
                <LoadingOutlined style={{ fontSize: 28, color: ACCENT }} spin />
              }
            />
            <Text
              type="secondary"
              style={{ fontSize: 13, textAlign: "center" }}
            >
              Ссылка генерируется на сервере. Это может занять до 15–20
              секунд...
            </Text>
          </div>
        )}

        {/* 3. Поле со ссылкой и кнопкой копирования */}
        {link && !generating && (
          <div>
            <Text strong>Ссылка для стажёра:</Text>
            <Space.Compact style={{ width: "100%", marginTop: 8 }}>
              <Input
                value={link}
                readOnly
                size="large"
                prefix={<LinkOutlined style={{ color: "#722ed1" }} />}
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="primary"
                size="large"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
                style={
                  copied
                    ? { background: "#52c41a", borderColor: "#52c41a" }
                    : accentBtn
                }
              >
                {copied ? "Скопировано" : "Скопировать"}
              </Button>
            </Space.Compact>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OneTimeLinkModal;
