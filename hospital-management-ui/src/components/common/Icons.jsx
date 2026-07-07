/* Minimal hand-rolled icon set (stroke-based, 24x24 viewBox) to avoid an
   extra icon-library dependency while keeping a consistent visual language. */

const base = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };

export const Icons = {
  Dashboard: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Patients: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17.5" cy="8.5" r="2.3" />
      <path d="M15.7 14.6c2.4.4 4.3 2.3 4.3 5.4" />
    </svg>
  ),
  Doctors: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M9 3v4a3 3 0 006 0V3" />
      <path d="M7 3h10" />
      <path d="M8 10v3a4 4 0 008 0v-3" />
      <circle cx="18.5" cy="17.5" r="3" />
      <path d="M18.5 16.2v2.6M17.2 17.5h2.6" />
    </svg>
  ),
  Departments: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 21V9l8-5 8 5v12" />
      <path d="M9 21v-6h6v6" />
      <path d="M12 7v3M10.5 8.5h3" />
    </svg>
  ),
  Appointments: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 15l2.2 2L16 12" />
    </svg>
  ),
  Billing: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
  Pharmacy: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  Laboratory: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M9 3h6M10 3v6.5L4.8 18a2 2 0 001.7 3h11a2 2 0 001.7-3L14 9.5V3" />
      <path d="M7.5 15h9" />
    </svg>
  ),
  Inventory: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  ),
  Staff: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M14.5 15.2c2.2.3 4 2 4 4.8" />
    </svg>
  ),
  Reports: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c0-3.6 3.1-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Edit: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  ),
  Menu: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  Logout: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9L2.5 18a1.7 1.7 0 001.5 2.5h16a1.7 1.7 0 001.5-2.5L13.7 3.9a1.7 1.7 0 00-3.4 0z" />
    </svg>
  ),
  Money: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 15.2c0 1 1 1.8 2.5 1.8s2.5-.7 2.5-1.8c0-2.4-5-1.2-5-3.5 0-1.1 1-1.8 2.5-1.8s2.5.6 2.5 1.6" />
      <path d="M12 7.5v9" />
    </svg>
  ),
  Beaker: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M9 3h6M10 3v6.5L4.8 18a2 2 0 001.7 3h11a2 2 0 001.7-3L14 9.5V3" />
    </svg>
  ),
  Box: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Eye: (p) => (
    <svg viewBox="0 0 24 24" {...base} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};
