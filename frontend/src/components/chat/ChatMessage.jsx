import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/index";

const UZUN_LIMIT = 900;

const DOSYA_ADLARI = {
  "/export/stok/excel":           "stok_listesi.xlsx",
  "/export/stok/pdf":             "stok_listesi.pdf",
  "/export/stok/kritik/excel":    "kritik_stoklar.xlsx",
  "/export/finans/excel":         "cari_listesi.xlsx",
  "/export/finans/cekler/excel":  "vadesi_yaklasan_cekler.xlsx",
  "/export/personel/excel":       "personel_listesi.xlsx",
};

const MD_BILESENLERI = {
  table: ({ node, ...p }) => (
    <div className="md-tablo-wrapper">
      <table {...p} />
    </div>
  ),
  thead: ({ node, ...p }) => <thead {...p} />,
  tbody: ({ node, ...p }) => <tbody {...p} />,
  tr:    ({ node, ...p }) => <tr {...p} />,
  th:    ({ node, ...p }) => <th {...p} />,
  td:    ({ node, ...p }) => <td {...p} />,
  // Yıldız/hash kalıntısı olursa bunları düz metin gibi davran
  strong: ({ node, ...p }) => <span {...p} />,
  em:     ({ node, ...p }) => <span {...p} />,
};

export default function ChatMessage({ rol, icerik, hata, zaman, tip, export_url }) {
  const [tamGoster, setTamGoster]   = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [indiriliyor, setIndiriliyor] = useState(false);
  const { user } = useAuthStore();

  const saat = zaman
    ? new Date(zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const uzun       = icerik.length > UZUN_LIMIT;
  const gosterilen = !tamGoster && uzun ? icerik.slice(0, UZUN_LIMIT) + "…" : icerik;
  const harfler    = user?.ad?.slice(0, 2)?.toUpperCase() || "KU";

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(icerik);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {}
  };

  const indir = async () => {
    if (!export_url || indiriliyor) return;
    setIndiriliyor(true);
    try {
      const res = await api.get(export_url, { responseType: "blob" });
      const dosyaAdi = DOSYA_ADLARI[export_url] || "rapor.xlsx";
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href     = url;
      link.download = dosyaAdi;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("Dosya indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIndiriliyor(false);
    }
  };

  const renderIcerik = () => {
    if (rol === "kullanici") {
      return <span className="balon-metin">{gosterilen}</span>;
    }
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={MD_BILESENLERI}
      >
        {gosterilen}
      </ReactMarkdown>
    );
  };

  return (
    <div className={`mesaj-satir ${rol}`}>
      {rol === "asistan" && (
        <div className="ai-avatar" title="Softwaremen AI">⚡</div>
      )}

      <div className="mesaj-icerik-wrapper">
        {rol === "asistan" && <span className="ai-etiket">AI</span>}

        <div className={`balon ${rol}${hata ? " hata" : ""}`}>
          {renderIcerik()}

          {uzun && (
            <button
              className="devami-goster"
              onClick={() => setTamGoster((v) => !v)}
            >
              {tamGoster ? "Daha az göster ↑" : "Devamını gör ↓"}
            </button>
          )}

          {tip?.startsWith("export_") && export_url && (
            <div className="export-actions">
              <button
                className={`indir-btn ${indiriliyor ? "yukleniyor" : ""}`}
                onClick={indir}
                disabled={indiriliyor}
              >
                {indiriliyor ? (
                  <><span className="gonder-spinner" /><span>İndiriliyor...</span></>
                ) : (
                  <><span>📥</span><span>{tip === "export_excel" ? "Excel İndir" : "PDF İndir"}</span></>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mesaj-alt">
          {saat && <span className="zaman-damgasi">{saat}</span>}
          {rol === "asistan" && (
            <button className="kopyala-btn" onClick={kopyala} title="Kopyala">
              {kopyalandi ? "✓" : "⧉"}
            </button>
          )}
        </div>
      </div>

      {rol === "kullanici" && (
        <div className="kullanici-avatar" title={user?.ad}>{harfler}</div>
      )}
    </div>
  );
}
