import { useState } from 'react';
import { updateTrainer, resetTrainerPassword } from '../../services/api';
import '../members/MemberForm.css';

function TrainerProfileForm({ trainer, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    first_name: trainer.first_name || '',
    last_name: trainer.last_name || '',
    email: trainer.email || '',
    phone: trainer.phone || '',
    specialization: trainer.specialization || '',
    new_password: '',
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
      await updateTrainer(trainer.trainer_id, formData);
      if (formData.new_password) {
        await resetTrainerPassword(trainer.trainer_id, formData.new_password);
      }
      onSaved({ ...trainer, ...formData });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Your Profile</h2>
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
            <label>Specialization</label>
            <input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Yoga, Weightlifting" />
          </div>
          <div className="form-row">
            <label>New Password (leave blank to keep current)</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TrainerProfileForm;