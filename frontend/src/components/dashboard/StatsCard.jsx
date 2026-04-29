export default function StatsCard({ ikon, baslik, deger, alt, renk = "blue" }) {
  return (
    <div className={`stats-card ${renk}`}>
      <div className="stats-card-ikon">{ikon}</div>
      <div className="stats-card-bilgi">
        <span className="stats-card-baslik">{baslik}</span>
        <span className="stats-card-deger">{deger ?? "—"}</span>
        {alt && <span className="stats-card-alt">{alt}</span>}
      </div>
    </div>
  );
}
