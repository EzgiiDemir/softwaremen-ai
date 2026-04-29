import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { ozet as fetchOzet, bildirimler as fetchBildirimler } from "../api/dashboard";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import NotificationPanel from "../components/dashboard/NotificationPanel";
import StockMan   from "../components/modules/StockMan";
import FinanceMan from "../components/modules/FinanceMan";
import AccountMan from "../components/modules/AccountMan";
import ServiceMan from "../components/modules/ServiceMan";
import WageMan    from "../components/modules/WageMan";
import "../styles/dashboard.css";
import "../styles/sidebar.css";
import "../styles/chat.css";

const MODUL_BILESENI = {
  stockman:   StockMan,
  financeman: FinanceMan,
  accountman: AccountMan,
  serviceman: ServiceMan,
  wageman:    WageMan,
};

const DESTEKLENEN = Object.keys(MODUL_BILESENI);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const aktifModul = useChatStore((s) => s.aktifModul);
  const modulSec   = useChatStore((s) => s.modulSec);

  const [sidebarAcik,   setSidebarAcik]   = useState(false);
  const [bildirimAcik,  setBildirimAcik]  = useState(false);
  const [bildirimler,   setBildirimler]   = useState([]);
  const [bilYukleniyor, setBilYukleniyor] = useState(false);
  const [modulOzet,     setModulOzet]     = useState({});

  // İlk desteklenen modülü seç
  useEffect(() => {
    const desteklenenModuller = (user?.moduller || []).filter((m) => DESTEKLENEN.includes(m));
    if (!aktifModul || !DESTEKLENEN.includes(aktifModul)) {
      if (desteklenenModuller.length > 0) {
        modulSec(desteklenenModuller[0]);
      }
    }
  }, []);

  // Modül özetlerini çek
  useEffect(() => {
    fetchOzet()
      .then((res) => setModulOzet(res.data?.ozet || {}))
      .catch(() => {});
  }, []);

  const bildirimAc = async () => {
    if (bildirimAcik) { setBildirimAcik(false); return; }
    setBildirimAcik(true);
    if (bildirimler.length > 0) return;
    setBilYukleniyor(true);
    try {
      const res = await fetchBildirimler();
      setBildirimler(res.data?.bildirimler || []);
    } catch {
      setBildirimler([{ tip: "kritik", modul: "sistem", mesaj: "Bildirimler yüklenemedi." }]);
    } finally {
      setBilYukleniyor(false);
    }
  };

  const kritikSayi = bildirimler.filter((b) => b.tip === "kritik").length;
  const AktifBilesen = aktifModul && DESTEKLENEN.includes(aktifModul)
    ? MODUL_BILESENI[aktifModul]
    : null;

  return (
    <div className="app">
      {sidebarAcik && (
        <div className="overlay" onClick={() => setSidebarAcik(false)} />
      )}

      <Sidebar
        acik={sidebarAcik}
        bildirimSayisi={kritikSayi}
        onBildirimToggle={bildirimAc}
      />

      <div className="icerik">
        <Header
          bildirimSayisi={kritikSayi}
          onBildirimToggle={bildirimAc}
          onMenuToggle={() => setSidebarAcik((v) => !v)}
        />

        <NotificationPanel
          acik={bildirimAcik}
          bildirimler={bildirimler}
          yukleniyor={bilYukleniyor}
          onKapat={() => setBildirimAcik(false)}
        />

        {AktifBilesen && !bildirimAcik && (
          <AktifBilesen
            ozet={modulOzet[aktifModul]?.ozet}
            data={modulOzet[aktifModul]}
          />
        )}

        {!AktifBilesen && !bildirimAcik && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            color: "#94A3B8",
            fontFamily: "system-ui, sans-serif",
          }}>
            <span style={{ fontSize: 48 }}>⚡</span>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>
              Softwaremen AI
            </p>
            <p style={{ fontSize: 13 }}>Sol menüden bir modül seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
