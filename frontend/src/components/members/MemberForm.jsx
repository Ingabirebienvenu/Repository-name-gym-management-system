import { useState } from 'react';
import { createMember, updateMember } from '../../services/api';
import './MemberForm.css';

function MemberForm({ member, onClose }) {
  const isEditing = Boolean(member);

  const [formData, setFormData] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    date_of_birth: member?.date_of_birth || '',
    membership_type: member?.membership_type || 'Basic',
    membership_status: member?.membership_status || 'Active',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await updateMember(member.member_id, formData);
      } else {
        await createMember(formData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>First Name</label>
            <input name="first_name" value={formData.first_name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Last Name</label>
            <input name="last_name" value={formData.last_name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Date of Birth</label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Membership Type</label>
            <select name="membership_type" value={formData.membership_type} onChange={handleChange}>
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          {isEditing && (
            <div className="form-row">
              <label>Status</label>
              <select name="membership_status" value={formData.membership_status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberForm;