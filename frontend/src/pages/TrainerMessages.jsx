import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrainerMembers } from '../services/api';
import MemberWorkspaceModal from '../components/trainers/MemberWorkspaceModal';
import './TrainerDashboard.css';

function TrainerMessages() {
  const { user } = useAuth();
  const [myMembers, setMyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceMember, setWorkspaceMember] = useState(null);

  async function loadMembers() {
    try {
      setLoading(true);
      const res = await getTrainerMembers(user.id);
      setMyMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadMembers();
  }, [user]);

  function handleWorkspaceClose() {
    setWorkspaceMember(null);
    loadMembers();
  }

  if (loading) return <div className="trainer-dashboard"><p className="loading-text">Loading your members...</p></div>;

  return (
    <div className="trainer-dashboard">
      <div className="section-heading"><h1 className="page-title">Messages</h1></div>
      {myMembers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No members yet</h3>
          <p>Once someone books into one of your classes, they'll appear here so you can message them, log their progress, and suggest supplements.</p>
        </div>
      ) : (
        <div className="members-grid">
          {myMembers.map((m) => (
            <div key={m.member_id} className="member-mini-card" onClick={() => setWorkspaceMember(m)}>
              <div className="member-mini-avatar">
                {(m.first_name?.[0] || '')}{(m.last_name?.[0] || '')}
              </div>
              <div className="member-mini-info">
                <strong>{m.first_name} {m.last_name}</strong>
                <span>{m.email}</span>
              </div>
              {m.unread_count > 0 && <span className="unread-badge">{m.unread_count}</span>}
            </div>
          ))}
        </div>
      )}

      {workspaceMember && (
        <MemberWorkspaceModal member={workspaceMember} onClose={handleWorkspaceClose} />
      )}
    </div>
  );
}

export default TrainerMessages;