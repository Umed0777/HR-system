// src/store/useVideoLesson.js

import { create } from "zustand";
import {
  getFolders,
  createFolder,
} from "../services/api.service.folder";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api.service.announcement";

// Название папки
const VIDEO_FOLDER_NAME = "ВидеоУрок";

export const useVideoLessonStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================

  videoLessons: [],
  currentVideoLesson: null,
  videoFolder: null,
  loading: false,
  error: null,

  // =========================
  // FIND VIDEO FOLDER
  // =========================

  findVideoFolder: (folders) => {
    if (!Array.isArray(folders)) {
      return null;
    }

    const folder = folders.find(
      (item) =>
        item.name?.toLowerCase() === VIDEO_FOLDER_NAME.toLowerCase() ||
        item.name?.toLowerCase() === "видеоуроки"
    );

    console.log("🎥 Найдена папка видеоуроков:", folder);
    return folder || null;
  },

  // =========================
  // CREATE VIDEO FOLDER IF NOT EXISTS
  // =========================

  ensureVideoFolderExists: async () => {
    try {
      // Получаем все папки
      const response = await getFolders();
      console.log("📥 Получены папки:", response);

      // Извлекаем массив папок из ответа
      let folders = [];
      if (response?.data && Array.isArray(response.data)) {
        folders = response.data;
      } else if (Array.isArray(response)) {
        folders = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        folders = response.$values;
      }

      console.log("📁 Массив папок:", folders);

      // Ищем папку
      let videoFolder = get().findVideoFolder(folders);

      // Если папка не найдена - создаём
      if (!videoFolder) {
        console.log(`🆕 Папка "${VIDEO_FOLDER_NAME}" не найдена, создаём...`);
        
        const newFolder = await createFolder({
          name: VIDEO_FOLDER_NAME,
          description: "Папка для видеоуроков",
        });

        console.log("✅ Папка создана:", newFolder);

        // Обновляем state
        videoFolder = newFolder;
        set({ videoFolder: newFolder });

        return newFolder;
      }

      // Папка найдена
      set({ videoFolder });
      return videoFolder;
    } catch (error) {
      console.error("❌ Ошибка при работе с папкой видеоуроков:", error);
      throw error;
    }
  },

  // =========================
  // FETCH VIDEO LESSONS
  // =========================

  fetchVideoLessons: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      // Сначала убеждаемся, что папка существует
      const videoFolder = await get().ensureVideoFolderExists();

      if (!videoFolder) {
        console.warn(`⚠️ Не удалось создать папку "${VIDEO_FOLDER_NAME}"`);
        set({
          videoLessons: [],
          videoFolder: null,
          loading: false,
        });
        return [];
      }

      // Получаем свежие данные папки со всеми announcements
      const response = await getFolders();
      let folders = [];
      if (response?.data && Array.isArray(response.data)) {
        folders = response.data;
      } else if (Array.isArray(response)) {
        folders = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        folders = response.$values;
      }

      const updatedFolder = folders.find(
        (f) => Number(f.id) === Number(videoFolder.id)
      );

      // Берем announcements из папки
      const videoLessons = updatedFolder?.announcements 
        ? (Array.isArray(updatedFolder.announcements) 
            ? updatedFolder.announcements 
            : updatedFolder.announcements.$values || [])
        : [];

      set({
        videoLessons,
        videoFolder: updatedFolder || videoFolder,
        loading: false,
      });

      console.log(`✅ Загружено видеоуроков: ${videoLessons.length}`);
      return videoLessons;
    } catch (error) {
      console.error("❌ Ошибка загрузки видеоуроков:", error);

      set({
        videoLessons: [],
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Ошибка загрузки видеоуроков",
      });

      throw error;
    }
  },

  // =========================
  // CREATE VIDEO LESSON
  // =========================

  addVideoLesson: async (newData) => {
    try {
      console.log("📝 Создание видеоурока:", newData);

      // Убеждаемся, что папка существует
      const videoFolder = await get().ensureVideoFolderExists();

      if (!videoFolder) {
        throw new Error(`Папка "${VIDEO_FOLDER_NAME}" не найдена и не может быть создана`);
      }

      console.log("📁 Создаём в папке:", videoFolder.id, videoFolder.name);

      // Создаем FormData для отправки
      const formData = new FormData();
      
      // Добавляем текстовые поля
      formData.append("Title", newData.title || "");
      formData.append("Content", newData.content || "");
      formData.append("SubDepartmentId", String(Number(newData.subDepartmentId ?? 0)));
      formData.append("EmployeeId", String(Number(newData.employeeId ?? 0)));
      formData.append("FolderId", String(Number(videoFolder.id)));

      // Добавляем файлы
      if (newData.files && Array.isArray(newData.files)) {
        newData.files.forEach((file, index) => {
          if (file instanceof File) {
            if (index === 0) {
              formData.append("ProfileImage", file);
            }
            formData.append("Files", file);
          }
        });
      }

      console.log("📤 Отправляем FormData:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? value.name : value);
      }

      const responseAnnouncement = await createAnnouncement(formData);

      console.log("✅ Видеоурок создан:", responseAnnouncement);

      // Обновляем список
      await get().fetchVideoLessons();

      return responseAnnouncement;
    } catch (error) {
      console.error("❌ Ошибка создания видеоурока:", error);
      throw error;
    }
  },

  // =========================
  // UPDATE VIDEO LESSON
  // =========================

  editVideoLesson: async (id, updatedData) => {
    try {
      console.log("✏️ Обновление видеоурока:", id);

      // Убеждаемся, что папка существует
      const videoFolder = await get().ensureVideoFolderExists();

      if (!videoFolder) {
        throw new Error(`Папка "${VIDEO_FOLDER_NAME}" не найдена и не может быть создана`);
      }

      // Создаем FormData для отправки
      const formData = new FormData();
      
      // Добавляем текстовые поля
      formData.append("Title", updatedData.title || "");
      formData.append("Content", updatedData.content || "");
      
      if (updatedData.subDepartmentId !== null && updatedData.subDepartmentId !== undefined) {
        formData.append("SubDepartmentId", String(Number(updatedData.subDepartmentId)));
      }
      
      if (updatedData.employeeId !== null && updatedData.employeeId !== undefined) {
        formData.append("EmployeeId", String(Number(updatedData.employeeId)));
      }
      
      formData.append("FolderId", String(Number(videoFolder.id)));

      // Добавляем только новые файлы
      if (updatedData.files && Array.isArray(updatedData.files)) {
        updatedData.files.forEach((file, index) => {
          if (file instanceof File) {
            if (index === 0) {
              formData.append("ProfileImage", file);
            }
            formData.append("Files", file);
          }
        });
      }

      console.log("📤 Отправляем FormData на обновление:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? value.name : value);
      }

      const updated = await updateAnnouncement(id, formData);

      console.log("✅ Видеоурок обновлен:", updated);

      await get().fetchVideoLessons();

      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления видеоурока:", error);
      throw error;
    }
  },

  // =========================
  // DELETE VIDEO LESSON
  // =========================

  removeVideoLesson: async (id) => {
    try {
      console.log("🗑️ Удаление видеоурока:", id);

      await deleteAnnouncement(id);

      set((state) => ({
        videoLessons: state.videoLessons.filter(
          (item) => Number(item.id) !== Number(id)
        ),
      }));

      console.log("✅ Видеоурок удален");
      
      // Обновляем папку
      await get().fetchVideoLessons();
    } catch (error) {
      console.error("❌ Ошибка удаления видеоурока:", error);
      throw error;
    }
  },
}));