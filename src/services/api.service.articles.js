import axios from "axios";

const API_URL = axios.create({
    baseURL: import.meta.env.VITE_API_ARTICLES,
})

// get all
export const getArticles = async (limit = 20, offset = 0) =>{
    try{
        const res = await API_URL.get("/api/articles",{
        params: {limit, offset}
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
export const createArticle = async(data) =>{
    try{
        const res = await API_URL.post("/api/articles",data);
        return res.data
    }catch(error){
         console.error("createArticles ошибка:", error.response?.data || error.message);
        throw error
        
    }
}
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