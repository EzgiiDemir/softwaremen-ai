import { useChatStore } from "../../store/chatStore";

const EMPTY_OBJ = {};

const MODUL_META = {
  stockman:   { label: "StockMan",   icon: "📦", alan: "Stok Yönetimi" },
  financeman: { label: "FinanceMan", icon: "💰", alan: "Finans & Kasa" },
  accountman: { label: "AccountMan", icon: "🧾", alan: "Muhasebe" },
  serviceman: { label: "ServiceMan", icon: "🔧", alan: "Teknik Servis" },
  wageman:    { label: "WageMan",    icon: "👥", alan: "Personel & Bordro" },
};

export default function ChatHistory({ acik, onKapat }) {
  // Sadece aktif kullanıcının geçmişini oku — diğer kullanıcıların verileri görünmez
  const aktifKullanici     = useChatStore((s) => s.aktifKullanici);
  const kullaniciGecmis    = useChatStore((s) => aktifKullanici ? (s.gecmis[aktifKullanici] ?? EMPTY_OBJ) : EMPTY_OBJ);
  const aktifModul         = useChatStore((s) => s.aktifModul);
  const modulSec           = useChatStore((s) => s.modulSec);
  const modulGecmisTemizle = useChatStore((s) => s.modulGecmisTemizle);

  const moduller = Object.entries(kullaniciGecmis)
    .filter(([, mesajlar]) => mesajlar.length > 0)
    .sort(([, a], [, b]) => (b.at(-1)?.zaman || 0) - (a.at(-1)?.zaman || 0));

  return (
    <div className={`gecmis-panel ${acik ? "acik" : ""}`}>
      <div className="gecmis-panel-header">
        <span>📋 Sohbet Geçmişi</span>
        <button onClick={onKapat} title="Kapat">✕</button>
      </div>

      <div className="gecmis-panel-icerik">
        {moduller.length === 0 ? (
          <p className="gecmis-bos">Henüz sohbet geçmişi yok.</p>
        ) : (
          moduller.map(([modulId, mesajlar]) => {
            const meta     = MODUL_META[modulId] || { label: modulId, icon: "💬", alan: "" };
            const sonMesaj = mesajlar.at(-1);
            const aktif    = modulId === aktifModul;
            const saat     = sonMesaj?.zaman
              ? new Date(sonMesaj.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
              : null;
            const ham      = sonMesaj?.icerik || "";
            const onizleme = ham.replace(/[|*#`]/g, "").slice(0, 55) + (ham.length > 55 ? "…" : "");

            return (
              <div
                key={modulId}
                className={`gecmis-kart ${aktif ? "aktif" : ""}`}
                onClick={() => { modulSec(modulId); onKapat(); }}
              >
                <div className="gecmis-kart-icon">{meta.icon}</div>
                <div className="gecmis-kart-icerik">
                  <div className="gecmis-kart-ust">
                    <span className="gecmis-kart-baslik">{meta.label}</span>
                    <span className="gecmis-kart-alan">{meta.alan}</span>
                  </div>
                  <p className="gecmis-kart-onizleme">{onizleme}</p>
                  <div className="gecmis-kart-alt">
                    <span className="gecmis-kart-sayac">{mesajlar.length} mesaj</span>
                    {saat && <span className="gecmis-kart-zaman">{saat}</span>}
                    <button
                      className="gecmis-sil-btn"
                      title="Bu geçmişi temizle"
                      onClick={(e) => { e.stopPropagation(); modulGecmisTemizle(modulId); }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
