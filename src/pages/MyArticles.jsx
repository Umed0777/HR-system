import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Modal,
  Input,
  Upload,
  message,
  Popconfirm,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useProfileStore } from "../store/useProfileStore";
import { useArticlesStore } from "../store/useArticles";

const API_URL = import.meta.env.VITE_API_ARTICLES;

const MyArticles = () => {
  // ===== PROFILE STORE =====
  const {
    profile,
    loading,
    error,
    fetchMyProfile,
    editMyArticle,
    removeMyArticle,
    updateMyArticleFiles,
  } = useProfileStore();

  // ===== ARTICLES STORE (для создания новых статей, используем общий create) =====
  const { addArticle } = useArticlesStore();

  // ===== LOCAL STATE =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  // ===== FILTERED ARTICLES (поиск) =====
  const filteredArticles = profile?.articles?.filter((article) =>
    article.title?.toLowerCase().includes(search.toLowerCase()) ||
    article.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // ===== INITIAL FETCH =====
  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  // ===== GET FILE URL (как в Articles) =====
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
    const cleanUrl = fileUrl.replace(/^\/+/, "");
    return `${API_URL}/${cleanUrl}`;
  };

  // ===== RESET FORM =====
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setText("");
    setImage(null);
    setVideo(null);
    setEditingArticle(null);
  };

  // ===== OPEN CREATE =====
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // ===== OPEN EDIT =====
  const openEditModal = (article) => {
    setEditingArticle(article);
    setTitle(article.title || "");
    setDescription(article.description || "");
    setText(article.text || "");
    setImage(null);
    setVideo(null);
    setIsModalOpen(true);
  };

  // ===== SAVE (CREATE or UPDATE) =====
  const handleSave = async () => {
    try {
      if (!title.trim() || !description.trim() || !text.trim()) {
        message.error("Заполните все обязательные поля");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("text", text.trim());
      formData.append("status", "published");

      if (image) formData.append("cover", image);
      if (video) formData.append("video", video);

      if (editingArticle) {
        // Для обновления своей статьи используем два эндпоинта:
        // 1. Обновляем текстовые поля (PUT /api/me/articles/{id})
        await editMyArticle(editingArticle.id, {
          title: title.trim(),
          description: description.trim(),
          text: text.trim(),
          status: "published",
        });
        // 2. Если есть новые файлы, обновляем их отдельно
        if (image || video) {
          const fileData = new FormData();
          if (image) fileData.append("cover", image);
          if (video) fileData.append("video", video);
          await updateMyArticleFiles(editingArticle.id, fileData);
        }
        message.success("Статья обновлена");
      } else {
        // Создаём новую статью (используем общий эндпоинт /api/articles)
        await addArticle(formData);
        message.success("Статья создана");
      }

      setIsModalOpen(false);
      resetForm();
      await fetchMyProfile(); // обновляем список своих статей
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || "Не удалось сохранить статью");
    }
  };

  // ===== DELETE =====
  const handleDelete = async (id) => {
    try {
      await removeMyArticle(id);
      message.success("Статья удалена");
      await fetchMyProfile();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.error || "Не удалось удалить статью");
    }
  };

  // ===== UPLOAD HANDLERS (как в Articles) =====
  const handleImageUpload = (file) => {
    if (!file.type.startsWith("image/")) {
      message.error("Можно загружать только изображения");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > 5) {
      message.error("Размер изображения не должен превышать 5 MB");
      return Upload.LIST_IGNORE;
    }
    setImage(file);
    return false;
  };

  const handleVideoUpload = (file) => {
    if (!file.type.startsWith("video/")) {
      message.error("Можно загружать только видео");
      return Upload.LIST_IGNORE;
    }
    if (file.size / 1024 / 1024 > 100) {
      message.error("Размер видео не должен превышать 100 MB");
      return Upload.LIST_IGNORE;
    }
    setVideo(file);
    return false;
  };

  // ===== CLOSE =====
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // ===== ERROR =====
  if (error && !profile) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 p-5 text-red-500">
          <p className="font-semibold">Ошибка загрузки профиля:</p>
          <pre className="mt-2 whitespace-pre-wrap">
            {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мои статьи</h1>
          <p className="mt-1 text-gray-500">
            {profile?.login ? `Пользователь: ${profile.login}` : "Загрузка..."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Поиск по моим статьям..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="middle"
            className="w-full sm:w-72"
          />
          <Button
            danger
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Добавить статью
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="mb-5 flex justify-center">
          <Spin />
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredArticles.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <Empty
            description={search ? "Статьи не найдены" : "У вас пока нет статей"}
          />
          {!search && (
            <Button
              type="primary"
              className="mt-4"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Создать первую статью
            </Button>
          )}
        </div>
      )}

      {/* CARDS */}
      {!loading && filteredArticles.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => {
            const coverUrl = getFileUrl(article.cover_url);
            const videoUrl = getFileUrl(article.video_url);
            return (
              <div
                key={article.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* MEDIA */}
                <div className="relative h-60 w-full overflow-hidden bg-gray-100">
                  {videoUrl ? (
                    <div
                      className="group relative h-full w-full cursor-pointer bg-black"
                      onClick={() => setPreview({ type: "video", url: videoUrl })}
                    >
                      <video
                        src={videoUrl}
                        className="h-full w-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-3xl text-black shadow-lg transition group-hover:scale-110">
                          <PlayCircleOutlined />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-sm text-white">
                        <VideoCameraOutlined /> Видео
                      </div>
                    </div>
                  ) : coverUrl ? (
                    <div
                      className="group relative h-full w-full cursor-pointer"
                      onClick={() => setPreview({ type: "image", url: coverUrl })}
                    >
                      <img
                        src={coverUrl}
                        alt={article.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                      />
                      <div className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100">
                        <FileImageOutlined />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <div className="text-center">
                        <FileImageOutlined className="text-4xl" />
                        <p className="mt-2">Нет изображения</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <div className="mb-3">
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Опубликовано
                    </span>
                  </div>
                  <h2 className="line-clamp-2 text-xl font-bold text-gray-900">
                    {article.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                    {article.description || "Описание отсутствует"}
                  </p>
                  {article.created_at && (
                    <p className="mt-4 text-xs text-gray-400">
                      {new Date(article.created_at).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                  <div className="mt-5 flex gap-2">
                    <Link to={`/article/${article.id}`} className="flex-1">
                      <Button type="primary" danger className="w-full">
                        Читать
                      </Button>
                    </Link>
                    <Button
                      className="flex-1"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(article)}
                    >
                      Изменить
                    </Button>
                    <Popconfirm
                      title="Удалить статью?"
                      description="Это действие нельзя отменить."
                      okText="Удалить"
                      cancelText="Отмена"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDelete(article.id)}
                    >
                      <Button danger className="flex-1" icon={<DeleteOutlined />}>
                        Удалить
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREATE/EDIT */}
      <Modal
        title={editingArticle ? "Редактировать статью" : "Добавить статью"}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={editingArticle ? "Сохранить" : "Создать"}
        cancelText="Отмена"
        centered
        width={700}
        confirmLoading={loading}
      >
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Название <span className="text-red-500"> *</span>
            </label>
            <Input
              size="large"
              placeholder="Введите название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Описание <span className="text-red-500"> *</span>
            </label>
            <Input.TextArea
              rows={4}
              placeholder="Введите описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Текст статьи <span className="text-red-500"> *</span>
            </label>
            <Input.TextArea
              rows={8}
              placeholder="Введите полный текст статьи"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Обложка</label>
            <Upload
              beforeUpload={handleImageUpload}
              maxCount={1}
              accept="image/*"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Выбрать изображение</Button>
            </Upload>
            {editingArticle?.cover_url && !image && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Текущая обложка:</p>
                <img
                  src={getFileUrl(editingArticle.cover_url)}
                  alt="Текущая обложка"
                  className="h-48 w-full rounded-xl object-cover"
                  onClick={() =>
                    setPreview({
                      type: "image",
                      url: getFileUrl(editingArticle.cover_url),
                    })
                  }
                />
              </div>
            )}
            {image && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Новая обложка:</p>
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="h-48 w-full cursor-pointer rounded-xl object-cover"
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Видео</label>
            <Upload
              beforeUpload={handleVideoUpload}
              maxCount={1}
              accept="video/*"
              showUploadList={false}
            >
              <Button icon={<VideoCameraOutlined />}>Выбрать видео</Button>
            </Upload>
            {editingArticle?.video_url && !video && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Текущее видео:</p>
                <div
                  className="relative cursor-pointer overflow-hidden rounded-xl bg-black"
                  onClick={() =>
                    setPreview({
                      type: "video",
                      url: getFileUrl(editingArticle.video_url),
                    })
                  }
                >
                  <video
                    src={getFileUrl(editingArticle.video_url)}
                    className="h-48 w-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl">
                      <PlayCircleOutlined />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {video && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">Новое видео:</p>
                <div className="overflow-hidden rounded-xl bg-black">
                  <video
                    src={URL.createObjectURL(video)}
                    controls
                    className="max-h-64 w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* PREVIEW MODAL */}
      <Modal
        open={!!preview}
        footer={null}
        onCancel={() => setPreview(null)}
        centered
        width={preview?.type === "video" ? 1000 : 900}
        styles={{ body: { padding: 0 } }}
      >
        {preview?.type === "image" && (
          <div className="flex max-h-[80vh] items-center justify-center bg-black">
            <img
              src={preview.url}
              alt="Большой просмотр"
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>
        )}
        {preview?.type === "video" && (
          <div className="flex max-h-[80vh] items-center justify-center bg-black">
            <video src={preview.url} controls autoPlay className="max-h-[80vh] w-full" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyArticles;