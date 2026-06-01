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

    fetchEmployee: async (pageNumber = 1, pageSize = 10) => {
        set({ loading: true });

        try {
            const response = await getEmployee(pageNumber, pageSize);
            
            // Сохраняем текущую страницу и размер страницы
            set({ 
                currentPage: pageNumber,
                pageSize: pageSize,
                loading: false,
            });

            // Проверяем структуру ответа от API
            // Если response.data существует и является массивом
            let employeesData = [];
            let total = 0;

            if (Array.isArray(response)) {
                employeesData = response;
                total = response.length;
            } else if (response && response.data && Array.isArray(response.data)) {
                employeesData = response.data;
                total = response.totalRecords || response.data.length;
            } else if (response && response.items) {
                employeesData = response.items;
                total = response.totalCount || response.items.length;
            } else {
                employeesData = [];
                total = 0;
            }

            set({
                employees: employeesData,
                totalRecords: total,
                loading: false,
            });
        } catch (err) {
            set({ error: err.message, loading: false });
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