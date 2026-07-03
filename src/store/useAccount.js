import { create } from "zustand";

import {
  login,
  register,
  registerAdmin,
} from "../services/api.service.account";

export const useAccountStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,

  // ================= LOGIN =================

loginUser: async (data) => {
  set({ loading: true, error: null });

  try {
    const res = await login(data);

    console.log("FULL RESPONSE:", res);

    const token = res?.data?.jwToken;

    console.log("TOKEN FROM BACKEND:", token);

    if (!token) {
      throw new Error("TOKEN NOT FOUND");
    }
    console.log("STORED TOKEN:", localStorage.getItem("token"));
    const oneDay = 24 * 60 * 60 * 1000;

localStorage.setItem("token", token);
localStorage.setItem("tokenExpire", Date.now() + oneDay);
    set({
      user: res.data,
      token,
      loading: false,
    });

    return res;
  } catch (err) {
    console.log("LOGIN ERROR:", err);

    set({
      loading: false,
      error: err.message,
    });

    throw err;
  }
},
  // ================= REGISTER =================

  registerUser: async (data) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await register(data);

      set({
        loading: false,
      });

      return res;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data || err.message,
      });

      throw err;
    }
  },

  // ================= REGISTER ADMIN =================

  registerAdminUser: async (data) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await registerAdmin(data);

      set({
        loading: false,
      });

      return res;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data || err.message,
      });

      throw err;
    }
  },

  // ================= LOGOUT =================

  logout: () => {
    localStorage.removeItem("token");

    set({
      user: null,
      token: null,
    });
  },
}));