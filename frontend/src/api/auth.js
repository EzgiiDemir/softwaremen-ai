import api from "./index";

export const giris = (kullanici_adi, sifre) =>
  api.post("/auth/giris", { kullanici_adi, sifre });

export const benimBilgilerim = () => api.get("/auth/ben");
