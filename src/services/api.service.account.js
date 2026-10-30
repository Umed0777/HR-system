import axios from "axios";

const API_URL = axios.create({
    baseURL: import.meta.env.VITE_API,
});

API_URL.interceptors.request.use((config) =>{
    const token = localStorage.getItem('token');

    if(token){
    config.headers.Authorization = `Bearer ${token}`
}
    return config;
})

export const login = async (data) => {
    try{
        const res  = await API_URL.post("/api/Account/login", data);
        console.log("FULL RESPONSE:", res);
        console.log("DATA ONLY:", res.data);
        console.log("TOKEN:", res.data?.data?.jwToken);
        return res.data;
    }catch(error){
        console.error(error);
        throw error
    }
}

export const getUsers = async (pageNumber = 1, pageSize = 10) => {
  try {
    const res = await API_URL.get("/api/User", {
      params: {
        pageNumber,
        pageSize,
      },
    });

    console.log("USERS RESPONSE:", res.data);

    return res.data;
  } catch (error) {
    console.error(
      "Ошибка получения пользователей:",
      error.response?.data || error
    );

    throw error;
  }
};