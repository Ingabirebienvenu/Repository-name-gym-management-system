import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClasses, getBookingsByClass } from '../services/api';
import RosterModal from '../components/trainers/RosterModal';
import './TrainerDashboard.css';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TrainerClasses() {
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

  const todayName = WEEK_DAYS[(new Date().getDay() + 6) % 7];

  if (loading) return <div className="trainer-dashboard"><p className="loading-text">Loading your classes...</p></div>;

  return (
    <div className="trainer-dashboard">
      <div className="section-heading"><h1 className="page-title">Your Classes</h1></div>
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
                  <span className={`day-badge ${c.schedule_day === todayName ? 'day-badge-today' : ''}`}>
                    {c.schedule_day === todayName ? 'Today' : c.schedule_day}
                  </span>
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

export default TrainerClasses;