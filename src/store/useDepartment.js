import { create } from "zustand";
import {
  getDepartament,
  getDepartmentId,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/api.service.department";

export const useDepartmentStore = create((set) => ({
  departments: [],
  totalRecords: 0,
  currentDepartment: null,
  loading: false,
  error: null,

  fetchDepartments: async (pageNumber = 1, pageSize = 10) => {
    set({ loading: true, error: null });

    try {
      const res = await getDepartament(pageNumber, pageSize);

      set({
        departments: res,   // <-- исправлено
        totalRecords: res.totalRecords, // сохраняем общее количество
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  fetchDepartmentById: async (id) => {
    set({ loading: true });

    try {
      const res = await getDepartmentId(id);

      set({
        currentDepartment: res,   // <-- исправлено
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  addDepartment: async (newData) => {
    try {
      const res = await createDepartment(newData);

      set((state) => ({
        departments: [...state.departments, res], // <-- исправлено
      }));
    } catch (err) {
      console.log(err);
    }
  },

  editDepartment: async (id, updateData) => {
    try {
      const res = await updateDepartment(id, updateData);

      set((state) => ({
        departments: state.departments.map((item) =>
          item.id === id ? res : item // <-- исправлено
        ),
      }));
    } catch (err) {
      console.log(err);
    }
  },

  removeDepartment: async (id) => {
    try {
      await deleteDepartment(id);

      set((state) => ({
        departments: state.departments.filter(
          (item) => item.id !== id
        ),
      }));
    } catch (err) {
      console.log(err);
    }
  },
}));