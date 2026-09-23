import { useEffect, useState } from 'react';
import { getClasses, deleteClass } from '../services/api';
import ClassForm from '../components/classes/ClassForm';
import './Classes.css';

function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadClasses() {
    try {
      setLoading(true);
      const res = await getClasses();
      setClasses(res.data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleDelete(classId) {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await deleteClass(classId);
      loadClasses();
    } catch (err) {
      alert('Failed to delete class.');
      console.error(err);
    }
  }

  function handleEdit(cls) {
    setEditingClass(cls);
    setShowForm(true);
  }

  function handleAddNew() {
    setEditingClass(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingClass(null);
    loadClasses();
  }

  if (loading) return <div className="classes-page"><p>Loading...</p></div>;

  return (
    <div className="classes-page">
      <div className="classes-header">
        <h1>Classes</h1>
        <button className="btn-primary" onClick={handleAddNew}>+ Add Class</button>
      </div>

      {showForm && (
        <ClassForm classItem={editingClass} onClose={handleFormClose} />
      )}

      <table className="classes-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Trainer</th>
            <th>Day</th>
            <th>Time</th>
            <th>Capacity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: 'center' }}>No classes yet.</td></tr>
          ) : (
            classes.map((c) => (
              <tr key={c.class_id}>
                <td>{c.class_id}</td>
                <td>{c.class_name}</td>
                <td>{c.trainer_first_name ? `${c.trainer_first_name} ${c.trainer_last_name}` : '—'}</td>
                <td>{c.schedule_day}</td>
                <td>{c.start_time} - {c.end_time}</td>
                <td>{c.capacity}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(c)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(c.class_id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Classes;