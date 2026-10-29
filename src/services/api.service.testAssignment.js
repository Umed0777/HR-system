// api.service.testAssignment.js - ИСПРАВЛЕННЫЙ
import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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

// ==================== POST /api/TestAssignment/bulk ====================
// Массовое назначение теста / опроса нескольким сотрудникам.
// Если на бэке ещё нет /bulk (404/405) — назначаем по одному через POST /api/TestAssignment.
export const createTestAssignmentsBulk = async (testId, employeeIds) => {
    const ids = [...new Set(employeeIds.map(Number))];

    try {
        await API.post('/api/TestAssignment/bulk', {
            testId: Number(testId),
            assignToAll: false,
            employeeIds: ids,
        });
        return { created: ids.length, failed: 0 };
    } catch (error) {
        if (![404, 405].includes(error.response?.status)) throw error;
    }

    let created = 0;
    let failed = 0;
    const CHUNK = 10;
    for (let i = 0; i < ids.length; i += CHUNK) {
        const results = await Promise.allSettled(
            ids.slice(i, i + CHUNK).map((employeeId) =>
                API.post('/api/TestAssignment', { testId: Number(testId), employeeId })
            )
        );
        results.forEach((r) => {
            // 409 — назначение уже есть, ошибкой не считаем
            if (r.status === "fulfilled" || r.reason?.response?.status === 409) created++;
            else failed++;
        });
    }
    return { created, failed };
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