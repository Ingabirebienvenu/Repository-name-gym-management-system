import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClasses, getBookingsByClass, getTrainer } from '../services/api';
import TrainerProfileForm from '../components/trainers/TrainerProfileForm';
import './TrainerDashboard.css';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TrainerDashboard() {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [classesRes, profileRes] = await Promise.all([
        getClasses(),
        getTrainer(user.id),
      ]);
      const filtered = classesRes.data.filter((c) => c.trainer_id === user.id);
      const withCounts = await Promise.all(
        filtered.map(async (c) => {
          const bRes = await getBookingsByClass(c.class_id);
          return { ...c, bookedCount: bRes.data.length };
        })
      );
      setMyClasses(withCounts);
      setProfile(profileRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  function handleProfileSaved(updated) {
    setProfile(updated);
    setEditingProfile(false);
  }

  function initials(first, last) {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  }

  if (loading) return <div className="trainer-dashboard"><p className="loading-text">Loading your dashboard...</p></div>;

  const totalStudents = myClasses.reduce((sum, c) => sum + c.bookedCount, 0);
  const totalCapacity = myClasses.reduce((sum, c) => sum + Number(c.capacity || 0), 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const todayName = WEEK_DAYS[(new Date().getDay() + 6) % 7];
  const classesByDay = WEEK_DAYS.reduce((acc, day) => {
    acc[day] = myClasses.filter((c) => c.schedule_day === day);
    return acc;
  }, {});

  return (
    <div className="trainer-dashboard">
      <div className="trainer-hero">
        <div className="trainer-avatar">{initials(user.first_name, user.last_name)}</div>
        <div className="trainer-hero-text">
          <p className="trainer-hero-eyebrow">Trainer Dashboard</p>
          <h1>Welcome back, {user.first_name}</h1>
          <p className="trainer-hero-sub">
            {myClasses.length === 0
              ? "You don't have any classes assigned yet."
              : `You're leading ${myClasses.length} class${myClasses.length > 1 ? 'es' : ''} with ${totalStudents} student${totalStudents !== 1 ? 's' : ''} booked in.`}
          </p>
        </div>
        <button className="btn-edit-profile" onClick={() => setEditingProfile(true)}>
          Edit Profile
        </button>
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

      <div className="home-columns">
        <div className="side-card">
          <h3 className="side-card-title">Your Profile</h3>
          <div className="profile-row"><span>Email</span><strong>{profile?.email || '—'}</strong></div>
          <div className="profile-row"><span>Phone</span><strong>{profile?.phone || '—'}</strong></div>
          <div className="profile-row"><span>Specialization</span><strong>{profile?.specialization || '—'}</strong></div>
          <div className="profile-row"><span>Joined</span><strong>{profile?.hire_date || '—'}</strong></div>
        </div>

        <div className="side-card">
          <h3 className="side-card-title">Weekly Schedule</h3>
          <ul className="week-list">
            {WEEK_DAYS.map((day) => (
              <li key={day} className={day === todayName ? 'week-row-today' : ''}>
                <span className="week-day">{day}{day === todayName ? ' (Today)' : ''}</span>
                {classesByDay[day].length === 0 ? (
                  <span className="week-empty">—</span>
                ) : (
                  <span className="week-classes">
                    {classesByDay[day].map((c) => c.class_name).join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {editingProfile && profile && (
        <TrainerProfileForm
          trainer={profile}
          onClose={() => setEditingProfile(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}

export default TrainerDashboard;