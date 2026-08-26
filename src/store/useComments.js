import { create } from "zustand";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../services/api.service.articles";

export const useCommentsStore = create((set, get) => ({
  comments: [],
  loading: false,
  error: null,
  articleId: null,


  fetchComments: async (articleId) => {
    set({ loading: true, error: null, articleId });
    try {
      const data = await getComments(articleId);
      set({ comments: data, loading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  addComment: async (articleId, data) => {
    set({ loading: true, error: null });
    try {
      await createComment(articleId, data);
      await get().fetchComments(articleId);
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  editComment: async (id, data, articleId) => {
    set({ loading: true, error: null });
    try {
      await updateComment(id, data);
      await get().fetchComments(articleId);
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  removeComment: async (id, articleId) => {
    set({ loading: true, error: null });
    try {
      await deleteComment(id);
      await get().fetchComments(articleId);
    } catch (error) {
      set({
        error: error.response?.data || error.message,
        loading: false,
      });
      throw error;
    }
  },

  clearComments: () => set({ comments: [], error: null, articleId: null }),
}));