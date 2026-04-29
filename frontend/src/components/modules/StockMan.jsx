import { useState } from "react";
import StatsCard from "../dashboard/StatsCard";
import ChatWindow from "../chat/ChatWindow";

const MODUL_INFO = { id: "stockman", label: "StockMan", icon: "📦", aciklama: "Stok Yönetimi" };

const SORULAR = [
  "Kritik stoklar neler?",
  "En çok satan ürünler hangileri?",
  "Stok durumu raporu",
  "Stok listesini tablo olarak göster",
  "Excel indir",
];

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("tr-TR");
}

export default function StockMan({ ozet, data }) {
  const [sekme, setSekme] = useState("kritik");

  const kritikler  = data?.kritik_stoklar ?? [];
  const liste      = data?.stok_listesi   ?? [];
  const gosterilen = sekme === "kritik" ? kritikler : liste;

  return (
    <div className="chat">
      <div className="stats-bar">
        <StatsCard
          ikon="📦" baslik="Toplam Ürün"
          deger={fmt(ozet?.toplam_urun)} alt="aktif kayıt" renk="blue"
        />
        <StatsCard
          ikon="⚠️" baslik="Kritik Stok"
          deger={ozet?.kritik_stok_sayisi ?? "—"} alt="miktar < 10"
          renk={ozet?.kritik_stok_sayisi > 0 ? "red" : "green"}
        />
        <StatsCard
          ikon="✅" baslik="Stok Durumu"
          deger={ozet?.kritik_stok_sayisi === 0 ? "İyi" : (ozet?.kritik_stok_sayisi > 0 ? "Dikkat" : "—")}
          alt="genel değerlendirme"
          renk={ozet?.kritik_stok_sayisi === 0 ? "green" : "amber"}
        />
        <StatsCard
          ikon="📋" baslik="Stok Çeşidi"
          deger={fmt(liste.length > 0 ? liste.length : ozet?.toplam_urun)}
          alt="listede" renk="blue"
        />
      </div>

      <div className="veri-panel">
        <div className="veri-panel-header">
          <div className="veri-sekmeler">
            <button
              className={`veri-sekme ${sekme === "kritik" ? "aktif" : ""}`}
              onClick={() => setSekme("kritik")}
            >
              ⚠️ Kritik Stoklar
              <span className="veri-panel-sayac">{kritikler.length}</span>
            </button>
            <button
              className={`veri-sekme ${sekme === "liste" ? "aktif" : ""}`}
              onClick={() => setSekme("liste")}
            >
              📦 Tüm Stoklar
              <span className="veri-panel-sayac">{liste.length}</span>
            </button>
          </div>
          <span className="veri-panel-guncelleme">Canlı DB verisi</span>
        </div>

        <div className="veri-tablo-wrap">
          {gosterilen.length === 0 ? (
            <div className="veri-bos">
              {sekme === "kritik" ? "Kritik stok yok — tüm ürünler yeterli miktarda." : "Stok verisi yüklenemedi."}
            </div>
          ) : (
            <table className="veri-tablo">
              <thead>
                <tr>
                  <th>Ürün Kodu</th>
                  <th>Ürün Adı</th>
                  <th>Birim</th>
                  <th style={{textAlign:"right"}}>Mevcut</th>
                  <th style={{textAlign:"right"}}>Giriş</th>
                  <th style={{textAlign:"right"}}>Çıkış</th>
                </tr>
              </thead>
              <tbody>
                {gosterilen.slice(0, 100).map((r, i) => {
                  const miktar = Number(r.mevcut_miktar ?? 0);
                  const cls = miktar < 5 ? "r-kritik" : miktar < 10 ? "r-uyari" : "";
                  return (
                    <tr key={i}>
                      <td className="r-kod">{r.urun_kodu}</td>
                      <td className="r-bold" title={r.urun_adi}>{r.urun_adi}</td>
                      <td>{r.birim}</td>
                      <td className={`r-sayi ${cls}`}>{fmt(r.mevcut_miktar)}</td>
                      <td className="r-sayi r-iyi">{fmt(r.giris_miktar)}</td>
                      <td className="r-sayi">{fmt(r.cikis_miktar)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ChatWindow modul="stockman" modulInfo={MODUL_INFO} sorular={SORULAR} />
    </div>
  );
}
