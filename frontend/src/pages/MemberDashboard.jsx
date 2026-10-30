import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getBookingsByMember, getPaymentsByMember, getNotificationsByMember,
  getClasses, createBooking, cancelBooking, getMember
} from '../services/api';
import { getMemberTrainers } from '../services/memberApi';
import PaymentForm from '../components/payments/PaymentForm';
import './MemberPortal.css';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function MemberDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  async function loadData() {
    try {
      const [memberRes, bookingsRes, paymentsRes, notificationsRes, classesRes, trainersRes] = await Promise.all([
        getMember(user.id),
        getBookingsByMember(user.id),
        getPaymentsByMember(user.id),
        getNotificationsByMember(user.id),
        getClasses(),
        getMemberTrainers(user.id),
      ]);
      setProfile(memberRes.data);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
      setNotifications(notificationsRes.data);
      setAvailableClasses(classesRes.data);
      setTrainers(trainersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleBook(classId) {
    setMessage('');
    try {
      await createBooking({ member_id: user.id, class_id: classId });
      setMessage('Class booked successfully!');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to book class.');
    }
  }

  async function handleCancel(bookingId) {
    try {
      await cancelBooking(bookingId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  function initials(first, last) {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  }

  if (loading) return <div className="member-dashboard"><p className="loading-text">Loading your dashboard...</p></div>;

  const activeBookings = bookings.filter((b) => b.status === 'Booked');
  const bookedIds = new Set(activeBookings.map((b) => b.class_id));
  const unreadMessages = trainers.reduce((sum, t) => sum + (t.unread_count || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'Pending').length;

  const remaining = daysUntil(profile?.membership_end_date);
  let membershipLabel = 'No active membership yet';
  let membershipClass = 'ms-none';
  if (remaining !== null) {
    if (remaining > 0) {
      membershipLabel = `${remaining} day${remaining !== 1 ? 's' : ''} left`;
      membershipClass = remaining <= 7 ? 'ms-warn' : 'ms-ok';
    } else {
      membershipLabel = 'Membership expired';
      membershipClass = 'ms-expired';
    }
  }

  const todayIdx = (new Date().getDay() + 6) % 7;
  const nextClass = activeBookings
    .map((b) => {
      const idx = WEEK_DAYS.indexOf(b.schedule_day);
      return { ...b, offset: idx === -1 ? 99 : (idx - todayIdx + 7) % 7 };
    })
    .sort((a, b) => a.offset - b.offset)[0];

  return (
    <div className="member-dashboard">
      <div className="member-hero">
        <div className="member-avatar">{initials(user.first_name, user.last_name)}</div>
        <div className="member-hero-text">
          <p className="member-hero-eyebrow">Member Dashboard</p>
          <h1>Welcome back, {user.first_name}</h1>
          <p className="member-hero-sub">
            <span className={`ms-dot ${membershipClass}`} /> {membershipLabel}
            {profile?.membership_end_date ? ` · valid until ${profile.membership_end_date}` : ''}
          </p>
        </div>
        <button className="btn-pay-hero" onClick={() => setShowPaymentForm(true)}>
          {remaining > 0 ? 'Renew Membership' : 'Pay for Membership'}
        </button>
      </div>

      {message && <p className="dashboard-message">{message}</p>}
      {pendingCount > 0 && (
        <p className="dashboard-message warn">
          You have {pendingCount} payment{pendingCount > 1 ? 's' : ''} waiting for admin confirmation.
          You'll get an email once your membership dates are set.
        </p>
      )}

      <div className="member-stats-grid">
        <div className="member-stat-card">
          <div className="stat-icon icon-blue"></div>
          <div><h3>Active Bookings</h3><p>{activeBookings.length}</p></div>
        </div>
        <Link to="/member/messages" className="member-stat-card linked">
          <div className="stat-icon icon-green"></div>
          <div><h3>Unread Messages</h3><p>{unreadMessages}</p></div>
        </Link>
        <Link to="/member/payments" className="member-stat-card linked">
          <div className="stat-icon icon-amber"></div>
          <div><h3>Payments Made</h3><p>{payments.length}</p></div>
        </Link>
        <div className="member-stat-card">
          <div className="stat-icon icon-purple"></div>
          <div><h3>Notifications</h3><p>{notifications.length}</p></div>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-main">
          <section>
            <div className="section-heading"><h2>Available Classes</h2></div>
            {availableClasses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🗓️</div>
                <h3>No classes available</h3>
                <p>Check back soon — new classes will show up here.</p>
              </div>
            ) : (
              <div className="class-cards">
                {availableClasses.map((c) => (
                  <div key={c.class_id} className="class-card">
                    <div className="class-card-top">
                      <h3>{c.class_name}</h3>
                      <span className="day-badge">{c.schedule_day}</span>
                    </div>
                    <p className="class-time">🕒 {c.start_time} – {c.end_time}</p>
                    {bookedIds.has(c.class_id) ? (
                      <button className="btn-booked" disabled>✓ Booked</button>
                    ) : (
                      <button className="btn-primary" onClick={() => handleBook(c.class_id)}>Book</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="section-heading"><h2>Your Bookings</h2></div>
            {bookings.length === 0 ? (
              <div className="empty-state small"><p>No bookings yet — book a class above to get started.</p></div>
            ) : (
              <table className="simple-table">
                <thead><tr><th>Class</th><th>Day</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.booking_id}>
                      <td>{b.class_name}</td>
                      <td>{b.schedule_day}</td>
                      <td><span className={`status-pill status-${b.status.toLowerCase()}`}>{b.status}</span></td>
                      <td>
                        {b.status === 'Booked' && (
                          <button className="btn-delete" onClick={() => handleCancel(b.booking_id)}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="home-side">
          <div className="side-card">
            <h3 className="side-card-title">Next Class</h3>
            {nextClass ? (
              <div className="next-class">
                <strong>{nextClass.class_name}</strong>
                <span>{nextClass.offset === 0 ? 'Today' : nextClass.schedule_day}</span>
              </div>
            ) : (
              <p className="muted">Nothing booked yet.</p>
            )}
          </div>

          <div className="side-card">
            <h3 className="side-card-title">Your Trainer{trainers.length > 1 ? 's' : ''}</h3>
            {trainers.length === 0 ? (
              <p className="muted">Book a class and its trainer will be assigned to you here.</p>
            ) : (
              trainers.map((t) => (
                <div key={t.trainer_id} className="trainer-line">
                  <div className="mini-avatar">{initials(t.first_name, t.last_name)}</div>
                  <div>
                    <strong>{t.first_name} {t.last_name}</strong>
                    <span>{t.specialization || 'Trainer'}</span>
                  </div>
                </div>
              ))
            )}
            {trainers.length > 0 && <Link to="/member/messages" className="side-link">Message your trainer →</Link>}
          </div>

          <div className="side-card">
            <h3 className="side-card-title">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="muted">No notifications.</p>
            ) : (
              <ul className="notification-list compact">
                {notifications.slice(0, 5).map((n) => <li key={n.notification_id}>{n.message}</li>)}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {showPaymentForm && (
        <PaymentForm onClose={() => { setShowPaymentForm(false); loadData(); }} />
      )}
    </div>
  );
}

export default MemberDashboard;