import { useEffect, useState } from 'react';
import { getMembers, getTrainers, getClasses, getPayments } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    members: 0,
    trainers: 0,
    classes: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [membersRes, trainersRes, classesRes, paymentsRes] = await Promise.all([
          getMembers(),
          getTrainers(),
          getClasses(),
          getPayments(),
        ]);

        const totalRevenue = paymentsRes.data.reduce(
          (sum, p) => sum + Number(p.amount || 0),
          0
        );

        setStats({
          members: membersRes.data.length,
          trainers: trainersRes.data.length,
          classes: classesRes.data.length,
          totalRevenue,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
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
    </div>
  );
}

export default Dashboard;