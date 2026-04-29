import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";

const MODUL_META = {
  stockman:   { label: "StockMan",   icon: "📦", aciklama: "Stok Yönetimi" },
  financeman: { label: "FinanceMan", icon: "💰", aciklama: "Finans & Kasa" },
  accountman: { label: "AccountMan", icon: "📒", aciklama: "Muhasebe" },
  serviceman: { label: "ServiceMan", icon: "🔧", aciklama: "Teknik Servis" },
  wageman:    { label: "WageMan",    icon: "👥", aciklama: "İnsan Kaynakları" },
};

export default function Sidebar({ acik, bildirimSayisi, onBildirimToggle }) {
  const { user, cikis }                   = useAuthStore();
  const { aktifModul, modulSec, kullaniciCikis } = useChatStore();

  const cikisYap = () => {
    kullaniciCikis(); // Chat geçmişini temizle (gizlilik)
    cikis();          // Token ve user bilgisini temizle
  };

  const moduller = (user?.moduller || []).filter((m) => MODUL_META[m]);

  return (
    <aside className={`sidebar ${acik ? "acik" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-logo">⚡</span>
          <span className="sidebar-title">Softwaremen</span>
        </div>
        <button className="bildirim-btn" onClick={onBildirimToggle} title="Bildirimler">
          <span>🔔</span>
          {bildirimSayisi > 0 && <span className="badge">{bildirimSayisi}</span>}
        </button>
      </div>

      <div className="musteri-karti">
        <div className="musteri-avatar">
          {user?.ad?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="musteri-info">
          <p className="musteri-ad">{user?.ad}</p>
          <p className="musteri-etiket">{moduller.length} modül erişimi</p>
        </div>
      </div>

      <div className="nav-baslik">MODÜLLER</div>
      <nav className="nav">
        {moduller.map((id) => {
          const m = MODUL_META[id];
          return (
            <button
              key={id}
              className={`nav-item ${aktifModul === id ? "aktif" : ""}`}
              onClick={() => modulSec(id)}
            >
              <span className="nav-icon">{m.icon}</span>
              <div className="nav-metin">
                <span className="nav-label">{m.label}</span>
                <span className="nav-aciklama">{m.aciklama}</span>
              </div>
              {aktifModul === id && <span className="nav-aktif-cizgi" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="durum-satiri">
          <span className="durum-dot" />
          <span>Bağlı · port 8002</span>
        </div>
        <button className="cikis-btn" onClick={cikisYap}>
          <span>⎋</span><span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

export { MODUL_META };
