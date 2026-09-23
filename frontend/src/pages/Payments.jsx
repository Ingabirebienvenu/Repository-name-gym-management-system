import { useEffect, useState } from 'react';
import { getPayments } from '../services/api';
import PaymentReviewModal from '../components/payments/PaymentReviewModal';
import './Payments.css';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingPayment, setReviewingPayment] = useState(null);

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

  function handleReviewClose(didChange) {
    setReviewingPayment(null);
    if (didChange) loadPayments();
  }

  function methodBadgeClass(method) {
    if (method === 'MTN Mobile Money') return 'badge-mtn';
    if (method === 'Airtel Money') return 'badge-airtel';
    if (method === 'Bank Transfer') return 'badge-bank';
    return 'badge-cash';
  }

  function statusBadgeClass(status) {
    if (status === 'Paid') return 'status-paid';
    if (status === 'Pending') return 'status-pending';
    return 'status-failed';
  }

  if (loading) return <div className="payments-page"><p>Loading...</p></div>;

  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'Pending').length;

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments</h1>
          <p className="revenue-line">
            Total Revenue: <strong>{totalRevenue.toLocaleString()} RWF</strong>
            {pendingCount > 0 && <span className="pending-pill">{pendingCount} pending review</span>}
          </p>
        </div>
      </div>

      {reviewingPayment && (
        <PaymentReviewModal payment={reviewingPayment} onClose={handleReviewClose} />
      )}

      <table className="payments-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Member</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center' }}>No payments recorded yet.</td></tr>
          ) : (
            payments.map((p) => (
              <tr key={p.payment_id} className={p.status === 'Pending' ? 'row-pending' : ''}>
                <td>{p.payment_id}</td>
                <td>{p.member_first_name} {p.member_last_name}</td>
                <td>{Number(p.amount).toLocaleString()} RWF</td>
                <td><span className={`method-badge ${methodBadgeClass(p.payment_method)}`}>{p.payment_method}</span></td>
                <td>{p.payment_reference || '—'}</td>
                <td>{p.payment_date}</td>
                <td><span className={`status-badge ${statusBadgeClass(p.status)}`}>{p.status}</span></td>
                <td>
                  {p.status === 'Pending' && (
                    <button className="btn-primary btn-small" onClick={() => setReviewingPayment(p)}>Review</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Payments;