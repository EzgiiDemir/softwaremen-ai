import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8002",
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("sm_auth");
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch {
      // bozuk veri — pas geç
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sm_auth");
      window.location.href = "/giris";
    }
    return Promise.reject(err);
  }
);

export default api;
