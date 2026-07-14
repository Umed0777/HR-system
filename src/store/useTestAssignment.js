// store/useTestAssignment.js
import { create } from "zustand";
import {
    getTestAssignments,
    getTestAssignmentById,
    createTestAssignment,
    deleteTestAssignment
} from '../services/api.service.testAssignment';

export const useTestAssignmentStore = create((set, get) => ({
    assignments: [],
    currentAssignment: null,
    loading: false,
    error: null,
    pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        totalCount: 0,
    },

    // ==================== Получить все назначения ====================
    fetchAssignments: async (pageNumber = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        try {
            const res = await getTestAssignments(pageNumber, pageSize);
            console.log("Fetch assignments response:", res);
            
            let assignmentsList = [];
            let totalPages = 1;
            let totalCount = 0;
            
            if (res.data) {
                if (Array.isArray(res.data)) {
                    assignmentsList = res.data;
                    totalPages = res.totalPages || 1;
                    totalCount = res.totalCount || assignmentsList.length;
                } else if (res.data.items) {
                    assignmentsList = res.data.items;
                    totalPages = res.data.totalPages || 1;
                    totalCount = res.data.totalCount || assignmentsList.length;
                } else {
                    assignmentsList = [res.data];
                }
            } else if (Array.isArray(res)) {
                assignmentsList = res;
            } else if (res.items) {
                assignmentsList = res.items;
                totalPages = res.totalPages || 1;
                totalCount = res.totalCount || assignmentsList.length;
            } else {
                assignmentsList = [];
            }
            
            set({
                assignments: assignmentsList,
                pagination: {
                    pageNumber,
                    pageSize,
                    totalPages,
                    totalCount,
                },
                loading: false
            });
            
            return assignmentsList;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Получить назначение по ID ====================
    fetchAssignmentById: async (id) => {
        set({ loading: true, error: null });
        try {
            const res = await getTestAssignmentById(id);
            const assignment = res.data || res;
            set({ currentAssignment: assignment, loading: false });
            return assignment;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Создать назначение ====================
    createAssignment: async (testId, employeeId, subDepartmentId, dueDate) => {
        set({ loading: true, error: null });
        try {
            const res = await createTestAssignment(testId, employeeId, subDepartmentId, dueDate);
            console.log("Create assignment response:", res);
            const newAssignment = res.data || res;
            
            // Добавляем в список
            set((state) => ({
                assignments: [newAssignment, ...state.assignments],
                loading: false
            }));
            
            return newAssignment;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Удалить назначение ====================
    deleteAssignment: async (id) => {
        set({ loading: true, error: null });
        try {
            await deleteTestAssignment(id);
            
            // Удаляем из списка
            set((state) => ({
                assignments: state.assignments.filter(a => a.id !== id),
                loading: false
            }));
            
            return true;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Вспомогательные методы ====================
    
    clearError: () => {
        set({ error: null });
    },

    getAssignmentById: (id) => {
        const { assignments, currentAssignment } = get();
        const fromList = assignments.find(a => a.id === id);
        if (fromList) return fromList;
        if (currentAssignment?.id === id) return currentAssignment;
        return null;
    },

    getAssignmentsByEmployee: (employeeId) => {
        const { assignments } = get();
        return assignments.filter(a => a.employeeId === employeeId);
    },

    getAssignmentsByTest: (testId) => {
        const { assignments } = get();
        return assignments.filter(a => a.testId === testId);
    },

    getAssignmentsBySubDepartment: (subDepartmentId) => {
        const { assignments } = get();
        return assignments.filter(a => a.subDepartmentId === subDepartmentId);
    },

    getStats: () => {
        const { assignments } = get();
        const today = new Date();
        const overdue = assignments.filter(a => new Date(a.dueDate) < today);
        const upcoming = assignments.filter(a => new Date(a.dueDate) >= today);
        
        return {
            total: assignments.length,
            overdue: overdue.length,
            upcoming: upcoming.length,
        };
    }
}));