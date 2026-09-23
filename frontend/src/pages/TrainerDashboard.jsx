import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClasses, getBookingsByClass } from '../services/api';
import './TrainerDashboard.css';

function TrainerDashboard() {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
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
    if (user) load();
  }, [user]);

  if (loading) return <div className="trainer-dashboard"><p>Loading...</p></div>;

  return (
    <div className="trainer-dashboard">
      <h1>Welcome, {user.first_name} {user.last_name}</h1>
      <h2>Your Classes</h2>
      {myClasses.length === 0 ? (
        <p>You have no classes assigned yet. Ask an admin to assign you to a class.</p>
      ) : (
        <div className="class-cards">
          {myClasses.map((c) => (
            <div key={c.class_id} className="class-card">
              <h3>{c.class_name}</h3>
              <p>{c.schedule_day} · {c.start_time} - {c.end_time}</p>
              <p className="capacity-line">{c.bookedCount} / {c.capacity} members booked</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrainerDashboard;