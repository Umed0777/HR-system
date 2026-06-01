import { create } from "zustand";
import {
  getPosition,
  getPositionId,
  createPosition,
  updatePosition,
  deletePosition,
} from "../services/api.service.position";

export const usePositionStore = create((set, get) => ({
  positions: [],
  currentPosition: null,
  loading: false,
  error: null,
  totalRecords: 0,
  currentPage: 1,
  pageSize: 10,

  fetchPositions: async (pageNumber = 1, pageSize = 10) => {
    set({ loading: true, error: null });

    try {
      const response = await getPosition(pageNumber, pageSize);

      set({
        currentPage: pageNumber,
        pageSize: pageSize,
        loading: false,
      });

      // Обрабатываем разные структуры ответа
      let positionsData = [];
      let total = 0;

      if (Array.isArray(response)) {
        positionsData = response;
        total = response.length;
      } else if (response && response.data && Array.isArray(response.data)) {
        positionsData = response.data;
        total = response.totalRecords || response.totalCount || response.data.length;
      } else if (response && response.items) {
        positionsData = response.items;
        total = response.totalCount || response.items.length;
      } else if (response && response.$values) {
        positionsData = response.$values;
        total = response.$values.length;
      } else {
        positionsData = [];
        total = 0;
      }

      set({
        positions: positionsData,
        totalRecords: total,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  fetchPositionById: async (id) => {
    set({ loading: true, error: null });

    try {
      const res = await getPositionId(id);

      set({
        currentPosition: res.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  addPosition: async (newData) => {
    try {
      const data = await createPosition(newData);

      // После добавления обновляем список на текущей странице
      const { currentPage, pageSize } = get();
      await get().fetchPositions(currentPage, pageSize);
      
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  editPosition: async (id, updateData) => {
    try {
      const data = await updatePosition(id, updateData);

      // После обновления обновляем список на текущей странице
      const { currentPage, pageSize } = get();
      await get().fetchPositions(currentPage, pageSize);
      
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  removePosition: async (id) => {
    try {
      await deletePosition(id);

      // После удаления обновляем список на текущей странице
      const { currentPage, pageSize } = get();
      await get().fetchPositions(currentPage, pageSize);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
}));