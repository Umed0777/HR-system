// src/store/useDocumentation.js

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

const DOCUMENT_FOLDER_NAME = "Документация";

export const useDocumentationStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================

  documents: [],
  currentDocument: null,
  documentFolder: null,
  loading: false,
  error: null,

  // =========================
  // FIND DOCUMENT FOLDER
  // =========================

  findDocumentFolder: (folders) => {
    if (!Array.isArray(folders)) {
      return null;
    }

    const folder = folders.find(
      (item) =>
        item.name?.toLowerCase() === DOCUMENT_FOLDER_NAME.toLowerCase() ||
        item.name?.toLowerCase() === "документы"
    );

    console.log("📚 Найдена папка документации:", folder);
    return folder || null;
  },

  // =========================
  // CREATE DOCUMENT FOLDER IF NOT EXISTS
  // =========================

  ensureDocumentFolderExists: async () => {
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
      let documentFolder = get().findDocumentFolder(folders);

      // Если папка не найдена - создаём
      if (!documentFolder) {
        console.log(`🆕 Папка "${DOCUMENT_FOLDER_NAME}" не найдена, создаём...`);
        
        const newFolder = await createFolder({
          name: DOCUMENT_FOLDER_NAME,
          description: "Папка для документации",
        });

        console.log("✅ Папка создана:", newFolder);

        // Обновляем state
        documentFolder = newFolder;
        set({ documentFolder: newFolder });

        return newFolder;
      }

      // Папка найдена
      set({ documentFolder });
      return documentFolder;
    } catch (error) {
      console.error("❌ Ошибка при работе с папкой документации:", error);
      throw error;
    }
  },

  // =========================
  // FETCH DOCUMENTS
  // =========================

  fetchDocuments: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      // Сначала убеждаемся, что папка существует
      const documentFolder = await get().ensureDocumentFolderExists();

      if (!documentFolder) {
        console.warn(`⚠️ Не удалось создать папку "${DOCUMENT_FOLDER_NAME}"`);
        set({
          documents: [],
          documentFolder: null,
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
        (f) => Number(f.id) === Number(documentFolder.id)
      );

      // Берем announcements из папки
      const documents = updatedFolder?.announcements 
        ? (Array.isArray(updatedFolder.announcements) 
            ? updatedFolder.announcements 
            : updatedFolder.announcements.$values || [])
        : [];

      set({
        documents,
        documentFolder: updatedFolder || documentFolder,
        loading: false,
      });

      console.log(`✅ Загружено документов: ${documents.length}`);
      return documents;
    } catch (error) {
      console.error("❌ Ошибка загрузки документов:", error);

      set({
        documents: [],
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Ошибка загрузки документов",
      });

      throw error;
    }
  },

  // =========================
  // CREATE DOCUMENT
  // =========================

  addDocument: async (newData) => {
    try {
      console.log("📝 Создание документа:", newData);

      // Убеждаемся, что папка существует
      const documentFolder = await get().ensureDocumentFolderExists();

      if (!documentFolder) {
        throw new Error(`Папка "${DOCUMENT_FOLDER_NAME}" не найдена и не может быть создана`);
      }

      console.log("📁 Создаём в папке:", documentFolder.id, documentFolder.name);

      // Создаем FormData для отправки
      const formData = new FormData();
      
      // Добавляем текстовые поля
      formData.append("Title", newData.title || "");
      formData.append("Content", newData.content || "");
      formData.append("SubDepartmentId", String(Number(newData.subDepartmentId ?? 0)));
      formData.append("EmployeeId", String(Number(newData.employeeId ?? 0)));
      formData.append("FolderId", String(Number(documentFolder.id)));

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

      console.log("✅ Документ создан:", responseAnnouncement);

      // Обновляем список
      await get().fetchDocuments();

      return responseAnnouncement;
    } catch (error) {
      console.error("❌ Ошибка создания документа:", error);
      throw error;
    }
  },

  // =========================
  // UPDATE DOCUMENT
  // =========================

  editDocument: async (id, updatedData) => {
    try {
      console.log("✏️ Обновление документа:", id);

      // Убеждаемся, что папка существует
      const documentFolder = await get().ensureDocumentFolderExists();

      if (!documentFolder) {
        throw new Error(`Папка "${DOCUMENT_FOLDER_NAME}" не найдена и не может быть создана`);
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
      
      formData.append("FolderId", String(Number(documentFolder.id)));

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

      console.log("✅ Документ обновлен:", updated);

      await get().fetchDocuments();

      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления документа:", error);
      throw error;
    }
  },

  // =========================
  // DELETE DOCUMENT
  // =========================

  removeDocument: async (id) => {
    try {
      console.log("🗑️ Удаление документа:", id);

      await deleteAnnouncement(id);

      set((state) => ({
        documents: state.documents.filter(
          (item) => Number(item.id) !== Number(id)
        ),
      }));

      console.log("✅ Документ удален");
      
      // Обновляем папку
      await get().fetchDocuments();
    } catch (error) {
      console.error("❌ Ошибка удаления документа:", error);
      throw error;
    }
  },
}));