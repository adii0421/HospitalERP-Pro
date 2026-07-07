import { useEffect, useState } from "react";
import { billingApi } from "../api/billingApi";
import { patientApi } from "../api/patientApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import Badge from "../components/common/Badge";
import { Icons } from "../components/common/Icons";

function currency(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

const emptyItem = () => ({ description: "", category: "consultation", quantity: 1, unit_price: 0 });

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ patient_id: "", due_date: "", tax_amount: 0, discount_amount: 0, notes: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [detailInvoice, setDetailInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentError, setPaymentError] = useState("");
  const [payingLoading, setPayingLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, patRes] = await Promise.all([
        billingApi.list({ limit: 500 }),
        patientApi.list({ limit: 500 }),
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data);
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

  const openCreate = () => {
    setCreateForm({ patient_id: "", due_date: "", tax_amount: 0, discount_amount: 0, notes: "" });
    setItems([emptyItem()]);
    setFormError("");
    setCreateOpen(true);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const addItemRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const itemsSubtotal = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        patient_id: Number(createForm.patient_id),
        due_date: createForm.due_date ? new Date(createForm.due_date).toISOString() : null,
        tax_amount: Number(createForm.tax_amount || 0),
        discount_amount: Number(createForm.discount_amount || 0),
        notes: createForm.notes,
        status: "pending",
        items: items
          .filter((it) => it.description.trim())
          .map((it) => ({
            description: it.description,
            category: it.category,
            quantity: Number(it.quantity),
            unit_price: Number(it.unit_price),
          })),
      };
      if (payload.items.length === 0) {
        setFormError("Add at least one line item.");
        setSaving(false);
        return;
      }
      await billingApi.create(payload);
      setCreateOpen(false);
      await load();
    } catch (e) {
      setFormError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (invoice) => {
    setDetailInvoice(invoice);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentError("");
  };

  const handleAddPayment = async () => {
    setPayingLoading(true);
    setPaymentError("");
    try {
      const res = await billingApi.addPayment(detailInvoice.id, {
        amount: Number(paymentAmount),
        method: paymentMethod,
      });
      setDetailInvoice(res.data);
      setPaymentAmount("");
      await load();
    } catch (e) {
      setPaymentError(extractErrorMessage(e));
    } finally {
      setPayingLoading(false);
    }
  };

  const columns = [
    { key: "invoice_number", header: "Invoice #", render: (r) => <span className="mono">{r.invoice_number}</span> },
    { key: "patient_name", header: "Patient" },
    {
      key: "issue_date",
      header: "Issued",
      render: (r) => new Date(r.issue_date).toLocaleDateString("en-IN", { dateStyle: "medium" }),
    },
    { key: "total_amount", header: "Total", render: (r) => currency(r.total_amount) },
    { key: "balance_due", header: "Balance Due", render: (r) => currency(r.balance_due) },
    { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
  ];

  if (loading) return <LoadingBlock label="Loading invoices…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="section-header">
        <div>
          <div className="section-title">Billing & Invoices</div>
          <div className="section-sub">{invoices.length} invoices</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icons.Plus />
          Create Invoice
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={invoices}
        searchKeys={["invoice_number", "patient_name"]}
        searchPlaceholder="Search by invoice # or patient…"
        emptyMessage="No invoices created yet."
        onRowClick={openDetail}
        actions={(row) => (
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetail(row)} title="View">
            <Icons.Eye />
          </button>
        )}
      />

      {/* Create Invoice Modal */}
      <Modal
        open={createOpen}
        title="Create Invoice"
        onClose={() => setCreateOpen(false)}
        width="720px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubmit} disabled={saving}>
              {saving ? "Creating…" : "Create Invoice"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          {formError && <div className="alert-banner danger">{formError}</div>}
          <div className="form-row">
            <FormField
              label="Patient"
              as="select"
              required
              options={patientOptions}
              value={createForm.patient_id}
              onChange={(e) => setCreateForm({ ...createForm, patient_id: e.target.value })}
            />
            <FormField
              label="Due Date"
              type="date"
              value={createForm.due_date}
              onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Line Items</label>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                  gap: 8,
                  marginBottom: 8,
                  alignItems: "center",
                }}
              >
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                />
                <input
                  placeholder="Category"
                  value={item.category}
                  onChange={(e) => updateItem(idx, "category", e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit Price"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => removeItemRow(idx)}
                  disabled={items.length === 1}
                  style={{ color: "var(--color-vital)" }}
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
              <Icons.Plus />
              Add Line Item
            </button>
          </div>

          <div className="form-row">
            <FormField
              label="Tax Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={createForm.tax_amount}
              onChange={(e) => setCreateForm({ ...createForm, tax_amount: e.target.value })}
            />
            <FormField
              label="Discount Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={createForm.discount_amount}
              onChange={(e) => setCreateForm({ ...createForm, discount_amount: e.target.value })}
            />
          </div>
          <FormField
            label="Notes"
            as="textarea"
            value={createForm.notes}
            onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
          />

          <div
            style={{
              background: "var(--color-surface-sunken)",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13.5,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <span>Subtotal</span>
            <span className="mono">{currency(itemsSubtotal)}</span>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        open={!!detailInvoice}
        title={detailInvoice ? `Invoice ${detailInvoice.invoice_number}` : ""}
        onClose={() => setDetailInvoice(null)}
        width="600px"
      >
        {detailInvoice && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{detailInvoice.patient_name}</div>
                <div className="section-sub">
                  Issued {new Date(detailInvoice.issue_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </div>
              </div>
              <Badge value={detailInvoice.status} />
            </div>

            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailInvoice.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.description}</td>
                      <td>{it.quantity}</td>
                      <td className="mono">{currency(it.unit_price)}</td>
                      <td className="mono">{currency(it.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span className="mono">{currency(detailInvoice.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax</span>
                <span className="mono">{currency(detailInvoice.tax_amount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Discount</span>
                <span className="mono">-{currency(detailInvoice.discount_amount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
                <span>Total</span>
                <span className="mono">{currency(detailInvoice.total_amount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success)" }}>
                <span>Paid</span>
                <span className="mono">{currency(detailInvoice.amount_paid)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "var(--color-vital)" }}>
                <span>Balance Due</span>
                <span className="mono">{currency(detailInvoice.balance_due)}</span>
              </div>
            </div>

            {detailInvoice.payments.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="section-sub" style={{ marginBottom: 8, fontWeight: 700 }}>Payment History</div>
                {detailInvoice.payments.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ textTransform: "capitalize" }}>{p.method}</span>
                    <span className="mono">{currency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {detailInvoice.balance_due > 0 && (
              <div className="card card-pad" style={{ background: "var(--color-brand-light)", border: "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Record Payment</div>
                {paymentError && <div className="alert-banner danger" style={{ marginBottom: 10 }}>{paymentError}</div>}
                <div className="form-row" style={{ marginBottom: 10 }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="insurance">Insurance</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAddPayment}
                  disabled={payingLoading || !paymentAmount}
                  style={{ width: "100%" }}
                >
                  {payingLoading ? "Recording…" : "Record Payment"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
