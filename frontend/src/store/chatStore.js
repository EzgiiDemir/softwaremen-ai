import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_MESAJ = 60;

export const useChatStore = create(
  persist(
    (set, get) => ({
      aktifKullanici: null,
      aktifModul:    null,
      // gecmis: { [userId]: { [modulId]: [mesajlar] } }
      gecmis:        {},

      // Giriş yapıldığında çağrılır — kullanıcı state'ini ayarlar
      kullaniciBelirle: (kullaniciId) => {
        const { aktifKullanici } = get();
        if (aktifKullanici !== kullaniciId) {
          set({ aktifKullanici: kullaniciId, aktifModul: null });
        }
      },

      // Çıkış yapıldığında mevcut kullanıcının chat verisi silinir (gizlilik)
      kullaniciCikis: () => {
        const { aktifKullanici, gecmis } = get();
        const yeniGecmis = { ...gecmis };
        if (aktifKullanici) delete yeniGecmis[aktifKullanici];
        set({ aktifKullanici: null, gecmis: yeniGecmis, aktifModul: null });
      },

      mesajEkle: (mesaj) => {
        const { aktifKullanici, aktifModul, gecmis } = get();
        if (!aktifKullanici || !aktifModul) return;
        const kullaniciGecmis = gecmis[aktifKullanici] || {};
        const modulMesajlar   = kullaniciGecmis[aktifModul] || [];
        set({
          gecmis: {
            ...gecmis,
            [aktifKullanici]: {
              ...kullaniciGecmis,
              [aktifModul]: [...modulMesajlar, mesaj].slice(-MAX_MESAJ),
            },
          },
        });
      },

      mesajlariTemizle: () => {
        const { aktifKullanici, aktifModul, gecmis } = get();
        if (!aktifKullanici || !aktifModul) return;
        const kullaniciGecmis = gecmis[aktifKullanici] || {};
        set({
          gecmis: {
            ...gecmis,
            [aktifKullanici]: { ...kullaniciGecmis, [aktifModul]: [] },
          },
        });
      },

      modulGecmisTemizle: (modulId) => {
        const { aktifKullanici, gecmis } = get();
        if (!aktifKullanici) return;
        const kullaniciGecmis = gecmis[aktifKullanici] || {};
        set({
          gecmis: {
            ...gecmis,
            [aktifKullanici]: { ...kullaniciGecmis, [modulId]: [] },
          },
        });
      },

      modulSec: (modul) => set({ aktifModul: modul }),

      // Aktif modülün son N mesajını döndürür (AI bağlamı için)
      getGecmis: (n = 10) => {
        const { aktifKullanici, aktifModul, gecmis } = get();
        if (!aktifKullanici || !aktifModul) return [];
        return ((gecmis[aktifKullanici] || {})[aktifModul] || []).slice(-n);
      },
    }),
    { name: "sm_chat" }
  )
);
