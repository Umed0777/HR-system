// src/store/useDocumentation.js
import { create } from "zustand";
import {
  getFolders,
  getFoldersByType,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/api.service.folder";
import {
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api.service.announcement";
import { FOLDER_TYPES } from "../constants/folderTypes";

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
  // FETCH ALL FOLDERS - ТОЛЬКО ПАПКИ ДОКУМЕНТАЦИИ (folderType = 2)
  // =========================

  fetchAllFolders: async () => {
    try {
      console.log("📁 Загрузка папок документации...");
      
      // Запрашиваем папки с folderType = 2 (документация)
      const response = await getFoldersByType(FOLDER_TYPES.DOCUMENTATION);
      
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
        folder.folderType === FOLDER_TYPES.DOCUMENTATION
      );

      console.log("📁 Получены папки документации:", filteredFolders);
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
  // FETCH DOCUMENTS
  // =========================

  fetchDocuments: async () => {
    set({ loading: true, error: null });

    try {
      // Получаем папки документации
      const folders = await get().fetchAllFolders();
      const folderIds = folders.map(f => f.id);
      
      console.log("📁 ID папок документации:", folderIds);

      // Если нет папок, возвращаем пустой массив
      if (folderIds.length === 0) {
        console.log("📁 Нет папок документации");
        set({ documents: [], loading: false });
        return [];
      }

      // Загружаем все объявления
      const response = await getAnnouncement();
      
      let allAnnouncements = [];
      if (response?.data && Array.isArray(response.data)) {
        allAnnouncements = response.data;
      } else if (Array.isArray(response)) {
        allAnnouncements = response;
      } else if (response?.$values && Array.isArray(response.$values)) {
        allAnnouncements = response.$values;
      }

      console.log(`📄 Всего объявлений: ${allAnnouncements.length}`);

      // Фильтруем объявления по folderId
      const docAnnouncements = allAnnouncements.filter(ann => {
        if (ann.folderId) {
          return folderIds.includes(Number(ann.folderId));
        }
        return false; // Объявления без папки не показываем в документации
      });

      // Добавляем информацию о папке
      const enrichedDocs = docAnnouncements.map(doc => {
        const folder = folders.find(f => Number(f.id) === Number(doc.folderId));
        return {
          ...doc,
          folderName: folder ? folder.name : null,
          folderType: folder ? folder.folderType : null,
        };
      });

      console.log(`📚 Всего документов: ${enrichedDocs.length}`);
      set({
        documents: enrichedDocs,
        loading: false,
      });
      
      return enrichedDocs;
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
  // CREATE FOLDER
  // =========================

  createNewFolder: async (folderData) => {
    try {
      console.log("📁 Создание папки документации:", folderData);
      
      // Создаем папку с folderType = 2 (документация)
      const newFolder = await createFolder({
        name: folderData.name,
        description: folderData.description || "Папка документации",
        folderType: FOLDER_TYPES.DOCUMENTATION, // Важно!
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
        folderType: FOLDER_TYPES.DOCUMENTATION, // Сохраняем тип
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
      
      // Получаем все документы в этой папке
      const docsToDelete = get().documents.filter(
        doc => Number(doc.folderId) === Number(folderId)
      );
      
      // Удаляем все документы из папки
      for (const doc of docsToDelete) {
        try {
          await deleteAnnouncement(doc.id);
          console.log(`✅ Документ ${doc.id} удален`);
        } catch (error) {
          console.error(`❌ Ошибка удаления документа ${doc.id}:`, error);
        }
      }
      
      // Удаляем папку
      await deleteFolder(folderId);
      console.log("✅ Папка удалена");
      
      // Обновляем состояние
      set((state) => ({
        documents: state.documents.filter(
          doc => Number(doc.folderId) !== Number(folderId)
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
        const folders = get().allFolders;
        const folderExists = folders.some(f => Number(f.id) === Number(newData.folderId));
        if (folderExists) {
          formData.append("FolderId", String(Number(newData.folderId)));
          console.log(`📁 Создаём документ в папке ID: ${newData.folderId}`);
        } else {
          console.warn(`⚠️ Папка ${newData.folderId} не найдена в документации`);
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
      console.log("✅ Документ создан:", response);

      await get().fetchDocuments();
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
        const folders = get().allFolders;
        const folderExists = folders.some(f => Number(f.id) === Number(updatedData.folderId));
        if (folderExists || updatedData.folderId === 0) {
          formData.append("FolderId", String(Number(updatedData.folderId || 0)));
          console.log(`📁 Перемещаем документ в папку ID: ${updatedData.folderId}`);
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
      await get().fetchDocuments();
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
      
      if (folderId) {
        const folders = get().allFolders;
        const folderExists = folders.some(f => Number(f.id) === Number(folderId));
        if (!folderExists) {
          throw new Error("Папка не найдена в документации");
        }
      }
      
      await get().editDocument(docId, {
        ...doc,
        folderId: folderId || 0,
      });
      
      console.log("✅ Документ перемещен");
      return true;
    } catch (error) {
      console.error("❌ Ошибка перемещения документа:", error);
      throw error;
    }
  },
}));