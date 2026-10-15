import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClasses } from '../services/api';
import { getClassRoster, saveClassAttendance } from '../services/attendanceApi';
import './TrainerDashboard.css';
import './TrainerAttendance.css';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STATUSES = ['Present', 'Late', 'Absent'];

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function weekdayName(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return WEEK_DAYS[(d.getDay() + 6) % 7];
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  return `${String(h).padStart(2, '0')}:${m}`;
}

function TrainerAttendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({});        // { member_id: 'Present' | 'Late' | 'Absent' }
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);    // { type: 'ok' | 'error', text }

  // 1. my classes (default to the class that happens today, if any)
  useEffect(() => {
    async function load() {
      try {
        const res = await getClasses();
        const mine = res.data.filter((c) => c.trainer_id === user.id);
        setClasses(mine);
        const today = weekdayName(todayISO());
        const first = mine.find((c) => c.schedule_day === today) || mine[0];
        if (first) setClassId(String(first.class_id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClasses(false);
      }
    }
    if (user) load();
  }, [user]);

  // 2. roster for the chosen class + date
  useEffect(() => {
    async function loadRoster() {
      if (!classId || !date) return;
      setLoadingRoster(true);
      setNotice(null);
      try {
        const res = await getClassRoster(classId, date);
        setRoster(res.data);
        const existing = {};
        res.data.forEach((m) => { if (m.status) existing[m.member_id] = m.status; });
        setMarks(existing);
      } catch (err) {
        console.error(err);
        setNotice({ type: 'error', text: err.response?.data?.error || 'Could not load the roster.' });
      } finally {
        setLoadingRoster(false);
      }
    }
    loadRoster();
  }, [classId, date]);

  const selectedClass = classes.find((c) => String(c.class_id) === classId);
  const dayMismatch = selectedClass && selectedClass.schedule_day !== weekdayName(date);

  const counts = useMemo(() => {
    const c = { Present: 0, Late: 0, Absent: 0 };
    Object.values(marks).forEach((s) => { if (c[s] !== undefined) c[s] += 1; });
    return c;
  }, [marks]);
  const unmarked = roster.length - Object.keys(marks).length;

  function setMark(memberId, status) {
    setMarks((prev) => ({ ...prev, [memberId]: status }));
    setNotice(null);
  }

  function markAll(status) {
    const all = {};
    roster.forEach((m) => { all[m.member_id] = status; });
    setMarks(all);
    setNotice(null);
  }

  async function handleSave() {
    const records = Object.entries(marks).map(([member_id, status]) => ({ member_id: Number(member_id), status }));
    if (records.length === 0) {
      setNotice({ type: 'error', text: 'Mark at least one member first.' });
      return;
    }
    setSaving(true);
    try {
      await saveClassAttendance({
        class_id: Number(classId),
        trainer_id: user.id,
        session_date: date,
        records,
      });
      setNotice({ type: 'ok', text: `Attendance saved for ${records.length} member${records.length !== 1 ? 's' : ''}. It now shows on the admin and member dashboards.` });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.error || 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  }

  if (loadingClasses) return <div className="trainer-dashboard"><p className="loading-text">Loading your classes...</p></div>;

  if (classes.length === 0) {
    return (
      <div className="trainer-dashboard">
        <div className="section-heading"><h1 className="page-title">Attendance</h1></div>
        <div className="empty-state">
          <div className="empty-icon">🗓️</div>
          <h3>No classes assigned yet</h3>
          <p>Once an admin assigns you to a class, you can take attendance for it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-dashboard">
      <div className="section-heading">
        <h1 className="page-title">Attendance</h1>
        <p className="ta-sub">Record who showed up. Members and admins see it straight away.</p>
      </div>

      <div className="ta-controls">
        <label>
          <span>Class</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_name} · {c.schedule_day} {fmtTime(c.start_time)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Session date</span>
          <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      {dayMismatch && (
        <p className="ta-warn">
          ⚠ This class is normally on {selectedClass.schedule_day}, but {date} is a {weekdayName(date)}.
          Check the date before saving.
        </p>
      )}
      {notice && <p className={`ta-notice ${notice.type}`}>{notice.text}</p>}

      <div className="ta-card">
        <div className="ta-card-head">
          <div className="ta-counters">
            <span className="ta-count present">Present <strong>{counts.Present}</strong></span>
            <span className="ta-count late">Late <strong>{counts.Late}</strong></span>
            <span className="ta-count absent">Absent <strong>{counts.Absent}</strong></span>
            <span className="ta-count none">Not marked <strong>{Math.max(unmarked, 0)}</strong></span>
          </div>
          <div className="ta-quick">
            <button type="button" onClick={() => markAll('Present')} disabled={roster.length === 0}>Mark all present</button>
            <button type="button" onClick={() => setMarks({})} disabled={roster.length === 0}>Clear</button>
          </div>
        </div>

        {loadingRoster ? (
          <p className="ta-empty">Loading roster...</p>
        ) : roster.length === 0 ? (
          <p className="ta-empty">No members are booked into this class yet.</p>
        ) : (
          <ul className="ta-list">
            {roster.map((m) => (
              <li key={m.member_id}>
                <div className="ta-avatar">{(m.first_name?.[0] || '')}{(m.last_name?.[0] || '')}</div>
                <span className="ta-name">{m.first_name} {m.last_name}</span>
                <div className="ta-seg" role="group" aria-label={`Attendance for ${m.first_name}`}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`ta-btn ${s.toLowerCase()} ${marks[m.member_id] === s ? 'on' : ''}`}
                      aria-pressed={marks[m.member_id] === s}
                      onClick={() => setMark(m.member_id, s)}
                    >
                      {s === 'Present' ? '✓ ' : s === 'Absent' ? '✕ ' : '◷ '}{s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="ta-foot">
          <button className="ta-save" onClick={handleSave} disabled={saving || roster.length === 0}>
            {saving ? 'Saving...' : 'Save attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrainerAttendance;