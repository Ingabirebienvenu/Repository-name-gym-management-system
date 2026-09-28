import { useEffect, useState } from 'react';
import { getBookingsByClass, markAttended } from '../../services/api';
import './RosterModal.css';

function RosterModal({ classItem, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function loadBookings() {
    try {
      setLoading(true);
      const res = await getBookingsByClass(classItem.class_id);
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleMarkAttended(bookingId) {
    setBusyId(bookingId);
    try {
      await markAttended(bookingId);
      loadBookings();
    } catch (err) {
      alert('Failed to mark attendance.');
      console.error(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal roster-modal">
        <h2>{classItem.class_name} — Roster</h2>
        <p className="roster-subtitle">
          {classItem.schedule_day} · {classItem.start_time} - {classItem.end_time}
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <p>No members have booked this class yet.</p>
        ) : (
          <table className="roster-table">
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
                  <td>
                    <span className={`roster-status roster-status-${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    {b.status === 'Booked' && (
                      <button
                        className="btn-primary btn-small"
                        onClick={() => handleMarkAttended(b.booking_id)}
                        disabled={busyId === b.booking_id}
                      >
                        {busyId === b.booking_id ? 'Marking...' : 'Mark Attended'}
                      </button>
                    )}
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

export default RosterModal;