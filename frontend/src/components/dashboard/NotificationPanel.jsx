const TIP_RENK   = { kritik: "tip-kritik", uyari: "tip-uyari", bilgi: "tip-bilgi" };
const TIP_ETIKET = { kritik: "Kritik", uyari: "Uyarı", bilgi: "Bilgi" };

export default function NotificationPanel({ acik, bildirimler, yukleniyor, onKapat }) {
  const kritikSayi = bildirimler.filter((b) => b.tip === "kritik").length;

  return (
    <div className={`bildirim-panel ${acik ? "acik" : ""}`}>
      <div className="bildirim-panel-header">
        <div className="bildirim-baslik-grup">
          <span className="bildirim-baslik-icon">🔔</span>
          <h3>Bildirimler</h3>
          {kritikSayi > 0 && (
            <span className="bildirim-sayac">{kritikSayi} kritik</span>
          )}
        </div>
        <button className="panel-kapat" onClick={onKapat}>✕</button>
      </div>

      <div className="bildirim-icerik">
        {yukleniyor ? (
          <div className="bildirim-yukle">
            <div className="yukle-halka" />
            <p>Bildirimler analiz ediliyor...</p>
          </div>
        ) : bildirimler.length === 0 ? (
          <div className="bildirim-bos">
            <span>✅</span>
            <p>Bildirim yok</p>
          </div>
        ) : (
          bildirimler.map((b, i) => (
            <div
              key={i}
              className={`bildirim-kart ${TIP_RENK[b.tip] || ""}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="bildirim-kart-ust">
                <span className={`bildirim-tip-etiketi ${TIP_RENK[b.tip] || ""}`}>
                  {TIP_ETIKET[b.tip] || b.tip}
                </span>
                <span className="bildirim-modul-etiketi">{b.modul}</span>
              </div>
              <p className="bildirim-mesaj">{b.mesaj}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
