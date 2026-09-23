export const FOLDER_TYPES = {
  VIDEO: 0,
  DOCUMENTATION: 1,
};

export const FOLDER_TYPE_NAMES = {
  0: "Видеоуроки",
  1: "Документация",
};

export const isFolderOfType = (folder, type) => {
  if (!folder) return false;
  const ft = folder.folderType;
  if (ft === undefined || ft === null) return false;
  if (typeof ft === "number") return ft === type;
  const s = String(ft).toLowerCase();
  if (type === FOLDER_TYPES.VIDEO) {
    return s === "0" || s === "video" || s === "videos";
  }
  if (type === FOLDER_TYPES.DOCUMENTATION) {
    return s === "1" || s === "documentation" || s === "documents";
  }
  return false;
};