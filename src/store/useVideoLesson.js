// src/store/useVideoLesson.js

import { create } from "zustand";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/api.service.folder";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api.service.announcement";

// Название папки для видеоуроков (системная)
const VIDEO_FOLDER_NAME = "ВидеоУрок";
const VIDEO_FOLDER_TYPE = "video"; // Тип папки для видеоуроков

export const useVideoLessonStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================

  videoLessons: [],
  allFolders: [],
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
        (item.name?.toLowerCase() === VIDEO_FOLDER_NAME.toLowerCase() &&
         item.type === VIDEO_FOLDER_TYPE) ||
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
      const response = await getFolders();
      console.log("📥 Получены папки:", response);

      let folders = [];
      if (response?.data && Array.isArray(response.data)) {
        folders = response.data;
      } else if (Array.isArray(response)) {
        folders = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        folders = response.$values;
      }

      console.log("📁 Массив папок:", folders);

      let videoFolder = get().findVideoFolder(folders);

      if (!videoFolder) {
        console.log(`🆕 Папка "${VIDEO_FOLDER_NAME}" не найдена, создаём...`);
        
        const newFolder = await createFolder({
          name: VIDEO_FOLDER_NAME,
          description: "Системная папка для видеоуроков",
          type: VIDEO_FOLDER_TYPE, // Указываем тип
        });

        console.log("✅ Папка создана:", newFolder);

        videoFolder = newFolder;
        set({ videoFolder: newFolder });

        await get().fetchAllFolders();

        return newFolder;
      }

      set({ videoFolder });
      return videoFolder;
    } catch (error) {
      console.error("❌ Ошибка при работе с папкой видеоуроков:", error);
      throw error;
    }
  },

  // =========================
  // FETCH ALL FOLDERS - ТОЛЬКО ПАПКИ ВИДЕОУРОКОВ
  // =========================

  fetchAllFolders: async () => {
    try {
      console.log("📁 Загрузка папок видеоуроков...");
      const response = await getFolders();
      
      let folders = [];
      if (response?.data && Array.isArray(response.data)) {
        folders = response.data;
      } else if (Array.isArray(response)) {
        folders = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        folders = response.$values;
      }

      // ФИЛЬТРУЕМ: показываем только папки видеоуроков (type === "video")
      // Исключаем папку "ВидеоУрок" из списка доступных для выбора
      const filteredFolders = folders.filter(folder => {
        const isVideoFolder = folder.name?.toLowerCase() === VIDEO_FOLDER_NAME.toLowerCase();
        const isVideoType = folder.type === VIDEO_FOLDER_TYPE || 
                           folder.type === "videos";
        
        return !isVideoFolder && isVideoType;
      });

      set({ allFolders: filteredFolders });
      console.log(`📁 Загружено папок видеоуроков: ${filteredFolders.length}`);
      return filteredFolders;
    } catch (error) {
      console.error("❌ Ошибка загрузки папок:", error);
      set({ 
        error: error.message || "Ошибка загрузки папок",
        allFolders: []
      });
      throw error;
    }
  },

  // =========================
  // CREATE FOLDER - РАЗРЕШЕНО
  // =========================

  createNewFolder: async (folderData) => {
    try {
      console.log("📁 Создание папки для видео:", folderData);
      
      // Проверяем, не пытается ли пользователь создать папку "ВидеоУрок"
      if (folderData.name?.toLowerCase() === VIDEO_FOLDER_NAME.toLowerCase()) {
        throw new Error("Нельзя создать папку с названием 'ВидеоУрок'");
      }
      
      const newFolder = await createFolder({
        name: folderData.name,
        description: folderData.description || "Папка видеоуроков",
        type: VIDEO_FOLDER_TYPE, // Указываем тип
      });

      console.log("✅ Папка видео создана:", newFolder);
      
      await get().fetchAllFolders();
      
      return newFolder;
    } catch (error) {
      console.error("❌ Ошибка создания папки:", error);
      throw error;
    }
  },

  // =========================
  // UPDATE FOLDER - РАЗРЕШЕНО
  // =========================

  updateFolder: async (folderId, folderData) => {
    try {
      console.log(`📁 Обновление папки ${folderId}:`, folderData);
      
      // Проверяем, не пытается ли пользователь переименовать в "ВидеоУрок"
      if (folderData.name?.toLowerCase() === VIDEO_FOLDER_NAME.toLowerCase()) {
        throw new Error("Нельзя переименовать папку в 'ВидеоУрок'");
      }
      
      const updated = await updateFolder(folderId, {
        ...folderData,
        type: VIDEO_FOLDER_TYPE, // Сохраняем тип
      });
      
      console.log("✅ Папка видео обновлена:", updated);
      
      await get().fetchAllFolders();
      
      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления папки:", error);
      throw error;
    }
  },

  // =========================
  // DELETE FOLDER - РАЗРЕШЕНО
  // =========================

  deleteFolder: async (folderId) => {
    try {
      console.log(`🗑️ Удаление папки ${folderId}`);
      
      // Проверяем, не пытается ли пользователь удалить папку "ВидеоУрок"
      const folder = get().allFolders.find(f => Number(f.id) === Number(folderId));
      if (folder?.name?.toLowerCase() === VIDEO_FOLDER_NAME.toLowerCase()) {
        throw new Error("Нельзя удалить папку 'ВидеоУрок'");
      }
      
      await deleteFolder(folderId);
      
      console.log("✅ Папка удалена");
      
      await get().fetchAllFolders();
      
      return true;
    } catch (error) {
      console.error("❌ Ошибка удаления папки:", error);
      throw error;
    }
  },

  // =========================
  // MOVE VIDEO TO FOLDER - РАЗРЕШЕНО
  // =========================

  moveVideoToFolder: async (videoId, folderId) => {
    try {
      console.log(`📦 Перемещение видео ${videoId} в папку ${folderId}`);
      
      const video = get().videoLessons.find(d => Number(d.id) === Number(videoId));
      if (!video) {
        throw new Error("Видео не найдено");
      }
      
      await get().editVideoLesson(videoId, {
        ...video,
        folderId: folderId,
      });
      
      console.log("✅ Видео перемещено");
      return true;
    } catch (error) {
      console.error("❌ Ошибка перемещения видео:", error);
      throw error;
    }
  },

  // =========================
  // FETCH VIDEO LESSONS - ТОЛЬКО ИЗ ПАПКИ "ВидеоУрок"
  // =========================

  fetchVideoLessons: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
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

      const videoLessons = updatedFolder?.announcements 
        ? (Array.isArray(updatedFolder.announcements) 
            ? updatedFolder.announcements 
            : updatedFolder.announcements.$values || [])
        : [];

      videoLessons.forEach(video => {
        video.folderId = updatedFolder?.id || videoFolder.id;
        video.folderName = VIDEO_FOLDER_NAME;
      });

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
  // CREATE VIDEO LESSON - ВСЕГДА В ПАПКУ "ВидеоУрок"
  // =========================

  addVideoLesson: async (newData) => {
    try {
      console.log("📝 Создание видеоурока:", newData);

      const videoFolder = await get().ensureVideoFolderExists();

      if (!videoFolder) {
        throw new Error(`Папка "${VIDEO_FOLDER_NAME}" не найдена`);
      }

      console.log("📁 Создаём в папке:", videoFolder.id, videoFolder.name);

      const formData = new FormData();
      
      formData.append("Title", newData.title || "");
      formData.append("Content", newData.content || "");
      formData.append("SubDepartmentId", String(Number(newData.subDepartmentId ?? 0)));
      formData.append("EmployeeId", String(Number(newData.employeeId ?? 0)));
      
      // ВСЕГДА в папку "ВидеоУрок"
      formData.append("FolderId", String(Number(videoFolder.id)));

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

      await get().fetchVideoLessons();
      await get().fetchAllFolders();

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

      const videoFolder = await get().ensureVideoFolderExists();

      if (!videoFolder) {
        throw new Error(`Папка "${VIDEO_FOLDER_NAME}" не найдена`);
      }

      const formData = new FormData();
      
      formData.append("Title", updatedData.title || "");
      formData.append("Content", updatedData.content || "");
      
      if (updatedData.subDepartmentId !== null && updatedData.subDepartmentId !== undefined) {
        formData.append("SubDepartmentId", String(Number(updatedData.subDepartmentId)));
      }
      
      if (updatedData.employeeId !== null && updatedData.employeeId !== undefined) {
        formData.append("EmployeeId", String(Number(updatedData.employeeId)));
      }
      
      // ВСЕГДА в папку "ВидеоУрок"
      formData.append("FolderId", String(Number(videoFolder.id)));

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
      await get().fetchAllFolders();

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
      
      await get().fetchVideoLessons();
      await get().fetchAllFolders();
    } catch (error) {
      console.error("❌ Ошибка удаления видеоурока:", error);
      throw error;
    }
  },
}));