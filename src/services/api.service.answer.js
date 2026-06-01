import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,
});

export const getAnswer = async (pageNumber = 1, pageSize = 100) =>{
    try{
        const res = await API.get(`/api/Answer?pageNumber=${pageNumber}&pageSize=${pageSize}`);
        return res.data;
    }catch(error){
        console.error(error);
        throw error        
    }
}

export const getAnswerId = async (id) =>{
    try{
        const res = await API.get(`/api/Answer/${id}`);
        return res.data
    }catch(error){
        console.error(error);
        throw error
    }
}

export const createAnswer = async (data) =>{
    try{
        const res = await API.post('/api/Answer', data);
        return res.data;
    }catch(error){
        console.error(error);
        throw error;
    }
}

export const deleteAnswer = async (id) =>{
    try{
        const res = await API.delete(`api/Answer/${id}`);
        return res.data
    }catch(error){
        console.error(error);
        throw error
    }
}