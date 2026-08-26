import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Spin,
  Button,
  Input,
  message,
  Popconfirm,
  Modal,
  Avatar,
  Typography,
  Space,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CommentOutlined,
  DownOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useArticlesStore } from "../store/useArticles";
import { useCommentsStore } from "../store/useComments";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const articleId = parseInt(id);

  // --- Статья ---
  const { article, loading: articleLoading, fetchArticleById } = useArticlesStore();

  // --- Комментарии ---
  const {
    comments,
    loading: commentsLoading,
    fetchComments,
    addComment,
    editComment,
    removeComment,
    clearComments,
  } = useCommentsStore();

  // --- Состояние для формы комментария ---
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editText, setEditText] = useState("");
  // Для сворачивания веток
  const [collapsedReplies, setCollapsedReplies] = useState(new Set());

  // Загрузка данных
  useEffect(() => {
    fetchArticleById(articleId);
    fetchComments(articleId);
    return () => {
      clearComments();
    };
  }, [articleId, fetchArticleById, fetchComments, clearComments]);

  // --- Добавление ---
  const handleAddComment = async () => {
    if (!newCommentText.trim()) {
      message.warning("Введите текст комментария");
      return;
    }
    const data = {
      text: newCommentText.trim(),
      parent_id: replyTo ? replyTo.id : null,
    };
    try {
      await addComment(articleId, data);
      setNewCommentText("");
      setReplyTo(null);
      message.success("Комментарий добавлен");
    } catch (error) {
      message.error("Не удалось добавить комментарий");
    }
  };

  // --- Редактирование ---
  const openEditModal = (comment) => {
    setEditingComment(comment);
    setEditText(comment.text);
    setIsEditModalOpen(true);
  };

  const handleEditComment = async () => {
    if (!editText.trim()) {
      message.warning("Введите текст комментария");
      return;
    }
    try {
      await editComment(editingComment.id, { text: editText.trim() }, articleId);
      setIsEditModalOpen(false);
      setEditingComment(null);
      message.success("Комментарий обновлён");
    } catch (error) {
      message.error("Не удалось обновить комментарий");
    }
  };

  // --- Удаление ---
  const handleDeleteComment = async (id) => {
    try {
      await removeComment(id, articleId);
      message.success("Комментарий удалён");
    } catch (error) {
      message.error("Не удалось удалить комментарий");
    }
  };

  // --- Сворачивание ветки ---
  const toggleCollapse = (commentId) => {
    setCollapsedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // --- URL медиа ---
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
    const cleanUrl = fileUrl.replace(/^\/+/, "");
    return `${import.meta.env.VITE_API_ARTICLES}/${cleanUrl}`;
  };

  // --- Рендер одного комментария (рекурсивно) с улучшенным UI ---
  const renderComment = useCallback(
    (comment, level = 0) => {
      const isReply = level > 0;
      const hasReplies = comment.replies && comment.replies.length > 0;
      const isCollapsed = collapsedReplies.has(comment.id);

      return (
        <div
          key={comment.id}
          style={{
            marginLeft: isReply ? 48 : 0,
            marginTop: 12,
            paddingLeft: isReply ? 16 : 0,
            borderLeft: isReply ? "2px solid #e8e8e8" : "none",
            position: "relative",
          }}
        >
          <div className="flex items-start gap-3">
            {/* Аватар */}
            <Avatar
              size={40}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#1677ff", flexShrink: 0 }}
            >
              {comment.created_by?.[0]?.toUpperCase()}
            </Avatar>

            <div className="flex-1">
              {/* Заголовок: автор + дата */}
              <div className="flex flex-wrap items-center gap-2">
                <Text strong>{comment.created_by}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(comment.created_at).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {comment.parent_id && comment.parent_id !== 0 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    (ответ)
                  </Text>
                )}
              </div>

              {/* Текст комментария */}
              <Paragraph className="mt-1 mb-2" style={{ whiteSpace: "pre-wrap" }}>
                {comment.text}
              </Paragraph>

              {/* Действия */}
              <Space size="small" className="flex-wrap">
                <Button
                  type="link"
                  size="small"
                  icon={<CommentOutlined />}
                  onClick={() =>
                    setReplyTo({ id: comment.id, created_by: comment.created_by })
                  }
                  style={{ paddingLeft: 0 }}
                >
                  Ответить
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditModal(comment)}
                >
                  Изменить
                </Button>
                <Popconfirm
                  title="Удалить комментарий?"
                  description="Это действие нельзя отменить."
                  okText="Удалить"
                  cancelText="Отмена"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDeleteComment(comment.id)}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    Удалить
                  </Button>
                </Popconfirm>
                {hasReplies && (
                  <Button
                    type="link"
                    size="small"
                    icon={isCollapsed ? <RightOutlined /> : <DownOutlined />}
                    onClick={() => toggleCollapse(comment.id)}
                  >
                    {isCollapsed
                      ? `Показать ответы (${comment.replies.length})`
                      : `Скрыть ответы (${comment.replies.length})`}
                  </Button>
                )}
              </Space>

              {/* Вложенные ответы */}
              {hasReplies && !isCollapsed && (
                <div className="mt-2">
                  {comment.replies.map((reply) => renderComment(reply, level + 1))}
                </div>
              )}
            </div>
          </div>
          {isReply && <Divider style={{ margin: "8px 0" }} />}
        </div>
      );
    },
    [collapsedReplies, toggleCollapse]
  );

  // --- Состояния загрузки ---
  if (articleLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!article) {
    return <div className="p-6 text-center text-gray-500">Статья не найдена</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Кнопка назад */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/article")}
        className="mb-4"
        danger
      >
        Назад к списку
      </Button>

      {/* Статья */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
        <p className="text-gray-500 mt-2">{article.description}</p>
        {article.created_at && (
          <p className="text-sm text-gray-400 mt-2">
            Опубликовано: {new Date(article.created_at).toLocaleDateString("ru-RU")}
          </p>
        )}
        {article.cover_url && (
          <img
            src={getFileUrl(article.cover_url)}
            alt="Обложка"
            className="mt-4 max-h-96 w-full rounded-lg object-contain"
          />
        )}
        {article.video_url && (
          <video
            src={getFileUrl(article.video_url)}
            controls
            className="mt-4 w-full rounded-lg"
            style={{ maxHeight: "500px" }}
          />
        )}
        <div className="mt-6 prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
          {article.text}
        </div>
      </div>

      {/* Комментарии */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Комментарии</h2>

        {/* Форма добавления */}
        <div className="mb-6">
          {replyTo && (
            <div className="mb-2 text-sm text-blue-600">
              Ответ пользователю <strong>{replyTo.created_by}</strong>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => setReplyTo(null)}
                className="ml-2"
              >
                Отменить
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <TextArea
              rows={2}
              placeholder="Напишите комментарий..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1"
            />
            <div style={{ display: "flex", alignItems: "center" }}>
              <Button
                danger
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddComment}
                loading={commentsLoading}
              >
                Отправить
              </Button>
            </div>
          </div>
        </div>

        {/* Список комментариев */}
        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Комментариев пока нет. Будьте первым!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => renderComment(comment, 0))}
          </div>
        )}
      </div>

      {/* Модалка редактирования */}
      <Modal
        title="Редактировать комментарий"
        open={isEditModalOpen}
        onOk={handleEditComment}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingComment(null);
          setEditText("");
        }}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={commentsLoading}
      >
        <TextArea
          rows={4}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          placeholder="Введите новый текст"
        />
      </Modal>
    </div>
  );
};

export default ArticleDetail;