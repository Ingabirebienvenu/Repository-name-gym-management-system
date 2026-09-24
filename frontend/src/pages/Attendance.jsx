import { useEffect, useState } from 'react';
import { getAttendance, getMembers, checkIn, checkOut } from '../services/api';
import './Attendance.css';

function Attendance() {
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [attendanceRes, membersRes] = await Promise.all([getAttendance(), getMembers()]);
      setRecords(attendanceRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCheckIn() {
    if (!selectedMemberId) {
      setMessage('Please select a member first.');
      return;
    }
    setMessage('');
    try {
      await checkIn(selectedMemberId);
      setMessage('Checked in successfully.');
      setSelectedMemberId('');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to check in.');
    }
  }

  async function handleCheckOut(attendanceId) {
    try {
      await checkOut(attendanceId);
      loadData();
    } catch (err) {
      alert('Failed to check out.');
      console.error(err);
    }
  }

  if (loading) return <div className="attendance-page"><p>Loading...</p></div>;

  return (
    <div className="attendance-page">
      <h1>Attendance</h1>

      <div className="checkin-bar">
        <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
          <option value="">-- Select a member to check in --</option>
          {members.map((m) => (
            <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={handleCheckIn}>Check In</button>
      </div>
      {message && <p className="attendance-message">{message}</p>}

      <table className="attendance-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No attendance records yet.</td></tr>
          ) : (
            records.map((r) => (
              <tr key={r.attendance_id}>
                <td>{r.first_name} {r.last_name}</td>
                <td>{r.check_in_time}</td>
                <td>{r.check_out_time || '—'}</td>
                <td>
                  {!r.check_out_time && (
                    <button className="btn-edit" onClick={() => handleCheckOut(r.attendance_id)}>Check Out</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Attendance;