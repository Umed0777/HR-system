import { Input, Row, Col, Tag } from "antd";

const { TextArea } = Input;

const LANGS = [
  { key: "ru", label: "RU", color: "blue", placeholder: "На русском" },
  { key: "tj", label: "TJ", color: "green", placeholder: "Бо тоҷикӣ" },
];

// Два поля ввода (RU / TJ) рядом — для контента, который хранится на двух языках
export const BilingualInput = ({
  valueRu,
  valueTj,
  onChangeRu,
  onChangeTj,
  placeholder,
  textarea = false,
  rows = 3,
  size = "large",
  style,
}) => {
  const values = { ru: valueRu, tj: valueTj };
  const handlers = { ru: onChangeRu, tj: onChangeTj };
  const Field = textarea ? TextArea : Input;

  return (
    <Row gutter={[10, 10]} style={{ width: "100%" }}>
      {LANGS.map((l) => (
        <Col xs={24} md={12} key={l.key}>
          <Field
            value={values[l.key]}
            onChange={(e) => handlers[l.key](e.target.value)}
            placeholder={placeholder ? `${placeholder} (${l.label})` : l.placeholder}
            prefix={
              textarea ? undefined : (
                <Tag color={l.color} style={{ marginInlineEnd: 4 }}>
                  {l.label}
                </Tag>
              )
            }
            {...(textarea ? { rows } : {})}
            size={size}
            style={{ borderRadius: 10, ...style }}
          />
          {textarea && (
            <Tag color={l.color} style={{ marginTop: 4 }}>
              {l.label}
            </Tag>
          )}
        </Col>
      ))}
    </Row>
  );
};

