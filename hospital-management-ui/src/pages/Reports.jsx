import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { reportsApi } from "../api/reportsApi";
import { extractErrorMessage } from "../api/axios";
import LoadingBlock from "../components/common/LoadingBlock";
import { Icons } from "../components/common/Icons";

const COLORS = ["#0c6e6e", "#2f9e6e", "#d69a1f", "#2f6f9e", "#e4572e", "#8a5fd6"];

function currency(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function Reports() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    reportsApi
      .overview()
      .then((res) => {
        if (mounted) setOverview(res.data);
      })
      .catch((e) => {
        if (mounted) setError(extractErrorMessage(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingBlock label="Loading reports…" />;
  if (error)
    return (
      <div className="alert-banner danger">
        <Icons.Alert />
        {error}
      </div>
    );

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Reports & Analytics</div>
          <div className="section-sub">A closer look at revenue, appointments, and departmental load</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="chart-card-header">
          <div>
            <div className="section-title">Revenue — 6 Month Trend</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={overview.revenue_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} width={55} />
            <Tooltip formatter={(v) => currency(v)} contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
            <Line type="monotone" dataKey="revenue" stroke="#0c6e6e" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="chart-card-header">
            <div className="section-title">Department Load</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overview.department_load}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e6" vertical={false} />
              <XAxis
                dataKey="department_name"
                tick={{ fontSize: 11, fill: "#8a9797" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fill: "#8a9797" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="doctor_count" name="Doctors" fill="#2f6f9e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="appointment_count" name="Appointments" fill="#0c6e6e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <div className="chart-card-header">
            <div className="section-title">Appointment Status Mix</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={overview.appointment_status_breakdown.filter((d) => d.count > 0)}
                dataKey="count"
                nameKey="status"
                outerRadius={95}
                label={(entry) => entry.status}
                labelLine={false}
              >
                {overview.appointment_status_breakdown.map((entry, idx) => (
                  <Cell key={entry.status} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="chart-card-header">
          <div className="section-title">Top Doctors by Appointment Volume</div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Appointments</th>
              </tr>
            </thead>
            <tbody>
              {overview.top_doctors_by_appointments.map((d, idx) => (
                <tr key={idx}>
                  <td>{d.doctor_name}</td>
                  <td className="mono">{d.appointment_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
