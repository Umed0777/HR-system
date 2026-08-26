import { create } from "zustand";

import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../services/api.service.articles"

export const useArticlesStore = create((set) => ({
  articles: [],
  article: null,
  loading: false,
  error: null,

  // GET ALL
  fetchArticles: async (limit = 20, offset = 0, query = "" ) => {
    set({ loading: true, error: null });

    try {
      const data = await getArticles(limit, offset,query);

      set({
        articles: data,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });

      throw error;
    }
  },

  // GET BY ID
  fetchArticleById: async (id) => {
    set({ loading: true, error: null });

    try {
      const data = await getArticleById(id);

      set({
        article: data,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });

      throw error;
    }
  },

  // CREATE
  addArticle: async (data) => {
    set({ loading: true, error: null });

    try {
      const newArticle = await createArticle(data);

      set((state) => ({
        articles: [...state.articles, newArticle],
        loading: false,
      }));

      return newArticle;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });

      throw error;
    }
  },

  // UPDATE
  editArticle: async (id, data) => {
    set({ loading: true, error: null });

    try {
      const updatedArticle = await updateArticle(id, data);

      set((state) => ({
        articles: state.articles.map((item) =>
          item.id === id ? updatedArticle : item
        ),
        loading: false,
      }));

      return updatedArticle;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });

      throw error;
    }
  },

  // DELETE
  removeArticle: async (id) => {
    set({ loading: true, error: null });

    try {
      const data = await deleteArticle(id);

      set((state) => ({
        articles: state.articles.filter(
          (item) => item.id !== id
        ),
        loading: false,
      }));

      return data;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });

      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearArticle: () => {
    set({ article: null });
  },
}));