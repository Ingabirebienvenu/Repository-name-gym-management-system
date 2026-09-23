import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getBookingsByMember, getPaymentsByMember, getNotificationsByMember,
  getClasses, createBooking, cancelBooking
} from '../services/api';
import './MemberDashboard.css';

function MemberDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [bookingsRes, paymentsRes, notificationsRes, classesRes] = await Promise.all([
        getBookingsByMember(user.id),
        getPaymentsByMember(user.id),
        getNotificationsByMember(user.id),
        getClasses(),
      ]);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
      setNotifications(notificationsRes.data);
      setAvailableClasses(classesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadData();
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

  if (loading) return <div className="member-dashboard"><p>Loading...</p></div>;

  return (
    <div className="member-dashboard">
      <h1>Welcome, {user.first_name} {user.last_name}</h1>
      {message && <p className="dashboard-message">{message}</p>}

      <section>
        <h2>Available Classes</h2>
        <div className="class-cards">
          {availableClasses.length === 0 ? <p>No classes available right now.</p> : availableClasses.map((c) => (
            <div key={c.class_id} className="class-card">
              <h3>{c.class_name}</h3>
              <p>{c.schedule_day} · {c.start_time} - {c.end_time}</p>
              <button className="btn-primary" onClick={() => handleBook(c.class_id)}>Book</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Your Bookings</h2>
        {bookings.length === 0 ? <p>No bookings yet.</p> : (
          <table className="simple-table">
            <thead><tr><th>Class</th><th>Day</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.booking_id}>
                  <td>{b.class_name}</td>
                  <td>{b.schedule_day}</td>
                  <td>{b.status}</td>
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

      <section>
        <h2>Payment History</h2>
        {payments.length === 0 ? <p>No payments recorded yet.</p> : (
          <table className="simple-table">
            <thead><tr><th>Amount</th><th>Date</th><th>Method</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.payment_id}>
                  <td>{Number(p.amount).toLocaleString()} RWF</td>
                  <td>{p.payment_date}</td>
                  <td>{p.payment_method}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Notifications</h2>
        {notifications.length === 0 ? <p>No notifications.</p> : (
          <ul className="notification-list">
            {notifications.map((n) => <li key={n.notification_id}>{n.message}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

export default MemberDashboard;