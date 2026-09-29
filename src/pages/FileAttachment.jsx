import { useEffect, useState } from "react";
import { Spin, Image } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import { downloadFile } from "../services/api.ervice.message";

export default function FileAttachment({ file }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl;
    let cancelled = false;

    setLoading(true);
    setFailed(false);

    downloadFile(file.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id]);

  if (loading) {
    return (
      <div className="flex h-16 w-16 items-center justify-center">
        <Spin size="small" />
      </div>
    );
  }

  if (failed || !blobUrl) {
    return (
      <span className="text-xs text-red-400">Не удалось загрузить файл</span>
    );
  }

  const isImage = file.mime_type?.startsWith("image/");
  const isVideo = file.mime_type?.startsWith("video/");

  if (isImage) {
    return (
      <Image
        src={blobUrl}
        alt={file.filename}
        className="max-h-48 max-w-full rounded-lg object-cover"
        style={{
          maxHeight: 192,
          maxWidth: "100%",
          objectFit: "cover",
          borderRadius: 8,
        }}
      />
    );
  }

  if (isVideo) {
    return (
      <video
        src={blobUrl}
        controls
        preload="metadata"
        className="max-h-64 max-w-full rounded-lg"
        style={{ maxHeight: 256, maxWidth: "100%" }}
      />
    );
  }

  return (
    <a
    
      href={blobUrl}
      download={file.filename}
      className="flex items-center gap-2 text-sm text-indigo-600 underline"
    >
      <FileTextOutlined />
      {file.filename}
    </a>
  );
}