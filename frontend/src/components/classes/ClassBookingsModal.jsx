import { useEffect, useState } from 'react';
import { getBookingsByClass, cancelBooking } from '../../services/api';
import './ClassBookingsModal.css';

function ClassBookingsModal({ classItem, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    try {
      setLoading(true);
      const res = await getBookingsByClass(classItem.class_id);
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleCancel(bookingId) {
    if (!window.confirm('Remove this member from the class?')) return;
    try {
      await cancelBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert('Failed to cancel booking.');
      console.error(err);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal bookings-modal">
        <h2>{classItem.class_name} — Bookings</h2>
        <p className="bookings-subtitle">
          {classItem.schedule_day} · {classItem.start_time} - {classItem.end_time} · Capacity {classItem.capacity}
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p>No members have booked this class yet.</p>
        ) : (
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.booking_id}>
                  <td>{b.member_first_name} {b.member_last_name}</td>
                  <td>{b.status}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleCancel(b.booking_id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ClassBookingsModal;