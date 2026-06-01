import { create } from "zustand";
import {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} from "../services/api.service.tests";

export const useTestStore = create((set) => ({
  tests: [],
  currentTest: null,
  loading: false,
  error: null,

  fetchTests: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getTests();
      console.log("Fetched tests response:", res);
      
      let testsData = [];
      if (res.data && Array.isArray(res.data)) {
        testsData = res.data;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        testsData = res.data.data;
      } else if (Array.isArray(res)) {
        testsData = res;
      }
      
      set({
        tests: testsData,
        loading: false,
      });
    } catch (err) {
      console.error("Fetch tests error:", err);
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  fetchTestById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await getTestById(id);
      let testData = res.data?.data || res.data;
      set({
        currentTest: testData,
        loading: false,
      });
      return testData;
    } catch (err) {
      console.error(`Fetch test ${id} error:`, err);
      set({
        error: err.message,
        loading: false,
      });
      throw err;
    }
  },

  addTest: async (data) => {
    try {
      const res = await createTest(data);
      set((state) => ({
        tests: [...state.tests, res.data?.data || res.data],
      }));
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Add test error:", err.response?.data || err.message);
      throw err;
    }
  },

  editTest: async (id, data) => {
    try {
      const res = await updateTest(id, data);
      set((state) => ({
        tests: state.tests.map((t) =>
          t.id === id ? (res.data?.data || res.data) : t
        ),
      }));
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Edit test error:", err.response?.data || err.message);
      throw err;
    }
  },

  removeTest: async (id) => {
    try {
      await deleteTest(id);
      set((state) => ({
        tests: state.tests.filter((t) => t.id !== id),
      }));
    } catch (err) {
      console.error("Delete test error:", err.response?.data || err.message);
      throw err;
    }
  },
}));