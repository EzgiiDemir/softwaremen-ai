import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { MODUL_META } from "./Sidebar";

export default function Header({ bildirimSayisi, onBildirimToggle, onMenuToggle }) {
  const { user } = useAuthStore();
  const { aktifModul } = useChatStore();
  const modulInfo = aktifModul ? MODUL_META[aktifModul] : null;

  return (
    <>
      {/* Masaüstü header */}
      <header className="header">
        <div className="header-sol">
          {modulInfo && <span className="header-modul-ikon">{modulInfo.icon}</span>}
          <span className="header-baslik">
            {modulInfo ? modulInfo.label : "Softwaremen AI"}
          </span>
        </div>
        <div className="header-sag">
          <button
            className="header-bildirim-btn"
            onClick={onBildirimToggle}
            title="Bildirimler"
          >
            🔔
            {bildirimSayisi > 0 && <span className="badge">{bildirimSayisi}</span>}
          </button>
          <span className="header-kullanici">{user?.ad}</span>
        </div>
      </header>

      {/* Mobil header */}
      <div className="mobil-header">
        <button className="hamburger" onClick={onMenuToggle}>☰</button>
        <span className="mobil-baslik">
          {modulInfo ? `${modulInfo.icon} ${modulInfo.label}` : "Softwaremen"}
        </span>
        <button className="mobil-bildirim" onClick={onBildirimToggle}>
          🔔
          {bildirimSayisi > 0 && <span className="mobil-badge">{bildirimSayisi}</span>}
        </button>
      </div>
    </>
  );
}
