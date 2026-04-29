import { useState } from "react";
import StatsCard from "../dashboard/StatsCard";
import ChatWindow from "../chat/ChatWindow";

const MODUL_INFO = { id: "serviceman", label: "ServiceMan", icon: "🔧", aciklama: "Teknik Servis" };

const SORULAR = [
  "Açık çağrıları listele",
  "Bugün kapananlar neler?",
  "Servis özet raporu",
  "Garanti durumuna göre dağılım",
  "Bu hafta kaç servis kapandı?",
];

function tarih(v) {
  if (!v) return "—";
  return String(v).slice(0, 10);
}

const GARANTI = { 0: "Garanti Dışı", 1: "Garanti Kapsamında", 2: "Süresi Dolmuş" };

export default function ServiceMan({ ozet, data }) {
  const [sekme, setSekme] = useState("acik");

  const acikCagrilar   = data?.acik_cagrilar   ?? [];
  const kapaliCagrilar = data?.kapali_cagrilar  ?? [];

  return (
    <div className="chat">
      <div className="stats-bar">
        <StatsCard
          ikon="🔓" baslik="Açık Çağrı"
          deger={ozet?.acik_cagri_sayisi ?? "—"} alt="bekleyen servis"
          renk={ozet?.acik_cagri_sayisi > 5 ? "red" : "amber"}
        />
        <StatsCard
          ikon="✅" baslik="Bugün Kapanan"
          deger={ozet?.bugun_kapanan ?? "—"} alt="tamamlanan" renk="green"
        />
        <StatsCard
          ikon="📅" baslik="Bu Hafta Kapanan"
          deger={ozet?.hafta_kapanan ?? "—"} alt="7 gün içinde" renk="blue"
        />
        <StatsCard
          ikon="📋" baslik="Son Kayıtlar"
          deger={kapaliCagrilar.length} alt="son kapalı" renk="blue"
        />
      </div>

      <div className="veri-panel">
        <div className="veri-panel-header">
          <div className="veri-sekmeler">
            <button
              className={`veri-sekme ${sekme === "acik" ? "aktif" : ""}`}
              onClick={() => setSekme("acik")}
            >
              🔓 Açık Çağrılar
              <span className="veri-panel-sayac">{acikCagrilar.length}</span>
            </button>
            <button
              className={`veri-sekme ${sekme === "kapali" ? "aktif" : ""}`}
              onClick={() => setSekme("kapali")}
            >
              ✅ Son Kapananlar
              <span className="veri-panel-sayac">{kapaliCagrilar.length}</span>
            </button>
          </div>
          <span className="veri-panel-guncelleme">Canlı DB verisi</span>
        </div>

        <div className="veri-tablo-wrap">
          {sekme === "acik" && (
            acikCagrilar.length === 0 ? (
              <div className="veri-bos">Açık servis çağrısı yok — tüm çağrılar kapatılmış.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Servis ID</th>
                    <th>Müşteri Kodu</th>
                    <th>Makine No</th>
                    <th>Açılış Tarihi</th>
                    <th>Garanti</th>
                    <th>Tip</th>
                    <th>Konum</th>
                  </tr>
                </thead>
                <tbody>
                  {acikCagrilar.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{r.servis_id || "—"}</td>
                      <td className="r-bold">{r.musteri_kodu || "—"}</td>
                      <td>{r.makine_no || "—"}</td>
                      <td className="r-kod">{tarih(r.baslangic_tarihi)}</td>
                      <td className={r.garanti_durumu === 1 ? "r-iyi" : ""}>
                        {GARANTI[r.garanti_durumu] ?? r.garanti_durumu ?? "—"}
                      </td>
                      <td>{r.servis_tipi || "—"}</td>
                      <td>{r.konum || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {sekme === "kapali" && (
            kapaliCagrilar.length === 0 ? (
              <div className="veri-bos">Kapalı servis kaydı bulunamadı.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Servis ID</th>
                    <th>Müşteri Kodu</th>
                    <th>Makine No</th>
                    <th>Açılış</th>
                    <th>Kapanış</th>
                    <th>Garanti</th>
                  </tr>
                </thead>
                <tbody>
                  {kapaliCagrilar.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{r.servis_id || "—"}</td>
                      <td className="r-bold">{r.musteri_kodu || "—"}</td>
                      <td>{r.makine_no || "—"}</td>
                      <td className="r-kod">{tarih(r.baslangic_tarihi)}</td>
                      <td className="r-kod r-iyi">{tarih(r.kapanis_tarihi)}</td>
                      <td className={r.garanti_durumu === 1 ? "r-iyi" : ""}>
                        {GARANTI[r.garanti_durumu] ?? r.garanti_durumu ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      <ChatWindow modul="serviceman" modulInfo={MODUL_INFO} sorular={SORULAR} />
    </div>
  );
}
