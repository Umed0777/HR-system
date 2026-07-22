// src/services/api.service.folder.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// GET ALL FOLDERS
export const getFolders = async () => {
  try {
    const res = await API.get("/api/Folder");

    console.log("📁 GET /api/Folder:", res.data);

    return res.data;
  } catch (error) {
    console.error(
      "❌ Ошибка загрузки папок:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// GET FOLDER BY ID
export const getFolderById = async (id) => {
  try {
    const res = await API.get(`/api/Folder/${id}`);

    console.log(`📁 GET /api/Folder/${id}:`, res.data);

    return res.data;
  } catch (error) {
    console.error(
      "❌ Ошибка получения папки:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// CREATE FOLDER
export const createFolder = async (data) => {
  try {
    const res = await API.post("/api/Folder", data);

    console.log("✅ Папка создана:", res.data);

    return res.data;
  } catch (error) {
    console.error(
      "❌ Ошибка создания папки:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// UPDATE FOLDER
export const updateFolder = async (id, data) => {
  try {
    const res = await API.put(`/api/Folder/${id}`, data);

    console.log("✅ Папка обновлена:", res.data);

    return res.data;
  } catch (error) {
    console.error(
      "❌ Ошибка обновления папки:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// DELETE FOLDER
export const deleteFolder = async (id) => {
  try {
    const res = await API.delete(`/api/Folder/${id}`);

    console.log("✅ Папка удалена:", res.data);

    return res.data;
  } catch (error) {
    console.error(
      "❌ Ошибка удаления папки:",
      error.response?.data || error.message
    );
    throw error;
  }
};