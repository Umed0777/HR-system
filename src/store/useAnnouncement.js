import { create } from "zustand";
import {
  getAnnouncement,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../services/api.service.announcement";

export const useAnnouncementStore = create((set) => ({
  announcements: [],
  currentAnnouncement: null,
  loading: false,
  error: null,

  fetchAnnouncements: async () => {
    set({ loading: true, error: null });

    try {
      const res = await getAnnouncement();

      const result = Array.isArray(res.data)
        ? res.data
        : [res.data];

      set({ announcements: result, loading: false });

    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchAnnouncementById: async (id) => {
    set({ loading: true });

    try {
      const res = await getAnnouncementById(id);
      set({ currentAnnouncement: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addAnnouncement: async (newData) => {
  try {
    const res = await createAnnouncement(newData);

    set((state) => ({
      announcements: [...state.announcements, res],
    }));
  } catch (err) {
    console.log(err);
  }
},

  editAnnouncement: async (id, updatedData) => {
  try {
    const res = await updateAnnouncement(id, updatedData);

    set((state) => ({
      announcements: state.announcements.map((item) =>
        item.id === id ? res : item
      ),
    }));
  } catch (err) {
    console.log(err);
  }
},

  removeAnnouncement: async (id) => {
    try {
      await deleteAnnouncement(id);

      set((state) => ({
        announcements: state.announcements.filter(
          (item) => item.id !== id
        ),
      }));
    } catch (err) {
      console.log(err);
    }
  },
}));