import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:8002";

const TUM_MODULLER = [
  { id: "stockman",   label: "StockMan",   icon: "📦", aciklama: "Stok Yönetimi",    sorular: ["Kritik stok durumu nedir?", "Hangi ürünler tükenmek üzere?", "Bu ay ciro ne kadar?"] },
  { id: "financeman", label: "FinanceMan", icon: "💰", aciklama: "Finans & Kasa",     sorular: ["Kasa ve banka bakiyesi ne?", "Vadesi gelen çekler hangileri?", "Açık fatura tutarı ne kadar?"] },
  { id: "accountman", label: "AccountMan", icon: "📒", aciklama: "Muhasebe",          sorular: ["KDV beyan durumu nedir?", "Bekleyen fişler var mı?", "Borç/alacak dengesi nasıl?"] },
  { id: "serviceman", label: "ServiceMan", icon: "🔧", aciklama: "Teknik Servis",     sorular: ["Kaç açık servis çağrısı var?", "Bekleyen parçalar neler?", "Ortalama çözüm süresi ne kadar?"] },
  { id: "productman", label: "ProductMan", icon: "🏭", aciklama: "Üretim",            sorular: ["Devam eden üretimler neler?", "Bekleyen hammaddeler neler?", "Bu ay üretim maliyeti ne kadar?"] },
  { id: "barcodeman", label: "BarcodeMan", icon: "🏷️", aciklama: "Barkod & Etiket",  sorular: ["Bugün kaç etiket basıldı?", "Yazıcı durumu nedir?", "Bekleyen işler var mı?"] },
  { id: "wageman",    label: "WageMan",    icon: "👥", aciklama: "İnsan Kaynakları",  sorular: ["Bu ay bordro tutarı ne kadar?", "Kaç personel izinli?", "Onay bekleyen izin talebi var mı?"] },
  { id: "pos",        label: "POS",        icon: "🖥️", aciklama: "Satış Noktası",    sorular: ["Bugünkü ciro ne kadar?", "Kaç masa açık?", "En çok satan ürün nedir?"] },
  { id: "smproposal", label: "smProposal", icon: "📋", aciklama: "Teklif Yönetimi",  sorular: ["Bekleyen teklifler neler?", "Bu ay kazanma oranı nedir?", "Toplam teklif tutarı ne kadar?"] },
  { id: "smloyalty",  label: "smLoyalty",  icon: "⭐", aciklama: "Sadakat Programı", sorular: ["Churn riski yüksek kaç üye var?", "Bu ay kaç yeni üye?", "Aktif üye oranı nedir?"] },
  { id: "smimports",  label: "smImports",  icon: "🚢", aciklama: "İthalat",           sorular: ["Gümrükte bekleyen sevkiyat var mı?", "Kur riski durumu nedir?", "Aktif sevkiyat sayısı kaç?"] },
  { id: "smgrocery",  label: "smGrocery",  icon: "🌾", aciklama: "Müstahsil",         sorular: ["Bugün kaç müstahsil fişi kesildi?", "Fire yüzdesi nedir?", "Toplam stopaj tutarı ne kadar?"] },
];

const TIP_RENK   = { kritik: "bildirim-kritik", uyari: "bildirim-uyari", bilgi: "bildirim-bilgi" };
const TIP_ETIKET = { kritik: "Kritik", uyari: "Uyarı", bilgi: "Bilgi" };

// ── localStorage token yönetimi ───────────────────────────────────────────
function tokenKaydet(token, kullanici) {
  localStorage.setItem("sm_token",    token);
  localStorage.setItem("sm_kullanici", JSON.stringify(kullanici));
}

function tokenAl()     { return localStorage.getItem("sm_token"); }
function kullaniciAl() {
  try { return JSON.parse(localStorage.getItem("sm_kullanici")); } catch { return null; }
}
function tokenTemizle() {
  localStorage.removeItem("sm_token");
  localStorage.removeItem("sm_kullanici");
}

function authHeader() {
  const token = tokenAl();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Giriş Ekranı ──────────────────────────────────────────────────────────
function GirisEkrani({ onGiris }) {
  const [musteriId, setMusteriId] = useState("");
  const [sifre,     setSifre]     = useState("");
  const [hata,      setHata]      = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const girisYap = async (e) => {
    e.preventDefault();
    if (!musteriId.trim() || !sifre.trim()) { setHata("Tüm alanları doldurun."); return; }
    setYukleniyor(true);
    setHata("");
    try {
      const res = await axios.post(`${API}/giris`, { musteri_id: musteriId.trim(), sifre });
      tokenKaydet(res.data.token, {
        musteri_id:   res.data.musteri_id,
        ad:           res.data.ad,
        modul_erisim: res.data.modul_erisim,
      });
      onGiris(res.data);
    } catch (err) {
      setHata(err.response?.data?.detail || "Giriş başarısız. Bilgileri kontrol edin.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="giris-ekrani">
      <div className="giris-kart">
        <div className="giris-logo">
          <span className="giris-logo-icon">⚡</span>
          <h1>Softwaremen AI</h1>
          <p>ERP Zeka Asistanı</p>
        </div>

        <form onSubmit={girisYap} className="giris-form">
          <div className="form-grup">
            <label>Müşteri ID</label>
            <input
              type="text"
              value={musteriId}
              onChange={(e) => setMusteriId(e.target.value)}
              placeholder="demo / musteri_a / musteri_b"
              autoFocus
              disabled={yukleniyor}
            />
          </div>
          <div className="form-grup">
            <label>Şifre</label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              disabled={yukleniyor}
            />
          </div>

          {hata && <div className="giris-hata">{hata}</div>}

          <button type="submit" className="giris-btn" disabled={yukleniyor}>
            {yukleniyor ? <span className="giris-spinner" /> : "Giriş Yap"}
          </button>
        </form>

        <div className="giris-ipucu">
          <p>Test hesapları:</p>
          <span onClick={() => { setMusteriId("demo");      setSifre("demo123"); }}>demo</span>
          <span onClick={() => { setMusteriId("musteri_a"); setSifre("musteri_a123"); }}>musteri_a</span>
          <span onClick={() => { setMusteriId("musteri_b"); setSifre("musteri_b123"); }}>musteri_b</span>
        </div>
      </div>
    </div>
  );
}

// ── Ana Uygulama ──────────────────────────────────────────────────────────
export default function App() {
  const [kullanici,    setKullanici]    = useState(kullaniciAl);
  const [aktifModul,   setAktifModul]   = useState(null);
  const [mesajlar,     setMesajlar]     = useState([]);
  const [input,        setInput]        = useState("");
  const [yukleniyor,   setYukleniyor]   = useState(false);
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [bildirimler,  setBildirimler]  = useState([]);
  const [bilYukleniyor, setBilYukleniyor] = useState(false);
  const altRef = useRef(null);

  const moduller = kullanici
    ? TUM_MODULLER.filter((m) => kullanici.modul_erisim.includes(m.id))
    : [];

  // İlk erişilebilir modülü seç
  useEffect(() => {
    if (kullanici && moduller.length > 0 && !aktifModul) {
      setAktifModul(moduller[0].id);
    }
  }, [kullanici]);

  useEffect(() => {
    altRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar]);

  const cikisYap = () => {
    tokenTemizle();
    setKullanici(null);
    setAktifModul(null);
    setMesajlar([]);
    setBildirimler([]);
    setBildirimAcik(false);
  };

  // 401 gelince otomatik çıkış
  const yetkiHatasiKontrol = useCallback((err) => {
    if (err.response?.status === 401) {
      tokenTemizle();
      setKullanici(null);
    }
  }, []);

  const modulDegistir = (id) => {
    setAktifModul(id);
    setMesajlar([]);
    setBildirimAcik(false);
  };

  const bildirimleriGetir = async () => {
    if (bildirimAcik) { setBildirimAcik(false); return; }
    setBildirimAcik(true);
    if (bildirimler.length > 0) return;
    setBilYukleniyor(true);
    try {
      const res = await axios.get(`${API}/bildirimler/${kullanici.musteri_id}`, { headers: authHeader() });
      setBildirimler(res.data.bildirimler || []);
    } catch (err) {
      yetkiHatasiKontrol(err);
      setBildirimler([{ tip: "kritik", modul: "sistem", mesaj: "Bildirimler yüklenemedi." }]);
    } finally {
      setBilYukleniyor(false);
    }
  };

  const gonder = async (soru_override) => {
    const soru = (soru_override || input).trim();
    if (!soru || yukleniyor) return;

    const yeniMesajlar = [...mesajlar, { rol: "kullanici", icerik: soru }];
    setMesajlar(yeniMesajlar);
    setInput("");
    setYukleniyor(true);

    try {
      const res = await axios.post(
        `${API}/sor`,
        { soru, modul: aktifModul },
        { headers: authHeader() }
      );
      setMesajlar([...yeniMesajlar, { rol: "asistan", icerik: res.data.yanit }]);
    } catch (err) {
      yetkiHatasiKontrol(err);
      const mesaj = err.response?.status === 403
        ? "Bu modüle erişim izniniz yok."
        : err.response?.status === 401
          ? "Oturumunuz sona erdi. Yeniden giriş yapın."
          : "Sunucuya bağlanılamadı.";
      setMesajlar([...yeniMesajlar, { rol: "asistan", icerik: mesaj, hata: true }]);
    } finally {
      setYukleniyor(false);
    }
  };

  // Giriş ekranı
  if (!kullanici) {
    return <GirisEkrani onGiris={(data) => {
      setKullanici({ musteri_id: data.musteri_id, ad: data.ad, modul_erisim: data.modul_erisim });
      const ilkModul = data.modul_erisim[0];
      setAktifModul(ilkModul || null);
    }} />;
  }

  const aktifInfo = TUM_MODULLER.find((m) => m.id === aktifModul);
  const kritikSayi = bildirimler.filter((b) => b.tip === "kritik").length;

  return (
    <div className="uygulama">
      {/* Sol Panel */}
      <aside className="sol-panel">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Softwaremen</span>
          <button
            className={`bildirim-btn ${kritikSayi > 0 ? "has-badge" : ""}`}
            onClick={bildirimleriGetir}
            title="Bildirimler"
          >
            🔔
            {kritikSayi > 0 && <span className="badge">{kritikSayi}</span>}
          </button>
        </div>

        <div className="musteri-bilgi">
          <span className="musteri-icon">🏢</span>
          <div>
            <p className="musteri-ad">{kullanici.ad}</p>
            <p className="musteri-id">{kullanici.musteri_id}</p>
          </div>
        </div>

        <p className="panel-baslik">MODÜLLER</p>
        <nav className="modul-nav">
          {moduller.map((m) => (
            <button
              key={m.id}
              className={`modul-btn ${aktifModul === m.id ? "aktif" : ""}`}
              onClick={() => modulDegistir(m.id)}
            >
              <span className="modul-icon">{m.icon}</span>
              <div className="modul-metin">
                <span className="modul-label">{m.label}</span>
                <span className="modul-aciklama">{m.aciklama}</span>
              </div>
            </button>
          ))}
        </nav>

        <div className="sol-alt">
          <div className="sol-alt-durum">
            <span className="durum-nokta" />
            <span>Backend · port 8002</span>
          </div>
          <button className="cikis-btn" onClick={cikisYap} title="Çıkış Yap">⎋ Çıkış</button>
        </div>
      </aside>

      {/* Sağ Panel */}
      <main className="sag-panel">
        {bildirimAcik ? (
          <div className="bildirim-panel">
            <div className="bildirim-header">
              <span>🔔 Bildirimler</span>
              <button className="kapat-btn" onClick={() => setBildirimAcik(false)}>✕</button>
            </div>
            <div className="bildirim-liste">
              {bilYukleniyor && <div className="bildirim-yukleniyor"><span /><span /><span /></div>}
              {!bilYukleniyor && bildirimler.length === 0 && (
                <p className="bildirim-bos">Bildirim bulunamadı.</p>
              )}
              {!bilYukleniyor && bildirimler.map((b, i) => (
                <div key={i} className={`bildirim-kart ${TIP_RENK[b.tip] || ""}`}>
                  <div className="bildirim-ust">
                    <span className="bildirim-tip">{TIP_ETIKET[b.tip] || b.tip}</span>
                    <span className="bildirim-modul">{b.modul}</span>
                  </div>
                  <p>{b.mesaj}</p>
                </div>
              ))}
            </div>
          </div>
        ) : aktifInfo ? (
          <>
            <header className="chat-header">
              <span className="header-icon">{aktifInfo.icon}</span>
              <div className="header-metin">
                <h1>{aktifInfo.label} Asistanı</h1>
                <p>{aktifInfo.aciklama} hakkında sorularınızı sorun</p>
              </div>
            </header>

            <div className="hazir-sorular">
              {aktifInfo.sorular.map((s, i) => (
                <button key={i} className="hazir-soru-btn" onClick={() => gonder(s)} disabled={yukleniyor}>
                  {s}
                </button>
              ))}
            </div>

            <div className="mesaj-alani">
              {mesajlar.length === 0 && (
                <div className="bos-durum">
                  <span className="bos-icon">{aktifInfo.icon}</span>
                  <p>{aktifInfo.label} hakkında soru sorun veya yukarıdan hazır soru seçin.</p>
                </div>
              )}
              {mesajlar.map((m, i) => (
                <div key={i} className={`mesaj-satir ${m.rol}`}>
                  <div className={`mesaj-kabarcik ${m.hata ? "hata" : ""}`}>{m.icerik}</div>
                </div>
              ))}
              {yukleniyor && (
                <div className="mesaj-satir asistan">
                  <div className="mesaj-kabarcik yukleniyor"><span /><span /><span /></div>
                </div>
              )}
              <div ref={altRef} />
            </div>

            <div className="input-alani">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && gonder()}
                placeholder={`${aktifInfo.label} hakkında soru sorun...`}
                disabled={yukleniyor}
              />
              <button className="gonder-btn" onClick={() => gonder()} disabled={yukleniyor || !input.trim()}>
                Gönder
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
