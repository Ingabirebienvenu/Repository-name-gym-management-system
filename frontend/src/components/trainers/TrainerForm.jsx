import { useState } from 'react';
import { createTrainer, updateTrainer, resetTrainerPassword } from '../../services/api';
import '../members/MemberForm.css';

function TrainerForm({ trainer, onClose }) {
  const isEditing = Boolean(trainer);

  const [formData, setFormData] = useState({
    first_name: trainer?.first_name || '',
    last_name: trainer?.last_name || '',
    email: trainer?.email || '',
    password: '',
    phone: trainer?.phone || '',
    specialization: trainer?.specialization || '',
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
        await updateTrainer(trainer.trainer_id, formData);
        if (formData.password) {
          await resetTrainerPassword(trainer.trainer_id, formData.password);
        }
      } else {
        await createTrainer(formData);
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
        <h2>{isEditing ? 'Edit Trainer' : 'Add New Trainer'}</h2>
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
            <label>{isEditing ? 'Reset Password (leave blank to keep current)' : 'Password'}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditing}
              minLength={6}
              placeholder={isEditing ? '••••••••' : ''}
            />
          </div>
          <div className="form-row">
            <label>Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Specialization</label>
            <input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Yoga, Weightlifting" />
          </div>
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

export default TrainerForm;