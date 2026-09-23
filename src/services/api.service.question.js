import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

export const getQuestions = async (
  pageNumber = 1,
  pageSize = 10,
  type = null,
  search = null,
  language = null
) => {
  try {
    const params = {
      PageNumber: pageNumber,
      PageSize: pageSize,
    };
    if (type) params.Type = type;
    if (search) params.Search = search;
    if (language) params.language = language;

    const res = await API.get("/api/Question", { params });
    return res.data;
  } catch (error) {
    console.error("getQuestions error:", error);
    throw error;
  }
};


export const getQuestionById = async (id) => {
  try {
    const res = await API.get(`/api/Question/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createQuestion = async (data) => {
  try {
    const res = await API.post("/api/Question", data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateQuestion = async (id, data) => {
  try {
    const res = await API.put(`/api/Question/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteQuestion = async (id) => {
  try {
    const res = await API.delete(`/api/Question/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const getAnswers = async () => {
  try {
    const res = await API.get("/api/Answer");
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAnswerById = async (id) => {
  try {
    const res = await API.get(`/api/Answer/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createAnswer = async (data) => {
  try {
    const res = await API.post("/api/Answer", data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateAnswer = async (id, data) => {
  try {
    const res = await API.put(`/api/Answer/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteAnswer = async (id) => {
  try {
    const res = await API.delete(`/api/Answer/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};