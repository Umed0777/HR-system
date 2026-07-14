// api.service.testAssignment.js
import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,
});

// ==================== GET /api/TestAssignment ====================
export const getTestAssignments = async (pageNumber = 1, pageSize = 10) => {
    try {
        const res = await API.get(`/api/TestAssignment?PageNumber=${pageNumber}&PageSize=${pageSize}`);
        console.log(res);
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

// ==================== POST /api/TestAssignment ====================
export const createTestAssignment = async (testId, employeeId, subDepartmentId, dueDate) => {
    try {
        const payload = {
            testId: Number(testId),
            employeeId: Number(employeeId),
            subDepartmentId: Number(subDepartmentId),
            dueDate: dueDate
        };
        const res = await API.post('/api/TestAssignment', payload);
        return res.data;
    } catch (error) {
        console.error("Create test assignment error:", error.response?.data || error.message);
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