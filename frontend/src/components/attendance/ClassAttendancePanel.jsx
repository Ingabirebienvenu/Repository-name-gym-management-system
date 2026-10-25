import { useEffect, useState } from 'react';
import { getAllClassAttendance, getClassList } from '../../services/attendanceApi';
import './ClassAttendancePanel.css';

const ICON = { Present: '✓', Late: '◷', Absent: '✕' };

function ClassAttendancePanel() {
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ class_id: '', status: '', date_from: '', date_to: '' });

  useEffect(() => {
    getClassList().then((res) => setClasses(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {};
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
        const res = await getAllClassAttendance(params);
        setRecords(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters]);

  function setFilter(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  const present = records.filter((r) => r.status === 'Present').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const total = records.length;
  const rate = total ? Math.round(((present + late) * 100) / total) : 0;

  return (
    <div className="cap">
      <div className="cap-stats">
        <div className="cap-stat"><span>Records</span><strong>{total}</strong></div>
        <div className="cap-stat"><span>Present</span><strong className="g">{present}</strong></div>
        <div className="cap-stat"><span>Late</span><strong className="a">{late}</strong></div>
        <div className="cap-stat"><span>Absent</span><strong className="r">{absent}</strong></div>
        <div className="cap-stat"><span>Attendance rate</span><strong>{rate}%</strong></div>
      </div>

      <div className="cap-filters">
        <select name="class_id" value={filters.class_id} onChange={setFilter}>
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.schedule_day})</option>)}
        </select>
        <select name="status" value={filters.status} onChange={setFilter}>
          <option value="">All statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
        </select>
        <label>From <input type="date" name="date_from" value={filters.date_from} onChange={setFilter} /></label>
        <label>To <input type="date" name="date_to" value={filters.date_to} onChange={setFilter} /></label>
        <button type="button" onClick={() => setFilters({ class_id: '', status: '', date_from: '', date_to: '' })}>Reset</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="attendance-table">
          <thead>
            <tr><th>Date</th><th>Member</th><th>Class</th><th>Trainer</th><th>Status</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No class attendance recorded yet.</td></tr>
            ) : records.map((r) => (
              <tr key={r.attendance_id}>
                <td>{r.session_date}</td>
                <td>{r.first_name} {r.last_name}</td>
                <td>{r.class_name} <small className="cap-day">{r.schedule_day}</small></td>
                <td>{r.trainer_first_name ? `${r.trainer_first_name} ${r.trainer_last_name}` : '—'}</td>
                <td><span className={`cap-pill ${r.status.toLowerCase()}`}>{ICON[r.status]} {r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ClassAttendancePanel;