import { create } from "zustand";
import {
  getFoldersByType,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/api.service.folder";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
} from "../services/api.service.announcement";
import { FOLDER_TYPES, isFolderOfType } from "../constants/folderTypes";

const normalizeList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.$values)) return response.$values;
  if (Array.isArray(response.data?.$values)) return response.data.$values;
  return [];
};

const extractFilePath = (ann) =>
  ann.profileImagePath || ann.path || ann.url || ann.filePath || "";

export const useVideoLessonStore = create((set, get) => ({
  videoLessons: [],
  allFolders: [],
  currentVideoLesson: null,
  loading: false,
  error: null,

  fetchAllFolders: async () => {
    try {
      const response = await getFoldersByType(FOLDER_TYPES.VIDEO);
      const folders = normalizeList(response);
      const filtered = folders.filter((f) => isFolderOfType(f, FOLDER_TYPES.VIDEO));
      set({ allFolders: filtered });
      return filtered;
    } catch (error) {
      console.error("❌ Ошибка загрузки папок видео:", error);
      set({ error: error.message || "Ошибка загрузки папок", allFolders: [] });
      throw error;
    }
  },

  fetchVideoLessons: async () => {
    set({ loading: true, error: null });
    try {
      const folders = await get().fetchAllFolders();
      const folderMap = new Map(folders.map((f) => [Number(f.id), f]));

      let videoLessons = [];
      folders.forEach((folder) => {
        const list = Array.isArray(folder.announcements) ? folder.announcements : [];
        list.forEach((ann) => {
          videoLessons.push({
            ...ann,
            folderId: folder.id,
            folderName: folder.name,
            folderType: folder.folderType,
            profileImagePath: extractFilePath(ann),
          });
        });
      });

      const response = await getAnnouncement();
      const allAnnouncements = normalizeList(response);

      const folderIds = new Set(folders.map((f) => Number(f.id)));
      const seen = new Set(videoLessons.map((v) => Number(v.id)));

      allAnnouncements.forEach((ann) => {
        const id = Number(ann.id);
        if (seen.has(id)) return;

        const rawFid = ann.folderId;
        const fid =
          rawFid !== undefined && rawFid !== null && rawFid !== 0
            ? Number(rawFid)
            : null;

        if (fid !== null && !folderIds.has(fid)) return;

        const folder = fid !== null ? folderMap.get(fid) : null;

        videoLessons.push({
          ...ann,
          folderId: fid,
          folderName: folder ? folder.name : null,
          folderType: folder ? folder.folderType : null,
          profileImagePath: extractFilePath(ann),
        });
        seen.add(id);
      });

      set({ videoLessons, loading: false, error: null });
      return videoLessons;
    } catch (error) {
      console.error("❌ Ошибка загрузки видеоуроков:", error);
      set({
        videoLessons: [],
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Ошибка загрузки видеоуроков",
      });
      throw error;
    }
  },

  createNewFolder: async (folderData) => {
    try {
      const newFolder = await createFolder({
        name: folderData.name.trim(),
        folderType: FOLDER_TYPES.VIDEO,
      });
      await get().fetchAllFolders();
      return newFolder;
    } catch (error) {
      console.error("❌ Ошибка создания папки:", error);
      throw error;
    }
  },

  updateFolder: async (folderId, folderData) => {
    try {
      const updated = await updateFolder(folderId, {
        ...folderData,
        folderType: FOLDER_TYPES.VIDEO,
      });
      await get().fetchAllFolders();
      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления папки:", error);
      throw error;
    }
  },

  deleteFolder: async (folderId) => {
    try {
      const videosToDelete = get().videoLessons.filter(
        (v) => Number(v.folderId) === Number(folderId)
      );
      for (const v of videosToDelete) {
        try {
          await deleteAnnouncement(v.id);
        } catch (e) {
          console.error(`Ошибка удаления видео ${v.id}:`, e);
        }
      }
      await deleteFolder(folderId);
      set((state) => ({
        videoLessons: state.videoLessons.filter(
          (v) => Number(v.folderId) !== Number(folderId)
        ),
      }));
      await get().fetchAllFolders();
      return true;
    } catch (error) {
      console.error("❌ Ошибка удаления папки:", error);
      throw error;
    }
  },

  addVideoLesson: async (newData) => {
    try {
      const formData = new FormData();
      formData.append("Title", newData.title || "");
      formData.append("Content", newData.content || "");
      formData.append(
        "SubDepartmentId",
        String(Number(newData.subDepartmentId ?? 0))
      );
      formData.append("EmployeeId", String(Number(newData.employeeId ?? 0)));

      if (newData.folderId) {
        const folders = get().allFolders;
        const exists = folders.some(
          (f) => Number(f.id) === Number(newData.folderId)
        );
        formData.append(
          "FolderId",
          exists ? String(Number(newData.folderId)) : "0"
        );
      } else {
        formData.append("FolderId", "0");
      }

      if (Array.isArray(newData.files)) {
        newData.files.forEach((file, index) => {
          if (file instanceof File) {
            if (index === 0) formData.append("ProfileImage", file);
            formData.append("Files", file);
          }
        });
      }

      const response = await createAnnouncement(formData);
      await get().fetchVideoLessons();
      return response;
    } catch (error) {
      console.error("❌ Ошибка создания видеоурока:", error);
      throw error;
    }
  },

  editVideoLesson: async (id, updatedData) => {
    try {
      const formData = new FormData();
      formData.append("Title", updatedData.title || "");
      formData.append("Content", updatedData.content || "");

      if (
        updatedData.subDepartmentId !== null &&
        updatedData.subDepartmentId !== undefined
      ) {
        formData.append(
          "SubDepartmentId",
          String(Number(updatedData.subDepartmentId))
        );
      }
      if (
        updatedData.employeeId !== null &&
        updatedData.employeeId !== undefined
      ) {
        formData.append("EmployeeId", String(Number(updatedData.employeeId)));
      }

      if (
        updatedData.folderId !== null &&
        updatedData.folderId !== undefined
      ) {
        const folders = get().allFolders;
        const exists = folders.some(
          (f) => Number(f.id) === Number(updatedData.folderId)
        );
        if (exists || Number(updatedData.folderId) === 0) {
          formData.append(
            "FolderId",
            String(Number(updatedData.folderId || 0))
          );
        } else {
          formData.append("FolderId", "0");
        }
      }

      if (Array.isArray(updatedData.files)) {
        updatedData.files.forEach((file, index) => {
          if (file instanceof File) {
            if (index === 0) formData.append("ProfileImage", file);
            formData.append("Files", file);
          }
        });
      }

      const updated = await updateAnnouncement(id, formData);
      await get().fetchVideoLessons();
      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления видеоурока:", error);
      throw error;
    }
  },

  removeVideoLesson: async (id) => {
    try {
      await deleteAnnouncement(id);
      set((state) => ({
        videoLessons: state.videoLessons.filter(
          (v) => Number(v.id) !== Number(id)
        ),
      }));
      await get().fetchVideoLessons();
    } catch (error) {
      console.error("❌ Ошибка удаления видеоурока:", error);
      throw error;
    }
  },

  moveVideoToFolder: async (videoId, folderId) => {
    try {
      const video = get().videoLessons.find(
        (v) => Number(v.id) === Number(videoId)
      );
      if (!video) throw new Error("Видео не найдено");

      if (folderId) {
        const exists = get().allFolders.some(
          (f) => Number(f.id) === Number(folderId)
        );
        if (!exists) throw new Error("Папка не найдена в видеоуроках");
      }

      await get().editVideoLesson(videoId, {
        ...video,
        folderId: folderId || 0,
      });
      return true;
    } catch (error) {
      console.error(" Ошибка перемещения видео:", error);
      throw error;
    }
  },
}));