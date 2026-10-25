import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMemberClassAttendance } from '../services/attendanceApi';
import './MemberPortal.css';
import './MemberAttendance.css';

function fmtDate(d) {
  if (!d) return '';
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  return `${String(h).padStart(2, '0')}:${m}`;
}

const ICON = { Present: '✓', Late: '◷', Absent: '✕' };

function MemberAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const res = await getMemberClassAttendance(user.id);
        setRecords(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  if (loading) return <div className="member-dashboard"><p className="loading-text">Loading your attendance...</p></div>;

  const present = records.filter((r) => r.status === 'Present').length;
  const late = records.filter((r) => r.status === 'Late').length;
  const absent = records.filter((r) => r.status === 'Absent').length;
  const total = records.length;
  const rate = total ? Math.round(((present + late) * 100) / total) : 0;
  const pct = (n) => (total ? (n * 100) / total : 0);

  // current run of consecutive attended sessions (newest first)
  let streak = 0;
  for (const r of records) {
    if (r.status === 'Absent') break;
    streak += 1;
  }

  const shown = filter === 'All' ? records : records.filter((r) => r.status === filter);

  return (
    <div className="member-dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-sub">Class attendance recorded by your trainers.</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No attendance recorded yet</h3>
          <p>After you attend a class, your trainer marks it and it appears here.
            <br /><Link to="/member">Book a class</Link> to get started.</p>
        </div>
      ) : (
        <>
          <div className="member-stats-grid">
            <div className="member-stat-card">
              <div className="stat-icon icon-green">📈</div>
              <div>
                <h3>Attendance rate</h3>
                <p>{rate}%</p>
                <span className="delta flat">{present + late} of {total} sessions</span>
              </div>
            </div>
            <div className="member-stat-card">
              <div className="stat-icon icon-blue">✅</div>
              <div><h3>Present</h3><p>{present}</p></div>
            </div>
            <div className="member-stat-card">
              <div className="stat-icon icon-amber">⏰</div>
              <div><h3>Late</h3><p>{late}</p></div>
            </div>
            <div className="member-stat-card">
              <div className="stat-icon icon-purple">🔥</div>
              <div>
                <h3>Current streak</h3>
                <p>{streak}</p>
                <span className="delta flat">sessions in a row</span>
              </div>
            </div>
          </div>

          <div className="panel ma-breakdown">
            <h3 className="panel-title">Breakdown</h3>
            <div className="ma-stack" role="img"
                 aria-label={`${present} present, ${late} late, ${absent} absent`}>
              {present > 0 && <div className="ma-seg present" style={{ width: `${pct(present)}%` }} />}
              {late > 0 && <div className="ma-seg late" style={{ width: `${pct(late)}%` }} />}
              {absent > 0 && <div className="ma-seg absent" style={{ width: `${pct(absent)}%` }} />}
            </div>
            <div className="ma-legend">
              <span><i className="dot present" /> Present {present}</span>
              <span><i className="dot late" /> Late {late}</span>
              <span><i className="dot absent" /> Absent {absent}</span>
            </div>
          </div>

          <section>
            <div className="section-heading ma-head">
              <h2>Session history</h2>
              <div className="ma-filters">
                {['All', 'Present', 'Late', 'Absent'].map((f) => (
                  <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr><th>Date</th><th>Class</th><th>Time</th><th>Marked by</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {shown.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>Nothing to show for this filter.</td></tr>
                  ) : shown.map((r) => (
                    <tr key={r.attendance_id}>
                      <td>{fmtDate(r.session_date)}</td>
                      <td><strong>{r.class_name}</strong></td>
                      <td>{fmtTime(r.start_time)}–{fmtTime(r.end_time)}</td>
                      <td>{r.trainer_first_name ? `${r.trainer_first_name} ${r.trainer_last_name}` : '—'}</td>
                      <td>
                        <span className={`ma-pill ${r.status.toLowerCase()}`}>{ICON[r.status]} {r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default MemberAttendance;