import { Icons } from "../common/Icons";

export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <Icons.Menu width={20} height={20} />
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-actions">
        <span className="badge badge-brand">
          <span className="badge-dot" />
          Live
        </span>
      </div>
    </header>
  );
}
