import axios from "axios";

const API_URL = axios.create({
    baseURL: import.meta.env.VITE_API_ARTICLES,
})
API_URL.interceptors.request.use((config) => {
  const login = localStorage.getItem("login");
   console.log("Отправляю Login:", login); 

  if (login) {
    config.headers.Login = login;
  }

  return config;
});

// get all
export const getArticles = async (limit = 20, offset = 0, query="") =>{
    try{
        const res = await API_URL.get("/api/articles",{
        params: {limit, offset,query}
        })
        return res.data;
    }catch(error){
        console.error("getArticles ошибка:", error.response?.data || error.message);
        throw error
    }
}

// get by id
export const getArticleById = async(id) =>{
    try{
        const res = await API_URL.get(`/api/articles/${id}`);
        return res.data;
    }catch(error){
        console.error("getArticlesById ошибка:", error.response?.data || error.message);
        throw error
    }
}
// create
export const createArticle = async (data) => {
  try {
    const login = localStorage.getItem("login");

    const res = await API_URL.post("/api/articles", data, {
  headers: {
    login: login,
  },
});

    return res.data;
  } catch (error) {
    console.error(
      "createArticles ошибка:",
      error.response?.data || error.message
    );
    throw error;
  }
};
// put
export const updateArticle = async(id, data) =>{
    try{
        const res = await API_URL.put(`/api/articles/${id}`, data)
        return res.data
    }catch(error){
        console.error("updateArticles ошибка:", error.response?.data || error.message);
        throw error
    }
}
// delete
export const deleteArticle = async (id) =>{
    try{
        const res = await API_URL.delete(`/api/articles/${id}`);
        return res.data
    }
    catch(error){
        console.error("deleteArticles ошибка:", error.response?.data || error.message);
        throw error
    }
}

// ============= КОММЕНТАРИИ (CRUD) =============

// Получить дерево комментариев для статьи
export const getComments = async (articleId) => {
  try {
    const res = await API_URL.get(`/api/articles/${articleId}/comments`);
    return res.data;
  } catch (error) {
    console.error("getComments ошибка:", error.response?.data || error.message);
    throw error;
  }
};

// Создать комментарий
export const createComment = async (articleId, data) => {
  try {
    const login = localStorage.getItem("login");
    const res = await API_URL.post(`/api/articles/${articleId}/comments`, data, {
      headers: {
        "Content-Type": "application/json",
        login: login,
      },
    });
    return res.data;
  } catch (error) {
    console.error("createComment ошибка:", error.response?.data || error.message);
    throw error;
  }
};

// Обновить комментарий
export const updateComment = async (id, data) => {
  try {
    const res = await API_URL.put(`/api/comments/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("updateComment ошибка:", error.response?.data || error.message);
    throw error;
  }
};

// Удалить комментарий
export const deleteComment = async (id) => {
  try {
    const res = await API_URL.delete(`/api/comments/${id}`);
    return res.data;
  } catch (error) {
    console.error("deleteComment ошибка:", error.response?.data || error.message);
    throw error;
  }
};

// ============= ПРОФИЛЬ И МОИ СТАТЬИ (/api/me) =============

/**
 * Получить профиль текущего пользователя (логин и его статьи)
 * GET /api/me
 */
export const getMyProfile = async () => {
  try {
    const res = await API_URL.get("/api/me");
    return res.data; // { login, articles: [...] }
  } catch (error) {
    console.error("getMyProfile ошибка:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Обновить свою статью (из профиля)
 * PUT /api/me/articles/{id}
 */
export const updateMyArticle = async (id, data) => {
  try {
    const res = await API_URL.put(`/api/me/articles/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("updateMyArticle ошибка:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Удалить свою статью (из профиля)
 * DELETE /api/me/articles/{id}
 */
export const deleteMyArticle = async (id) => {
  try {
    const res = await API_URL.delete(`/api/me/articles/${id}`);
    return res.data;
  } catch (error) {
    console.error("deleteMyArticle ошибка:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Обновить файлы своей статьи (из профиля)
 * PUT /api/me/articles/{id}/files
 * @param {number} id - ID статьи
 * @param {FormData} formData - должен содержать поля cover и/или video
 */
export const updateMyArticleFiles = async (id, formData) => {
  try {
    const login = localStorage.getItem("login");
    const res = await API_URL.put(`/api/me/articles/${id}/files`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        login: login,
      },
    });
    return res.data;
  } catch (error) {
    console.error("updateMyArticleFiles ошибка:", error.response?.data || error.message);
    throw error;
  }
};