import { useEffect, useState } from 'react';
import { getTrainers, deleteTrainer } from '../services/api';
import TrainerForm from '../components/trainers/TrainerForm';
import './Trainers.css';

function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadTrainers() {
    try {
      setLoading(true);
      const res = await getTrainers();
      setTrainers(res.data);
    } catch (err) {
      console.error('Failed to load trainers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrainers();
  }, []);

  async function handleDelete(trainerId) {
    if (!window.confirm('Are you sure you want to delete this trainer?')) return;
    try {
      await deleteTrainer(trainerId);
      loadTrainers();
    } catch (err) {
      alert('Failed to delete trainer.');
      console.error(err);
    }
  }

  function handleEdit(trainer) {
    setEditingTrainer(trainer);
    setShowForm(true);
  }

  function handleAddNew() {
    setEditingTrainer(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingTrainer(null);
    loadTrainers();
  }

  if (loading) return <div className="trainers-page"><p>Loading...</p></div>;

  return (
    <div className="trainers-page">
      <div className="trainers-header">
        <h1>Trainers</h1>
        <button className="btn-primary" onClick={handleAddNew}>+ Add Trainer</button>
      </div>

      {showForm && (
        <TrainerForm trainer={editingTrainer} onClose={handleFormClose} />
      )}

      <table className="trainers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Specialization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trainers.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center' }}>No trainers yet.</td></tr>
          ) : (
            trainers.map((t) => (
              <tr key={t.trainer_id}>
                <td>{t.trainer_id}</td>
                <td>{t.first_name} {t.last_name}</td>
                <td>{t.email}</td>
                <td>{t.phone}</td>
                <td>{t.specialization}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(t)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(t.trainer_id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Trainers;