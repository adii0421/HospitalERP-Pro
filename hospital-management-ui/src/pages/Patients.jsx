import { useEffect, useState } from "react";
import { patientApi } from "../api/patientApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import { Icons } from "../components/common/Icons";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM = {
  full_name: "",
  date_of_birth: "",
  gender: "male",
  blood_group: "",
  phone: "",
  email: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  allergies: "",
  chronic_conditions: "",
  insurance_provider: "",
  insurance_policy_number: "",
};

function age(dob) {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await patientApi.list({ limit: 500 });
      setPatients(res.data);
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

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (patient) => {
    setEditing(patient);
    setForm({
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group || "",
      phone: patient.phone,
      email: patient.email || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      allergies: patient.allergies || "",
      chronic_conditions: patient.chronic_conditions || "",
      insurance_provider: patient.insurance_provider || "",
      insurance_policy_number: patient.insurance_policy_number || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form };
      if (editing) {
        await patientApi.update(editing.id, payload);
      } else {
        await patientApi.create(payload);
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
      await patientApi.remove(deleteTarget.id);
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
    { key: "patient_code", header: "ID", render: (r) => <span className="mono">{r.patient_code}</span> },
    { key: "full_name", header: "Name" },
    { key: "age", header: "Age", render: (r) => age(r.date_of_birth) },
    { key: "gender", header: "Gender", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.gender}</span> },
    { key: "blood_group", header: "Blood Group", render: (r) => r.blood_group || "—" },
    { key: "phone", header: "Phone" },
  ];

  if (loading) return <LoadingBlock label="Loading patients…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="section-header">
        <div>
          <div className="section-title">Patient Registry</div>
          <div className="section-sub">{patients.length} patients registered</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icons.Plus />
          Register Patient
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={patients}
        searchKeys={["full_name", "patient_code", "phone"]}
        searchPlaceholder="Search by name, ID, or phone…"
        emptyMessage="No patients registered yet."
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
        title={editing ? "Edit Patient" : "Register New Patient"}
        onClose={() => setModalOpen(false)}
        width="640px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Register Patient"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert-banner danger">{formError}</div>}
          <div className="form-row">
            <FormField
              label="Full Name"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <FormField
              label="Date of Birth"
              type="date"
              required
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Gender"
              as="select"
              required
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
            <FormField
              label="Blood Group"
              placeholder="e.g. O+"
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Phone"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <FormField
            label="Address"
            as="textarea"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="form-row">
            <FormField
              label="Emergency Contact Name"
              value={form.emergency_contact_name}
              onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
            />
            <FormField
              label="Emergency Contact Phone"
              value={form.emergency_contact_phone}
              onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Allergies"
              as="textarea"
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            />
            <FormField
              label="Chronic Conditions"
              as="textarea"
              value={form.chronic_conditions}
              onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Insurance Provider"
              value={form.insurance_provider}
              onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })}
            />
            <FormField
              label="Insurance Policy Number"
              value={form.insurance_policy_number}
              onChange={(e) => setForm({ ...form, insurance_policy_number: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`This will permanently remove ${deleteTarget?.full_name} from the patient registry.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
