export const API_URL = import.meta.env.VITE_API;
export const CHAT_API_URL = import.meta.env.VITE_CHAT_API;

export const http = axios.create({ baseURL: `${API_URL}/api` });          
export const chatHttp = axios.create({ baseURL: `${CHAT_API_URL}/api` });

const WS_URL = CHAT_API_URL.replace(/^http/, 'ws');