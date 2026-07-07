import { useEffect, useState } from "react";
import { staffApi, leaveRequestApi } from "../api/staffApi";
import { departmentApi } from "../api/departmentApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import Badge from "../components/common/Badge";
import { Icons } from "../components/common/Icons";

const EMPLOYMENT_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "visiting", label: "Visiting" },
];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "suspended", label: "Suspended" },
  { value: "terminated", label: "Terminated" },
];

const emptyStaff = () => ({
  full_name: "",
  email: "",
  phone: "",
  designation: "",
  department_id: "",
  employment_type: "full_time",
  status: "active",
  date_joined: "",
  salary: 0,
  address: "",
});

export default function Staff() {
  const [tab, setTab] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyStaff());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ staff_id: "", start_date: "", end_date: "", reason: "" });
  const [leaveFormError, setLeaveFormError] = useState("");
  const [leaveSaving, setLeaveSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [staffRes, leaveRes, deptRes] = await Promise.all([
        staffApi.list({ limit: 500 }),
        leaveRequestApi.list({ limit: 500 }),
        departmentApi.list({ limit: 500 }),
      ]);
      setStaffList(staffRes.data);
      setLeaveRequests(leaveRes.data);
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
  const staffOptions = staffList.map((s) => ({ value: s.id, label: `${s.full_name} — ${s.designation}` }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyStaff());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (staff) => {
    setEditing(staff);
    setForm({
      full_name: staff.full_name,
      email: staff.email,
      phone: staff.phone,
      designation: staff.designation,
      department_id: staff.department_id || "",
      employment_type: staff.employment_type,
      status: staff.status,
      date_joined: staff.date_joined,
      salary: staff.salary,
      address: staff.address || "",
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
        department_id: form.department_id ? Number(form.department_id) : null,
        salary: Number(form.salary),
      };
      if (editing) {
        await staffApi.update(editing.id, payload);
      } else {
        await staffApi.create(payload);
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
      await staffApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openLeaveCreate = () => {
    setLeaveForm({ staff_id: "", start_date: "", end_date: "", reason: "" });
    setLeaveFormError("");
    setLeaveModalOpen(true);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveSaving(true);
    setLeaveFormError("");
    try {
      await leaveRequestApi.create({ ...leaveForm, staff_id: Number(leaveForm.staff_id) });
      setLeaveModalOpen(false);
      await load();
    } catch (e) {
      setLeaveFormError(extractErrorMessage(e));
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleLeaveStatus = async (leave, status) => {
    try {
      await leaveRequestApi.update(leave.id, { status });
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const staffColumns = [
    { key: "full_name", header: "Name" },
    { key: "designation", header: "Designation" },
    { key: "department_name", header: "Department", render: (r) => r.department_name || "—" },
    {
      key: "employment_type",
      header: "Type",
      render: (r) => <span style={{ textTransform: "capitalize" }}>{r.employment_type.replace("_", " ")}</span>,
    },
    { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
  ];

  const leaveColumns = [
    { key: "staff_name", header: "Staff" },
    { key: "start_date", header: "From" },
    { key: "end_date", header: "To" },
    { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
    { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
  ];

  if (loading) return <LoadingBlock label="Loading staff data…" />;

  return (
    <div>
      {error && (
        <div className="alert-banner danger">
          <Icons.Alert />
          {error}
        </div>
      )}

      <div className="tabs">
        <button className={`tab-btn ${tab === "staff" ? "active" : ""}`} onClick={() => setTab("staff")}>
          Staff Directory
        </button>
        <button className={`tab-btn ${tab === "leave" ? "active" : ""}`} onClick={() => setTab("leave")}>
          Leave Requests
        </button>
      </div>

      {tab === "staff" ? (
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Staff Directory</div>
              <div className="section-sub">{staffList.length} employees</div>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>
              <Icons.Plus />
              Add Staff
            </button>
          </div>
          <DataTable
            columns={staffColumns}
            rows={staffList}
            searchKeys={["full_name", "designation", "department_name"]}
            searchPlaceholder="Search staff…"
            emptyMessage="No staff members added yet."
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
        </div>
      ) : (
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Leave Requests</div>
              <div className="section-sub">{leaveRequests.length} requests</div>
            </div>
            <button className="btn btn-primary" onClick={openLeaveCreate}>
              <Icons.Plus />
              Request Leave
            </button>
          </div>
          <DataTable
            columns={leaveColumns}
            rows={leaveRequests}
            searchKeys={["staff_name", "reason"]}
            searchPlaceholder="Search leave requests…"
            emptyMessage="No leave requests yet."
            actions={(row) =>
              row.status === "pending" && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleLeaveStatus(row, "approved")}>
                    Approve
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleLeaveStatus(row, "rejected")}
                    style={{ color: "var(--color-vital)" }}
                  >
                    Reject
                  </button>
                </>
              )
            }
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Edit Staff Member" : "Add Staff Member"}
        onClose={() => setModalOpen(false)}
        width="640px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Staff"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert-banner danger">{formError}</div>}
          <div className="form-row">
            <FormField label="Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <FormField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-row">
            <FormField label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <FormField label="Designation" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </div>
          <div className="form-row">
            <FormField
              label="Department"
              as="select"
              options={deptOptions}
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            />
            <FormField
              label="Employment Type"
              as="select"
              options={EMPLOYMENT_OPTIONS}
              value={form.employment_type}
              onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Date Joined"
              type="date"
              required
              value={form.date_joined}
              onChange={(e) => setForm({ ...form, date_joined: e.target.value })}
            />
            <FormField
              label="Salary (₹/month)"
              type="number"
              min="0"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </div>
          {editing && (
            <FormField
              label="Status"
              as="select"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          )}
          <FormField label="Address" as="textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </form>
      </Modal>

      <Modal
        open={leaveModalOpen}
        title="Request Leave"
        onClose={() => setLeaveModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setLeaveModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleLeaveSubmit} disabled={leaveSaving}>
              {leaveSaving ? "Submitting…" : "Submit Request"}
            </button>
          </>
        }
      >
        <form onSubmit={handleLeaveSubmit}>
          {leaveFormError && <div className="alert-banner danger">{leaveFormError}</div>}
          <FormField
            label="Staff Member"
            as="select"
            required
            options={staffOptions}
            value={leaveForm.staff_id}
            onChange={(e) => setLeaveForm({ ...leaveForm, staff_id: e.target.value })}
          />
          <div className="form-row">
            <FormField
              label="Start Date"
              type="date"
              required
              value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
            />
            <FormField
              label="End Date"
              type="date"
              required
              value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
            />
          </div>
          <FormField label="Reason" as="textarea" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`This will remove ${deleteTarget?.full_name} from the staff directory.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
