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

export const useDocumentationStore = create((set, get) => ({
  documents: [],
  allFolders: [],
  currentDocument: null,
  loading: false,
  error: null,

  fetchAllFolders: async () => {
    try {
      const response = await getFoldersByType(FOLDER_TYPES.DOCUMENTATION);
      const folders = normalizeList(response);
      const filtered = folders.filter((f) =>
        isFolderOfType(f, FOLDER_TYPES.DOCUMENTATION)
      );
      set({ allFolders: filtered });
      return filtered;
    } catch (error) {
      console.error("❌ Ошибка загрузки папок документации:", error);
      set({
        error: error.message || "Ошибка загрузки папок",
        allFolders: [],
      });
      throw error;
    }
  },

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const folders = await get().fetchAllFolders();
      const folderMap = new Map(folders.map((f) => [Number(f.id), f]));

      // 1) Документы из вложенных announcements
      let documents = [];
      folders.forEach((folder) => {
        const list = Array.isArray(folder.announcements)
          ? folder.announcements
          : [];
        list.forEach((ann) => {
          documents.push({
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
      const seen = new Set(documents.map((d) => Number(d.id)));

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

        documents.push({
          ...ann,
          folderId: fid,
          folderName: folder ? folder.name : null,
          folderType: folder ? folder.folderType : null,
          profileImagePath: extractFilePath(ann),
        });
        seen.add(id);
      });

      set({ documents, loading: false, error: null });
      return documents;
    } catch (error) {
      console.error(" Ошибка загрузки документов:", error);
      set({
        documents: [],
        loading: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Ошибка загрузки документов",
      });
      throw error;
    }
  },

  createNewFolder: async (folderData) => {
    try {
      const newFolder = await createFolder({
        name: folderData.name.trim(),
        description: folderData.description || "Папка документации",
        folderType: FOLDER_TYPES.DOCUMENTATION,
      });
      await get().fetchAllFolders();
      return newFolder;
    } catch (error) {
      console.error(" Ошибка создания папки:", error);
      throw error;
    }
  },

  updateFolder: async (folderId, folderData) => {
    try {
      const updated = await updateFolder(folderId, {
        ...folderData,
        folderType: FOLDER_TYPES.DOCUMENTATION,
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
      const docsToDelete = get().documents.filter(
        (d) => Number(d.folderId) === Number(folderId)
      );
      for (const doc of docsToDelete) {
        try {
          await deleteAnnouncement(doc.id);
        } catch (e) {
          console.error(`Ошибка удаления документа ${doc.id}:`, e);
        }
      }
      await deleteFolder(folderId);
      set((state) => ({
        documents: state.documents.filter(
          (d) => Number(d.folderId) !== Number(folderId)
        ),
      }));
      await get().fetchAllFolders();
      return true;
    } catch (error) {
      console.error(" Ошибка удаления папки:", error);
      throw error;
    }
  },

  addDocument: async (newData) => {
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
        const exists = get().allFolders.some(
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
      await get().fetchDocuments();
      return response;
    } catch (error) {
      console.error("❌ Ошибка создания документа:", error);
      throw error;
    }
  },

  editDocument: async (id, updatedData) => {
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
        const exists = get().allFolders.some(
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
      await get().fetchDocuments();
      return updated;
    } catch (error) {
      console.error("❌ Ошибка обновления документа:", error);
      throw error;
    }
  },

  removeDocument: async (id) => {
    try {
      await deleteAnnouncement(id);
      set((state) => ({
        documents: state.documents.filter(
          (d) => Number(d.id) !== Number(id)
        ),
      }));
      await get().fetchDocuments();
    } catch (error) {
      console.error(" Ошибка удаления документа:", error);
      throw error;
    }
  },

  moveDocumentToFolder: async (docId, folderId) => {
    try {
      const doc = get().documents.find((d) => Number(d.id) === Number(docId));
      if (!doc) throw new Error("Документ не найден");

      if (folderId) {
        const exists = get().allFolders.some(
          (f) => Number(f.id) === Number(folderId)
        );
        if (!exists) throw new Error("Папка не найдена в документации");
      }

      await get().editDocument(docId, { ...doc, folderId: folderId || 0 });
      return true;
    } catch (error) {
      console.error(" Ошибка перемещения документа:", error);
      throw error;
    }
  },
}));