import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProgress, getSupplements } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './MemberPortal.css';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function TrendChart({ data, dataKey, color, unit }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} unit={unit} />
        <Tooltip formatter={(v) => `${v}${unit}`} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MemberProgress() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, sRes] = await Promise.all([getProgress(user.id), getSupplements(user.id)]);
        setLogs(pRes.data);
        setSupplements(sRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user]);

  if (loading) return <div className="member-dashboard"><p className="loading-text">Loading your progress...</p></div>;

  // API returns newest first; charts need oldest first
  const ascending = [...logs].reverse().map((l) => ({
    ...l,
    label: fmtDate(l.log_date).replace(/ \d{4}$/, ''),
  }));
  const weightData = ascending.filter((l) => l.weight_kg != null);
  const fatData = ascending.filter((l) => l.body_fat_percent != null);

  const latestWeight = weightData.length ? weightData[weightData.length - 1].weight_kg : null;
  const firstWeight = weightData.length ? weightData[0].weight_kg : null;
  const weightChange = latestWeight != null && firstWeight != null ? latestWeight - firstWeight : null;
  const latestFat = fatData.length ? fatData[fatData.length - 1].body_fat_percent : null;
  const firstFat = fatData.length ? fatData[0].body_fat_percent : null;
  const fatChange = latestFat != null && firstFat != null ? latestFat - firstFat : null;
  const notes = logs.filter((l) => l.notes);

  function delta(v, unit) {
    if (v == null) return null;
    if (Math.abs(v) < 0.05) return <span className="delta flat">No change</span>;
    const down = v < 0;
    // For weight and body fat in a gym context, going down is shown in green
    return (
      <span className={`delta ${down ? 'good' : 'bad'}`}>
        {down ? '▼' : '▲'} {Math.abs(v).toFixed(1)}{unit} since first log
      </span>
    );
  }

  return (
    <div className="member-dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Progress</h1>
          <p className="page-sub">Measurements and notes logged by your trainer.</p>
        </div>
      </div>

      {logs.length === 0 && supplements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <h3>No progress logged yet</h3>
          <p>Once your trainer records your weight, body fat or notes, your charts will appear here.
            Not assigned to a trainer yet? <Link to="/member">Book a class</Link> first.</p>
        </div>
      ) : (
        <>
          <div className="member-stats-grid">
            <div className="member-stat-card">
              <div className="stat-icon icon-blue">⚖️</div>
              <div>
                <h3>Current Weight</h3>
                <p>{latestWeight != null ? `${latestWeight} kg` : '—'}</p>
                {delta(weightChange, ' kg')}
              </div>
            </div>
            <div className="member-stat-card">
              <div className="stat-icon icon-amber">🔥</div>
              <div>
                <h3>Body Fat</h3>
                <p>{latestFat != null ? `${latestFat}%` : '—'}</p>
                {delta(fatChange, '%')}
              </div>
            </div>
            <div className="member-stat-card">
              <div className="stat-icon icon-green">📝</div>
              <div><h3>Check-ins Logged</h3><p>{logs.length}</p></div>
            </div>
            <div className="member-stat-card">
              <div className="stat-icon icon-purple">💊</div>
              <div><h3>Supplement Tips</h3><p>{supplements.length}</p></div>
            </div>
          </div>

          <div className="charts-row">
            <div className="panel">
              <h3 className="panel-title">Weight (kg)</h3>
              {weightData.length < 2 ? (
                <p className="muted pad">Needs at least two weight entries to draw a trend.</p>
              ) : (
                <TrendChart data={weightData} dataKey="weight_kg" color="#3b82f6" unit=" kg" />
              )}
            </div>
            <div className="panel">
              <h3 className="panel-title">Body Fat (%)</h3>
              {fatData.length < 2 ? (
                <p className="muted pad">Needs at least two body-fat entries to draw a trend.</p>
              ) : (
                <TrendChart data={fatData} dataKey="body_fat_percent" color="#f59e0b" unit="%" />
              )}
            </div>
          </div>

          <div className="two-col">
            <section>
              <div className="section-heading"><h2>Trainer Notes</h2></div>
              {notes.length === 0 ? (
                <div className="empty-state small"><p>No notes from your trainer yet.</p></div>
              ) : (
                <ul className="timeline">
                  {notes.map((l) => (
                    <li key={l.progress_id}>
                      <div className="timeline-dot" />
                      <div className="timeline-body">
                        <div className="timeline-head">
                          <strong>{l.trainer_first_name ? `${l.trainer_first_name} ${l.trainer_last_name}` : 'Trainer'}</strong>
                          <span>{fmtDate(l.log_date)}</span>
                        </div>
                        <p>{l.notes}</p>
                        {(l.weight_kg != null || l.body_fat_percent != null) && (
                          <div className="chips">
                            {l.weight_kg != null && <span className="chip">{l.weight_kg} kg</span>}
                            {l.body_fat_percent != null && <span className="chip">{l.body_fat_percent}% fat</span>}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="section-heading"><h2>Suggested Supplements</h2></div>
              {supplements.length === 0 ? (
                <div className="empty-state small"><p>Your trainer hasn't suggested any supplements.</p></div>
              ) : (
                <div className="supp-list">
                  {supplements.map((s) => (
                    <div key={s.suggestion_id} className="supp-card">
                      <div className="supp-top">
                        <strong>{s.supplement_name}</strong>
                        <span>{fmtDate(s.suggested_at)}</span>
                      </div>
                      {s.dosage && <p className="supp-dose">Dosage: {s.dosage}</p>}
                      {s.notes && <p className="supp-notes">{s.notes}</p>}
                      <p className="supp-by">
                        From {s.trainer_first_name ? `${s.trainer_first_name} ${s.trainer_last_name}` : 'your trainer'}
                      </p>
                    </div>
                  ))}
                  <p className="muted small-note">Suggestions only — check with a doctor if you have a medical condition.</p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default MemberProgress;