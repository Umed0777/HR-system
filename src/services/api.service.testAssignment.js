// api.service.testAssignment.js - ИСПРАВЛЕННЫЙ
import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,
});

// ==================== POST /api/TestAssignment ====================
export const createTestAssignment = async (testId, employeeId, subDepartmentId, dueDate) => {
    try {
        const payload = {
            testId: Number(testId),
            employeeId: Number(employeeId),
            subDepartmentId: Number(subDepartmentId),
            dueDate: dueDate
        };
        
        console.log("📤 createTestAssignment payload:", payload);
        
        const res = await API.post('/api/TestAssignment', payload);
        
        console.log("📥 createTestAssignment response:", res);
        console.log("  Status:", res.status);
        console.log("  Data:", res.data);
        
        // Если ответ пустой, возвращаем успех
        if (!res.data) {
            console.log("⚠️ Пустой ответ, возвращаю успех");
            return { 
                success: true, 
                message: "Assignment created",
                testId, 
                employeeId, 
                subDepartmentId 
            };
        }
        
        return res.data;
    } catch (error) {
        console.error("❌ Create test assignment error:");
        console.error("  Status:", error.response?.status);
        console.error("  Data:", error.response?.data);
        console.error("  Message:", error.message);
        throw error;
    }
}

// ==================== GET /api/TestAssignment ====================
export const getTestAssignments = async (pageNumber = 1, pageSize = 10) => {
    try {
        const res = await API.get(`/api/TestAssignment?PageNumber=${pageNumber}&PageSize=${pageSize}`);
        console.log("📥 getTestAssignments:", res.data);
        return res.data;
    } catch (error) {
        console.error("Get test assignments error:", error.response?.data || error.message);
        throw error;
    }
}

// ==================== GET /api/TestAssignment/{id} ====================
export const getTestAssignmentById = async (id) => {
    try {
        const res = await API.get(`/api/TestAssignment/${id}`);
        return res.data;
    } catch (error) {
        console.error("Get test assignment by id error:", error.response?.data || error.message);
        throw error;
    }
}

// ==================== DELETE /api/TestAssignment/{id} ====================
export const deleteTestAssignment = async (id) => {
    try {
        const res = await API.delete(`/api/TestAssignment/${id}`);
        return res.data;
    } catch (error) {
        console.error("Delete test assignment error:", error.response?.data || error.message);
        throw error;
    }
}