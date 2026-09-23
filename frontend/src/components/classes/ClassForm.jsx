import { useState, useEffect } from 'react';
import { createClass, updateClass, getTrainers } from '../../services/api';
import '../members/MemberForm.css';

function ClassForm({ classItem, onClose }) {
  const isEditing = Boolean(classItem);

  const [trainers, setTrainers] = useState([]);
  const [formData, setFormData] = useState({
    class_name: classItem?.class_name || '',
    description: classItem?.description || '',
    trainer_id: classItem?.trainer_id || '',
    schedule_day: classItem?.schedule_day || 'Monday',
    start_time: classItem?.start_time || '',
    end_time: classItem?.end_time || '',
    capacity: classItem?.capacity || 20,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTrainers() {
      try {
        const res = await getTrainers();
        setTrainers(res.data);
      } catch (err) {
        console.error('Failed to load trainers:', err);
      }
    }
    loadTrainers();
  }, []);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...formData, trainer_id: formData.trainer_id || null };
      if (isEditing) {
        await updateClass(classItem.class_id, payload);
      } else {
        await createClass(payload);
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
        <h2>{isEditing ? 'Edit Class' : 'Add New Class'}</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Class Name</label>
            <input name="class_name" value={formData.class_name} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Description</label>
            <input name="description" value={formData.description} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Trainer</label>
            <select name="trainer_id" value={formData.trainer_id} onChange={handleChange}>
              <option value="">-- No trainer assigned --</option>
              {trainers.map((t) => (
                <option key={t.trainer_id} value={t.trainer_id}>
                  {t.first_name} {t.last_name} ({t.specialization || 'General'})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Day</label>
            <select name="schedule_day" value={formData.schedule_day} onChange={handleChange}>
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Start Time</label>
            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>End Time</label>
            <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <label>Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" />
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

export default ClassForm;