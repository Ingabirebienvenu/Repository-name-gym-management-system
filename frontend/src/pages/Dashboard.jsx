import { useEffect, useState } from 'react';
import {
  getMembers, getTrainers, getClasses, getPayments, getDashboardStats
} from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function Dashboard() {
  const [stats, setStats] = useState({ members: 0, trainers: 0, classes: 0, totalRevenue: 0 });
  const [chartData, setChartData] = useState({
    revenue_by_month: [],
    members_by_type: [],
    payments_by_method: [],
    attendance_last_7_days: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [membersRes, trainersRes, classesRes, paymentsRes, statsRes] = await Promise.all([
          getMembers(),
          getTrainers(),
          getClasses(),
          getPayments(),
          getDashboardStats(),
        ]);

        const totalRevenue = paymentsRes.data
          .filter((p) => p.status === 'Paid')
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        setStats({
          members: membersRes.data.length,
          trainers: trainersRes.data.length,
          classes: classesRes.data.length,
          totalRevenue,
        });

        setChartData(statsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) return <div className="dashboard"><p>Loading...</p></div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Members</h3>
          <p>{stats.members}</p>
        </div>
        <div className="stat-card">
          <h3>Trainers</h3>
          <p>{stats.trainers}</p>
        </div>
        <div className="stat-card">
          <h3>Classes</h3>
          <p>{stats.classes}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>{stats.totalRevenue.toLocaleString()} RWF</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenue Trend (Last 6 Months)</h3>
          {chartData.revenue_by_month.length === 0 ? (
            <p className="chart-empty">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData.revenue_by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} RWF`} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Check-ins (Last 7 Days)</h3>
          {chartData.attendance_last_7_days.length === 0 ? (
            <p className="chart-empty">No attendance data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData.attendance_last_7_days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Members by Type</h3>
          {chartData.members_by_type.length === 0 ? (
            <p className="chart-empty">No members yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData.members_by_type}
                  dataKey="count"
                  nameKey="membership_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.membership_type}: ${entry.count}`}
                >
                  {chartData.members_by_type.map((entry, index) => (
                    <Cell key={entry.membership_type} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Revenue by Payment Method</h3>
          {chartData.payments_by_method.length === 0 ? (
            <p className="chart-empty">No payments yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData.payments_by_method} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="payment_method" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} RWF`} />
                <Bar dataKey="total" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;