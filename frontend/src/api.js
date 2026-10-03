import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5050/api",
});

export const signup = (data) => API.post("/auth/signup", data);
export const login = (data) => API.post("/auth/login", data);

API.interceptors.request.use((req) => {
const user = JSON.parse(sessionStorage.getItem("user"));
  if (user?.token) {
    req.headers.Authorization = `Bearer ${user.token}`;
  }

  return req;
});

export default API;