import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const TITLES = {
  "/": "Dashboard",
  "/patients": "Patients",
  "/doctors": "Doctors",
  "/departments": "Departments",
  "/appointments": "Appointments",
  "/billing": "Billing",
  "/pharmacy": "Pharmacy",
  "/laboratory": "Laboratory",
  "/inventory": "Inventory",
  "/staff": "Staff",
  "/reports": "Reports",
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || "MediCore";

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Topbar title={title} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
