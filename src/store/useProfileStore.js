import { create } from "zustand";
import {
  getMyProfile,
  updateMyArticle,
  deleteMyArticle,
  updateMyArticleFiles,
} from "../services/api.service.articles";

export const useProfileStore = create((set, get) => ({
  profile: null,     // { login, articles: [...] }
  loading: false,
  error: null,

  // Загрузить профиль и свои статьи
  fetchMyProfile: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMyProfile();
      set({ profile: data, loading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Обновить свою статью (текстовые поля)
  editMyArticle: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateMyArticle(id, data);
      // Обновляем статью в локальном списке
      set((state) => {
        if (!state.profile) return state;
        const articles = state.profile.articles.map((article) =>
          article.id === id ? { ...article, ...updated } : article
        );
        return { profile: { ...state.profile, articles }, loading: false };
      });
      return updated;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Удалить свою статью
  removeMyArticle: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteMyArticle(id);
      // Удаляем из локального списка
      set((state) => {
        if (!state.profile) return state;
        const articles = state.profile.articles.filter((a) => a.id !== id);
        return { profile: { ...state.profile, articles }, loading: false };
      });
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Обновить файлы своей статьи (обложка/видео)
  updateMyArticleFiles: async (id, formData) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateMyArticleFiles(id, formData);
      // Обновляем статью в списке
      set((state) => {
        if (!state.profile) return state;
        const articles = state.profile.articles.map((article) =>
          article.id === id ? { ...article, ...updated } : article
        );
        return { profile: { ...state.profile, articles }, loading: false };
      });
      return updated;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}));