import { useState } from "react";
import StatsCard from "../dashboard/StatsCard";
import ChatWindow from "../chat/ChatWindow";

const MODUL_INFO = { id: "wageman", label: "WageMan", icon: "👥", aciklama: "İnsan Kaynakları" };

const SORULAR = [
  "Personel listesi tablo olarak",
  "Kaç personel aktif?",
  "İK özet raporu",
  "Personel tipe göre dağılım",
  "Excel indir",
];

function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("tr-TR");
}

export default function WageMan({ ozet, data }) {
  const [sekme, setSekme] = useState("personel");

  const personelListesi = data?.personel_listesi ?? [];
  const tipDagilim      = data?.tip_dagilim      ?? [];

  const toplam = ozet?.toplam_personel ?? 0;
  const aktif  = ozet?.aktif_personel  ?? 0;
  const pasif  = toplam - aktif;

  return (
    <div className="chat">
      <div className="stats-bar">
        <StatsCard ikon="👥" baslik="Toplam Personel" deger={fmt(toplam)} alt="kayıtlı" renk="blue" />
        <StatsCard ikon="✅" baslik="Aktif Personel"  deger={fmt(aktif)}  alt="çalışan"  renk="green" />
        <StatsCard
          ikon="🏖️" baslik="Pasif / İzinli"
          deger={fmt(pasif)} alt="aktif olmayan"
          renk={pasif > 0 ? "amber" : "green"}
        />
        <StatsCard ikon="📊" baslik="Tip Çeşidi" deger={fmt(tipDagilim.length)} alt="farklı tip" renk="blue" />
      </div>

      <div className="veri-panel">
        <div className="veri-panel-header">
          <div className="veri-sekmeler">
            <button
              className={`veri-sekme ${sekme === "personel" ? "aktif" : ""}`}
              onClick={() => setSekme("personel")}
            >
              👤 Personel Listesi
              <span className="veri-panel-sayac">{personelListesi.length}</span>
            </button>
            <button
              className={`veri-sekme ${sekme === "dagilim" ? "aktif" : ""}`}
              onClick={() => setSekme("dagilim")}
            >
              📊 Tipe Göre Dağılım
              <span className="veri-panel-sayac">{tipDagilim.length}</span>
            </button>
          </div>
          <span className="veri-panel-guncelleme">Canlı DB verisi</span>
        </div>

        <div className="veri-tablo-wrap">
          {sekme === "personel" && (
            personelListesi.length === 0 ? (
              <div className="veri-bos">Personel kaydı bulunamadı.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Personel Kodu</th>
                    <th>Ad Soyad</th>
                    <th>Tip</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {personelListesi.slice(0, 100).map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{r.personel_kodu || "—"}</td>
                      <td className="r-bold">{r.personel_adi || "—"}</td>
                      <td>{r.tip ?? "—"}</td>
                      <td className={r.aktif ? "r-iyi" : "r-uyari"}>
                        {r.aktif ? "Aktif" : "Pasif"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {sekme === "dagilim" && (
            tipDagilim.length === 0 ? (
              <div className="veri-bos">Dağılım verisi bulunamadı.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Personel Tipi</th>
                    <th style={{textAlign:"right"}}>Personel Sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {tipDagilim.map((r, i) => (
                    <tr key={i}>
                      <td className="r-bold">{r.tip ?? "Tanımsız"}</td>
                      <td className="r-sayi">{fmt(r.sayi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      <ChatWindow modul="wageman" modulInfo={MODUL_INFO} sorular={SORULAR} />
    </div>
  );
}
