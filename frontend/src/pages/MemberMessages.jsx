import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversation, sendMessage, markConversationRead } from '../services/api';
import { getMemberTrainers } from '../services/memberApi';
import './MemberPortal.css';

function initials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

function timeLabel(s) {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T'));
  if (isNaN(d)) return s.slice(0, 16);
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function MemberMessages() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function loadTrainers() {
    try {
      const res = await getMemberTrainers(user.id);
      setTrainers(res.data);
      setActive((cur) => cur || res.data[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(trainer) {
    if (!trainer) return;
    try {
      const res = await getConversation(trainer.trainer_id, user.id);
      setMessages(res.data);
      await markConversationRead(trainer.trainer_id, user.id, 'member');
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (user) loadTrainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load the open conversation and refresh it every 8 seconds
  useEffect(() => {
    if (!active) return undefined;
    setMessages([]);
    loadConversation(active);
    const timer = setInterval(() => loadConversation(active), 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.trainer_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setSending(true);
    try {
      await sendMessage({
        trainer_id: active.trainer_id,
        member_id: user.id,
        sender: 'member',
        message: text.trim(),
      });
      setText('');
      await loadConversation(active);
      loadTrainers();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function selectTrainer(t) {
    setActive(t);
    setTrainers((list) => list.map((x) => (x.trainer_id === t.trainer_id ? { ...x, unread_count: 0 } : x)));
  }

  if (loading) return <div className="member-dashboard"><p className="loading-text">Loading messages...</p></div>;

  return (
    <div className="member-dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-sub">Chat with the trainer of your booked classes.</p>
        </div>
      </div>

      {trainers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No trainer assigned yet</h3>
          <p>You're matched with a trainer when you book one of their classes.
            <br /><Link to="/member">Go book a class</Link> to start chatting.</p>
        </div>
      ) : (
        <div className="chat-shell">
          <div className="chat-list">
            {trainers.map((t) => (
              <button
                key={t.trainer_id}
                className={`chat-list-item ${active?.trainer_id === t.trainer_id ? 'active' : ''}`}
                onClick={() => selectTrainer(t)}
              >
                <div className="mini-avatar">{initials(t.first_name, t.last_name)}</div>
                <div className="chat-list-text">
                  <strong>{t.first_name} {t.last_name}</strong>
                  <span>{t.last_message || t.specialization || 'Say hello'}</span>
                </div>
                {t.unread_count > 0 && <span className="unread-badge">{t.unread_count}</span>}
              </button>
            ))}
          </div>

          <div className="chat-window">
            {active && (
              <>
                <div className="chat-header">
                  <div className="mini-avatar large">{initials(active.first_name, active.last_name)}</div>
                  <div>
                    <strong>{active.first_name} {active.last_name}</strong>
                    <span>{active.specialization || 'Trainer'}</span>
                  </div>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <p className="chat-empty">No messages yet. Ask about your plan, a class, or your goals.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.message_id} className={`chat-row ${m.sender === 'member' ? 'mine' : 'theirs'}`}>
                        <div className="chat-bubble">
                          <p>{m.message}</p>
                          <span>{timeLabel(m.sent_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                <form className="chat-input" onSubmit={handleSend}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Message ${active.first_name}...`}
                  />
                  <button type="submit" disabled={sending || !text.trim()}>Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberMessages;