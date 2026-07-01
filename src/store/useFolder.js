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
    } catch (error) {
      console.error("Ошибка загрузки папок:", error);
      set({ loading: false });
    }
  },

  // GET BY ID
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
      const res = await createFolder(data);
      set((state) => ({
        folders: [...state.folders, res.data],
      }));
      return res.data;
    } catch (error) {
      console.error("Ошибка создания папки:", error);
      throw error;
    }
  },

  updateFolder: async (id, data) => {
    try {
      const res = await updateFolder(id, data);
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === id ? res.data : f
        ),
      }));
      return res.data;
    } catch (error) {
      console.error("Ошибка обновления папки:", error);
      throw error;
    }
  },

  deleteFolder: async (id) => {
    try {
      await deleteFolder(id);
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
      }));
    } catch (error) {
      console.error("Ошибка удаления папки:", error);
      throw error;
    }
  },

  // Синхронный метод для получения папки из состояния по ID
  getFolderFromStore: (id) => {
    const state = get();
    return state.folders.find(f => f.id === id) || null;
  },
}));