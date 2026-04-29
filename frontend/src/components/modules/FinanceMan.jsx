import { useState } from "react";
import StatsCard from "../dashboard/StatsCard";
import ChatWindow from "../chat/ChatWindow";

const MODUL_INFO = { id: "financeman", label: "FinanceMan", icon: "💰", aciklama: "Finans & Kasa" };

const SORULAR = [
  "Kasa durumu nasıl?",
  "Vadesi yaklaşan çekler hangileri?",
  "Cari listesi tablo olarak",
  "Finans özet raporu",
  "Excel indir",
];

function para(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}
function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("tr-TR");
}

export default function FinanceMan({ ozet, data }) {
  const [sekme, setSekme] = useState("cari");

  const kasalar       = data?.kasalar        ?? [];
  const cariHesaplar  = data?.cari_hesaplar  ?? [];
  const yasClekler    = data?.yaklasan_cekler ?? [];
  const gecmisCekler  = data?.gecmis_cekler  ?? [];

  const kasaStr = ozet?.kasa_toplam != null
    ? para(ozet.kasa_toplam)
    : "—";

  const sekmeler = [
    { key: "cari",   label: "Cari Hesaplar",   icon: "👥", sayi: cariHesaplar.length },
    { key: "kasa",   label: "Kasalar",          icon: "💵", sayi: kasalar.length },
    { key: "cek",    label: "Yaklaşan Çekler",  icon: "🗓️", sayi: yasClekler.length + gecmisCekler.length },
  ];

  return (
    <div className="chat">
      <div className="stats-bar">
        <StatsCard ikon="💵" baslik="Kasa Toplamı" deger={kasaStr} alt="tüm kasalar" renk="green" />
        <StatsCard ikon="👥" baslik="Cari Sayısı" deger={fmt(ozet?.cari_sayisi)} alt="kayıtlı cari" renk="blue" />
        <StatsCard
          ikon="🗓️" baslik="Vadesi Yaklaşan"
          deger={ozet?.vadesi_yaklasan_cek ?? "—"} alt="7 gün içinde"
          renk={ozet?.vadesi_yaklasan_cek > 0 ? "red" : "green"}
        />
        <StatsCard ikon="🏦" baslik="Kasa Sayısı" deger={fmt(kasalar.length)} alt="açık hesap" renk="blue" />
      </div>

      <div className="veri-panel">
        <div className="veri-panel-header">
          <div className="veri-sekmeler">
            {sekmeler.map(s => (
              <button
                key={s.key}
                className={`veri-sekme ${sekme === s.key ? "aktif" : ""}`}
                onClick={() => setSekme(s.key)}
              >
                {s.icon} {s.label}
                <span className="veri-panel-sayac">{s.sayi}</span>
              </button>
            ))}
          </div>
          <span className="veri-panel-guncelleme">Canlı DB verisi</span>
        </div>

        <div className="veri-tablo-wrap">
          {sekme === "cari" && (
            cariHesaplar.length === 0 ? (
              <div className="veri-bos">Cari hesap verisi yok.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Cari Kodu</th>
                    <th>Cari Adı</th>
                    <th style={{textAlign:"right"}}>Bakiye (Borç - Alacak)</th>
                  </tr>
                </thead>
                <tbody>
                  {cariHesaplar.slice(0, 100).map((r, i) => {
                    const b = Number(r.bakiye ?? 0);
                    return (
                      <tr key={i}>
                        <td className="r-kod">{r.cari_kodu}</td>
                        <td className="r-bold" title={r.cari_adi}>{r.cari_adi}</td>
                        <td className={`r-sayi ${b > 0 ? "r-kritik" : b < 0 ? "r-iyi" : ""}`}>
                          {para(b)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {sekme === "kasa" && (
            kasalar.length === 0 ? (
              <div className="veri-bos">Kasa kaydı yok.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Kasa Kodu</th>
                    <th>Kasa Adı</th>
                    <th style={{textAlign:"right"}}>Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  {kasalar.map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{r.kasa_kodu}</td>
                      <td className="r-bold">{r.kasa_adi}</td>
                      <td className={`r-sayi ${Number(r.bakiye) > 0 ? "r-iyi" : ""}`}>
                        {para(r.bakiye)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {sekme === "cek" && (
            (yasClekler.length + gecmisCekler.length) === 0 ? (
              <div className="veri-bos">Yaklaşan veya vadesi geçmiş çek yok.</div>
            ) : (
              <table className="veri-tablo">
                <thead>
                  <tr>
                    <th>Çek No</th>
                    <th>Adına</th>
                    <th style={{textAlign:"right"}}>Tutar</th>
                    <th>Vade</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {[...yasClekler.map(r => ({...r, _tip: "yaklasan"})),
                    ...gecmisCekler.map(r => ({...r, _tip: "gecmis"}))
                  ].slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="r-kod">{r.cek_kodu}</td>
                      <td title={r.aciklama}>{r.aciklama}</td>
                      <td className="r-sayi r-bold">{para(r.tutar)}</td>
                      <td>{r.vade_tarihi ? String(r.vade_tarihi).slice(0, 10) : "—"}</td>
                      <td className={r._tip === "gecmis" ? "r-kritik" : "r-uyari"}>
                        {r._tip === "gecmis" ? "Vadesi Geçmiş" : "Yaklaşıyor"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      <ChatWindow modul="financeman" modulInfo={MODUL_INFO} sorular={SORULAR} />
    </div>
  );
}
