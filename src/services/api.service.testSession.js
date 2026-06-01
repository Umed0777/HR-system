import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,
});

// ==================== POST /api/TestSession/start ====================
export const startTestSession = async (testId, employeeId) => {
    try {
        const res = await API.post('/api/TestSession/start', {
            testId: Number(testId),
            employeeId: Number(employeeId)
        });
        return res.data;
    } catch (error) {
        console.error("Start session error:", error.response?.data || error.message);
        throw error;
    }
}

// ==================== POST /api/TestSession/answer ====================
export const submitSessionAnswer = async (sessionId, questionId, optionId = null, textAnswer = "") => {
    try {
        // Создаем правильный payload в зависимости от типа ответа
        const payload = {
            sessionId: Number(sessionId),
            questionId: Number(questionId)
        };
        
        // Если optionId передан и не null, добавляем его
        if (optionId !== null && optionId !== undefined) {
            payload.optionId = Number(optionId);
        }
        
        // Если textAnswer передан и не пустой, добавляем его
        if (textAnswer && textAnswer.trim() !== "") {
            payload.textAnswer = textAnswer.trim();
        }
        
        console.log("Sending answer payload:", payload);
        
        const res = await API.post('/api/TestSession/answer', payload);
        return res.data;
    } catch (error) {
        console.error("Submit answer error:", error.response?.data || error.message);
        throw error;
    }
}

// ==================== POST /api/TestSession/{sessionId}/finish ====================
export const finishTestSession = async (sessionId, employeeId) => {
    try {
        const res = await API.post(`/api/TestSession/${sessionId}/finish?employeeId=${employeeId}`);
        return res.data;
    } catch (error) {
        console.error("Finish session error:", error.response?.data || error.message);
        throw error;
    }
}

// ==================== GET /api/TestSession ====================
export const getTestSessions = async (pageNumber = 1, pageSize = 10) => {
    try {
        const res = await API.get(`/api/TestSession?PageNumber=${pageNumber}&PageSize=${pageSize}`);
        return res.data;
    } catch (error) {
        console.error("Get sessions error:", error.response?.data || error.message);
        throw error;
    }
}

// ==================== GET /api/TestSession/{sessionId}/export/excel ====================
// export const exportSessionToExcel = async (sessionId) => {
//     try {
//         const res = await API.get(`/api/TestSession/${sessionId}/export/excel`, {
//             responseType: 'blob'
//         });
//         return res.data;
//     } catch (error) {
//         console.error("Export to Excel error:", error.response?.data || error.message);
//         throw error;
//     }
// }

// ==================== GET /api/TestSession/{sessionId}/export/csv ====================
// export const exportSessionToCsv = async (sessionId) => {
//     try {
//         const res = await API.get(`/api/TestSession/${sessionId}/export/csv`, {
//             responseType: 'blob'
//         });
//         return res.data;
//     } catch (error) {
//         console.error("Export to CSV error:", error.response?.data || error.message);
//         throw error;
//     }
// }