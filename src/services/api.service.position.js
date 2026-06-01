import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API,    
}) 

export const getPosition = async (pageNumber = 1, pageSize = 10) => {
    try{
        const res = await API.get("/api/Position",{
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

export const getPositionId = async (id) =>{
    try{
        const res = await API.get(`/api/Position/${id}`);
        return res.data
    }catch(error){
        console.error(error);
        throw error
    } 
}

export const createPosition = async (data) =>{
   try{
       const res = await API.post("/api/Position", data)
       return res.data
   }catch(error){
    console.error(error);
    throw error
   }
}

export const updatePosition = async (id, data) =>{
   try{ 
       console.log("Sending update:", id, data); // Отладка
       const res = await API.put(`/api/Position/${id}`, data)
       console.log("Update response:", res.data); // Отладка
       return res.data;
   }catch(error){
    console.error(error);
    throw error
   }
}

export const deletePosition = async (id) => {
  try {
    const res = await API.delete(`/api/Position/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};