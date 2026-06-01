import { create } from "zustand";
import {getAnswer, getAnswerId, createAnswer, deleteAnswer} from '../services/api.service.answer';

export const useAnswerStore = create((set) =>({
    answers: [],
    currentAnswer: null,
    loading: false,
    error: null,
    
    fetchAnswers: async () =>{
        set({loading: true, error: null});
        try{
            const res = await getAnswer();
            console.log("Fetch answers response:", res);
            set({answers: Array.isArray(res) ? res : res.data || [], loading: false});
        }catch(err){
            set({error: err.message, loading: false})
        }
    },
    
    fetchAnswersById: async (id) =>{
        set({loading: true, error: null});
        try{
            const res = await getAnswerId(id);
            set({currentAnswer: res.data, loading: false});
            return res.data;
        }catch(err){
            set({error: err.message, loading: false});
            throw err;
        }
    },
    
    addAnswer: async (newData) =>{
        set({loading: true, error: null});
        try{
            const res = await createAnswer(newData);
            console.log("Added answer:", res.data);
            set((state)=>({
                answers: [...state.answers, res.data],
                loading: false
            }))
            return res.data
        }catch(err){
            set({error: err.message, loading: false});
            console.log("Add error:", err.response?.data || err.message);
            throw err
        }
    },
    
    remove: async (id) =>{
        set({loading: true, error: null});
        try {
            await deleteAnswer(id);
            set((state) =>({
                answers: state.answers.filter((a) => a.id !== id),
                loading: false
            }))
        }catch(err){
            set({error: err.message, loading: false});
            console.log("Delete error:", err.response?.data || err.message);
            throw err
        }
    }
}))