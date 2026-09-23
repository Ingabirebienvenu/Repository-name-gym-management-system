import { useState, useEffect } from 'react';
import { createPayment, getMembers } from '../../services/api';
import { validatePhoneNumber, validateAccountNumber, RWANDA_BANKS } from '../../utils/paymentValidation';
import './PaymentForm.css';

const PAYMENT_METHODS = ['MTN Mobile Money', 'Airtel Money', 'Bank Transfer', 'Cash'];

function PaymentForm({ onClose }) {
  const [members, setMembers] = useState([]);
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_method: 'MTN Mobile Money',
    for_period: '',
    phone: '',
    bank_name: RWANDA_BANKS[0],
    account_number: '',
  });

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await getMembers();
        setMembers(res.data);
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    }
    loadMembers();
  }, []);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!formData.member_id) return 'Please select a member';
    if (!formData.amount || Number(formData.amount) <= 0) return 'Please enter a valid amount';

    if (formData.payment_method === 'MTN Mobile Money' || formData.payment_method === 'Airtel Money') {
      const phoneError = validatePhoneNumber(formData.phone, formData.payment_method);
      if (phoneError) return phoneError;
    }

    if (formData.payment_method === 'Bank Transfer') {
      if (!formData.bank_name) return 'Please select a bank';
      const accountError = validateAccountNumber(formData.account_number);
      if (accountError) return accountError;
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setStep('processing');

    // Simulate a payment gateway processing delay
    setTimeout(async () => {
      try {
        const reference =
          formData.payment_method === 'Bank Transfer'
            ? `${formData.bank_name} - ${formData.account_number}`
            : formData.phone;

        await createPayment({
          member_id: formData.member_id,
          amount: formData.amount,
          payment_method: formData.payment_method,
          payment_reference: reference,
          for_period: formData.for_period,
          status: 'Paid',
        });

        setStep('success');
      } catch (err) {
        setError(err.response?.data?.error || 'Payment failed. Please try again.');
        setStep('form');
      }
    }, 1800);
  }

  if (step === 'processing') {
    return (
      <div className="modal-overlay">
        <div className="modal payment-modal">
          <div className="processing-state">
            <div className="spinner"></div>
            <p>Processing {formData.payment_method} payment...</p>
            <p className="processing-sub">Please wait, do not close this window.</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="modal-overlay">
        <div className="modal payment-modal">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>Payment Successful</h2>
            <p>{Number(formData.amount).toLocaleString()} RWF received via {formData.payment_method}</p>
            <button className="btn-primary btn-full" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal payment-modal">
        <h2>Record a Payment</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Member</label>
            <select name="member_id" value={formData.member_id} onChange={handleChange} required>
              <option value="">-- Select a member --</option>
              {members.map((m) => (
                <option key={m.member_id} value={m.member_id}>
                  {m.first_name} {m.last_name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Amount (RWF)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} min="1" required />
          </div>

          <div className="form-row">
            <label>For Period</label>
            <input name="for_period" value={formData.for_period} onChange={handleChange} placeholder="e.g. October 2026" />
          </div>

          <div className="form-row">
            <label>Payment Method</label>
            <div className="method-selector">
              {PAYMENT_METHODS.map((method) => (
                <button
                  type="button"
                  key={method}
                  className={`method-btn ${formData.payment_method === method ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, payment_method: method })}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {(formData.payment_method === 'MTN Mobile Money' || formData.payment_method === 'Airtel Money') && (
            <div className="form-row">
              <label>{formData.payment_method} Phone Number</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                maxLength={10}
                required
              />
              <small className="field-hint">
                {formData.payment_method === 'MTN Mobile Money' ? 'Must start with 078 or 079' : 'Must start with 072 or 073'}
              </small>
            </div>
          )}

          {formData.payment_method === 'Bank Transfer' && (
            <>
              <div className="form-row">
                <label>Bank</label>
                <select name="bank_name" value={formData.bank_name} onChange={handleChange} required>
                  {RWANDA_BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Account Number</label>
                <input
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleChange}
                  placeholder="8–16 digit account number"
                  required
                />
              </div>
            </>
          )}

          {formData.payment_method === 'Cash' && (
            <p className="field-hint">Cash payments are recorded immediately, no reference needed.</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Pay Now</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentForm;