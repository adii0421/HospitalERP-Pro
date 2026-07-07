export default function StatCard({ icon, label, value, trend, trendDirection }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>
        {trend && (
          <span className={`stat-trend ${trendDirection === "down" ? "down" : "up"}`}>{trend}</span>
        )}
      </div>
      <div className="stat-value mono">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
