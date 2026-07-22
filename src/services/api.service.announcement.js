// src/services/api.service.announcement.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// ==============================
// GET ALL
// ==============================
export const getAnnouncement = async () => {
  try {
    const res = await API.get("/api/Announcement");
    return res.data;
  } catch (error) {
    console.error("❌ getAnnouncement ошибка:", error.response?.data || error.message);
    throw error;
  }
};

// ==============================
// GET BY ID
// ==============================
export const getAnnouncementById = async (id) => {
  try {
    const res = await API.get(`/api/Announcement/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ getAnnouncementById ошибка:", error.response?.data || error.message);
    throw error;
  }
};

// ==============================
// CREATE
// ==============================
export const createAnnouncement = async (data) => {
  try {
    const formData = new FormData();
    
    // Если data - это FormData, используем её
    if (data instanceof FormData) {
      console.log("📤 Отправляем FormData напрямую");
      const res = await API.post("/api/Announcement", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Announcement создан:", res.data);
      return res.data;
    }

    // Иначе создаем FormData из объекта
    console.log("📤 Создаем FormData из объекта:", data);
    
    formData.append("Title", data.title || "");
    formData.append("Content", data.content || "");
    formData.append("SubDepartmentId", String(Number(data.subDepartmentId ?? 0)));
    formData.append("EmployeeId", String(Number(data.employeeId ?? 0)));
    formData.append("FolderId", String(Number(data.folderId ?? 0)));

    // Добавляем файлы
    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file, index) => {
        if (file instanceof File) {
          if (index === 0) {
            formData.append("ProfileImage", file);
          }
          formData.append("Files", file);
        }
      });
    }

    console.log("📤 Отправляем Announcement:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? value.name : value);
    }

    const res = await API.post("/api/Announcement", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Announcement создан:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Ошибка Announcement:", error.response?.data || error.message);
    throw error;
  }
};

// ==============================
// UPDATE
// ==============================
export const updateAnnouncement = async (id, data) => {
  try {
    const formData = new FormData();
    
    // Если data - это FormData, используем её
    if (data instanceof FormData) {
      console.log("📤 Отправляем FormData напрямую на обновление");
      const res = await API.put(`/api/Announcement/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Announcement обновлен:", res.data);
      return res.data;
    }

    // Иначе создаем FormData из объекта
    console.log("📤 Создаем FormData из объекта на обновление:", data);
    
    formData.append("Title", data.title || "");
    formData.append("Content", data.content || "");
    
    if (data.subDepartmentId !== null && data.subDepartmentId !== undefined) {
      formData.append("SubDepartmentId", String(Number(data.subDepartmentId)));
    }
    
    if (data.employeeId !== null && data.employeeId !== undefined) {
      formData.append("EmployeeId", String(Number(data.employeeId)));
    }
    
    if (data.folderId !== null && data.folderId !== undefined) {
      formData.append("FolderId", String(Number(data.folderId)));
    }

    // Добавляем файлы
    if (data.files && Array.isArray(data.files)) {
      data.files.forEach((file, index) => {
        if (file instanceof File) {
          if (index === 0) {
            formData.append("ProfileImage", file);
          }
          formData.append("Files", file);
        }
      });
    }

    console.log("📤 Отправляем Announcement на обновление:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? value.name : value);
    }

    const res = await API.put(`/api/Announcement/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Announcement обновлен:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Ошибка обновления:", error.response?.data || error.message);
    throw error;
  }
};

// ==============================
// DELETE
// ==============================
export const deleteAnnouncement = async (id) => {
  try {
    console.log(`🗑️ Удаляем Announcement ID: ${id}`);
    const res = await API.delete(`/api/Announcement/${id}`);
    console.log("✅ Удаление успешно");
    return res.data;
  } catch (error) {
    console.error("❌ Ошибка удаления:", error.response?.data || error.message);
    throw error;
  }
};