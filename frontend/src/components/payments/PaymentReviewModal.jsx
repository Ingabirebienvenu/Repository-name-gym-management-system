import { useState } from 'react';
import { validatePayment, rejectPayment } from '../../services/api';
import './PaymentReviewModal.css';

function PaymentReviewModal({ payment, onClose }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  async function handleValidate() {
    setProcessing(true);
    setError('');
    try {
      await validatePayment(payment.payment_id);
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to validate payment.');
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!window.confirm('Reject this payment? The member will be notified.')) return;
    setProcessing(true);
    setError('');
    try {
      await rejectPayment(payment.payment_id);
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject payment.');
      setProcessing(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal review-modal">
        <h2>Review Payment</h2>
        {error && <p className="form-error">{error}</p>}

        <div className="review-details">
          <div className="review-row">
            <span>Member</span>
            <strong>{payment.member_first_name} {payment.member_last_name}</strong>
          </div>
          <div className="review-row">
            <span>Email</span>
            <strong>{payment.member_email}</strong>
          </div>
          <div className="review-row">
            <span>Amount</span>
            <strong>{Number(payment.amount).toLocaleString()} RWF</strong>
          </div>
          <div className="review-row">
            <span>Method</span>
            <strong>{payment.payment_method}</strong>
          </div>
          <div className="review-row">
            <span>Reference</span>
            <strong>{payment.payment_reference || '—'}</strong>
          </div>
          <div className="review-row">
            <span>Duration</span>
            <strong>{payment.duration_months} month{payment.duration_months > 1 ? 's' : ''}</strong>
          </div>
          <div className="review-row">
            <span>Submitted</span>
            <strong>{payment.payment_date}</strong>
          </div>
        </div>

        <p className="review-note">
          Confirming will activate this member's account and automatically set their membership start/end dates. They'll also receive a confirmation email.
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-reject" onClick={handleReject} disabled={processing}>
            Reject
          </button>
          <button type="button" className="btn-secondary" onClick={() => onClose(false)} disabled={processing}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleValidate} disabled={processing}>
            {processing ? 'Processing...' : 'Confirm & Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentReviewModal;