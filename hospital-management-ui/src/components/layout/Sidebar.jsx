import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../common/Icons";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: Icons.Dashboard, end: true }],
  },
  {
    label: "Clinical",
    items: [
      { to: "/patients", label: "Patients", icon: Icons.Patients },
      { to: "/doctors", label: "Doctors", icon: Icons.Doctors },
      { to: "/departments", label: "Departments", icon: Icons.Departments },
      { to: "/appointments", label: "Appointments", icon: Icons.Appointments },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/billing", label: "Billing", icon: Icons.Billing },
      { to: "/pharmacy", label: "Pharmacy", icon: Icons.Pharmacy },
      { to: "/laboratory", label: "Laboratory", icon: Icons.Laboratory },
      { to: "/inventory", label: "Inventory", icon: Icons.Inventory },
    ],
  },
  {
    label: "Organization",
    items: [
      { to: "/staff", label: "Staff", icon: Icons.Staff },
      { to: "/reports", label: "Reports", icon: Icons.Reports },
    ],
  },
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  const initials = (user?.full_name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#ffffff" strokeWidth="2">
              <path d="M4 12h4l1.5-4 3 8L14 12h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-name">MediCore</div>
            <div className="sidebar-brand-sub">HMS · v1.0</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.full_name}</div>
              <div className="sidebar-user-role">{user?.role?.replace("_", " ")}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <Icons.Logout width={14} height={14} />
            Sign out
          </button>
        </div>
      </aside>
      <div className={`sidebar-backdrop ${open ? "open" : ""}`} onClick={onNavigate} />
    </>
  );
}
