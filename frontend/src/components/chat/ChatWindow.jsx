import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/chatStore";
import { soruSor } from "../../api/chat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatHistory from "./ChatHistory";

const BOSH_DIZI = [];

const HINT_GENEL = [
  {
    baslik: "💬 Sohbet",
    ipucu: "Doğal Türkçe ile soru sor.",
    ornekler: ["Genel durum nasıl?", "Bu ay ne kadar kazandık?"],
  },
  {
    baslik: "📋 Tablo",
    ipucu: '"tablo olarak göster" veya "listele" ekle.',
    ornekler: ["Ürünleri tablo olarak göster", "Listele"],
  },
  {
    baslik: "📊 Rapor",
    ipucu: '"raporu hazırla" veya "analiz et" ekle.',
    ornekler: ["Özet rapor hazırla", "Durum analizi yap"],
  },
  {
    baslik: "🔮 Tahmin",
    ipucu: '"önümüzdeki" veya "tahmin" kelimesini kullan.',
    ornekler: ["Önümüzdeki ay tahmini?", "Gelecek hafta nasıl görünüyor?"],
  },
  {
    baslik: "📥 İndir",
    ipucu: '"Excel indir" veya "PDF olarak çıkar" yaz.',
    ornekler: ["Excel indir", "PDF olarak çıkar"],
  },
];

export default function ChatWindow({ modul, modulInfo, sorular }) {
  const mesajlar   = useChatStore((s) => ((s.gecmis[s.aktifKullanici] ?? {})[s.aktifModul]) ?? BOSH_DIZI);
  const { mesajEkle, mesajlariTemizle } = useChatStore();
  const [yukleniyor, setYukleniyor]   = useState(false);
  const [hintAcik, setHintAcik]       = useState(false);
  const [gecmisAcik, setGecmisAcik]   = useState(false);
  const altRef = useRef(null);

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar, yukleniyor]);

  const gonder = async (soru) => {
    const temiz = soru.trim();
    if (!temiz || yukleniyor) return;
    mesajEkle({ rol: "kullanici", icerik: temiz, zaman: Date.now() });
    setYukleniyor(true);
    try {
      const res = await soruSor(temiz, modul);
      const { yanit, tip, export_url } = res.data;
      mesajEkle({
        rol: "asistan",
        icerik: yanit,
        tip:   tip || "sohbet",
        export_url: export_url || null,
        zaman: Date.now(),
      });
    } catch (err) {
      const detay =
        err.response?.status === 403 ? "Bu modüle erişim izniniz yok." :
        err.response?.status === 401 ? "Oturumunuz sona erdi."         :
        "Bağlantı hatası. Sunucunun çalıştığını kontrol edin.";
      mesajEkle({ rol: "asistan", icerik: detay, hata: true, tip: "sohbet", zaman: Date.now() });
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-sol">
          <div className="chat-modul-icon">{modulInfo.icon}</div>
          <div>
            <h2>{modulInfo.label}</h2>
            <p>{modulInfo.aciklama}</p>
          </div>
        </div>
        <div className="chat-header-sag">
          {mesajlar.length > 0 && (
            <button
              className="chat-temizle-btn"
              onClick={mesajlariTemizle}
              title="Sohbeti temizle"
            >
              🗑
            </button>
          )}
          <button
            className={`chat-hint-btn ${gecmisAcik ? "aktif" : ""}`}
            onClick={() => { setGecmisAcik((v) => !v); setHintAcik(false); }}
            title="Sohbet geçmişi"
          >
            📋
          </button>
          <button
            className={`chat-hint-btn ${hintAcik ? "aktif" : ""}`}
            onClick={() => { setHintAcik((v) => !v); setGecmisAcik(false); }}
            title="Kullanım kılavuzu"
          >
            ?
          </button>
        </div>
      </div>

      {/* İçerik alanı */}
      <div className="chat-govde">
        <ChatHistory acik={gecmisAcik} onKapat={() => setGecmisAcik(false)} />

        {/* Mesaj listesi */}
        <div className="mesajlar">
          {mesajlar.length === 0 && !hintAcik && (
            <div className="bos-alan">
              <div className="bos-alan-icon">{modulInfo.icon}</div>
              <h3>{modulInfo.label} Asistanı</h3>
              <p>Aşağıdaki hazır sorulardan birini seçin veya kendi sorunuzu yazın.</p>
              <button className="hint-ac-btn" onClick={() => setHintAcik(true)}>
                💡 Kullanım kılavuzunu gör
              </button>
            </div>
          )}
          {mesajlar.map((m, i) => (
            <ChatMessage key={i} {...m} />
          ))}
          {yukleniyor && (
            <div className="mesaj-satir asistan">
              <div className="ai-avatar">⚡</div>
              <div className="mesaj-icerik-wrapper">
                <span className="ai-etiket">AI</span>
                <div className="balon asistan yazıyor">
                  <span className="nokta" />
                  <span className="nokta" />
                  <span className="nokta" />
                </div>
              </div>
            </div>
          )}
          <div ref={altRef} />
        </div>

        {/* Hint paneli */}
        <div className={`hint-panel ${hintAcik ? "acik" : ""}`}>
          <div className="hint-panel-header">
            <span>💡 Kullanım Kılavuzu</span>
            <button onClick={() => setHintAcik(false)}>✕</button>
          </div>
          <div className="hint-panel-icerik">
            {HINT_GENEL.map((b, i) => (
              <div key={i} className="hint-bolum">
                <div className="hint-bolum-baslik">{b.baslik}</div>
                <p className="hint-ipucu">{b.ipucu}</p>
                {b.ornekler.map((o, j) => (
                  <button
                    key={j}
                    className="hint-ornek-btn"
                    onClick={() => { gonder(o); setHintAcik(false); }}
                    disabled={yukleniyor}
                  >
                    {o}
                  </button>
                ))}
              </div>
            ))}
            <div className="hint-klavye">
              <div className="hint-bolum-baslik">⌨️ Kısayollar</div>
              <div className="hint-klavye-satir"><kbd>Enter</kbd><span>Gönder</span></div>
              <div className="hint-klavye-satir"><kbd>Shift</kbd><kbd>Enter</kbd><span>Yeni satır</span></div>
            </div>
          </div>
        </div>
      </div>

      <ChatInput
        onGonder={gonder}
        yukleniyor={yukleniyor}
        placeholder={`${modulInfo.label} hakkında soru sorun...`}
        sorular={sorular}
      />
    </div>
  );
}
