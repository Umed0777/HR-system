import {
  useEffect,
  useState,
} from "react";

import {
  Button,
  Modal,
  Input,
  Upload,
  message,
  Select,
} from "antd";

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import { useArticlesStore } from "../store/useArticles";

const API_URL =
  import.meta.env.VITE_API_ARTICLES;

const Articles = () => {
  // ===============================
  // ZUSTAND
  // ===============================

  const {
    articles,
    loading,
    error,

    fetchArticles,
    addArticle,
    editArticle,
    removeArticle,
  } = useArticlesStore();

  // ===============================
  // MODAL
  // ===============================

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingArticle, setEditingArticle] =
    useState(null);

  // ===============================
  // FORM
  // ===============================

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("published");

  const [createdBy, setCreatedBy] =
    useState("");

  const [image, setImage] =
    useState(null);

  // ===============================
  // FETCH
  // ===============================

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // ===============================
  // IMAGE URL
  // ===============================

  const getImageUrl = (coverUrl) => {
    if (!coverUrl) {
      return "/placeholder.jpg";
    }

    // Backend уже вернул полный URL
    if (
      coverUrl.startsWith("http://") ||
      coverUrl.startsWith("https://")
    ) {
      return coverUrl;
    }

    // Убираем "/" из начала
    const cleanUrl =
      coverUrl.replace(/^\/+/, "");

    return `${API_URL}/${cleanUrl}`;
  };

  // ===============================
  // RESET FORM
  // ===============================

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("published");
    setCreatedBy("");
    setImage(null);
    setEditingArticle(null);
  };

  // ===============================
  // CREATE
  // ===============================

  const openCreateModal = () => {
    resetForm();

    setIsModalOpen(true);
  };

  // ===============================
  // EDIT
  // ===============================

  const openEditModal = (article) => {
    setEditingArticle(article);

    setTitle(article.title || "");

    setDescription(
      article.description || ""
    );

    setStatus(
      article.status || "published"
    );

    setCreatedBy(
      article.created_by || ""
    );

    setImage(null);

    setIsModalOpen(true);
  };

  // ===============================
  // SAVE
  // ===============================

  const handleSave = async () => {
    try {
      // Проверка title
      if (!title.trim()) {
        message.error(
          "Введите название статьи"
        );

        return;
      }

      // =============================
      // FORMDATA
      // =============================

      const formData =
        new FormData();

      formData.append(
        "title",
        title
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "status",
        status
      );

      formData.append(
        "created_by",
        createdBy
      );

      // =============================
      // IMAGE
      // =============================

      if (image) {
        formData.append(
          "cover",
          image
        );
      }

      // =============================
      // UPDATE
      // =============================

      if (editingArticle) {
        await editArticle(
          editingArticle.id,
          formData
        );

        message.success(
          "Статья успешно обновлена"
        );
      }

      // =============================
      // CREATE
      // =============================

      else {
        await addArticle(
          formData
        );

        message.success(
          "Статья успешно создана"
        );
      }

      // =============================
      // CLOSE
      // =============================

      setIsModalOpen(false);

      resetForm();

      // =============================
      // REFRESH
      // =============================

      await fetchArticles();

    } catch (error) {
      console.error(
        "Ошибка сохранения:",
        error.response?.data ||
          error.message
      );

      message.error(
        "Не удалось сохранить статью"
      );
    }
  };

  // ===============================
  // DELETE
  // ===============================

  const handleDelete = async (id) => {
    try {
      await removeArticle(id);

      message.success(
        "Статья успешно удалена"
      );

      await fetchArticles();

    } catch (error) {
      console.error(
        "Ошибка удаления:",
        error.response?.data ||
          error.message
      );

      message.error(
        "Не удалось удалить статью"
      );
    }
  };

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-gray-500">
          Загрузка статей...
        </p>
      </div>
    );
  }

  // ===============================
  // ERROR
  // ===============================

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-50 p-5 text-red-500">
          Ошибка загрузки:
          <br />
          {typeof error === "string"
            ? error
            : "Неизвестная ошибка"}
        </div>
      </div>
    );
  }

  // ===============================
  // UI
  // ===============================

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Статьи
          </h1>

          <p className="mt-1 text-gray-500">
            Управление новостями и статьями
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Добавить статью
        </Button>

      </div>

      {/* ================================= */}
      {/* EMPTY */}
      {/* ================================= */}

      {!articles ||
      articles.length === 0 ? (

        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

          <p className="text-lg text-gray-500">
            Статей пока нет
          </p>

          <Button
            type="primary"
            className="mt-4"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Создать первую статью
          </Button>

        </div>

      ) : (

        /* ================================= */
        /* CARDS */
        /* ================================= */

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {articles.map(
            (article) => (

              <div
                key={article.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* ========================= */}
                {/* IMAGE */}
                {/* ========================= */}

                <div className="h-56 w-full overflow-hidden bg-gray-100">

                  <img
                    src={getImageUrl(
                      article.cover_url
                    )}
                    alt={
                      article.title ||
                      "Article"
                    }
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    onError={(event) => {
                      console.log(
                        "Картинка не загрузилась:",
                        getImageUrl(
                          article.cover_url
                        )
                      );

                      event.currentTarget.src =
                        "/placeholder.jpg";
                    }}
                  />

                </div>

                {/* ========================= */}
                {/* CONTENT */}
                {/* ========================= */}

                <div className="p-5">

                  {/* STATUS */}

                  <div className="mb-3">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        article.status ===
                        "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {article.status}
                    </span>

                  </div>

                  {/* TITLE */}

                  <h2 className="line-clamp-2 text-xl font-bold text-gray-900">
                    {article.title}
                  </h2>

                  {/* DESCRIPTION */}

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                    {article.description ||
                      "Описание отсутствует"}
                  </p>

                  {/* AUTHOR */}

                  <div className="mt-4">

                    <p className="text-sm text-gray-400">
                      Автор:
                    </p>

                    <p className="text-sm font-medium text-gray-700">
                      {article.created_by ||
                        "Не указан"}
                    </p>

                  </div>

                  {/* DATE */}

                  {article.created_at && (
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(
                        article.created_at
                      ).toLocaleDateString(
                        "ru-RU"
                      )}
                    </p>
                  )}

                  {/* BUTTONS */}

                  <div className="mt-5 flex gap-2">

                    <Button
                      className="flex-1"
                      icon={
                        <EditOutlined />
                      }
                      onClick={() =>
                        openEditModal(
                          article
                        )
                      }
                    >
                      Изменить
                    </Button>

                    <Button
                      danger
                      className="flex-1"
                      icon={
                        <DeleteOutlined />
                      }
                      onClick={() =>
                        handleDelete(
                          article.id
                        )
                      }
                    >
                      Удалить
                    </Button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* ================================= */}
      {/* MODAL */}
      {/* ================================= */}

      <Modal
        title={
          editingArticle
            ? "Редактировать статью"
            : "Добавить статью"
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onOk={handleSave}
        okText={
          editingArticle
            ? "Сохранить"
            : "Создать"
        }
        cancelText="Отмена"
        centered
      >

        <div className="flex flex-col gap-4">

          {/* TITLE */}

          <div>

            <label className="mb-1 block text-sm font-medium">
              Название
            </label>

            <Input
              size="large"
              placeholder="Введите название"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
            />

          </div>

          {/* DESCRIPTION */}

          <div>

            <label className="mb-1 block text-sm font-medium">
              Описание
            </label>

            <Input.TextArea
              rows={5}
              placeholder="Введите описание"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
            />

          </div>

          {/* STATUS */}

          <div>

            <label className="mb-1 block text-sm font-medium">
              Статус
            </label>

            <Select
              className="w-full"
              size="large"
              value={status}
              onChange={(value) =>
                setStatus(value)
              }
              options={[
                {
                  value: "published",
                  label: "Опубликовано",
                },
                {
                  value: "draft",
                  label: "Черновик",
                },
              ]}
            />

          </div>

          {/* AUTHOR */}

          <div>

            <label className="mb-1 block text-sm font-medium">
              Автор
            </label>

            <Input
              size="large"
              placeholder="Введите автора"
              value={createdBy}
              onChange={(event) =>
                setCreatedBy(
                  event.target.value
                )
              }
            />

          </div>

          {/* IMAGE */}

          <div>

            <label className="mb-2 block text-sm font-medium">
              Обложка
            </label>

            <Upload
              beforeUpload={(file) => {

                // Проверяем тип
                if (
                  !file.type.startsWith(
                    "image/"
                  )
                ) {
                  message.error(
                    "Можно загружать только изображения"
                  );

                  return Upload.LIST_IGNORE;
                }

                // Проверяем размер
                const isValidSize =
                  file.size /
                    1024 /
                    1024 <
                  5;

                if (!isValidSize) {
                  message.error(
                    "Размер изображения не должен превышать 5 MB"
                  );

                  return Upload.LIST_IGNORE;
                }

                setImage(file);

                return false;
              }}
              maxCount={1}
              accept="image/*"
              showUploadList={false}
            >

              <Button
                icon={
                  <UploadOutlined />
                }
              >
                Выбрать изображение
              </Button>

            </Upload>

          </div>

          {/* OLD IMAGE */}

          {editingArticle?.cover_url &&
            !image && (

              <div>

                <p className="mb-2 text-sm text-gray-500">
                  Текущая обложка:
                </p>

                <img
                  src={getImageUrl(
                    editingArticle.cover_url
                  )}
                  alt="Текущая обложка"
                  className="h-48 w-full rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.src =
                      "/placeholder.jpg";
                  }}
                />

              </div>

            )}

          {/* NEW IMAGE */}

          {image && (

            <div>

              <p className="mb-2 text-sm text-gray-500">
                Новая обложка:
              </p>

              <img
                src={URL.createObjectURL(
                  image
                )}
                alt="Preview"
                className="h-48 w-full rounded-xl object-cover"
              />

            </div>

          )}

        </div>

      </Modal>

    </div>
  );
};

export default Articles;