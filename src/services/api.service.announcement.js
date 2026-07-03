import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

export const getAnnouncement = async () => {
  try {
    const res = await API.get("/api/Announcement");
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAnnouncementById = async (id) => {
  try {
    const res = await API.get(`/api/Announcement/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createAnnouncement = async (data) => {
  const formData = new FormData();

  // Добавляем все текстовые поля
  formData.append("Title", data.title || "");
  formData.append("Content", data.content || "");
  formData.append("SubDepartmentId", data.subDepartmentId ?? "");
  formData.append("EmployeeId", data.employeeId ?? "");
  formData.append("FolderId", data.folderId ?? ""); // <-- ДОБАВЛЯЕМ FolderId
  formData.append("CreatedAt", new Date().toISOString());

  // Добавляем файлы
  if (data.files && data.files.length > 0) {
    // Если есть несколько файлов, добавляем их все
    data.files.forEach((file, index) => {
      formData.append(`Files`, file);
    });
    
    // Первый файл также сохраняем как ProfileImage для обратной совместимости
    formData.append("ProfileImage", data.files[0]);
  }

  // Для отладки - выводим содержимое FormData
  console.log("Creating announcement with FormData:");
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const res = await API.post("/api/Announcement", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateAnnouncement = async (id, data) => {
  const formData = new FormData();

  // Добавляем все текстовые поля
  formData.append("Title", data.title || "");
  formData.append("Content", data.content || "");
  formData.append("SubDepartmentId", data.subDepartmentId ?? "");
  formData.append("EmployeeId", data.employeeId ?? "");
  formData.append("FolderId", data.folderId ?? ""); // <-- ДОБАВЛЯЕМ FolderId

  // Добавляем файлы
  if (data.files && data.files.length > 0) {
    data.files.forEach((file, index) => {
      formData.append(`Files`, file);
    });
    formData.append("ProfileImage", data.files[0]);
  }

  // Для отладки - выводим содержимое FormData
  console.log(`Updating announcement ${id} with FormData:`);
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const res = await API.put(`/api/Announcement/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  return res.data;
};

export const deleteAnnouncement = async (id) => {
  try {
    const res = await API.delete(`/api/Announcement/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};