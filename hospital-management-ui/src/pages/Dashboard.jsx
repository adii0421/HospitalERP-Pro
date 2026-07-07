import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportsApi } from "../api/reportsApi";
import { extractErrorMessage } from "../api/axios";
import StatCard from "../components/common/StatCard";
import LoadingBlock from "../components/common/LoadingBlock";
import PulseDivider from "../components/common/PulseDivider";
import { Icons } from "../components/common/Icons";

const PIE_COLORS = ["#0c6e6e", "#2f9e6e", "#d69a1f", "#2f6f9e", "#e4572e", "#8a5fd6"];

function currency(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [summaryRes, overviewRes] = await Promise.all([
          reportsApi.dashboardSummary(),
          reportsApi.overview(),
        ]);
        if (!mounted) return;
        setSummary(summaryRes.data);
        setOverview(overviewRes.data);
      } catch (e) {
        if (mounted) setError(extractErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingBlock label="Loading dashboard…" />;
  if (error) return <div className="alert-banner danger"><Icons.Alert />{error}</div>;

  const lowStockTotal = (summary.low_stock_medicines || 0) + (summary.low_stock_inventory || 0);

  return (
    <div>
      <PulseDivider className="pulse-divider" style={{ marginBottom: 18 }} />

      {(lowStockTotal > 0 || summary.pending_lab_tests > 0) && (
        <div className="alert-banner warning">
          <Icons.Alert />
          {lowStockTotal > 0 &&
            `${lowStockTotal} item${lowStockTotal > 1 ? "s" : ""} running low on stock. `}
          {summary.pending_lab_tests > 0 &&
            `${summary.pending_lab_tests} lab test${summary.pending_lab_tests > 1 ? "s" : ""} pending.`}
        </div>
      )}

      <div className="stat-grid">
        <StatCard
          icon={<Icons.Patients />}
          label="Total Patients"
          value={summary.total_patients.toLocaleString()}
        />
        <StatCard
          icon={<Icons.Doctors />}
          label="Total Doctors"
          value={summary.total_doctors.toLocaleString()}
        />
        <StatCard
          icon={<Icons.Appointments />}
          label="Appointments Today"
          value={summary.appointments_today.toLocaleString()}
          trend={`${summary.appointments_this_week} this week`}
        />
        <StatCard
          icon={<Icons.Money />}
          label="Revenue This Month"
          value={currency(summary.revenue_this_month)}
          trend={currency(summary.revenue_today) + " today"}
        />
        <StatCard
          icon={<Icons.Billing />}
          label="Pending Invoices"
          value={summary.pending_invoices.toLocaleString()}
        />
        <StatCard
          icon={<Icons.Departments />}
          label="Departments"
          value={summary.total_departments.toLocaleString()}
        />
        <StatCard icon={<Icons.Staff />} label="Staff Members" value={summary.total_staff.toLocaleString()} />
        <StatCard
          icon={<Icons.Beaker />}
          label="Pending Lab Tests"
          value={summary.pending_lab_tests.toLocaleString()}
        />
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="chart-card-header">
            <div>
              <div className="section-title">Revenue Trend</div>
              <div className="section-sub">Collected payments over the last 6 months</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={overview.revenue_trend}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0c6e6e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0c6e6e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0c6e6e" strokeWidth={2.5} fill="url(#revGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <div className="chart-card-header">
            <div>
              <div className="section-title">Appointment Status</div>
              <div className="section-sub">All-time breakdown</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={overview.appointment_status_breakdown.filter((d) => d.count > 0)}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {overview.appointment_status_breakdown.map((entry, idx) => (
                  <Cell key={entry.status} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, textTransform: "capitalize" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="card card-pad">
          <div className="chart-card-header">
            <div>
              <div className="section-title">Appointments — Last 7 Days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={overview.appointment_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
              <Bar dataKey="count" fill="#0c6e6e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <div className="chart-card-header">
            <div>
              <div className="section-title">Department Load</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={overview.department_load} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="department_name"
                tick={{ fontSize: 11.5, fill: "#8a9797" }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
              <Bar dataKey="appointment_count" fill="#2f9e6e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
