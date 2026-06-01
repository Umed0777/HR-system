import { create } from "zustand";
import {
    startTestSession,
    submitSessionAnswer,
    finishTestSession,
    getTestSessions,
    // exportSessionToExcel,
    // exportSessionToCsv
} from '../services/api.service.testsession';

export const useTestSessionStore = create((set, get) => ({
    sessions: [],
    currentSession: null,
    loading: false,
    error: null,
    pagination: {
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        totalCount: 0,
    },

    // ==================== Начать сессию ====================
    startSession: async (testId, employeeId) => {
        set({ loading: true, error: null });
        try {
            const res = await startTestSession(testId, employeeId);
            console.log("Start session response:", res);
            const session = res.data || res;
            set({ currentSession: session, loading: false });
            return session;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

   // ==================== Отправить ответ ====================
submitAnswer: async (sessionId, questionId, optionId = null, textAnswer = "") => {
    set({ loading: true, error: null });
    try {
        const res = await submitSessionAnswer(sessionId, questionId, optionId, textAnswer);
        console.log("Submit answer response:", res);
        const updatedSession = res.data || res;
        
        // Обновляем currentSession
        const { currentSession } = get();
        if (currentSession && currentSession.id === sessionId) {
            set({ currentSession: updatedSession });
        }
        
        // Обновляем в списке sessions
        set((state) => ({
            sessions: state.sessions.map(s => 
                s.id === sessionId ? updatedSession : s
            ),
            loading: false
        }));
        
        return updatedSession;
    } catch (err) {
        console.error("Submit answer error:", err);
        set({ error: err.message, loading: false });
        throw err;
    }
},

    // ==================== Завершить сессию ====================
    finishSession: async (sessionId, employeeId) => {
        set({ loading: true, error: null });
        try {
            const res = await finishTestSession(sessionId, employeeId);
            console.log("Finish session response:", res);
            const finishedSession = res.data || res;
            
            // Обновляем currentSession
            const { currentSession } = get();
            if (currentSession && currentSession.id === sessionId) {
                set({ currentSession: finishedSession });
            }
            
            // Обновляем в списке sessions
            set((state) => ({
                sessions: state.sessions.map(s => 
                    s.id === sessionId ? finishedSession : s
                ),
                loading: false
            }));
            
            return finishedSession;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Получить все сессии ====================
    fetchSessions: async (pageNumber = 1, pageSize = 10) => {
        set({ loading: true, error: null });
        try {
            const res = await getTestSessions(pageNumber, pageSize);
            console.log("Fetch sessions response:", res);
            
            // Обработка разных форматов ответа
            let sessionsList = [];
            let totalPages = 1;
            let totalCount = 0;
            
            if (res.data) {
                if (Array.isArray(res.data)) {
                    sessionsList = res.data;
                    totalPages = res.totalPages || 1;
                    totalCount = res.totalCount || sessionsList.length;
                } else if (res.data.items) {
                    sessionsList = res.data.items;
                    totalPages = res.data.totalPages || 1;
                    totalCount = res.data.totalCount || sessionsList.length;
                } else {
                    sessionsList = [res.data];
                }
            } else if (Array.isArray(res)) {
                sessionsList = res;
            } else if (res.items) {
                sessionsList = res.items;
                totalPages = res.totalPages || 1;
                totalCount = res.totalCount || sessionsList.length;
            } else {
                sessionsList = [];
            }
            
            set({
                sessions: sessionsList,
                pagination: {
                    pageNumber,
                    pageSize,
                    totalPages,
                    totalCount,
                },
                loading: false
            });
            
            return sessionsList;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Экспорт в Excel ====================
    exportToExcel: async (sessionId) => {
        set({ loading: true, error: null });
        try {
            const blob = await exportSessionToExcel(sessionId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test_session_${sessionId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            set({ loading: false });
            return true;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Экспорт в CSV ====================
    exportToCsv: async (sessionId) => {
        set({ loading: true, error: null });
        try {
            const blob = await exportSessionToCsv(sessionId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test_session_${sessionId}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            set({ loading: false });
            return true;
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    // ==================== Вспомогательные методы ====================
    
    setCurrentSession: (session) => {
        set({ currentSession: session });
    },

    clearCurrentSession: () => {
        set({ currentSession: null });
    },

    clearError: () => {
        set({ error: null });
    },

    getSessionById: (sessionId) => {
        const { sessions, currentSession } = get();
        const fromList = sessions.find(s => s.id === sessionId);
        if (fromList) return fromList;
        if (currentSession?.id === sessionId) return currentSession;
        return null;
    },

    getStats: () => {
        const { sessions } = get();
        const completed = sessions.filter(s => s.status === 2);
        const inProgress = sessions.filter(s => s.status === 1);
        const cancelled = sessions.filter(s => s.status === 3);
        
        const avgScore = completed.length > 0
            ? (completed.reduce((sum, s) => sum + (s.score || 0), 0) / completed.length).toFixed(2)
            : 0;
        
        return {
            total: sessions.length,
            completed: completed.length,
            inProgress: inProgress.length,
            cancelled: cancelled.length,
            averageScore: avgScore,
        };
    }
}));