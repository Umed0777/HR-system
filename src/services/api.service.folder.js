import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// GET ALL
export const getFolders = async () => {
  const res = await API.get("/api/Folder");
  return res.data;
};

// GET BY ID
export const getFolderById = async (id) => {
  const res = await API.get(`/api/Folder/${id}`);
  return res.data;
};

// CREATE
export const createFolder = async (data) => {
  const res = await API.post("/api/Folder", data);
  return res.data;
};

// UPDATE
export const updateFolder = async (id, data) => {
  const res = await API.put(`/api/Folder/${id}`, data);
  return res.data;
};

// DELETE
export const deleteFolder = async (id) => {
  const res = await API.delete(`/api/Folder/${id}`);
  return res.data;
};