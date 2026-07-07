import { useEffect, useState } from "react";
import { departmentApi } from "../api/departmentApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import Badge from "../components/common/Badge";
import { Icons } from "../components/common/Icons";

const EMPTY_FORM = { name: "", description: "", location: "", phone_extension: "", is_active: true };

export default function Departments() {
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
      const res = await departmentApi.list({ limit: 500 });
      setDepartments(res.data);
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

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      description: dept.description || "",
      location: dept.location || "",
      phone_extension: dept.phone_extension || "",
      is_active: dept.is_active,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await departmentApi.update(editing.id, form);
      } else {
        await departmentApi.create(form);
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
      await departmentApi.remove(deleteTarget.id);
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
    { key: "name", header: "Department" },
    { key: "location", header: "Location", render: (r) => r.location || "—" },
    { key: "doctor_count", header: "Doctors", render: (r) => r.doctor_count ?? 0 },
    { key: "phone_extension", header: "Extension", render: (r) => r.phone_extension || "—" },
    {
      key: "is_active",
      header: "Status",
      render: (r) => <Badge value={r.is_active} label={r.is_active ? "Active" : "Inactive"} />,
    },
  ];

  if (loading) return <LoadingBlock label="Loading departments…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="section-header">
        <div>
          <div className="section-title">Departments</div>
          <div className="section-sub">{departments.length} departments</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icons.Plus />
          Add Department
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={departments}
        searchKeys={["name", "location"]}
        searchPlaceholder="Search departments…"
        emptyMessage="No departments added yet."
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
        title={editing ? "Edit Department" : "Add Department"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Department"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert-banner danger">{formError}</div>}
          <FormField
            label="Department Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <FormField
            label="Description"
            as="textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="form-row">
            <FormField
              label="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <FormField
              label="Phone Extension"
              value={form.phone_extension}
              onChange={(e) => setForm({ ...form, phone_extension: e.target.value })}
            />
          </div>
          <FormField label="Status">
            <select
              value={form.is_active ? "yes" : "no"}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === "yes" })}
            >
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`This will remove the ${deleteTarget?.name} department.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
