import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// GET ALL
export const getQuestions = async () => {
  try {
    const res = await API.get("/api/Question");
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// GET BY ID
export const getQuestionById = async (id) => {
  try {
    const res = await API.get(`/api/Question/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// CREATE
export const createQuestion = async (data) => {
  try {
    const res = await API.post("/api/Question", data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// UPDATE
export const updateQuestion = async (id, data) => {
  try {
    const res = await API.put(`/api/Question/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DELETE
export const deleteQuestion = async (id) => {
  try {
    const res = await API.delete(`/api/Question/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ==================== ANSWER API METHODS ====================

// GET ALL ANSWERS
export const getAnswers = async () => {
  try {
    const res = await API.get("/api/Answer");
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// GET ANSWER BY ID
export const getAnswerById = async (id) => {
  try {
    const res = await API.get(`/api/Answer/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// CREATE ANSWER
export const createAnswer = async (data) => {
  try {
    const res = await API.post("/api/Answer", data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// UPDATE ANSWER
export const updateAnswer = async (id, data) => {
  try {
    const res = await API.put(`/api/Answer/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// DELETE ANSWER
export const deleteAnswer = async (id) => {
  try {
    const res = await API.delete(`/api/Answer/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};