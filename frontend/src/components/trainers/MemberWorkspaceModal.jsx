import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getConversation, sendMessage, markConversationRead,
  getProgress, addProgress, deleteProgress,
  getSupplements, addSupplement, deleteSupplement,
} from '../../services/api';
import './MemberWorkspaceModal.css';

function MemberWorkspaceModal({ member, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('messages');

  return (
    <div className="modal-overlay">
      <div className="modal workspace-modal">
        <div className="workspace-header">
          <div>
            <h2>{member.first_name} {member.last_name}</h2>
            <p className="workspace-subtitle">{member.email}</p>
          </div>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>

        <div className="workspace-tabs">
          <button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}>Messages</button>
          <button className={tab === 'progress' ? 'active' : ''} onClick={() => setTab('progress')}>Progress</button>
          <button className={tab === 'supplements' ? 'active' : ''} onClick={() => setTab('supplements')}>Supplements</button>
        </div>

        <div className="workspace-body">
          {tab === 'messages' && <MessagesTab trainerId={user.id} member={member} />}
          {tab === 'progress' && <ProgressTab trainerId={user.id} member={member} />}
          {tab === 'supplements' && <SupplementsTab trainerId={user.id} member={member} />}
        </div>
      </div>
    </div>
  );
}

// ---------------- MESSAGES ----------------
function MessagesTab({ trainerId, member }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function load() {
    try {
      const res = await getConversation(trainerId, member.member_id);
      setMessages(res.data);
      await markConversationRead(trainerId, member.member_id, 'trainer');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ trainer_id: trainerId, member_id: member.member_id, sender: 'trainer', message: text.trim() });
      setText('');
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <p className="workspace-loading">Loading conversation...</p>;

  return (
    <div className="messages-tab">
      <div className="message-list">
        {messages.length === 0 ? (
          <p className="workspace-empty">No messages yet — say hello!</p>
        ) : (
          messages.map((m) => (
            <div key={m.message_id} className={`bubble-row ${m.sender === 'trainer' ? 'from-trainer' : 'from-member'}`}>
              <div className="bubble">
                <p>{m.message}</p>
                <span className="bubble-time">{m.sent_at.slice(0, 16)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <form className="message-input-row" onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="btn-primary" disabled={sending}>Send</button>
      </form>
    </div>
  );
}

// ---------------- PROGRESS ----------------
function ProgressTab({ trainerId, member }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    weight_kg: '',
    body_fat_percent: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getProgress(member.member_id);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.weight_kg && !form.body_fat_percent && !form.notes) {
      setError('Add at least a weight, body fat %, or a note.');
      return;
    }
    setSaving(true);
    try {
      await addProgress({ ...form, member_id: member.member_id, trainer_id: trainerId });
      setForm({ log_date: new Date().toISOString().slice(0, 10), weight_kg: '', body_fat_percent: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log progress.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteProgress(id);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="progress-tab">
      <form className="progress-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="progress-form-row">
          <div className="form-row">
            <label>Date</label>
            <input type="date" name="log_date" value={form.log_date} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Weight (kg)</label>
            <input type="number" step="0.1" name="weight_kg" value={form.weight_kg} onChange={handleChange} placeholder="e.g. 78.5" />
          </div>
          <div className="form-row">
            <label>Body Fat (%)</label>
            <input type="number" step="0.1" name="body_fat_percent" value={form.body_fat_percent} onChange={handleChange} placeholder="e.g. 18.0" />
          </div>
        </div>
        <div className="form-row">
          <label>Notes</label>
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Improved squat form, more energy this week" />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Log Progress'}
        </button>
      </form>

      <h3 className="workspace-section-title">History</h3>
      {loading ? (
        <p className="workspace-loading">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="workspace-empty">No progress logged yet.</p>
      ) : (
        <table className="workspace-table">
          <thead>
            <tr><th>Date</th><th>Weight</th><th>Body Fat</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.progress_id}>
                <td>{l.log_date}</td>
                <td>{l.weight_kg != null ? `${l.weight_kg} kg` : '—'}</td>
                <td>{l.body_fat_percent != null ? `${l.body_fat_percent}%` : '—'}</td>
                <td>{l.notes || '—'}</td>
                <td><button className="btn-delete-small" onClick={() => handleDelete(l.progress_id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---------------- SUPPLEMENTS ----------------
function SupplementsTab({ trainerId, member }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ supplement_name: '', dosage: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getSupplements(member.member_id);
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.supplement_name.trim()) {
      setError('Supplement name is required.');
      return;
    }
    setSaving(true);
    try {
      await addSupplement({ ...form, member_id: member.member_id, trainer_id: trainerId });
      setForm({ supplement_name: '', dosage: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add suggestion.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this suggestion?')) return;
    try {
      await deleteSupplement(id);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="progress-tab">
      <form className="progress-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="progress-form-row">
          <div className="form-row">
            <label>Supplement</label>
            <input name="supplement_name" value={form.supplement_name} onChange={handleChange} placeholder="e.g. Whey Protein" />
          </div>
          <div className="form-row">
            <label>Suggested Dosage</label>
            <input name="dosage" value={form.dosage} onChange={handleChange} placeholder="e.g. 1 scoop post-workout" />
          </div>
        </div>
        <div className="form-row">
          <label>Notes</label>
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Why you're suggesting this" />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add Suggestion'}
        </button>
      </form>

      <h3 className="workspace-section-title">Suggested So Far</h3>
      {loading ? (
        <p className="workspace-loading">Loading...</p>
      ) : items.length === 0 ? (
        <p className="workspace-empty">No suggestions yet.</p>
      ) : (
        <table className="workspace-table">
          <thead>
            <tr><th>Supplement</th><th>Dosage</th><th>Notes</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.suggestion_id}>
                <td>{s.supplement_name}</td>
                <td>{s.dosage || '—'}</td>
                <td>{s.notes || '—'}</td>
                <td>{s.suggested_at.slice(0, 10)}</td>
                <td><button className="btn-delete-small" onClick={() => handleDelete(s.suggestion_id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MemberWorkspaceModal;