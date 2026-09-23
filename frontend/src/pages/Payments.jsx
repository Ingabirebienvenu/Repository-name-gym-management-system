import { useEffect, useState } from 'react';
import { getPayments } from '../services/api';
import PaymentForm from '../components/payments/PaymentForm';
import './Payments.css';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadPayments() {
    try {
      setLoading(true);
      const res = await getPayments();
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  function handleFormClose() {
    setShowForm(false);
    loadPayments();
  }

  function methodBadgeClass(method) {
    if (method === 'MTN Mobile Money') return 'badge-mtn';
    if (method === 'Airtel Money') return 'badge-airtel';
    if (method === 'Bank Transfer') return 'badge-bank';
    return 'badge-cash';
  }

  if (loading) return <div className="payments-page"><p>Loading...</p></div>;

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments</h1>
          <p className="revenue-line">Total Revenue: <strong>{totalRevenue.toLocaleString()} RWF</strong></p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Record Payment</button>
      </div>

      {showForm && <PaymentForm onClose={handleFormClose} />}

      <table className="payments-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Member</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Period</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>No payments recorded yet.</td></tr>
          ) : (
            payments.map((p) => (
              <tr key={p.payment_id}>
                <td>{p.payment_id}</td>
                <td>{p.member_first_name} {p.member_last_name}</td>
                <td>{Number(p.amount).toLocaleString()} RWF</td>
                <td><span className={`method-badge ${methodBadgeClass(p.payment_method)}`}>{p.payment_method}</span></td>
                <td>{p.payment_reference || '—'}</td>
                <td>{p.for_period || '—'}</td>
                <td>{p.payment_date}</td>
                <td>{p.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Payments;