const STATUS_MAP = {
  // Appointment
  scheduled: "info",
  confirmed: "brand",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
  no_show: "vital",
  // Invoice
  draft: "neutral",
  pending: "warning",
  partially_paid: "info",
  paid: "success",
  overdue: "vital",
  // Prescription
  dispensed: "success",
  partially_dispensed: "warning",
  // Lab
  ordered: "info",
  sample_collected: "warning",
  // Staff
  active: "success",
  on_leave: "warning",
  suspended: "vital",
  terminated: "danger",
  // Generic
  true: "success",
  false: "neutral",
};

export default function Badge({ value, label }) {
  const key = String(value).toLowerCase();
  const tone = STATUS_MAP[key] || "neutral";
  const text = label || String(value).replace(/_/g, " ");
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {text}
    </span>
  );
}
