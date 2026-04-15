import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8002";

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

const TIP_RENK   = { kritik: "tip-kritik", uyari: "tip-uyari", bilgi: "tip-bilgi" };
const TIP_ETIKET = { kritik: "Kritik", uyari: "Uyarı", bilgi: "Bilgi" };

function tokenKaydet(token, kullanici) {
  localStorage.setItem("sm_token",     token);
  localStorage.setItem("sm_kullanici", JSON.stringify(kullanici));
}
function tokenAl()     { return localStorage.getItem("sm_token"); }
function kullaniciAl() { try { return JSON.parse(localStorage.getItem("sm_kullanici")); } catch { return null; } }
function tokenTemizle() { localStorage.removeItem("sm_token"); localStorage.removeItem("sm_kullanici"); }
function authHeader()  { const t = tokenAl(); return t ? { Authorization: `Bearer ${t}` } : {}; }

/* ── Giriş Ekranı ─────────────────────────────────────────────────────── */
function GirisEkrani({ onGiris }) {
  const [musteriId,  setMusteriId]  = useState("");
  const [sifre,      setSifre]      = useState("");
  const [hata,       setHata]       = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const girisYap = async (e) => {
    e.preventDefault();
    if (!musteriId.trim() || !sifre.trim()) { setHata("Tüm alanları doldurun."); return; }
    setYukleniyor(true); setHata("");
    try {
      const res = await axios.post(`${API}/giris`, { musteri_id: musteriId.trim(), sifre });
      tokenKaydet(res.data.token, { musteri_id: res.data.musteri_id, ad: res.data.ad, modul_erisim: res.data.modul_erisim });
      onGiris(res.data);
    } catch (err) {
      setHata(err.response?.data?.detail || "Geçersiz kimlik bilgisi.");
    } finally { setYukleniyor(false); }
  };

  const doldur = (id, sifre) => { setMusteriId(id); setSifre(sifre); setHata(""); };

  return (
    <div className="giris-sayfa">
      <div className="giris-sol">
        <div className="giris-brand">
          <div className="brand-logo">⚡</div>
          <h1 className="brand-names">Softwaremen AI</h1>
          <p>Akıllı ERP Asistanı — Tüm modüllerinizi tek bir yapay zeka ile yönetin.</p>
          
        </div>
      </div>
      <div className="giris-sag">
        <div className="giris-kart">
          <div className="giris-kart-baslik">
            <h2>Giriş Yap</h2>
            <p>Softwaremen hesabınızla devam edin</p>
          </div>
          <form onSubmit={girisYap} className="giris-form">
            <div className="form-alan">
              <label>Müşteri ID</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input type="text" value={musteriId} onChange={e => setMusteriId(e.target.value)} placeholder="Müşteri ID'nizi girin" autoFocus disabled={yukleniyor} />
              </div>
            </div>
            <div className="form-alan">
              <label>Şifre</label>
              <div className="input-wrap">
                <span className="input-icon">🔑</span>
                <input type="password" value={sifre} onChange={e => setSifre(e.target.value)} placeholder="Şifrenizi girin" disabled={yukleniyor} />
              </div>
            </div>
            {hata && <div className="giris-hata"><span>⚠️</span>{hata}</div>}
            <button type="submit" className="giris-btn" disabled={yukleniyor}>
              {yukleniyor ? <span className="spinner" /> : <><span>Giriş Yap</span><span className="btn-arrow">→</span></>}
            </button>
          </form>
          <div className="demo-hesaplar">
            <p>Hızlı giriş:</p>
            <div className="demo-butonlar">
              <button onClick={() => doldur("demo",      "demo123")}      className="demo-btn">Demo Market</button>
              <button onClick={() => doldur("musteri_a", "musteri_a123")} className="demo-btn">ABC Market</button>
              <button onClick={() => doldur("musteri_b", "musteri_b123")} className="demo-btn">XYZ Restoran</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Ana Uygulama ─────────────────────────────────────────────────────── */
export default function App() {
  const [kullanici,    setKullanici]    = useState(kullaniciAl);
  const [aktifModul,   setAktifModul]   = useState(null);
  const [mesajlar,     setMesajlar]     = useState([]);
  const [input,        setInput]        = useState("");
  const [yukleniyor,   setYukleniyor]   = useState(false);
  const [sidebarAcik,  setSidebarAcik]  = useState(false);
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [bildirimler,  setBildirimler]  = useState([]);
  const [bilYukleniyor, setBilYukleniyor] = useState(false);
  const altRef   = useRef(null);
  const inputRef = useRef(null);

  const moduller = kullanici
    ? TUM_MODULLER.filter(m => kullanici.modul_erisim.includes(m.id))
    : [];

  useEffect(() => {
    if (kullanici && moduller.length > 0 && !aktifModul) setAktifModul(moduller[0].id);
  }, [kullanici]);

  useEffect(() => { altRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mesajlar]);

  const yetkiKontrol = useCallback((err) => {
    if (err.response?.status === 401) { tokenTemizle(); setKullanici(null); }
  }, []);

  const cikis = () => { tokenTemizle(); setKullanici(null); setAktifModul(null); setMesajlar([]); setBildirimler([]); };

  const modulSec = (id) => { setAktifModul(id); setMesajlar([]); setSidebarAcik(false); setBildirimAcik(false); inputRef.current?.focus(); };

  const bildirimleriGetir = async () => {
    if (bildirimAcik) { setBildirimAcik(false); return; }
    setBildirimAcik(true);
    if (bildirimler.length > 0) return;
    setBilYukleniyor(true);
    try {
      const res = await axios.get(`${API}/bildirimler/${kullanici.musteri_id}`, { headers: authHeader() });
      setBildirimler(res.data.bildirimler || []);
    } catch (err) {
      yetkiKontrol(err);
      setBildirimler([{ tip: "kritik", modul: "sistem", mesaj: "Bildirimler yüklenemedi." }]);
    } finally { setBilYukleniyor(false); }
  };

  const gonder = async (soru_override) => {
    const soru = (soru_override || input).trim();
    if (!soru || yukleniyor) return;
    const yeni = [...mesajlar, { rol: "kullanici", icerik: soru }];
    setMesajlar(yeni); setInput(""); setYukleniyor(true);
    try {
      const res = await axios.post(`${API}/sor`, { soru, modul: aktifModul }, { headers: authHeader() });
      setMesajlar([...yeni, { rol: "asistan", icerik: res.data.yanit }]);
    } catch (err) {
      yetkiKontrol(err);
      const msg = err.response?.status === 403 ? "Bu modüle erişim izniniz yok."
        : err.response?.status === 401 ? "Oturumunuz sona erdi." : "Bağlantı hatası.";
      setMesajlar([...yeni, { rol: "asistan", icerik: msg, hata: true }]);
    } finally { setYukleniyor(false); }
  };

  if (!kullanici) return (
    <GirisEkrani onGiris={data => {
      setKullanici({ musteri_id: data.musteri_id, ad: data.ad, modul_erisim: data.modul_erisim });
      setAktifModul(data.modul_erisim[0] || null);
    }} />
  );

  const aktifInfo  = TUM_MODULLER.find(m => m.id === aktifModul);
  const kritikSayi = bildirimler.filter(b => b.tip === "kritik").length;

  return (
    <div className="app">
      {/* Mobil overlay */}
      {sidebarAcik && <div className="overlay" onClick={() => setSidebarAcik(false)} />}

      {/* ── Sol Panel ── */}
      <aside className={`sidebar ${sidebarAcik ? "acik" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo">⚡</span>
            <span className="sidebar-title">Softwaremen</span>
          </div>
          <button className="bildirim-btn" onClick={bildirimleriGetir} title="Bildirimler">
            <span className="bildirim-icon">🔔</span>
            {kritikSayi > 0 && <span className="badge">{kritikSayi}</span>}
          </button>
        </div>

        <div className="musteri-karti">
          <div className="musteri-avatar">{kullanici.ad.charAt(0)}</div>
          <div className="musteri-info">
            <p className="musteri-ad">{kullanici.ad}</p>
            <p className="musteri-etiket">{kullanici.modul_erisim.length} modül erişimi</p>
          </div>
        </div>

        <div className="nav-baslik">MODÜLLER</div>
        <nav className="nav">
          {moduller.map(m => (
            <button key={m.id} className={`nav-item ${aktifModul === m.id ? "aktif" : ""}`} onClick={() => modulSec(m.id)}>
              <span className="nav-icon">{m.icon}</span>
              <div className="nav-metin">
                <span className="nav-label">{m.label}</span>
                <span className="nav-aciklama">{m.aciklama}</span>
              </div>
              {aktifModul === m.id && <span className="nav-aktif-cizgi" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="durum-satiri">
            <span className="durum-dot" />
            <span>Bağlı · port 8002</span>
          </div>
          <button className="cikis-btn" onClick={cikis}>
            <span>⎋</span><span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ── Ana İçerik ── */}
      <div className="icerik">
        {/* Mobil header */}
        <div className="mobil-header">
          <button className="hamburger" onClick={() => setSidebarAcik(!sidebarAcik)}>☰</button>
          <span className="mobil-baslik">{aktifInfo ? `${aktifInfo.icon} ${aktifInfo.label}` : "Softwaremen"}</span>
          <button className="mobil-bildirim" onClick={bildirimleriGetir}>
            🔔{kritikSayi > 0 && <span className="mobil-badge">{kritikSayi}</span>}
          </button>
        </div>

        {/* Bildirim paneli */}
        <div className={`bildirim-panel ${bildirimAcik ? "acik" : ""}`}>
          <div className="bildirim-panel-header">
            <div className="bildirim-baslik-grup">
              <span className="bildirim-baslik-icon">🔔</span>
              <h3>Bildirimler</h3>
              {kritikSayi > 0 && <span className="bildirim-sayac">{kritikSayi} kritik</span>}
            </div>
            <button className="panel-kapat" onClick={() => setBildirimAcik(false)}>✕</button>
          </div>
          <div className="bildirim-icerik">
            {bilYukleniyor ? (
              <div className="bildirim-yukle">
                <div className="yukle-halka" />
                <p>Bildirimler analiz ediliyor...</p>
              </div>
            ) : bildirimler.length === 0 ? (
              <div className="bildirim-bos"><span>✅</span><p>Bildirim yok</p></div>
            ) : (
              bildirimler.map((b, i) => (
                <div key={i} className={`bildirim-kart ${TIP_RENK[b.tip] || ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="bildirim-kart-ust">
                    <span className={`bildirim-tip-etiketi ${TIP_RENK[b.tip] || ""}`}>{TIP_ETIKET[b.tip] || b.tip}</span>
                    <span className="bildirim-modul-etiketi">{b.modul}</span>
                  </div>
                  <p className="bildirim-mesaj">{b.mesaj}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat alanı */}
        {aktifInfo && !bildirimAcik && (
          <div className="chat">
            <div className="chat-header">
              <div className="chat-header-sol">
                <div className="chat-modul-icon">{aktifInfo.icon}</div>
                <div>
                  <h2>{aktifInfo.label}</h2>
                  <p>{aktifInfo.aciklama}</p>
                </div>
              </div>
            </div>

            <div className="hazir-sorular-bar">
              {aktifInfo.sorular.map((s, i) => (
                <button key={i} className="hazir-soru" onClick={() => gonder(s)} disabled={yukleniyor}>
                  <span className="hazir-soru-ikon">💬</span>{s}
                </button>
              ))}
            </div>

            <div className="mesajlar">
              {mesajlar.length === 0 && (
                <div className="bos-alan">
                  <div className="bos-alan-icon">{aktifInfo.icon}</div>
                  <h3>{aktifInfo.label} Asistanı</h3>
                  <p>Hazır sorulardan birini seçin veya kendi sorunuzu yazın.</p>
                </div>
              )}
              {mesajlar.map((m, i) => (
                <div key={i} className={`mesaj-satir ${m.rol}`}>
                  {m.rol === "asistan" && <div className="ai-avatar">⚡</div>}
                  <div className={`balon ${m.rol} ${m.hata ? "hata" : ""}`}>{m.icerik}</div>
                </div>
              ))}
              {yukleniyor && (
                <div className="mesaj-satir asistan">
                  <div className="ai-avatar">⚡</div>
                  <div className="balon asistan yazıyor">
                    <span className="nokta" /><span className="nokta" /><span className="nokta" />
                  </div>
                </div>
              )}
              <div ref={altRef} />
            </div>

            <div className="input-bar">
              <div className="input-alan">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && gonder()}
                  placeholder={`${aktifInfo.label} hakkında soru sorun...`}
                  disabled={yukleniyor}
                />
                <button className={`gonder ${input.trim() && !yukleniyor ? "aktif" : ""}`} onClick={() => gonder()} disabled={yukleniyor || !input.trim()}>
                  ↑
                </button>
              </div>
              <p className="input-ipucu">Enter ile gönderin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
