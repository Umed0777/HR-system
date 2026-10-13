import { create } from "zustand";
import {
  getBranches,
  getInterns,
  getIntern,
  getAttempt,
} from "../services/api.service.oneTimeLink";
import { getErrorMessage as errMsg } from "../utils/oneTimeHistory";



let internsReq = 0; // защита от гонки при быстром вводе в поиск

export const useInternHistoryStore = create((set) => ({
  error: null,

  branches: [],

  interns: [],
  internsTotal: 0,
  internsLoading: false,

  internDetail: null, 
  internLoading: false,

  attemptView: null, 
  attemptLoading: false,

  fetchBranches: async () => {
    try {
      const data = await getBranches();
      set({ branches: data?.items ?? [] });
    } catch (err) {
      set({ error: errMsg(err) });
    }
  },

  fetchInterns: async (params) => {
    const id = ++internsReq;
    set({ internsLoading: true, error: null });
    try {
      const data = await getInterns(params);
      if (id !== internsReq) return;
      set({
        interns: data?.items ?? [],
        internsTotal: data?.total ?? 0,
        internsLoading: false,
      });
    } catch (err) {
      if (id !== internsReq) return;
      set({ interns: [], internsTotal: 0, internsLoading: false, error: errMsg(err) });
    }
  },

  fetchIntern: async (id, params) => {
    set({ internLoading: true, error: null });
    try {
      const data = await getIntern(id, params);
      set({
        internDetail: {
          intern: data.intern,
          attempts: data.attempts ?? [],
          attemptsTotal: data.attempts_total ?? 0, // здесь не total, а attempts_total
        },
        internLoading: false,
      });
    } catch (err) {
      set({ internLoading: false, error: errMsg(err) });
    }
  },

  fetchAttempt: async (id) => {
    set({ attemptLoading: true, attemptView: null, error: null });
    try {
      const data = await getAttempt(id);
      set({ attemptView: data, attemptLoading: false });
    } catch (err) {
      set({ attemptLoading: false, error: errMsg(err) });
    }
  },

  clearIntern: () => set({ internDetail: null, internLoading: false }),
  clearAttempt: () => set({ attemptView: null, attemptLoading: false }),
}));