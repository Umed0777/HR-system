import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,    
}) 
export const getSubDepartment = async (pageNumber = 1, pageSize = 10) => {
    try{
        const res = await API.get("/api/SubDepartment", {
        params: {
        PageNumber: pageNumber,
        PageSize: pageSize,
      },
        })
        return res.data;
    }catch(error){
        console.error(error);
        throw error
        
    }
}
export const getSubDepartmentId = async (id) =>{
    try{
        const res = await API.get(`/api/SubDepartment/${id}`);
        return res.data
    }catch(error){
        console.error(error);
        throw error
    } 
}
export const createSubDepartment = async (data) =>{
   try{
       const res = await API.post("/api/SubDepartment",data)
       return res.data
   }catch(error){
    console.error(error);
    throw error
   }
}
export const updateSubDepartment = async (id,data) =>{
   try{ 
       const res = await API.put(`/api/SubDepartment/${id}`,data)
       return res.data;
   }catch(error){
    console.error(error);
    throw error
   }
}
export const deleteSubDepartment = async (id) =>{
    try{
        const res = await API.delete(`/api/SubDepartment/${id}`)
        return res.data
    }catch(error){
        console.error(error);
        throw error
    }
} 