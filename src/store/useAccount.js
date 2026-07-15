import { create } from "zustand";

import {
  login,
  register,
  registerAdmin,
} from "../services/api.service.account";


export const useAccountStore = create((set) => ({

  user: JSON.parse(localStorage.getItem("user")) || null,

  token: localStorage.getItem("token") || null,

  roles: JSON.parse(localStorage.getItem("roles")) || [],

  loading: false,

  error: null,


  // ================= LOGIN =================

  loginUser: async (data) => {

    set({
      loading:true,
      error:null
    });


    try {

      const res = await login(data);


      console.log("LOGIN RESPONSE:", res);



      const userData = res.data;


      const token = userData.jwToken;


      const roles = userData.roles || [];



      // сохраняем токен

      localStorage.setItem(
        "token",
        token
      );



      // сохраняем пользователя

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );



      // сохраняем роли

      localStorage.setItem(
        "roles",
        JSON.stringify(roles)
      );



      set({

        user:userData,

        token,

        roles,

        loading:false

      });



      return userData;



    } catch(error){


      console.log(
        "LOGIN ERROR",
        error
      );


      set({

        loading:false,

        error:error.message

      });


      throw error;

    }

  },




  // ================= REGISTER =================


  registerUser: async(data)=>{


    set({
      loading:true,
      error:null
    });


    try{


      const res = await register(data);


      set({
        loading:false
      });


      return res;


    }catch(error){


      set({

        loading:false,

        error:error.response?.data || error.message

      });


      throw error;

    }

  },




  // ================= REGISTER ADMIN =================


  registerAdminUser: async(data)=>{


    set({

      loading:true,

      error:null

    });


    try{


      const res = await registerAdmin(data);


      set({

        loading:false

      });


      return res;



    }catch(error){


      set({

        loading:false,

        error:error.response?.data || error.message

      });


      throw error;

    }

  },




  // ================= LOGOUT =================


  logout:()=>{


    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("roles");



    set({

      user:null,

      token:null,

      roles:[]

    });


  }


}));