// src/store/useVideoLesson.js
import { create } from "zustand";
import {
  getFoldersByType,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/api.service.folder";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api.service.announcement";
import { FOLDER_TYPES } from "../constants/folderTypes";

export const useVideoLessonStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================

  videoLessons: [],
  allFolders: [],
  currentVideoLesson: null,
  loading: false,
  error: null,

  // =========================
  // FETCH ALL FOLDERS - ТОЛЬКО ПАПКИ ВИДЕОУРОКОВ (folderType = 1)
  // =========================

  fetchAllFolders: async () => {
    try {
      console.log("📁 Загрузка папок видеоуроков...");
      
      // Запрашиваем папки с folderType = 1 (видеоуроки)
      const response = await getFoldersByType(FOLDER_TYPES.VIDEO);
      
      // Нормализуем ответ
      let folders = [];
      if (response?.data && Array.isArray(response.data)) {
        folders = response.data;
      } else if (Array.isArray(response)) {
        folders = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        folders = response.$values;
      }

      // Фильтруем по folderType на всякий случай
      const filteredFolders = folders.filter(folder => 
        folder.folderType === FOLDER_TYPES.VIDEO
      );

      console.log("📁 Получены папки видео:", filteredFolders);
      set({ allFolders: filteredFolders });
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
  // FETCH VIDEO LESSONS
  // =========================

  // =========================
// FETCH VIDEO LESSONS
// =========================

fetchVideoLessons: async () => {
  set({ loading: true, error: null });

  try {
    console.log("🎬 Загрузка видеоуроков...");

    // Получаем только папки с folderType = VIDEO
    const folders = await get().fetchAllFolders();

    console.log("📁 Папки видео:", folders);

    // Берем объявления непосредственно из каждой папки
    const videoLessons = folders.flatMap((folder) => {
      const announcements = Array.isArray(folder.announcements)
        ? folder.announcements
        : [];

      return announcements.map((announcement) => ({
        ...announcement,

        // ID папки
        folderId: folder.id,

        // Дополнительная информация о папке
        folderName: folder.name,
        folderType: folder.folderType,
      }));
    });

    console.log("🎬 Найдено видеоуроков:", videoLessons.length);
    console.log("🎬 Видеоуроки:", videoLessons);

    set({
      videoLessons,
      loading: false,
      error: null,
    });

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
  // CREATE FOLDER
  // =========================

  createNewFolder: async (folderData) => {
    try {
      console.log("📁 Создание папки видеоуроков:", folderData);
      
      // Создаем папку с folderType = 1 (видеоуроки)
      const newFolder = await createFolder({
        name: folderData.name,
        description: folderData.description || "Папка видеоуроков",
        folderType: FOLDER_TYPES.VIDEO, // Важно!
      });

      console.log("✅ Папка видеоуроков создана:", newFolder);
      await get().fetchAllFolders();
      return newFolder;
    } catch (error) {
      console.error("❌ Ошибка создания папки:", error);
      throw error;
    }
  },

  // =========================
  // UPDATE FOLDER
  // =========================

  updateFolder: async (folderId, folderData) => {
    try {
      console.log(`📁 Обновление папки ${folderId}:`, folderData);
      
      const updated = await updateFolder(folderId, {
        ...folderData,
        folderType: FOLDER_TYPES.VIDEO, // Сохраняем тип
      });
      
      console.log("✅ Папка обновлена:", updated);
      await get().fetchAllFolders();
      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления папки:", error);
      throw error;
    }
  },

  // =========================
  // DELETE FOLDER
  // =========================

  deleteFolder: async (folderId) => {
    try {
      console.log(`🗑️ Удаление папки ${folderId}`);
      
      // Получаем все видео в этой папке
      const videosToDelete = get().videoLessons.filter(
        video => Number(video.folderId) === Number(folderId)
      );
      
      // Удаляем все видео из папки
      for (const video of videosToDelete) {
        try {
          await deleteAnnouncement(video.id);
          console.log(`✅ Видео ${video.id} удалено`);
        } catch (error) {
          console.error(`❌ Ошибка удаления видео ${video.id}:`, error);
        }
      }
      
      // Удаляем папку
      await deleteFolder(folderId);
      console.log("✅ Папка удалена");
      
      // Обновляем состояние
      set((state) => ({
        videoLessons: state.videoLessons.filter(
          video => Number(video.folderId) !== Number(folderId)
        ),
      }));
      
      await get().fetchAllFolders();
      return true;
    } catch (error) {
      console.error("❌ Ошибка удаления папки:", error);
      throw error;
    }
  },

  // =========================
  // CREATE VIDEO LESSON
  // =========================

  addVideoLesson: async (newData) => {
    try {
      console.log("📝 Создание видеоурока:", newData);

      const formData = new FormData();
      
      formData.append("Title", newData.title || "");
      formData.append("Content", newData.content || "");
      formData.append("SubDepartmentId", String(Number(newData.subDepartmentId ?? 0)));
      formData.append("EmployeeId", String(Number(newData.employeeId ?? 0)));
      
      // Проверяем, что folderId принадлежит папке видео
      if (newData.folderId) {
        const folders = get().allFolders;
        const folderExists = folders.some(f => Number(f.id) === Number(newData.folderId));
        if (folderExists) {
          formData.append("FolderId", String(Number(newData.folderId)));
          console.log(`📁 Создаём видео в папке ID: ${newData.folderId}`);
        } else {
          console.warn(`⚠️ Папка ${newData.folderId} не найдена в видео`);
          formData.append("FolderId", "0");
        }
      } else {
        formData.append("FolderId", "0");
      }

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

      const response = await createAnnouncement(formData);
      console.log("✅ Видеоурок создан:", response);

      await get().fetchVideoLessons();
      return response;
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
      console.log("✏️ Обновление видеоурока:", id, updatedData);

      const formData = new FormData();
      formData.append("Title", updatedData.title || "");
      formData.append("Content", updatedData.content || "");
      
      if (updatedData.subDepartmentId !== null && updatedData.subDepartmentId !== undefined) {
        formData.append("SubDepartmentId", String(Number(updatedData.subDepartmentId)));
      }
      
      if (updatedData.employeeId !== null && updatedData.employeeId !== undefined) {
        formData.append("EmployeeId", String(Number(updatedData.employeeId)));
      }
      
      if (updatedData.folderId !== null && updatedData.folderId !== undefined) {
        const folders = get().allFolders;
        const folderExists = folders.some(f => Number(f.id) === Number(updatedData.folderId));
        if (folderExists || updatedData.folderId === 0) {
          formData.append("FolderId", String(Number(updatedData.folderId || 0)));
          console.log(`📁 Перемещаем видео в папку ID: ${updatedData.folderId}`);
        } else {
          console.warn(`⚠️ Папка ${updatedData.folderId} не найдена`);
          formData.append("FolderId", "0");
        }
      }

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
      await get().fetchVideoLessons();
    } catch (error) {
      console.error("❌ Ошибка удаления видеоурока:", error);
      throw error;
    }
  },

  // =========================
  // MOVE VIDEO TO FOLDER
  // =========================

  moveVideoToFolder: async (videoId, folderId) => {
    try {
      console.log(`📦 Перемещение видео ${videoId} в папку ${folderId}`);
      
      const video = get().videoLessons.find(v => Number(v.id) === Number(videoId));
      if (!video) {
        throw new Error("Видео не найдено");
      }
      
      // Проверяем, что папка существует в видео
      if (folderId) {
        const folders = get().allFolders;
        const folderExists = folders.some(f => Number(f.id) === Number(folderId));
        if (!folderExists) {
          throw new Error("Папка не найдена в видеоуроках");
        }
      }
      
      await get().editVideoLesson(videoId, {
        ...video,
        folderId: folderId || 0,
      });
      
      console.log("✅ Видео перемещено");
      return true;
    } catch (error) {
      console.error("❌ Ошибка перемещения видео:", error);
      throw error;
    }
  },
}));