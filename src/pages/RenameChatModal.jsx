import { useEffect, useState } from "react";
import { Modal, Input, Spin } from "antd";

const ACCENT = "#ff4b2b";

export default function RenameChatModal({ open, initialName, onClose, onSubmit }) {
  const [value, setValue] = useState(initialName || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setValue(initialName || "");
  }, [open, initialName]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialName) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Переименовать группу" open={open} onCancel={onClose} footer={null} closable={false}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPressEnter={handleSubmit}
        placeholder="Название группы"
        className="mt-3 rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5"
        autoFocus
      />
      <div className="mt-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !value.trim()}
          style={{ backgroundColor: ACCENT }}
          className="flex-1 rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? <Spin size="small" /> : "Сохранить"}
        </button>
      </div>
    </Modal>
  );
}