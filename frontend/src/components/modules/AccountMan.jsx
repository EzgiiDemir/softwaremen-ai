import { useState } from "react";
import StatsCard from "../dashboard/StatsCard";
import ChatWindow from "../chat/ChatWindow";

const MODUL_INFO = { id: "accountman", label: "AccountMan", icon: "🧾", aciklama: "Muhasebe" };

const SORULAR = [
  "KDV beyan durumu nedir?",
  "Bekleyen fişler var mı?",
  "Borç/alacak dengesi nasıl?",
  "Muhasebe özet raporu",
  "Son işlemleri tablo olarak göster",
];

function para(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}
function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("tr-TR");
}
function tarih(v) {
  if (!v) return "—";
  return String(v).slice(0, 10);
}

export default function AccountMan({ ozet, data }) {
  const [sekme, setSekme] = useState("islemler");

  const sonIslemler = data?.son_islemler ?? [];
  const hesapPlani  = data?.hesap_plani  ?? [];

  return (
    <div className="chat">
      <div className="stats-bar">
        <StatsCard
          ikon="📋" baslik="Toplam Fiş"
          deger={fmt(ozet?.bekleyen_fis_sayisi)} alt="kayıtlı fiş" renk="blue"
        />
        <StatsCard
          ikon="📅" baslik="Son İşlem"
          deger={ozet?.son_islem_tarihi || "—"} alt="son kayıt" renk="green"
        />
        <StatsCard
          ikon="📊" baslik="Bu Ay İşlem"
          deger={fmt(ozet?.bu_ay_islem_sayisi)} alt="bu ay" renk="blue"
        />
        <StatsCard
          ikon="📒" baslik="Hesap Planı"
          deger={fmt(hesapPlani.length)} alt="hesap kodu" renk="amber"
        />
      </div>

      <div className="veri-panel">
        <div className="veri-panel-header">
          <div className="veri-sekmeler">
            <button
              className={`veri-sekme ${sekme === "islemler" ? "aktif" : ""}`}
              onClick={() => setSekme("islemler")}
            >
              🧾 Son İşlemler
              <span className="veri-panel-sayac">{sonIslemler.length}</span>
            </button>
            <button
              className={`veri-sekme ${sekme === "hesap" ? "aktif" : ""}`}
              onClick={() => setSekme("hesap")}
            >
              📒 Hesap Planı
              <span className="veri-panel-sayac">{hesapPlani.length}</span>
            </button>
          </div>
          <span className="veri-panel-guncelleme">Canlı DB verisi</span>
        </div>

        <div className="veri-tablo-wrap">
          {sekme === "islemler" && (
            sonIslemler.length === 0 ? (
              <div className="veri-bos">İşlem kaydı bulunamadı.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Barkod</th>
                    <th>Ürün / Açıklama</th>
                    <th style={{textAlign:"right"}}>Adet</th>
                    <th style={{textAlign:"right"}}>Birim Fiyat</th>
                    <th style={{textAlign:"right"}}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {sonIslemler.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{tarih(r.TRANS_DATE)}</td>
                      <td className="r-kod">{r.BARCODE || "—"}</td>
                      <td className="r-bold" title={r.EXPLAIN}>{r.EXPLAIN}</td>
                      <td className="r-sayi">{r.QUANTITY}</td>
                      <td className="r-sayi">{para(r.UNIT_PRICE)}</td>
                      <td className="r-sayi r-bold">{para(r.TOTAL_PRICE)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {sekme === "hesap" && (
            hesapPlani.length === 0 ? (
              <div className="veri-bos">Hesap planı verisi yok.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Hesap Kodu</th>
                    <th>Hesap Adı</th>
                  </tr>
                </thead>
                <tbody>
                  {hesapPlani.slice(0, 100).map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{r.hesap_kodu}</td>
                      <td className="r-bold">{r.hesap_adi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      <ChatWindow modul="accountman" modulInfo={MODUL_INFO} sorular={SORULAR} />
    </div>
  );
}
