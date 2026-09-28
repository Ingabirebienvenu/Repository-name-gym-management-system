import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClasses, getBookingsByClass } from '../services/api';
import RosterModal from '../components/trainers/RosterModal';
import './TrainerDashboard.css';

function TrainerDashboard() {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingRosterFor, setViewingRosterFor] = useState(null);

  async function loadClasses() {
    try {
      setLoading(true);
      const res = await getClasses();
      const filtered = res.data.filter((c) => c.trainer_id === user.id);
      const withCounts = await Promise.all(
        filtered.map(async (c) => {
          const bRes = await getBookingsByClass(c.class_id);
          return { ...c, bookedCount: bRes.data.length };
        })
      );
      setMyClasses(withCounts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadClasses();
  }, [user]);

  function handleRosterClose() {
    setViewingRosterFor(null);
    loadClasses();
  }

  function initials(first, last) {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  }

  if (loading) return <div className="trainer-dashboard"><p className="loading-text">Loading your dashboard...</p></div>;

  const totalStudents = myClasses.reduce((sum, c) => sum + c.bookedCount, 0);
  const totalCapacity = myClasses.reduce((sum, c) => sum + Number(c.capacity || 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return (
    <div className="trainer-dashboard">
      <div className="trainer-hero">
        <div className="trainer-avatar">{initials(user.first_name, user.last_name)}</div>
        <div>
          <p className="trainer-hero-eyebrow">Trainer Dashboard</p>
          <h1>Welcome back, {user.first_name}</h1>
          <p className="trainer-hero-sub">
            {myClasses.length === 0
              ? "You don't have any classes assigned yet."
              : `You're leading ${myClasses.length} class${myClasses.length > 1 ? 'es' : ''} with ${totalStudents} student${totalStudents !== 1 ? 's' : ''} booked in.`}
          </p>
        </div>
      </div>

      <div className="trainer-stats-grid">
        <div className="trainer-stat-card">
          <div className="stat-icon icon-blue">📅</div>
          <div>
            <h3>Your Classes</h3>
            <p>{myClasses.length}</p>
          </div>
        </div>
        <div className="trainer-stat-card">
          <div className="stat-icon icon-green">🧑‍🤝‍🧑</div>
          <div>
            <h3>Students Booked</h3>
            <p>{totalStudents}</p>
          </div>
        </div>
        <div className="trainer-stat-card">
          <div className="stat-icon icon-amber">📊</div>
          <div>
            <h3>Average Fill Rate</h3>
            <p>{fillRate}%</p>
          </div>
        </div>
      </div>

      <div className="section-heading">
        <h2>Your Classes</h2>
      </div>

      {myClasses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗓️</div>
          <h3>No classes assigned yet</h3>
          <p>Once an admin assigns you to a class, it will show up here with your student roster.</p>
        </div>
      ) : (
        <div className="class-cards">
          {myClasses.map((c) => {
            const pct = c.capacity ? Math.min(Math.round((c.bookedCount / c.capacity) * 100), 100) : 0;
            return (
              <div key={c.class_id} className="class-card">
                <div className="class-card-top">
                  <h3>{c.class_name}</h3>
                  <span className="day-badge">{c.schedule_day}</span>
                </div>
                <p className="class-time">🕒 {c.start_time} – {c.end_time}</p>

                <div className="capacity-block">
                  <div className="capacity-labels">
                    <span>{c.bookedCount} / {c.capacity} booked</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="capacity-bar">
                    <div className="capacity-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <button className="btn-primary" onClick={() => setViewingRosterFor(c)}>
                  View Roster
                </button>
              </div>
            );
          })}
        </div>
      )}

      {viewingRosterFor && (
        <RosterModal classItem={viewingRosterFor} onClose={handleRosterClose} />
      )}
    </div>
  );
}

export default TrainerDashboard;