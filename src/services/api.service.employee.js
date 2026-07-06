import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});
export const getEmployee = async (pageNumber = 1, pageSize = 10) => {
  try {
    const res = await API.get("/api/Employee",{
    params: {
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    })
      return res.data.data;
    } catch (error) {
    console.error(error);
    throw error;
  }
};
export const getEmployeeId = async (id) => {
  try {
    const res = await API.get(`/api/Employee/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const createEmployee = async (data) => {
  try {
       console.log("Отправляем:", data);
    const res = await API.post("/api/Employee", data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const updateEmployee = async (id, data) => {
  try {
    const res = await API.put(`/api/Employee/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const deleteEmployee = async (id) => {
  try {
    const res = await API.delete(`/api/Employee/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
