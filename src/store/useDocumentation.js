import { create } from "zustand";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
} from "../services/api.service.announcement";

// 🎯 ID ПАПКИ ДЛЯ ДОКУМЕНТОВ
const DOCUMENT_FOLDER_ID = 2;

export const useDocumentationStore = create((set, get) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,

  // ✅ ЗАГРУЖАЕМ ТОЛЬКО ДОКУМЕНТЫ (folderId === 2)
  fetchDocuments: async () => {
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
      
      console.log(`📊 fetchDocuments - Всего объявлений: ${allAnnouncements.length}`);
      console.log(`🎯 Фильтруем по folderId: ${DOCUMENT_FOLDER_ID}`);
      
      // ✅ ФИЛЬТРУЕМ ТОЛЬКО ДОКУМЕНТЫ (folderId === 2)
      const result = allAnnouncements.filter(item => {
        return item.folderId === DOCUMENT_FOLDER_ID;
      });

      console.log(`✅ fetchDocuments - Загружено ${result.length} документов`);
      
      if (result.length === 0) {
        console.warn("⚠️  Документов не найдено");
        console.log("📋 Объявления по папкам:", 
          allAnnouncements.reduce((acc, item) => {
            acc[item.folderId] = (acc[item.folderId] || 0) + 1;
            return acc;
          }, {})
        );
      }
      
      set({ documents: result, loading: false });

    } catch (err) {
      console.error("❌ fetchDocuments - Ошибка:", err);
      set({ error: err.message, loading: false });
    }
  },

  fetchDocumentById: async (id) => {
    set({ loading: true });

    try {
      const res = await getAnnouncement();
      const folders = Array.isArray(res.data) ? res.data : [];
      
      let doc = null;
      for (const folder of folders) {
        if (folder.announcements && Array.isArray(folder.announcements)) {
          doc = folder.announcements.find(item => 
            item.id === id && item.folderId === DOCUMENT_FOLDER_ID
          );
          if (doc) break;
        }
      }
      
      if (doc) {
        set({ currentDocument: doc, loading: false });
        return doc;
      } else {
        throw new Error("Документ не найден");
      }
    } catch (err) {
      console.error("❌ fetchDocumentById - Ошибка:", err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ✅ ДОБАВЛЯЕМ С ПАПКОЙ folderId = 2
  addDocument: async (newData) => {
    try {
      console.log("📝 addDocument - Создание документа:", newData);
      
      const dataToSend = {
        ...newData,
        folderId: DOCUMENT_FOLDER_ID, // 🎯 АВТОМАТИЧЕСКИ НАЗНАЧАЕМ ПАПКУ 2
      };
      
      console.log("📤 Отправляем с folderId:", DOCUMENT_FOLDER_ID);
      const res = await createAnnouncement(dataToSend);
      console.log("✅ addDocument - Создан:", res);

      set((state) => ({
        documents: [...state.documents, res],
      }));
      return res;
    } catch (err) {
      console.error("❌ addDocument - Ошибка:", err);
      throw err;
    }
  },

  // ✅ ОБНОВЛЯЕМ И СОХРАНЯЕМ ПАПКУ
  editDocument: async (id, updatedData) => {
    try {
      console.log("✏️ editDocument - Обновление ID:", id);
      
      const dataToSend = {
        ...updatedData,
        folderId: DOCUMENT_FOLDER_ID, // 🎯 СОХРАНЯЕМ ПАПКУ 2
      };
      
      const res = await updateAnnouncement(id, dataToSend);

      set((state) => ({
        documents: state.documents.map((item) =>
          item.id === id ? res : item
        ),
      }));
      console.log("✅ editDocument - Обновлен");
      return res;
    } catch (err) {
      console.error("❌ editDocument - Ошибка:", err);
      throw err;
    }
  },

  removeDocument: async (id) => {
    try {
      console.log("🗑️ removeDocument - Удаление ID:", id);
      await deleteAnnouncement(id);

      set((state) => ({
        documents: state.documents.filter(item => item.id !== id),
      }));
      console.log("✅ removeDocument - Удален");
    } catch (err) {
      console.error("❌ removeDocument - Ошибка:", err);
      throw err;
    }
  },
}));