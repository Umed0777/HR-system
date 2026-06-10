import { create } from "zustand";
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAnswers,
  getAnswerById,
  createAnswer,
  updateAnswer,
  deleteAnswer,
} from "../services/api.service.question";

export const useQuestionStore = create((set, get) => ({
  questions: [],
  currentQuestion: null,
  answers: [],
  currentAnswer: null,
  loading: false,
  error: null,
  totalRecords: 0,

  // ==================== QUESTION METHODS ====================
  
  fetchQuestions: async (pageNumber = 1, pageSize = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await getQuestions(pageNumber, pageSize);
      console.log("Fetched questions:", res.data);
      console.log(res.totalRecords); 
      set({
        questions: res.data,
        totalRecords: res.totalRecords,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  fetchQuestionById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await getQuestionById(id);
      set({
        currentQuestion: res.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  addQuestion: async (data) => {
    try {
      const res = await createQuestion(data);
      console.log("Added question:", res.data);
      
      set((state) => ({
        questions: [...state.questions, res.data],
      }));
      
      return res.data;
    } catch (err) {
      console.log("Add error:", err.response?.data || err.message);
      throw err;
    }
  },

  editQuestion: async (id, data) => {
    try {
      const res = await updateQuestion(id, data);
      console.log("Updated question:", res.data); 
      
      set((state) => ({
        questions: state.questions.map((q) =>
          q.id === id ? res.data : q
        ),
      }));
      
      return res.data;
    } catch (err) {
      console.log("Edit error:", err.response?.data || err.message);
      throw err;
    }
  },

  removeQuestion: async (id) => {
    try {
      await deleteQuestion(id);
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
      }));
    } catch (err) {
      console.log("Delete error:", err.response?.data || err.message);
      throw err;
    }
  },

  // ==================== ANSWER METHODS ====================
  
  fetchAnswers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getAnswers();
      console.log("Fetched answers:", res.data);
      set({
        answers: res.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  fetchAnswerById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await getAnswerById(id);
      set({
        currentAnswer: res.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  fetchAnswersByQuestionId: (questionId) => {
    const { answers } = get();
    return answers.filter(answer => answer.questionId === questionId);
  },

  addAnswer: async (data) => {
    try {
      const res = await createAnswer(data);
      console.log("Added answer:", res.data);
      
      set((state) => ({
        answers: [...state.answers, res.data],
      }));
      
      return res.data;
    } catch (err) {
      console.log("Add answer error:", err.response?.data || err.message);
      throw err;
    }
  },

  editAnswer: async (id, data) => {
    try {
      const res = await updateAnswer(id, data);
      console.log("Updated answer:", res.data);
      
      set((state) => ({
        answers: state.answers.map((a) =>
          a.id === id ? res.data : a
        ),
      }));
      
      return res.data;
    } catch (err) {
      console.log("Edit answer error:", err.response?.data || err.message);
      throw err;
    }
  },

  removeAnswer: async (id) => {
    try {
      await deleteAnswer(id);
      set((state) => ({
        answers: state.answers.filter((a) => a.id !== id),
      }));
    } catch (err) {
      console.log("Delete answer error:", err.response?.data || err.message);
      throw err;
    }
  },

  // Дополнительный метод для получения ответов студента
  fetchStudentAnswer: async (questionId, employeeId, testId) => {
    try {
      const { answers } = get();
      return answers.find(
        answer => answer.questionId === questionId && 
                 answer.employeeId === employeeId && 
                 answer.testId === testId
      );
    } catch (err) {
      console.log("Fetch student answer error:", err);
      return null;
    }
  },
}));