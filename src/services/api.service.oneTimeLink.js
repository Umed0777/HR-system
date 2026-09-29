import axios from "axios";

const api = axios.create({
  baseURL: "http://10.65.10.22:8083/api/v1",
});


export const generateOneTimeLink = async (testId, durationMinutes) => {
  try {
    const res = await api.post("/admin/forms", {
      test_id: Number(testId),
      duration_minutes: Number(durationMinutes),
    });
    return res.data;
  } catch (error) {
    console.error("generateOneTimeLink error:", error);
    throw error;
  }
};

export const getBranches = async () => {
  const res = await api.get("/branches");
  return res.data;
};

export const getInterns = async ({ search, branchId, limit = 20, offset = 0 } = {}) => {
  const res = await api.get("/interns", {
    params: {
      search: search || undefined,
      branch_id: branchId,
      limit,
      offset,
    },
  });
  return res.data;
};

export const getIntern = async (id, { testId, status, limit = 10, offset = 0 } = {}) => {
  const res = await api.get(`/interns/${id}`, {
    params: { test_id: testId, status, limit, offset },
  });
  return res.data;
};

export const getAttempt = async (id) => {
  const res = await api.get(`/attempts/${id}`);
  return res.data;
};