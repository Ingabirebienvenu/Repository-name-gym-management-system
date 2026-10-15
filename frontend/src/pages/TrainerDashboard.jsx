import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getTrainer } from '../services/api';
import { getTrainerStats } from '../services/trainerApi';
import TrainerProfileForm from '../components/trainers/TrainerProfileForm';
import './TrainerDashboard.css';
import './TrainerStats.css';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Chart colors (validated categorical slots 1 and 2) and ink tokens
const BLUE = '#2a78d6';
const ORANGE = '#eb6834';
const INK_2 = '#52514e';
const GRID = '#e2e8f0';

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  return `${String(h).padStart(2, '0')}:${m}`;
}

function initials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

function Kpi({ icon, tone, label, value, caption, to, children }) {
  const body = (
    <>
      <div className={`ts-kpi-icon ${tone}`}>{icon}</div>
      <div className="ts-kpi-body">
        <span className="ts-kpi-label">{label}</span>
        <strong className="ts-kpi-value">{value}</strong>
        {children}
        {caption && <span className="ts-kpi-caption">{caption}</span>}
      </div>
    </>
  );
  return to
    ? <Link to={to} className="ts-kpi linked">{body}</Link>
    : <div className="ts-kpi">{body}</div>;
}

function TrainerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, pRes] = await Promise.all([getTrainerStats(user.id), getTrainer(user.id)]);
        setStats(sRes.data);
        setProfile(pRes.data);
      } catch (err) {
        console.error(err);
        setError('Could not load your statistics. Is the backend running?');
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  if (loading) return <div className="trainer-dashboard"><p className="loading-text">Loading your dashboard...</p></div>;
  if (error || !stats) return <div className="trainer-dashboard"><p className="ts-error">{error}</p></div>;

  const t = stats.totals;
  const todayName = WEEK_DAYS[(new Date().getDay() + 6) % 7];
  const todaysClasses = stats.classes.filter((c) => c.schedule_day === todayName);
  const classesByDay = WEEK_DAYS.reduce((acc, d) => {
    acc[d] = stats.classes.filter((c) => c.schedule_day === d);
    return acc;
  }, {});
  const hasBookings = stats.bookings_by_day.some((d) => d.bookings > 0);
  const hasWeekly = stats.weekly_activity.some((w) => w.bookings > 0 || w.progress > 0);

  const sortedByFill = [...stats.classes].sort((a, b) => b.fill_pct - a.fill_pct);

  return (
    <div className="trainer-dashboard">
      {/* ---------- Hero ---------- */}
      <div className="trainer-hero">
        <div className="trainer-avatar">{initials(user.first_name, user.last_name)}</div>
        <div className="trainer-hero-text">
          <p className="trainer-hero-eyebrow">Trainer Dashboard</p>
          <h1>Welcome back, {user.first_name}</h1>
          <p className="trainer-hero-sub">
            {t.classes === 0
              ? "You don't have any classes assigned yet."
              : `${t.classes} class${t.classes !== 1 ? 'es' : ''} · ${t.members} member${t.members !== 1 ? 's' : ''} · ${t.unread_messages} unread message${t.unread_messages !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="ts-hero-actions">
          <Link to="/trainer/messages" className="ts-hero-link">Open Messages</Link>
          <button className="btn-edit-profile" onClick={() => setEditingProfile(true)}>Edit Profile</button>
        </div>
      </div>

      {/* ---------- KPI row ---------- */}
      <div className="ts-kpi-grid">
        <Kpi icon="📅" tone="blue" label="Classes" value={t.classes}
             caption={todaysClasses.length ? `${todaysClasses.length} today` : 'None today'} />
        <Kpi icon="🧑‍🤝‍🧑" tone="green" label="Members coached" value={t.members}
             caption={`${t.active_bookings} active booking${t.active_bookings !== 1 ? 's' : ''}`} />
        <Kpi icon="📊" tone="amber" label="Average fill rate" value={`${t.fill_rate}%`}>
          <div className="ts-meter" role="img" aria-label={`Fill rate ${t.fill_rate} percent`}>
            <div className="ts-meter-fill" style={{ width: `${Math.min(t.fill_rate, 100)}%` }} />
          </div>
        </Kpi>
        <Kpi icon="✅" tone="teal" label="Attendance rate" value={`${t.attendance_rate}%`}
             caption="Attended of active bookings" />
        <Kpi icon="💬" tone="violet" label="Unread messages" value={t.unread_messages}
             caption={t.unread_messages ? 'Reply now →' : 'All caught up'} to="/trainer/messages" />
        <Kpi icon="📝" tone="rose" label="Coaching, last 30 days" value={t.progress_30d + t.supplements_30d}
             caption={`${t.progress_30d} progress · ${t.supplements_30d} supplement tips`} />
      </div>

      {/* ---------- Charts ---------- */}
      <div className="ts-row">
        <section className="ts-panel">
          <header className="ts-panel-head">
            <h2>Members booked by day</h2>
            <p>Active bookings across your classes, Monday to Sunday</p>
          </header>
          {!hasBookings ? (
            <p className="ts-empty">No bookings yet. They'll appear here as members book your classes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.bookings_by_day} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: INK_2 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: INK_2 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  labelFormatter={(_, p) => p?.[0]?.payload?.full_day}
                  formatter={(v) => [v, 'Bookings']}
                />
                <Bar dataKey="bookings" name="Bookings" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="ts-panel">
          <header className="ts-panel-head">
            <h2>Weekly activity</h2>
            <p>New bookings and progress entries, last 8 weeks</p>
          </header>
          {!hasWeekly ? (
            <p className="ts-empty">Activity will show up here once members book and you log progress.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.weekly_activity} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: INK_2 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: INK_2 }} />
                <Tooltip labelFormatter={(l) => `Week of ${l}`} />
                <Legend verticalAlign="top" height={28} iconType="plainline"
                        wrapperStyle={{ fontSize: 12, color: INK_2 }} />
                <Line type="monotone" dataKey="bookings" name="New bookings" stroke={BLUE}
                      strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="progress" name="Progress logged" stroke={ORANGE}
                      strokeWidth={2} dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      {/* ---------- Class capacity + Needs attention ---------- */}
      <div className="ts-row">
        <section className="ts-panel">
          <header className="ts-panel-head">
            <h2>Class capacity</h2>
            <p>How full each of your classes is</p>
          </header>
          {sortedByFill.length === 0 ? (
            <p className="ts-empty">No classes assigned yet.</p>
          ) : (
            <ul className="ts-capacity-list">
              {sortedByFill.map((c) => (
                <li key={c.class_id}>
                  <div className="ts-capacity-top">
                    <span className="ts-capacity-name">
                      {c.class_name}
                      <small>{c.schedule_day} · {fmtTime(c.start_time)}–{fmtTime(c.end_time)}</small>
                    </span>
                    <span className="ts-capacity-num">
                      {c.booked}/{c.capacity}
                      {c.fill_pct >= 90 && <em className="ts-tag full">Almost full</em>}
                      {c.booked === 0 && <em className="ts-tag empty">No bookings</em>}
                    </span>
                  </div>
                  <div className="ts-bar" role="img" aria-label={`${c.class_name} ${c.fill_pct} percent full`}>
                    <div className="ts-bar-fill" style={{ width: `${Math.min(c.fill_pct, 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ts-panel">
          <header className="ts-panel-head">
            <h2>Members to follow up</h2>
            <p>No progress entry from you in the last 30 days</p>
          </header>
          {stats.needs_attention.length === 0 ? (
            <p className="ts-empty">
              {t.members === 0 ? 'No members yet.' : '✓ Every member has a recent progress entry.'}
            </p>
          ) : (
            <ul className="ts-follow-list">
              {stats.needs_attention.map((m) => (
                <li key={m.member_id}>
                  <div className="ts-follow-avatar">{initials(m.first_name, m.last_name)}</div>
                  <div className="ts-follow-text">
                    <strong>{m.first_name} {m.last_name}</strong>
                    <span>
                      {m.days_since === null ? 'No progress logged yet' : `Last logged ${m.days_since} days ago`}
                    </span>
                  </div>
                  <Link to="/trainer/messages" className="ts-follow-btn">Log progress</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- Today + profile + schedule ---------- */}
      {todaysClasses.length > 0 && (
        <section className="ts-today">
          <h2>Today · {todayName}</h2>
          <div className="ts-today-list">
            {todaysClasses.map((c) => (
              <div key={c.class_id} className="ts-today-item">
                <strong>{c.class_name}</strong>
                <span>🕒 {fmtTime(c.start_time)}–{fmtTime(c.end_time)}</span>
                <span>{c.booked}/{c.capacity} booked</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="home-columns">
        <div className="side-card">
          <h3 className="side-card-title">Your Profile</h3>
          <div className="profile-row"><span>Email</span><strong>{profile?.email || '—'}</strong></div>
          <div className="profile-row"><span>Phone</span><strong>{profile?.phone || '—'}</strong></div>
          <div className="profile-row"><span>Specialization</span><strong>{profile?.specialization || '—'}</strong></div>
          <div className="profile-row">
            <span>Joined</span>
            <strong>{profile?.hire_date ? String(profile.hire_date).slice(0, 16) : '—'}</strong>
          </div>
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
                  <span className="week-classes">{classesByDay[day].map((c) => c.class_name).join(', ')}</span>
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
          onSaved={(updated) => { setProfile(updated); setEditingProfile(false); }}
        />
      )}
    </div>
  );
}

export default TrainerDashboard;