import api from "./index";

export const soruSor = (soru, modul) =>
  api.post("/chat/sor", { soru, modul });
