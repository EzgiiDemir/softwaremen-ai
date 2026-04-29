import api from "./index";

export const ozet = () => api.get("/dashboard/ozet");
export const bildirimler = () => api.get("/dashboard/bildirimler");
