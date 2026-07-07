import { useEffect, useState } from "react";
import { appointmentApi } from "../api/appointmentApi";
import { patientApi } from "../api/patientApi";
import { doctorApi } from "../api/doctorApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import Badge from "../components/common/Badge";
import { Icons } from "../components/common/Icons";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

const emptyForm = () => ({
  patient_id: "",
  doctor_id: "",
  scheduled_at: "",
  duration_minutes: 30,
  reason: "",
  notes: "",
  status: "scheduled",
});

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [apptRes, patRes, docRes] = await Promise.all([
        appointmentApi.list({ limit: 500 }),
        patientApi.list({ limit: 500 }),
        doctorApi.list({ limit: 500 }),
      ]);
      setAppointments(apptRes.data);
      setPatients(patRes.data);
      setDoctors(docRes.data);
      setError("");
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patientOptions = patients.map((p) => ({ value: p.id, label: `${p.full_name} (${p.patient_code})` }));
  const doctorOptions = doctors.map((d) => ({ value: d.id, label: `${d.full_name} — ${d.specialization}` }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (appt) => {
    setEditing(appt);
    setForm({
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id,
      scheduled_at: toLocalInputValue(appt.scheduled_at),
      duration_minutes: appt.duration_minutes,
      reason: appt.reason || "",
      notes: appt.notes || "",
      status: appt.status,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        duration_minutes: Number(form.duration_minutes),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      };
      if (editing) {
        await appointmentApi.update(editing.id, payload);
      } else {
        await appointmentApi.create(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await appointmentApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "scheduled_at",
      header: "Date & Time",
      render: (r) => new Date(r.scheduled_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    },
    { key: "patient_name", header: "Patient" },
    { key: "doctor_name", header: "Doctor" },
    { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
    { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
  ];

  if (loading) return <LoadingBlock label="Loading appointments…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="section-header">
        <div>
          <div className="section-title">Appointments</div>
          <div className="section-sub">{appointments.length} appointments</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icons.Plus />
          Schedule Appointment
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={appointments}
        searchKeys={["patient_name", "doctor_name", "reason"]}
        searchPlaceholder="Search by patient, doctor, or reason…"
        emptyMessage="No appointments scheduled yet."
        actions={(row) => (
          <>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit">
              <Icons.Edit />
            </button>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => setDeleteTarget(row)}
              title="Delete"
              style={{ color: "var(--color-vital)" }}
            >
              <Icons.Trash />
            </button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        title={editing ? "Edit Appointment" : "Schedule Appointment"}
        onClose={() => setModalOpen(false)}
        width="640px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Schedule"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert-banner danger">{formError}</div>}
          <div className="form-row">
            <FormField
              label="Patient"
              as="select"
              required
              options={patientOptions}
              value={form.patient_id}
              onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
            />
            <FormField
              label="Doctor"
              as="select"
              required
              options={doctorOptions}
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Date & Time"
              type="datetime-local"
              required
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
            <FormField
              label="Duration (minutes)"
              type="number"
              min="5"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            />
          </div>
          <FormField
            label="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <FormField
            label="Notes"
            as="textarea"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {editing && (
            <FormField
              label="Status"
              as="select"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`This will cancel and remove the appointment for ${deleteTarget?.patient_name}.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
