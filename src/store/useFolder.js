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
  folders: [],
  loading: false,
  selectedFolder: null,

  fetchFolders: async () => {
    set({ loading: true });
    try {
      const res = await getFolders();
      set({
        folders: res.data || [],
        loading: false,
      });
      return res.data || [];
    } catch (error) {
      console.error("Ошибка загрузки папок:", error);
      set({ loading: false });
      throw error;
    }
  },

  getFolderById: async (id) => {
    set({ loading: true });
    try {
      const res = await getFolderById(id);
      set({
        selectedFolder: res.data,
        loading: false,
      });
      return res.data;
    } catch (error) {
      console.error("Ошибка получения папки:", error);
      set({ loading: false });
      throw error;
    }
  },

  addFolder: async (data) => {
    try {
      console.log("📁 addFolder - Создание папки:", data);
      const res = await createFolder(data);
      console.log("✅ addFolder - Папка создана:", res.data);
      set((state) => ({
        folders: [...state.folders, res.data],
      }));
      return res.data;
    } catch (error) {
      console.error("❌ Ошибка создания папки:", error);
      throw error;
    }
  },

  updateFolder: async (id, data) => {
    try {
      console.log("✏️ updateFolder - Обновление папки:", id, data);
      const res = await updateFolder(id, data);
      console.log("✅ updateFolder - Папка обновлена:", res.data);
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === id ? res.data : f
        ),
      }));
      return res.data;
    } catch (error) {
      console.error("❌ Ошибка обновления папки:", error);
      throw error;
    }
  },

  deleteFolder: async (id) => {
    try {
      console.log("🗑️ deleteFolder - Удаление папки:", id);
      await deleteFolder(id);
      console.log("✅ deleteFolder - Папка удалена");
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
      }));
    } catch (error) {
      console.error("❌ Ошибка удаления папки:", error);
      throw error;
    }
  },

  getFolderFromStore: (id) => {
    const state = get();
    return state.folders.find(f => f.id === id) || null;
  },

  // Получаем папки для видеоуроков
  getVideoFolders: () => {
    const state = get();
    return state.folders.filter(f => f.type === "video" || f.name === "ВидеоУрок");
  },

  // Получаем папки для документации
  getDocFolders: () => {
    const state = get();
    return state.folders.filter(f => f.type === "document" || f.name === "документация");
  },

  // Получаем все папки с типом
  getFoldersByType: (type) => {
    const state = get();
    return state.folders.filter(f => f.type === type);
  },
}));