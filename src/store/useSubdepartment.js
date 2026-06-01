import { create } from "zustand";
import {
  getSubDepartment,
  getSubDepartmentId,
  createSubDepartment,
  updateSubDepartment,
  deleteSubDepartment,
} from "../services/api.service.subdepartment";

export const useSubDepartmentStore = create((set, get) => ({
  subdepartments: [],
  currentSubdepartment: null,
  loading: false,
  error: null,
  totalRecords: 0,
  currentPage: 1,
  pageSize: 10,

  fetchSubDepartments: async (pageNumber = 1, pageSize = 10) => {
    set({ loading: true, error: null });

    try {
      const response = await getSubDepartment(pageNumber, pageSize);

      set({
        currentPage: pageNumber,
        pageSize: pageSize,
        loading: false,
      });

      // Обрабатываем разные структуры ответа
      let subdepartmentsData = [];
      let total = 0;

      if (Array.isArray(response)) {
        subdepartmentsData = response;
        total = response.length;
      } else if (response && response.data && Array.isArray(response.data)) {
        subdepartmentsData = response.data;
        total = response.totalRecords || response.totalCount || response.data.length;
      } else if (response && response.items) {
        subdepartmentsData = response.items;
        total = response.totalCount || response.items.length;
      } else if (response && response.$values) {
        subdepartmentsData = response.$values;
        total = response.$values.length;
      } else {
        subdepartmentsData = [];
        total = 0;
      }

      set({
        subdepartments: subdepartmentsData,
        totalRecords: total,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
      throw err;
    }
  },

  // GET BY ID
  fetchSubDepartmentById: async (id) => {
    set({ loading: true, error: null });

    try {
      const data = await getSubDepartmentId(id);

      set({
        currentSubdepartment: data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
      throw err;
    }
  },

  // ADD
  addSubDepartment: async (newData) => {
    try {
      const data = await createSubDepartment(newData);

      // После добавления обновляем список на текущей странице
      const { currentPage, pageSize } = get();
      await get().fetchSubDepartments(currentPage, pageSize);
      
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  // EDIT
  editSubDepartment: async (id, updateData) => {
    try {
      const data = await updateSubDepartment(id, updateData);

      // После обновления обновляем список на текущей странице
      const { currentPage, pageSize } = get();
      await get().fetchSubDepartments(currentPage, pageSize);
      
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  // DELETE
  removeSubDepartment: async (id) => {
    try {
      await deleteSubDepartment(id);

      // После удаления обновляем список на текущей странице
      const { currentPage, pageSize } = get();
      await get().fetchSubDepartments(currentPage, pageSize);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
}));