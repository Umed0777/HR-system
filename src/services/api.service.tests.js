import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

export const getTests = async (
  pageNumber = 1,
  pageSize = 100,
  language = null
) => {
  try {
    const params = { pageNumber, pageSize };
    if (language) params.language = language;
    const res = await API.get("/api/Test", { params });

    return res.data;
  } catch (error) {
    console.error("getTests error:", error);
    throw error;
  }
};

export const getTestById = async (id) => {
  try {
    const res = await API.get(`/api/Test/${id}`);
    return res.data;
  } catch (error) {
    console.error("getTestById error:", error);
    throw error;
  }
};

export const createTest = async (data) => {
  try {
    const res = await API.post("/api/Test", data);
    return res.data;
  } catch (error) {
    console.error("createTest error:", error);
    throw error;
  }
};

export const updateTest = async (id, data) => {
  try {
    const res = await API.put(`/api/Test/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("updateTest error:", error);
    throw error;
  }
};

export const deleteTest = async (id) => {
  try {
    const res = await API.delete(`/api/Test/${id}`);
    return res.data;
  } catch (error) {
    console.error("deleteTest error:", error);
    throw error;
  }
};

