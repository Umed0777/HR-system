// src/store/useFolder.js
import { create } from "zustand";

import {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/api.service.folder";

export const useFolderStore = create((set, get) => ({
  // =========================
  // STATE
  // =========================

  folders: [],
  loading: false,
  error: null,
  selectedFolder: null,

  // =========================
  // GET ALL FOLDERS
  // =========================

  fetchFolders: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const response = await getFolders();

      console.log("📁 Полный ответ Folder API:", response);

      // Backend:
      // {
      //   statusCode: 0,
      //   data: [...]
      // }

      const folders = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      console.log("📁 Полученные папки:", folders);

      set({
        folders,
        loading: false,
      });

      return folders;
    } catch (error) {
      console.error("❌ Ошибка загрузки папок:", error);

      set({
        loading: false,
        error: error.message || "Ошибка загрузки папок",
      });

      throw error;
    }
  },

  // =========================
  // GET FOLDER BY ID
  // =========================

  getFolderById: async (id) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const response = await getFolderById(id);

      console.log(`📁 Папка ${id}:`, response);

      const folder = response?.data || response;

      set({
        selectedFolder: folder,
        loading: false,
      });

      return folder;
    } catch (error) {
      console.error("❌ Ошибка получения папки:", error);

      set({
        loading: false,
        error: error.message || "Ошибка получения папки",
      });

      throw error;
    }
  },

  // =========================
  // CREATE FOLDER
  // =========================

  addFolder: async (data) => {
    try {
      console.log("📁 Создание папки:", data);

      const response = await createFolder(data);

      console.log("✅ Ответ создания папки:", response);

      const newFolder = response?.data || response;

      set((state) => ({
        folders: [...state.folders, newFolder],
      }));

      return newFolder;
    } catch (error) {
      console.error("❌ Ошибка создания папки:", error);
      throw error;
    }
  },

  // =========================
  // UPDATE FOLDER
  // =========================

  updateFolder: async (id, data) => {
    try {
      console.log("✏️ Обновление папки:", id, data);

      const response = await updateFolder(id, data);

      console.log("✅ Ответ обновления:", response);

      const updatedFolder = response?.data || response;

      set((state) => ({
        folders: state.folders.map((folder) =>
          Number(folder.id) === Number(id)
            ? updatedFolder
            : folder
        ),
      }));

      return updatedFolder;
    } catch (error) {
      console.error("❌ Ошибка обновления папки:", error);
      throw error;
    }
  },

  // =========================
  // DELETE FOLDER
  // =========================

  deleteFolder: async (id) => {
    try {
      console.log("🗑️ Удаление папки:", id);

      await deleteFolder(id);

      set((state) => ({
        folders: state.folders.filter(
          (folder) => Number(folder.id) !== Number(id)
        ),
      }));

      console.log("✅ Папка удалена");
    } catch (error) {
      console.error("❌ Ошибка удаления папки:", error);
      throw error;
    }
  },

  // =========================
  // GET FOLDER FROM STORE
  // =========================

  getFolderFromStore: (id) => {
    const state = get();

    return (
      state.folders.find(
        (folder) => Number(folder.id) === Number(id)
      ) || null
    );
  },

  // =========================
  // GET VIDEO FOLDER
  // =========================

  getVideoFolder: () => {
    const state = get();

    return (
      state.folders.find(
        (folder) =>
          folder.name?.toLowerCase() === "видеоурок" ||
          folder.name?.toLowerCase() === "видеоуроки"
      ) || null
    );
  },

  // =========================
  // GET DOCUMENT FOLDER
  // =========================

  getDocumentFolder: () => {
    const state = get();

    return (
      state.folders.find(
        (folder) =>
          folder.name?.toLowerCase() === "документация" ||
          folder.name?.toLowerCase() === "документы"
      ) || null
    );
  },

  // =========================
  // GET FOLDER BY NAME
  // =========================

  getFolderByName: (name) => {
    const state = get();

    if (!name) return null;

    return (
      state.folders.find(
        (folder) =>
          folder.name?.toLowerCase() === name.toLowerCase()
      ) || null
    );
  },
}));