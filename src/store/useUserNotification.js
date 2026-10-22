import { create } from "zustand";
import { getUsers } from "../services/api.service.account";

export const useUserNotificationStore = create((set) => ({
  users: [],
  loading: false,
  total: 0,
  error: null,

  // без пагинации — загружаем всех пользователей одним запросом
  fetchUsers: async (pageNumber = 1, pageSize = 10000) => {
    try {
      set({
        loading: true,
        error: null,
      });

      const response = await getUsers(
        pageNumber,
        pageSize
      );

      console.log(
        "USERS RESPONSE:",
        response
      );

      const users = Array.isArray(response?.data)
        ? response.data
        : [];

      set({
        users,
        loading: false,
        total:
          response?.totalRecords ??
          response?.total ??
          response?.data?.totalRecords ??
          0,
      });

      return users;
    } catch (error) {
      console.error(
        "Ошибка загрузки пользователей:",
        error
      );

      set({
        users: [],
        loading: false,
        error,
      });

      return [];
    }
  },
}));