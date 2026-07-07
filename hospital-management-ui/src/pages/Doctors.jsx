import { useEffect, useState } from "react";
import { doctorApi } from "../api/doctorApi";
import { departmentApi } from "../api/departmentApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import Badge from "../components/common/Badge";
import { Icons } from "../components/common/Icons";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  specialization: "",
  qualification: "",
  license_number: "",
  years_of_experience: 0,
  consultation_fee: 0,
  department_id: "",
  is_available: true,
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      const [docRes, deptRes] = await Promise.all([
        doctorApi.list({ limit: 500 }),
        departmentApi.list({ limit: 500 }),
      ]);
      setDoctors(docRes.data);
      setDepartments(deptRes.data);
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

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (doctor) => {
    setEditing(doctor);
    setForm({
      full_name: doctor.full_name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      qualification: doctor.qualification || "",
      license_number: doctor.license_number,
      years_of_experience: doctor.years_of_experience,
      consultation_fee: doctor.consultation_fee,
      department_id: doctor.department_id || "",
      is_available: doctor.is_available,
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
        years_of_experience: Number(form.years_of_experience),
        consultation_fee: Number(form.consultation_fee),
        department_id: form.department_id ? Number(form.department_id) : null,
      };
      if (editing) {
        await doctorApi.update(editing.id, payload);
      } else {
        await doctorApi.create(payload);
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
      await doctorApi.remove(deleteTarget.id);
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
    { key: "full_name", header: "Name" },
    { key: "specialization", header: "Specialization" },
    { key: "department_name", header: "Department", render: (r) => r.department_name || "—" },
    {
      key: "consultation_fee",
      header: "Fee",
      render: (r) => <span className="mono">₹{r.consultation_fee}</span>,
    },
    { key: "years_of_experience", header: "Experience", render: (r) => `${r.years_of_experience} yrs` },
    {
      key: "is_available",
      header: "Status",
      render: (r) => <Badge value={r.is_available} label={r.is_available ? "Available" : "Unavailable"} />,
    },
  ];

  if (loading) return <LoadingBlock label="Loading doctors…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="section-header">
        <div>
          <div className="section-title">Doctors</div>
          <div className="section-sub">{doctors.length} doctors on staff</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icons.Plus />
          Add Doctor
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={doctors}
        searchKeys={["full_name", "specialization", "department_name"]}
        searchPlaceholder="Search by name or specialization…"
        emptyMessage="No doctors added yet."
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
        title={editing ? "Edit Doctor" : "Add Doctor"}
        onClose={() => setModalOpen(false)}
        width="640px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Doctor"}
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
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              label="License Number"
              required
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Specialization"
              required
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            />
            <FormField
              label="Department"
              as="select"
              options={deptOptions}
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            />
          </div>
          <FormField
            label="Qualification"
            value={form.qualification}
            onChange={(e) => setForm({ ...form, qualification: e.target.value })}
          />
          <div className="form-row">
            <FormField
              label="Years of Experience"
              type="number"
              min="0"
              value={form.years_of_experience}
              onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
            />
            <FormField
              label="Consultation Fee (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.consultation_fee}
              onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
            />
          </div>
          <FormField label="Available for appointments">
            <select
              value={form.is_available ? "yes" : "no"}
              onChange={(e) => setForm({ ...form, is_available: e.target.value === "yes" })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`This will remove ${deleteTarget?.full_name} from the doctor roster.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
