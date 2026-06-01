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

  formData.append("Title", data.title);
  formData.append("Content", data.content);
  formData.append("SubDepartmentId", data.subDepartmentId ?? "");
  formData.append("EmployeeId", data.employeeId ?? "");
  formData.append("CreatedAt", new Date().toISOString());

  if (data.files && data.files.length > 0) {
    formData.append("ProfileImage", data.files[0]);
  }

  const res = await API.post("/api/Announcement", formData);

  return res.data;
};
export const updateAnnouncement = async (id, data) => {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("content", data.content);
  formData.append("SubDepartmentId", data.subDepartmentId ?? "");
  formData.append("EmployeeId", data.employeeId ?? "");

  if (data.files && data.files.length > 0) {
    formData.append("ProfileImage", data.files[0]);
  }

  const res = await API.put(`/api/Announcement/${id}`, formData);
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
