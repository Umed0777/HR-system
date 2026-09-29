import { create } from "zustand";
import {
  generateOneTimeLink,
  // getOneTimeLinksHistory,
} from "../services/api.service.oneTimeLink";

export const useOneTimeLinkStore = create((set) => ({
  // ---- генерация ссылки ----
  link: "",
  generating: false,
  error: null,

  // ---- история ----
  history: [],
  historyTotalRecords: 0,
  historyLoading: false,
  historyError: null,

  generateLink: async (testId, durationMinutes) => {
    set({ generating: true, error: null, link: "" });
    try {
      const res = await generateOneTimeLink(testId, durationMinutes);

      // сервис уже возвращает тело ответа, поэтому берём поля напрямую
      // (на случай, если вернётся полный axios-ответ, есть запасной вариант через res.data)
      const body = res?.data && !res?.form_url ? res.data : res;
      const link = body?.respondent_url || body?.form_url;

      if (!link) throw new Error("Сервер не вернул ссылку");

      set({ link, generating: false });
      return link;
    } catch (err) {
      console.error("Generate one-time link error:", err.response?.data || err.message);
      set({
        error: err.response?.data?.message || err.message,
        generating: false,
      });
      throw err;
    }
  },

  resetLink: () => set({ link: "", error: null, generating: false }),

  // ⚠️ заглушка под будущий эндпоинт истории
  // fetchHistory: async (pageNumber = 1, pageSize = 100) => { ... },
}));