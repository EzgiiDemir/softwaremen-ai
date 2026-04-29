import { useState, useRef, useEffect } from "react";

export default function ChatInput({ onGonder, yukleniyor, placeholder, sorular }) {
  const [deger, setDeger]     = useState("");
  const textareaRef           = useRef(null);

  // Textarea auto-resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  }, [deger]);

  const gonder = () => {
    const temiz = deger.trim();
    if (!temiz || yukleniyor) return;
    onGonder(temiz);
    setDeger("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const chipTikla = (soru) => {
    if (yukleniyor) return;
    onGonder(soru);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      gonder();
    }
  };

  return (
    <div className="input-bar">
      {sorular?.length > 0 && (
        <div className="hazir-sorular-chips">
          {sorular.map((s, i) => (
            <button
              key={i}
              className="hazir-chip"
              onClick={() => chipTikla(s)}
              disabled={yukleniyor}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="input-alan">
        <button className="ek-btn" title="Dosya ekle (yakında)" disabled tabIndex={-1}>
          📎
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={deger}
          onChange={(e) => setDeger(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Soru sorun..."}
          disabled={yukleniyor}
          autoFocus
        />

        <div className="input-araclari">
          {deger.length > 0 && (
            <span className={`karakter-sayac ${deger.length > 800 ? "uyari" : ""}`}>
              {deger.length}
            </span>
          )}
          <button
            className={`gonder ${deger.trim() && !yukleniyor ? "aktif" : ""}`}
            onClick={gonder}
            disabled={yukleniyor || !deger.trim()}
            title="Gönder"
          >
            {yukleniyor ? <span className="gonder-spinner" /> : "↑"}
          </button>
        </div>
      </div>

      <p className="input-ipucu">Enter ile gönderin · Shift+Enter yeni satır</p>
    </div>
  );
}
