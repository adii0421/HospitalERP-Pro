import { useEffect, useState } from "react";
import { inventoryItemApi, inventoryTransactionApi } from "../api/inventoryApi";
import { extractErrorMessage } from "../api/axios";
import DataTable from "../components/common/DataTable";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import FormField from "../components/common/FormField";
import LoadingBlock from "../components/common/LoadingBlock";
import { Icons } from "../components/common/Icons";

const CATEGORY_OPTIONS = [
  { value: "equipment", label: "Equipment" },
  { value: "consumable", label: "Consumable" },
  { value: "surgical", label: "Surgical" },
  { value: "diagnostic", label: "Diagnostic" },
  { value: "office_supply", label: "Office Supply" },
];

const TXN_TYPE_OPTIONS = [
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "adjustment", label: "Adjustment (set exact qty)" },
  { value: "damaged", label: "Damaged / Written Off" },
];

const emptyItem = () => ({
  name: "",
  category: "consumable",
  sku: "",
  unit: "unit",
  unit_cost: 0,
  quantity_in_stock: 0,
  reorder_level: 5,
  supplier: "",
  location: "",
});

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [txnItem, setTxnItem] = useState(null);
  const [txnForm, setTxnForm] = useState({ transaction_type: "stock_in", quantity: 1, reason: "" });
  const [txnError, setTxnError] = useState("");
  const [txnSaving, setTxnSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await inventoryItemApi.list({ limit: 500 });
      setItems(res.data);
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
    setForm(emptyItem());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      sku: item.sku,
      unit: item.unit,
      unit_cost: item.unit_cost,
      quantity_in_stock: item.quantity_in_stock,
      reorder_level: item.reorder_level,
      supplier: item.supplier || "",
      location: item.location || "",
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
        unit_cost: Number(form.unit_cost),
        quantity_in_stock: Number(form.quantity_in_stock),
        reorder_level: Number(form.reorder_level),
      };
      if (editing) {
        await inventoryItemApi.update(editing.id, payload);
      } else {
        await inventoryItemApi.create(payload);
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
      await inventoryItemApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openTxn = (item) => {
    setTxnItem(item);
    setTxnForm({ transaction_type: "stock_in", quantity: 1, reason: "" });
    setTxnError("");
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    setTxnSaving(true);
    setTxnError("");
    try {
      await inventoryTransactionApi.create({
        item_id: txnItem.id,
        transaction_type: txnForm.transaction_type,
        quantity: Number(txnForm.quantity),
        reason: txnForm.reason,
      });
      setTxnItem(null);
      await load();
    } catch (e) {
      setTxnError(extractErrorMessage(e));
    } finally {
      setTxnSaving(false);
    }
  };

  const columns = [
    { key: "name", header: "Item" },
    { key: "sku", header: "SKU", render: (r) => <span className="mono">{r.sku}</span> },
    { key: "category", header: "Category", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.category.replace("_", " ")}</span> },
    {
      key: "quantity_in_stock",
      header: "Stock",
      render: (r) => (
        <span style={{ color: r.quantity_in_stock <= r.reorder_level ? "var(--color-vital)" : "inherit", fontWeight: r.quantity_in_stock <= r.reorder_level ? 700 : 400 }}>
          {r.quantity_in_stock} {r.unit}
        </span>
      ),
    },
    { key: "unit_cost", header: "Unit Cost", render: (r) => <span className="mono">₹{r.unit_cost}</span> },
    { key: "location", header: "Location", render: (r) => r.location || "—" },
  ];

  if (loading) return <LoadingBlock label="Loading inventory…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="section-header">
        <div>
          <div className="section-title">Inventory</div>
          <div className="section-sub">{items.length} items tracked</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icons.Plus />
          Add Item
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        searchKeys={["name", "sku", "category"]}
        searchPlaceholder="Search inventory…"
        emptyMessage="No inventory items tracked yet."
        actions={(row) => (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => openTxn(row)}>
              Stock
            </button>
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
        title={editing ? "Edit Inventory Item" : "Add Inventory Item"}
        onClose={() => setModalOpen(false)}
        width="620px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Item"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert-banner danger">{formError}</div>}
          <div className="form-row">
            <FormField label="Item Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormField label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div className="form-row">
            <FormField
              label="Category"
              as="select"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <FormField label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="form-row">
            <FormField
              label="Unit Cost (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.unit_cost}
              onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
            />
            <FormField
              label={editing ? "Current Stock (read-only via ledger)" : "Initial Stock"}
              type="number"
              min="0"
              value={form.quantity_in_stock}
              onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
              disabled={!!editing}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Reorder Level"
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
            />
            <FormField label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <FormField label="Storage Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          {editing && <div className="form-hint">To change stock quantity, use the "Stock" action from the table instead.</div>}
        </form>
      </Modal>

      <Modal
        open={!!txnItem}
        title={txnItem ? `Stock Transaction — ${txnItem.name}` : ""}
        onClose={() => setTxnItem(null)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setTxnItem(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleTxnSubmit} disabled={txnSaving}>
              {txnSaving ? "Saving…" : "Apply Transaction"}
            </button>
          </>
        }
      >
        <form onSubmit={handleTxnSubmit}>
          {txnError && <div className="alert-banner danger">{txnError}</div>}
          <div className="form-hint" style={{ marginBottom: 12 }}>
            Current stock: <strong>{txnItem?.quantity_in_stock} {txnItem?.unit}</strong>
          </div>
          <FormField
            label="Transaction Type"
            as="select"
            options={TXN_TYPE_OPTIONS}
            value={txnForm.transaction_type}
            onChange={(e) => setTxnForm({ ...txnForm, transaction_type: e.target.value })}
          />
          <FormField
            label="Quantity"
            type="number"
            min="1"
            required
            value={txnForm.quantity}
            onChange={(e) => setTxnForm({ ...txnForm, quantity: e.target.value })}
          />
          <FormField label="Reason / Notes" as="textarea" value={txnForm.reason} onChange={(e) => setTxnForm({ ...txnForm, reason: e.target.value })} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`This will remove ${deleteTarget?.name} from inventory.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
