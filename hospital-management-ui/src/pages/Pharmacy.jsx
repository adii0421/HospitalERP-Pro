import { useEffect, useState } from "react";
import { medicineApi, prescriptionApi } from "../api/pharmacyApi";
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

const emptyMedicine = () => ({
  name: "",
  generic_name: "",
  category: "general",
  manufacturer: "",
  unit: "tablet",
  unit_price: 0,
  stock_quantity: 0,
  reorder_level: 10,
  expiry_date: "",
  batch_number: "",
  requires_prescription: true,
});

const emptyPrescriptionItem = () => ({ medicine_id: "", dosage: "", frequency: "", duration_days: 7, quantity: 1, instructions: "" });

export default function Pharmacy() {
  const [tab, setTab] = useState("medicines");

  // Shared reference data
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Medicine modal
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [medForm, setMedForm] = useState(emptyMedicine());
  const [medFormError, setMedFormError] = useState("");
  const [medSaving, setMedSaving] = useState(false);
  const [medDeleteTarget, setMedDeleteTarget] = useState(null);
  const [medDeleting, setMedDeleting] = useState(false);

  // Prescription modal
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxForm, setRxForm] = useState({ patient_id: "", doctor_id: "", diagnosis: "", notes: "" });
  const [rxItems, setRxItems] = useState([emptyPrescriptionItem()]);
  const [rxFormError, setRxFormError] = useState("");
  const [rxSaving, setRxSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [medRes, rxRes, patRes, docRes] = await Promise.all([
        medicineApi.list({ limit: 500 }),
        prescriptionApi.list({ limit: 500 }),
        patientApi.list({ limit: 500 }),
        doctorApi.list({ limit: 500 }),
      ]);
      setMedicines(medRes.data);
      setPrescriptions(rxRes.data);
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

  const medicineOptions = medicines.map((m) => ({ value: m.id, label: `${m.name} (₹${m.unit_price}/${m.unit})` }));
  const patientOptions = patients.map((p) => ({ value: p.id, label: `${p.full_name} (${p.patient_code})` }));
  const doctorOptions = doctors.map((d) => ({ value: d.id, label: d.full_name }));

  // ---- Medicine handlers ----
  const openCreateMed = () => {
    setEditingMed(null);
    setMedForm(emptyMedicine());
    setMedFormError("");
    setMedModalOpen(true);
  };

  const openEditMed = (med) => {
    setEditingMed(med);
    setMedForm({
      name: med.name,
      generic_name: med.generic_name || "",
      category: med.category,
      manufacturer: med.manufacturer || "",
      unit: med.unit,
      unit_price: med.unit_price,
      stock_quantity: med.stock_quantity,
      reorder_level: med.reorder_level,
      expiry_date: med.expiry_date || "",
      batch_number: med.batch_number || "",
      requires_prescription: med.requires_prescription,
    });
    setMedFormError("");
    setMedModalOpen(true);
  };

  const handleMedSubmit = async (e) => {
    e.preventDefault();
    setMedSaving(true);
    setMedFormError("");
    try {
      const payload = {
        ...medForm,
        unit_price: Number(medForm.unit_price),
        stock_quantity: Number(medForm.stock_quantity),
        reorder_level: Number(medForm.reorder_level),
        expiry_date: medForm.expiry_date || null,
      };
      if (editingMed) {
        await medicineApi.update(editingMed.id, payload);
      } else {
        await medicineApi.create(payload);
      }
      setMedModalOpen(false);
      await load();
    } catch (e) {
      setMedFormError(extractErrorMessage(e));
    } finally {
      setMedSaving(false);
    }
  };

  const handleMedDelete = async () => {
    setMedDeleting(true);
    try {
      await medicineApi.remove(medDeleteTarget.id);
      setMedDeleteTarget(null);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
      setMedDeleteTarget(null);
    } finally {
      setMedDeleting(false);
    }
  };

  // ---- Prescription handlers ----
  const openCreateRx = () => {
    setRxForm({ patient_id: "", doctor_id: "", diagnosis: "", notes: "" });
    setRxItems([emptyPrescriptionItem()]);
    setRxFormError("");
    setRxModalOpen(true);
  };

  const updateRxItem = (idx, field, value) => {
    setRxItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const addRxItemRow = () => setRxItems((prev) => [...prev, emptyPrescriptionItem()]);
  const removeRxItemRow = (idx) => setRxItems((prev) => prev.filter((_, i) => i !== idx));

  const handleRxSubmit = async (e) => {
    e.preventDefault();
    setRxSaving(true);
    setRxFormError("");
    try {
      const validItems = rxItems.filter((it) => it.medicine_id && it.dosage && it.frequency);
      if (validItems.length === 0) {
        setRxFormError("Add at least one medicine with dosage and frequency.");
        setRxSaving(false);
        return;
      }
      const payload = {
        patient_id: Number(rxForm.patient_id),
        doctor_id: Number(rxForm.doctor_id),
        diagnosis: rxForm.diagnosis,
        notes: rxForm.notes,
        status: "pending",
        items: validItems.map((it) => ({
          medicine_id: Number(it.medicine_id),
          dosage: it.dosage,
          frequency: it.frequency,
          duration_days: Number(it.duration_days),
          quantity: Number(it.quantity),
          instructions: it.instructions,
        })),
      };
      await prescriptionApi.create(payload);
      setRxModalOpen(false);
      await load();
    } catch (e) {
      setRxFormError(extractErrorMessage(e));
    } finally {
      setRxSaving(false);
    }
  };

  const handleDispense = async (rx) => {
    try {
      await prescriptionApi.dispense(rx.id);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const medicineColumns = [
    { key: "name", header: "Medicine" },
    { key: "category", header: "Category", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.category}</span> },
    { key: "unit_price", header: "Unit Price", render: (r) => <span className="mono">₹{r.unit_price}</span> },
    {
      key: "stock_quantity",
      header: "Stock",
      render: (r) => (
        <span style={{ color: r.stock_quantity <= r.reorder_level ? "var(--color-vital)" : "inherit", fontWeight: r.stock_quantity <= r.reorder_level ? 700 : 400 }}>
          {r.stock_quantity} {r.unit}
        </span>
      ),
    },
    { key: "expiry_date", header: "Expiry", render: (r) => r.expiry_date || "—" },
  ];

  const prescriptionColumns = [
    {
      key: "prescribed_at",
      header: "Date",
      render: (r) => new Date(r.prescribed_at).toLocaleDateString("en-IN", { dateStyle: "medium" }),
    },
    { key: "patient_name", header: "Patient" },
    { key: "doctor_name", header: "Doctor" },
    { key: "diagnosis", header: "Diagnosis", render: (r) => r.diagnosis || "—" },
    { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
  ];

  if (loading) return <LoadingBlock label="Loading pharmacy data…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="tabs">
        <button className={`tab-btn ${tab === "medicines" ? "active" : ""}`} onClick={() => setTab("medicines")}>
          Medicines
        </button>
        <button className={`tab-btn ${tab === "prescriptions" ? "active" : ""}`} onClick={() => setTab("prescriptions")}>
          Prescriptions
        </button>
      </div>

      {tab === "medicines" ? (
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Medicine Catalog</div>
              <div className="section-sub">{medicines.length} medicines in stock</div>
            </div>
            <button className="btn btn-primary" onClick={openCreateMed}>
              <Icons.Plus />
              Add Medicine
            </button>
          </div>
          <DataTable
            columns={medicineColumns}
            rows={medicines}
            searchKeys={["name", "generic_name", "category"]}
            searchPlaceholder="Search medicines…"
            emptyMessage="No medicines added yet."
            actions={(row) => (
              <>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditMed(row)} title="Edit">
                  <Icons.Edit />
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setMedDeleteTarget(row)}
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
              <div className="section-title">Prescriptions</div>
              <div className="section-sub">{prescriptions.length} prescriptions issued</div>
            </div>
            <button className="btn btn-primary" onClick={openCreateRx}>
              <Icons.Plus />
              New Prescription
            </button>
          </div>
          <DataTable
            columns={prescriptionColumns}
            rows={prescriptions}
            searchKeys={["patient_name", "doctor_name", "diagnosis"]}
            searchPlaceholder="Search prescriptions…"
            emptyMessage="No prescriptions issued yet."
            actions={(row) => (
              <>
                {row.status === "pending" && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDispense(row)}>
                    <Icons.Check />
                    Dispense
                  </button>
                )}
              </>
            )}
          />
        </div>
      )}

      {/* Medicine Modal */}
      <Modal
        open={medModalOpen}
        title={editingMed ? "Edit Medicine" : "Add Medicine"}
        onClose={() => setMedModalOpen(false)}
        width="640px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setMedModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleMedSubmit} disabled={medSaving}>
              {medSaving ? "Saving…" : editingMed ? "Save Changes" : "Add Medicine"}
            </button>
          </>
        }
      >
        <form onSubmit={handleMedSubmit}>
          {medFormError && <div className="alert-banner danger">{medFormError}</div>}
          <div className="form-row">
            <FormField label="Name" required value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} />
            <FormField
              label="Generic Name"
              value={medForm.generic_name}
              onChange={(e) => setMedForm({ ...medForm, generic_name: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField label="Category" value={medForm.category} onChange={(e) => setMedForm({ ...medForm, category: e.target.value })} />
            <FormField label="Manufacturer" value={medForm.manufacturer} onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })} />
          </div>
          <div className="form-row">
            <FormField label="Unit" value={medForm.unit} onChange={(e) => setMedForm({ ...medForm, unit: e.target.value })} />
            <FormField
              label="Unit Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={medForm.unit_price}
              onChange={(e) => setMedForm({ ...medForm, unit_price: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Stock Quantity"
              type="number"
              min="0"
              value={medForm.stock_quantity}
              onChange={(e) => setMedForm({ ...medForm, stock_quantity: e.target.value })}
            />
            <FormField
              label="Reorder Level"
              type="number"
              min="0"
              value={medForm.reorder_level}
              onChange={(e) => setMedForm({ ...medForm, reorder_level: e.target.value })}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Expiry Date"
              type="date"
              value={medForm.expiry_date}
              onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })}
            />
            <FormField label="Batch Number" value={medForm.batch_number} onChange={(e) => setMedForm({ ...medForm, batch_number: e.target.value })} />
          </div>
          <FormField label="Requires Prescription">
            <select
              value={medForm.requires_prescription ? "yes" : "no"}
              onChange={(e) => setMedForm({ ...medForm, requires_prescription: e.target.value === "yes" })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </FormField>
        </form>
      </Modal>

      {/* Prescription Modal */}
      <Modal
        open={rxModalOpen}
        title="New Prescription"
        onClose={() => setRxModalOpen(false)}
        width="720px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRxModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleRxSubmit} disabled={rxSaving}>
              {rxSaving ? "Saving…" : "Create Prescription"}
            </button>
          </>
        }
      >
        <form onSubmit={handleRxSubmit}>
          {rxFormError && <div className="alert-banner danger">{rxFormError}</div>}
          <div className="form-row">
            <FormField
              label="Patient"
              as="select"
              required
              options={patientOptions}
              value={rxForm.patient_id}
              onChange={(e) => setRxForm({ ...rxForm, patient_id: e.target.value })}
            />
            <FormField
              label="Doctor"
              as="select"
              required
              options={doctorOptions}
              value={rxForm.doctor_id}
              onChange={(e) => setRxForm({ ...rxForm, doctor_id: e.target.value })}
            />
          </div>
          <FormField label="Diagnosis" value={rxForm.diagnosis} onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })} />

          <div className="form-field">
            <label>Medicines</label>
            {rxItems.map((item, idx) => (
              <div key={idx} style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <select value={item.medicine_id} onChange={(e) => updateRxItem(idx, "medicine_id", e.target.value)}>
                    <option value="">Select medicine…</option>
                    {medicineOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Dosage (e.g. 1 tablet)"
                    value={item.dosage}
                    onChange={(e) => updateRxItem(idx, "dosage", e.target.value)}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 8 }}>
                  <input
                    placeholder="Frequency (e.g. Twice a day)"
                    value={item.frequency}
                    onChange={(e) => updateRxItem(idx, "frequency", e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Days"
                    value={item.duration_days}
                    onChange={(e) => updateRxItem(idx, "duration_days", e.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateRxItem(idx, "quantity", e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => removeRxItemRow(idx)}
                    disabled={rxItems.length === 1}
                    style={{ color: "var(--color-vital)" }}
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addRxItemRow}>
              <Icons.Plus />
              Add Medicine
            </button>
          </div>

          <FormField label="Notes" as="textarea" value={rxForm.notes} onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!medDeleteTarget}
        message={`This will remove ${medDeleteTarget?.name} from the catalog.`}
        onCancel={() => setMedDeleteTarget(null)}
        onConfirm={handleMedDelete}
        loading={medDeleting}
      />
    </div>
  );
}
