import { create } from 'zustand';
import { getEmployee, getEmployeeId, createEmployee, updateEmployee, deleteEmployee } from '../services/api.service.employee';

export const useEmployeeStore = create((set, get) => ({
    employees: [],
    currentEmployee: null,
    totalRecords: 0,
    loading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,

     fetchEmployee: async (page = 1, size = 10) => {
    set({ loading: true });
    try {
      const res = await getEmployee(page, size);
      const total =
        res.totalRecords ?? res.totalCount ?? res.total ?? res.data?.length ?? 0;

      set({
        employees: res.data ?? [],
        totalRecords: total,
        currentPage: page,
        pageSize: size,
        loading: false,
      });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

    fetchEmployeeById: async (id) => {
        set({ loading: true });
        try {
            const res = await getEmployeeId(id);
            set({ currentEmployee: res.data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    addEmployee: async (newData) => {
        try {
            const res = await createEmployee(newData);
            // После добавления обновляем список на текущей странице
            const { currentPage, pageSize } = get();
            await get().fetchEmployee(currentPage, pageSize);
            return res.data;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    editEmployee: async (id, newData) => {
        try {
            const res = await updateEmployee(id, newData);
            // После обновления обновляем список на текущей странице
            const { currentPage, pageSize } = get();
            await get().fetchEmployee(currentPage, pageSize);
            return res.data;
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    removeEmployee: async (id) => {
        try {
            await deleteEmployee(id);
            // После удаления обновляем список на текущей странице
            const { currentPage, pageSize } = get();
            await get().fetchEmployee(currentPage, pageSize);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}));