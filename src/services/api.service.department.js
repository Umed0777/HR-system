import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,    
}) 
export const getDepartament = async (pageNumber = 1, pageSize = 10) => {
    try{
       const res = await API.get("/api/Department", {
      params: {
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
    });
        return res.data;
    }catch(error){
        console.error(error);
        throw error
        
    }
}
export const getDepartmentId = async (id) =>{
    try{
        const res = await API.get(`/api/Department/${id}`);
        return res.data
    }catch(error){
        console.error(error);
        throw error
    } 
}
export const createDepartment = async (data) =>{
   try{
       const res = await API.post("/api/Department",data)
       return res.data
   }catch(error){
    console.error(error);
    throw error
   }
}
export const updateDepartment = async (id,data) =>{
   try{ 
       const res = await API.put(`/api/Department/${id}`,data)
       return res.data;
   }catch(error){
    console.error(error);
    throw error
   }
}
export const deleteDepartment = async (id) =>{
    try{
        const res = await API.delete(`/api/Department/${id}`)
        return res.data
    }catch(error){
        console.error(error);
        throw error
    }
} 