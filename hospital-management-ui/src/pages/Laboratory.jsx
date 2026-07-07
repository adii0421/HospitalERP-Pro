import { useEffect, useState } from "react";
import { labTestApi, labOrderApi } from "../api/laboratoryApi";
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

const emptyTest = () => ({ name: "", category: "general", sample_type: "blood", price: 0, turnaround_hours: 24, normal_range: "" });

const STATUS_OPTIONS = [
  { value: "ordered", label: "Ordered" },
  { value: "sample_collected", label: "Sample Collected" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Laboratory() {
  const [tab, setTab] = useState("orders");

  const [tests, setTests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Test catalog modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState(emptyTest());
  const [testFormError, setTestFormError] = useState("");
  const [testSaving, setTestSaving] = useState(false);
  const [testDeleteTarget, setTestDeleteTarget] = useState(null);
  const [testDeleting, setTestDeleting] = useState(false);

  // Order modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ patient_id: "", doctor_id: "", lab_test_id: "" });
  const [orderFormError, setOrderFormError] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);

  // Result modal
  const [resultOrder, setResultOrder] = useState(null);
  const [resultForm, setResultForm] = useState({ status: "completed", result: "", result_notes: "" });
  const [resultSaving, setResultSaving] = useState(false);
  const [resultError, setResultError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [testRes, orderRes, patRes, docRes] = await Promise.all([
        labTestApi.list({ limit: 500 }),
        labOrderApi.list({ limit: 500 }),
        patientApi.list({ limit: 500 }),
        doctorApi.list({ limit: 500 }),
      ]);
      setTests(testRes.data);
      setOrders(orderRes.data);
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

  const testOptions = tests.map((t) => ({ value: t.id, label: `${t.name} (₹${t.price})` }));
  const patientOptions = patients.map((p) => ({ value: p.id, label: `${p.full_name} (${p.patient_code})` }));
  const doctorOptions = doctors.map((d) => ({ value: d.id, label: d.full_name }));

  // ---- Test catalog handlers ----
  const openCreateTest = () => {
    setEditingTest(null);
    setTestForm(emptyTest());
    setTestFormError("");
    setTestModalOpen(true);
  };
  const openEditTest = (test) => {
    setEditingTest(test);
    setTestForm({
      name: test.name,
      category: test.category,
      sample_type: test.sample_type,
      price: test.price,
      turnaround_hours: test.turnaround_hours,
      normal_range: test.normal_range || "",
    });
    setTestFormError("");
    setTestModalOpen(true);
  };
  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setTestSaving(true);
    setTestFormError("");
    try {
      const payload = { ...testForm, price: Number(testForm.price), turnaround_hours: Number(testForm.turnaround_hours) };
      if (editingTest) {
        await labTestApi.update(editingTest.id, payload);
      } else {
        await labTestApi.create(payload);
      }
      setTestModalOpen(false);
      await load();
    } catch (e) {
      setTestFormError(extractErrorMessage(e));
    } finally {
      setTestSaving(false);
    }
  };
  const handleTestDelete = async () => {
    setTestDeleting(true);
    try {
      await labTestApi.remove(testDeleteTarget.id);
      setTestDeleteTarget(null);
      await load();
    } catch (e) {
      setError(extractErrorMessage(e));
      setTestDeleteTarget(null);
    } finally {
      setTestDeleting(false);
    }
  };

  // ---- Order handlers ----
  const openCreateOrder = () => {
    setOrderForm({ patient_id: "", doctor_id: "", lab_test_id: "" });
    setOrderFormError("");
    setOrderModalOpen(true);
  };
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderSaving(true);
    setOrderFormError("");
    try {
      const payload = {
        patient_id: Number(orderForm.patient_id),
        doctor_id: Number(orderForm.doctor_id),
        lab_test_id: Number(orderForm.lab_test_id),
        status: "ordered",
      };
      await labOrderApi.create(payload);
      setOrderModalOpen(false);
      await load();
    } catch (e) {
      setOrderFormError(extractErrorMessage(e));
    } finally {
      setOrderSaving(false);
    }
  };

  const openResult = (order) => {
    setResultOrder(order);
    setResultForm({ status: order.status === "ordered" ? "sample_collected" : "completed", result: order.result || "", result_notes: order.result_notes || "" });
    setResultError("");
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setResultSaving(true);
    setResultError("");
    try {
      await labOrderApi.update(resultOrder.id, resultForm);
      setResultOrder(null);
      await load();
    } catch (e) {
      setResultError(extractErrorMessage(e));
    } finally {
      setResultSaving(false);
    }
  };

  const testColumns = [
    { key: "name", header: "Test Name" },
    { key: "category", header: "Category", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.category}</span> },
    { key: "sample_type", header: "Sample" },
    { key: "price", header: "Price", render: (r) => <span className="mono">₹{r.price}</span> },
    { key: "turnaround_hours", header: "Turnaround", render: (r) => `${r.turnaround_hours}h` },
  ];

  const orderColumns = [
    {
      key: "ordered_at",
      header: "Ordered",
      render: (r) => new Date(r.ordered_at).toLocaleDateString("en-IN", { dateStyle: "medium" }),
    },
    { key: "patient_name", header: "Patient" },
    { key: "test_name", header: "Test" },
    { key: "doctor_name", header: "Ordering Doctor" },
    { key: "status", header: "Status", render: (r) => <Badge value={r.status} /> },
  ];

  if (loading) return <LoadingBlock label="Loading laboratory data…" />;

  return (
    <div>
      {error && <div className="alert-banner danger"><Icons.Alert />{error}</div>}

      <div className="tabs">
        <button className={`tab-btn ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>
          Test Orders
        </button>
        <button className={`tab-btn ${tab === "catalog" ? "active" : ""}`} onClick={() => setTab("catalog")}>
          Test Catalog
        </button>
      </div>

      {tab === "orders" ? (
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Lab Test Orders</div>
              <div className="section-sub">{orders.length} orders</div>
            </div>
            <button className="btn btn-primary" onClick={openCreateOrder}>
              <Icons.Plus />
              Order Test
            </button>
          </div>
          <DataTable
            columns={orderColumns}
            rows={orders}
            searchKeys={["patient_name", "test_name", "doctor_name"]}
            searchPlaceholder="Search orders…"
            emptyMessage="No lab tests ordered yet."
            actions={(row) => (
              <button className="btn btn-secondary btn-sm" onClick={() => openResult(row)}>
                Update
              </button>
            )}
          />
        </div>
      ) : (
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Test Catalog</div>
              <div className="section-sub">{tests.length} tests available</div>
            </div>
            <button className="btn btn-primary" onClick={openCreateTest}>
              <Icons.Plus />
              Add Test
            </button>
          </div>
          <DataTable
            columns={testColumns}
            rows={tests}
            searchKeys={["name", "category"]}
            searchPlaceholder="Search tests…"
            emptyMessage="No tests in catalog yet."
            actions={(row) => (
              <>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditTest(row)} title="Edit">
                  <Icons.Edit />
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setTestDeleteTarget(row)}
                  title="Delete"
                  style={{ color: "var(--color-vital)" }}
                >
                  <Icons.Trash />
                </button>
              </>
            )}
          />
        </div>
      )}

      {/* Test catalog modal */}
      <Modal
        open={testModalOpen}
        title={editingTest ? "Edit Test" : "Add Test"}
        onClose={() => setTestModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setTestModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleTestSubmit} disabled={testSaving}>
              {testSaving ? "Saving…" : editingTest ? "Save Changes" : "Add Test"}
            </button>
          </>
        }
      >
        <form onSubmit={handleTestSubmit}>
          {testFormError && <div className="alert-banner danger">{testFormError}</div>}
          <FormField label="Test Name" required value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} />
          <div className="form-row">
            <FormField label="Category" value={testForm.category} onChange={(e) => setTestForm({ ...testForm, category: e.target.value })} />
            <FormField label="Sample Type" value={testForm.sample_type} onChange={(e) => setTestForm({ ...testForm, sample_type: e.target.value })} />
          </div>
          <div className="form-row">
            <FormField
              label="Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={testForm.price}
              onChange={(e) => setTestForm({ ...testForm, price: e.target.value })}
            />
            <FormField
              label="Turnaround (hours)"
              type="number"
              min="1"
              value={testForm.turnaround_hours}
              onChange={(e) => setTestForm({ ...testForm, turnaround_hours: e.target.value })}
            />
          </div>
          <FormField label="Normal Range" value={testForm.normal_range} onChange={(e) => setTestForm({ ...testForm, normal_range: e.target.value })} />
        </form>
      </Modal>

      {/* Order modal */}
      <Modal
        open={orderModalOpen}
        title="Order Lab Test"
        onClose={() => setOrderModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOrderModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleOrderSubmit} disabled={orderSaving}>
              {orderSaving ? "Ordering…" : "Order Test"}
            </button>
          </>
        }
      >
        <form onSubmit={handleOrderSubmit}>
          {orderFormError && <div className="alert-banner danger">{orderFormError}</div>}
          <FormField
            label="Patient"
            as="select"
            required
            options={patientOptions}
            value={orderForm.patient_id}
            onChange={(e) => setOrderForm({ ...orderForm, patient_id: e.target.value })}
          />
          <FormField
            label="Ordering Doctor"
            as="select"
            required
            options={doctorOptions}
            value={orderForm.doctor_id}
            onChange={(e) => setOrderForm({ ...orderForm, doctor_id: e.target.value })}
          />
          <FormField
            label="Test"
            as="select"
            required
            options={testOptions}
            value={orderForm.lab_test_id}
            onChange={(e) => setOrderForm({ ...orderForm, lab_test_id: e.target.value })}
          />
        </form>
      </Modal>

      {/* Result / status update modal */}
      <Modal
        open={!!resultOrder}
        title="Update Test Order"
        onClose={() => setResultOrder(null)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResultOrder(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleResultSubmit} disabled={resultSaving}>
              {resultSaving ? "Saving…" : "Save Update"}
            </button>
          </>
        }
      >
        <form onSubmit={handleResultSubmit}>
          {resultError && <div className="alert-banner danger">{resultError}</div>}
          <FormField
            label="Status"
            as="select"
            options={STATUS_OPTIONS}
            value={resultForm.status}
            onChange={(e) => setResultForm({ ...resultForm, status: e.target.value })}
          />
          <FormField
            label="Result"
            as="textarea"
            value={resultForm.result}
            onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })}
          />
          <FormField
            label="Result Notes"
            as="textarea"
            value={resultForm.result_notes}
            onChange={(e) => setResultForm({ ...resultForm, result_notes: e.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!testDeleteTarget}
        message={`This will remove ${testDeleteTarget?.name} from the test catalog.`}
        onCancel={() => setTestDeleteTarget(null)}
        onConfirm={handleTestDelete}
        loading={testDeleting}
      />
    </div>
  );
}
