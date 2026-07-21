import { create } from "zustand";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
} from "../services/api.service.announcement";

// 🎯 ID ПАПКИ ДЛЯ ВИДЕОУРОКОВ
const VIDEO_FOLDER_ID = 1;

export const useVideoLessonStore = create((set, get) => ({
  videoLessons: [],
  currentVideoLesson: null,
  loading: false,
  error: null,

  // ✅ ЗАГРУЖАЕМ ТОЛЬКО ВИДЕОУРОКИ (folderId === 1)
  fetchVideoLessons: async () => {
    set({ loading: true, error: null });

    try {
      const res = await getAnnouncement();
      
      // 🔥 ИСПРАВКА: API возвращает папки (folders) с объявлениями (announcements) внутри!
      const folders = Array.isArray(res.data) ? res.data : [];
      
      console.log(`📁 Всего папок: ${folders.length}`);
      
      // Распаковываем все объявления из всех папок
      const allAnnouncements = [];
      folders.forEach(folder => {
        console.log(`📂 Папка ID: ${folder.id}, Название: "${folder.name}", Объявлений: ${folder.announcements?.length || 0}`);
        if (folder.announcements && Array.isArray(folder.announcements)) {
          allAnnouncements.push(...folder.announcements);
        }
      });
      
      console.log(`📊 fetchVideoLessons - Всего объявлений: ${allAnnouncements.length}`);
      console.log(`🎯 Фильтруем по folderId: ${VIDEO_FOLDER_ID}`);
      
      // ✅ ФИЛЬТРУЕМ ТОЛЬКО ВИДЕОУРОКИ (folderId === 1)
      const result = allAnnouncements.filter(item => {
        return item.folderId === VIDEO_FOLDER_ID;
      });

      console.log(`✅ fetchVideoLessons - Загружено ${result.length} видеоуроков`);
      
      if (result.length === 0) {
        console.warn("⚠️  Видеоуроков не найдено");
        console.log("📋 Объявления по папкам:", 
          allAnnouncements.reduce((acc, item) => {
            acc[item.folderId] = (acc[item.folderId] || 0) + 1;
            return acc;
          }, {})
        );
      }
      
      set({ videoLessons: result, loading: false });

    } catch (err) {
      console.error("❌ fetchVideoLessons - Ошибка:", err);
      set({ error: err.message, loading: false });
    }
  },

  fetchVideoLessonById: async (id) => {
    set({ loading: true });

    try {
      const res = await getAnnouncement();
      const folders = Array.isArray(res.data) ? res.data : [];
      
      let lesson = null;
      for (const folder of folders) {
        if (folder.announcements && Array.isArray(folder.announcements)) {
          lesson = folder.announcements.find(item => 
            item.id === id && item.folderId === VIDEO_FOLDER_ID
          );
          if (lesson) break;
        }
      }
      
      if (lesson) {
        set({ currentVideoLesson: lesson, loading: false });
        return lesson;
      } else {
        throw new Error("Видеоурок не найден");
      }
    } catch (err) {
      console.error("❌ fetchVideoLessonById - Ошибка:", err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ✅ ДОБАВЛЯЕМ С ПАПКОЙ folderId = 1
  addVideoLesson: async (newData) => {
    try {
      console.log("📝 addVideoLesson - Создание видеоурока:", newData);
      
      const dataToSend = {
        ...newData,
        folderId: VIDEO_FOLDER_ID, // 🎯 АВТОМАТИЧЕСКИ НАЗНАЧАЕМ ПАПКУ 1
      };
      
      console.log("📤 Отправляем с folderId:", VIDEO_FOLDER_ID);
      const res = await createAnnouncement(dataToSend);
      console.log("✅ addVideoLesson - Создан:", res);

      set((state) => ({
        videoLessons: [...state.videoLessons, res],
      }));
      return res;
    } catch (err) {
      console.error("❌ addVideoLesson - Ошибка:", err);
      throw err;
    }
  },

  // ✅ ОБНОВЛЯЕМ И СОХРАНЯЕМ ПАПКУ
  editVideoLesson: async (id, updatedData) => {
    try {
      console.log("✏️ editVideoLesson - Обновление ID:", id);
      
      const dataToSend = {
        ...updatedData,
        folderId: VIDEO_FOLDER_ID, // 🎯 СОХРАНЯЕМ ПАПКУ 1
      };
      
      const res = await updateAnnouncement(id, dataToSend);

      set((state) => ({
        videoLessons: state.videoLessons.map((item) =>
          item.id === id ? res : item
        ),
      }));
      console.log("✅ editVideoLesson - Обновлен");
      return res;
    } catch (err) {
      console.error("❌ editVideoLesson - Ошибка:", err);
      throw err;
    }
  },

  removeVideoLesson: async (id) => {
    try {
      console.log("🗑️ removeVideoLesson - Удаление ID:", id);
      await deleteAnnouncement(id);

      set((state) => ({
        videoLessons: state.videoLessons.filter(item => item.id !== id),
      }));
      console.log("✅ removeVideoLesson - Удален");
    } catch (err) {
      console.error("❌ removeVideoLesson - Ошибка:", err);
      throw err;
    }
  },
}));