import { useEffect, useState } from 'react';
import { getMembers, deleteMember } from '../services/api';
import MemberForm from '../components/members/MemberForm';
import './Members.css';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadMembers() {
    try {
      setLoading(true);
      const res = await getMembers();
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleDelete(memberId) {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await deleteMember(memberId);
      loadMembers();
    } catch (err) {
      alert('Failed to delete member.');
      console.error(err);
    }
  }

  function handleEdit(member) {
    setEditingMember(member);
    setShowForm(true);
  }

  function handleAddNew() {
    setEditingMember(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingMember(null);
    loadMembers();
  }

  if (loading) return <div className="members-page"><p>Loading...</p></div>;

  return (
    <div className="members-page">
      <div className="members-header">
        <h1>Members</h1>
        <button className="btn-primary" onClick={handleAddNew}>+ Add Member</button>
      </div>

      {showForm && (
        <MemberForm member={editingMember} onClose={handleFormClose} />
      )}

      <table className="members-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: 'center' }}>No members yet.</td></tr>
          ) : (
            members.map((m) => (
              <tr key={m.member_id}>
                <td>{m.member_id}</td>
                <td>{m.first_name} {m.last_name}</td>
                <td>{m.email}</td>
                <td>{m.phone}</td>
                <td>{m.membership_type}</td>
                <td>
                  <span className={`status-badge status-${m.membership_status?.toLowerCase()}`}>
                    {m.membership_status}
                  </span>
                </td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(m)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(m.member_id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Members;