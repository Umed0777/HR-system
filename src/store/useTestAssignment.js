// store/useTestAssignment.js - ИСПРАВЛЕННЫЙ
import { create } from "zustand";
import {
  getTestAssignments,
  getTestAssignmentById,
  createTestAssignment,
  deleteTestAssignment,
} from "../services/api.service.testAssignment";

export const useTestAssignmentStore = create((set, get) => ({
  testAssignments: [],
  selectedTestAssignment: null,
  loading: false,
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,

  // ==================== GET ALL - ИСПРАВЛЕНО ====================
  fetchTestAssignments: async (pageNumber = 1, pageSize = 10) => {
    try {
      set({ loading: true });

      const res = await getTestAssignments(pageNumber, pageSize);
      
      console.log("📥 fetchTestAssignments response:", res);

      // ПРАВИЛЬНАЯ ОБРАБОТКА ОТВЕТА
      let assignments = [];
      let total = 0;
      
      if (res?.data) {
        if (Array.isArray(res.data)) {
          assignments = res.data;
          total = res.totalCount || res.data.length;
        } else if (typeof res.data === 'object') {
          assignments = [res.data];
          total = 1;
        }
      } else if (Array.isArray(res)) {
        assignments = res;
        total = res.length;
      }

      console.log("✅ Установлено назначений:", assignments.length);

      set({
        testAssignments: assignments,
        totalCount: total,
        pageNumber,
        pageSize,
        loading: false,
      });
      
      return assignments;
    } catch (error) {
      console.error("❌ fetchTestAssignments error:", error);
      set({ loading: false });
      return [];
    }
  },

  // ==================== GET BY ID ====================
  fetchTestAssignmentById: async (id) => {
    try {
      set({ loading: true });
      const res = await getTestAssignmentById(id);
      set({
        selectedTestAssignment: res?.data || res || null,
        loading: false,
      });
      return res;
    } catch (error) {
      console.error(error);
      set({ loading: false });
      return null;
    }
  },

  // ==================== CREATE ====================
  addTestAssignment: async (testId, employeeId, subDepartmentId, dueDate) => {
    try {
      set({ loading: true });

      const res = await createTestAssignment(
        testId,
        employeeId,
        subDepartmentId,
        dueDate
      );

      console.log("✅ addTestAssignment response:", res);

      // Обновляем список
      await get().fetchTestAssignments(get().pageNumber, get().pageSize);

      set({ loading: false });
      return res;
    } catch (error) {
      console.error("❌ addTestAssignment error:", error);
      set({ loading: false });
      throw error;
    }
  },

  // ==================== DELETE ====================
  removeTestAssignment: async (id) => {
    try {
      set({ loading: true });
      const res = await deleteTestAssignment(id);
      set((state) => ({
        testAssignments: state.testAssignments.filter(
          (item) => item.id !== id
        ),
        loading: false,
      }));
      return res;
    } catch (error) {
      console.error(error);
      set({ loading: false });
      throw error;
    }
  },
}));