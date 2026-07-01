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
/////////// LOGIN ///////////////

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

/////////  REGISTER ////////////

export const register = async (data) => {
    try{
        const res = await API_URL.post("/api/Account/register", data);
        return res.data
    }catch(error){
        console.error(error);
        throw error;
    }
}

///////// REGISTER ADMIN ///////////

export const registerAdmin = async(data) =>{
    try{
        const res = await API_URL.post("/api/Account/register-admin", data);
        return res.data;
    }catch(error){
        console.error(error);
        throw error;
    }
}