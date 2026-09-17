import { create } from "zustand";
import { getUsers } from "../services/api.service.account";

export const useUserNotificationStore =
  create((set) => ({
    users: [],
    loading: false,
    error: null,

    fetchUsers: async () => {
      try {
        set({
          loading: true,
          error: null,
        });

        const response =
          await getUsers(1, 40);

        console.log(
          "USERS RESPONSE:",
          response
        );

        const users = Array.isArray(
          response?.data
        )
          ? response.data
          : [];

        set({
          users,
          loading: false,
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