// src/store/useDocumentation.js

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

// Константа для типа папки документации
const DOCUMENTATION_FOLDER_TYPE = "documentation";

export const useDocumentationStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================

  documents: [],
  allFolders: [],
  currentDocument: null,
  loading: false,
  error: null,

  // =========================
  // FETCH ALL FOLDERS - ТОЛЬКО ПАПКИ ДОКУМЕНТАЦИИ
  // =========================

  fetchAllFolders: async () => {
    try {
      console.log("📁 Загрузка папок документации...");
      const response = await getFolders();
      
      let folders = [];
      if (response?.data && Array.isArray(response.data)) {
        folders = response.data;
      } else if (Array.isArray(response)) {
        folders = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        folders = response.$values;
      }

      // ФИЛЬТРУЕМ: исключаем папку "ВидеоУрок" и показываем только папки документации
      const filteredFolders = folders.filter(folder => {
        const isVideoFolder = folder.name?.toLowerCase() === "видеоурок";
        const isDocFolder = folder.type === DOCUMENTATION_FOLDER_TYPE || 
                           folder.type === "docs" ||
                           !folder.type?.includes("video"); // Если type не видео-папка
        
        return !isVideoFolder && isDocFolder;
      });

      set({ allFolders: filteredFolders });
      console.log(`📁 Загружено папок документации: ${filteredFolders.length}`);
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
  // CREATE FOLDER
  // =========================

  createNewFolder: async (folderData) => {
    try {
      console.log("📁 Создание папки документации:", folderData);
      
      const newFolder = await createFolder({
        name: folderData.name,
        description: folderData.description || "Папка документации",
        type: DOCUMENTATION_FOLDER_TYPE, // Указываем тип
      });

      console.log("✅ Папка документации создана:", newFolder);
      
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
        type: DOCUMENTATION_FOLDER_TYPE,
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
  // FETCH DOCUMENTS
  // =========================

  fetchDocuments: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const folders = await get().fetchAllFolders();
      let allDocs = [];
      
      folders.forEach(folder => {
        if (folder.announcements) {
          const docs = Array.isArray(folder.announcements) 
            ? folder.announcements 
            : (folder.announcements.$values || []);
          
          docs.forEach(doc => {
            doc.folderId = folder.id;
            doc.folderName = folder.name;
          });
          
          allDocs = [...allDocs, ...docs];
        }
      });
      
      console.log(`📄 Всего документов: ${allDocs.length}`);
      set({
        documents: allDocs,
        loading: false,
      });
      
      return allDocs;
    } catch (error) {
      console.error("❌ Ошибка загрузки документов:", error);
      set({
        documents: [],
        loading: false,
        error: error.response?.data?.message || error.message || "Ошибка загрузки документов",
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

      const formData = new FormData();
      
      formData.append("Title", newData.title || "");
      formData.append("Content", newData.content || "");
      formData.append("SubDepartmentId", String(Number(newData.subDepartmentId ?? 0)));
      formData.append("EmployeeId", String(Number(newData.employeeId ?? 0)));
      
      if (newData.folderId) {
        formData.append("FolderId", String(Number(newData.folderId)));
        console.log(`📁 Создаём документ в папке ID: ${newData.folderId}`);
      } else {
        console.warn("⚠️ FolderId не указан, документ будет без папки");
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

      console.log("📤 Отправляем FormData:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? value.name : value);
      }

      const response = await createAnnouncement(formData);

      console.log("✅ Документ создан:", response);

      await get().fetchDocuments();
      await get().fetchAllFolders();

      return response;
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
      console.log("✏️ Обновление документа:", id, updatedData);

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
        formData.append("FolderId", String(Number(updatedData.folderId)));
        console.log(`📁 Перемещаем документ в папку ID: ${updatedData.folderId}`);
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

      console.log("📤 Отправляем FormData на обновление:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? value.name : value);
      }

      const updated = await updateAnnouncement(id, formData);

      console.log("✅ Документ обновлен:", updated);

      await get().fetchDocuments();
      await get().fetchAllFolders();

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
      
      await get().fetchDocuments();
      await get().fetchAllFolders();
    } catch (error) {
      console.error("❌ Ошибка удаления документа:", error);
      throw error;
    }
  },

  // =========================
  // MOVE DOCUMENT TO FOLDER
  // =========================

  moveDocumentToFolder: async (docId, folderId) => {
    try {
      console.log(`📦 Перемещение документа ${docId} в папку ${folderId}`);
      
      const doc = get().documents.find(d => Number(d.id) === Number(docId));
      if (!doc) {
        throw new Error("Документ не найден");
      }
      
      await get().editDocument(docId, {
        ...doc,
        folderId: folderId,
      });
      
      console.log("✅ Документ перемещен");
      return true;
    } catch (error) {
      console.error("❌ Ошибка перемещения документа:", error);
      throw error;
    }
  },
}));