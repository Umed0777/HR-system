import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// GET ALL TESTS (с пагинацией)
export const getTests = async (pageNumber = 1, pageSize = 100) => {
  try {
    const res = await API.get(`/api/Test?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// GET TEST BY ID
export const getTestById = async (id) => {
  try {
    const res = await API.get(`/api/Test/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// CREATE TEST
export const createTest = async (data) => {
  try {
    const res = await API.post("/api/Test", data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// UPDATE TEST
export const updateTest = async (id, data) => {
  try {
    const res = await API.put(`/api/Test/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DELETE TEST
export const deleteTest = async (id) => {
  try {
    const res = await API.delete(`/api/Test/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};