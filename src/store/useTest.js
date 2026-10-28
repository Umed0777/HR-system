import { create } from "zustand";
import {
  getTests,
  getMyTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} from "../services/api.service.tests";

// админы видят все тесты, остальные — только назначенные им
const isAdminUser = () => {
  try {
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    return (Array.isArray(roles) ? roles : [roles]).some((r) =>
      ["admin", "superadmin", "super_admin", "super-admin"].includes(
        String(r).toLowerCase(),
      ),
    );
  } catch {
    return false;
  }
};

export const useTestStore = create((set, get) => ({
  tests: [],
  currentTest: null,
  loading: false,
  error: null,
  totalRecords: 0,
  // язык последнего запроса — повторные fetchTests без языка используют его
  language: "ru",

 fetchTests: async (pageNumber = 1, pageSize = 100, language = null) => {
  const lang = language || get().language;
  set({ loading: true, error: null, language: lang });

  try {
    const res = isAdminUser()
      ? await getTests(pageNumber, pageSize, lang)
      : await getMyTests(lang);

    console.log("========== TESTS API ==========");
    console.log("FULL RESPONSE:", res);
    console.log("RESPONSE DATA:", res?.data);
    console.log("================================");

    const responseData = res?.data;

    let testsData = [];
    let total = 0;

    if (Array.isArray(responseData)) {
      testsData = responseData;
      total = responseData.length;
    }

    else if (Array.isArray(responseData?.data)) {
      testsData = responseData.data;
      total =
        responseData.totalRecords ??
        responseData.totalCount ??
        responseData.data.length;
    }

    else if (Array.isArray(responseData?.items)) {
      testsData = responseData.items;
      total =
        responseData.totalRecords ??
        responseData.totalCount ??
        responseData.items.length;
    }

    else if (Array.isArray(responseData?.records)) {
      testsData = responseData.records;
      total =
        responseData.totalRecords ??
        responseData.totalCount ??
        responseData.records.length;
    }


    else if (Array.isArray(res)) {
      testsData = res;
      total = res.length;
    }

    console.log("TESTS ARRAY:", testsData);
    console.log("TOTAL:", total);

    set({
      tests: testsData,
      totalRecords: total,
      loading: false,
    });

  } catch (err) {
    console.error("Fetch tests error:", err);

    set({
      tests: [],
      totalRecords: 0,
      error: err.response?.data?.message || err.message,
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

    console.log("CREATE TEST RESPONSE:", res);

    const newTest =
      res?.data?.data ||
      res?.data ||
      res;

    console.log("NEW TEST:", newTest);

    set((state) => ({
      tests: [...state.tests, newTest],
    }));

    return newTest;

  } catch (err) {
    console.error(
      "Add test error:",
      err.response?.data || err.message
    );

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