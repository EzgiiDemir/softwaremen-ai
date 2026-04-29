import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { giris } from "../api/auth";
import "../styles/login.css";

export default function LoginPage() {
  const [kullanici_adi, setKullaniciAdi] = useState("");
  const [sifre, setSifre]               = useState("");
  const [hata, setHata]                 = useState("");
  const [yukleniyor, setYukleniyor]     = useState(false);

  const { giris: storeGiris }                         = useAuthStore();
  const { modulSec, kullaniciBelirle } = useChatStore();

  const girisYap = async (e) => {
    e.preventDefault();
    if (!kullanici_adi.trim() || !sifre.trim()) {
      setHata("Tüm alanları doldurun.");
      return;
    }
    setYukleniyor(true);
    setHata("");
    try {
      const res = await giris(kullanici_adi.trim(), sifre);
      const { token, kullanici_id, ad, moduller } = res.data;
      // Kullanıcıya ait chat geçmişine geç (diğer kullanıcının verileri görünmez)
      kullaniciBelirle(kullanici_id);
      // İlk desteklenen modülü seç
      const desteklenen = ["stockman","financeman","accountman","serviceman","wageman"];
      const ilkModul = (moduller || []).find(m => desteklenen.includes(m));
      if (ilkModul) modulSec(ilkModul);
      storeGiris({ kullanici_id, ad, moduller: moduller || [] }, token);
      // App.jsx token'ı görünce otomatik DashboardPage'e geçer
    } catch (err) {
      setHata(err.response?.data?.detail || "Geçersiz kimlik bilgisi.");
      setYukleniyor(false);
    }
  };

  const doldur = (id, sif) => {
    setKullaniciAdi(id);
    setSifre(sif);
    setHata("");
  };

  return (
    <div className="giris-sayfa">
      <div className="giris-sol">
        <div className="giris-brand">
          <span className="brand-logo">⚡</span>
          <h1>Softwaremen AI</h1>
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
              <label>Kullanıcı Adı / Kod</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  value={kullanici_adi}
                  onChange={(e) => setKullaniciAdi(e.target.value)}
                  placeholder="Kullanıcı adı veya kod"
                  autoFocus
                  disabled={yukleniyor}
                />
              </div>
            </div>

            <div className="form-alan">
              <label>Şifre</label>
              <div className="input-wrap">
                <span className="input-icon">🔑</span>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="Şifrenizi girin"
                  disabled={yukleniyor}
                />
              </div>
            </div>

            {hata && (
              <div className="giris-hata">
                <span>⚠️</span>{hata}
              </div>
            )}

            <button type="submit" className="giris-btn" disabled={yukleniyor}>
              {yukleniyor
                ? <span className="spinner" />
                : <><span>Giriş Yap</span><span className="btn-arrow">→</span></>
              }
            </button>
          </form>

          <div className="demo-hesaplar">
            <p>Hızlı giriş:</p>
            <div className="demo-butonlar">
              {[
                { id: "100",   sifre: "qLJV",   isim: "ADMIN"   },
                { id: "IBO",   sifre: "qDly",   isim: "IBRAHIM" },
                { id: "ADNAN", sifre: "vLmmT9", isim: "ADNAN"   },
                { id: "IPEK",  sifre: "rXaO-9", isim: "IPEK"    },
                { id: "IPEK2", sifre: "w@js",   isim: "IPEK2"   },
                { id: "BURAK", sifre: "qH",     isim: "BURAK"   },
              ].map((u) => (
                <button
                  key={u.id}
                  onClick={() => doldur(u.id, u.sifre)}
                  className="demo-btn"
                  type="button"
                  disabled={yukleniyor}
                >
                  <span className="demo-btn-isim">{u.isim}</span>
                  <span className="demo-btn-id">{u.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
