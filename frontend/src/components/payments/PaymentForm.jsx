import { useState } from 'react';
import { submitPayment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { validatePhoneNumber, validateAccountNumber, RWANDA_BANKS } from '../../utils/paymentValidation';
import './PaymentForm.css';

const PAYMENT_METHODS = ['MTN Mobile Money', 'Airtel Money', 'Bank Transfer', 'Cash'];
const DURATIONS = [
  { label: '1 Month', months: 1, price: 15000 },
  { label: '3 Months', months: 3, price: 40000 },
  { label: '6 Months', months: 6, price: 75000 },
  { label: '12 Months', months: 12, price: 140000 },
];

function PaymentForm({ onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    duration_index: 0,
    payment_method: 'MTN Mobile Money',
    phone: '',
    bank_name: RWANDA_BANKS[0],
    account_number: '',
  });

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function validate() {
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
    const selectedDuration = DURATIONS[formData.duration_index];

    setTimeout(async () => {
      try {
        const reference =
          formData.payment_method === 'Bank Transfer'
            ? `${formData.bank_name} - ${formData.account_number}`
            : formData.payment_method === 'Cash'
            ? 'In-person'
            : formData.phone;

        await submitPayment({
          member_id: user.id,
          amount: selectedDuration.price,
          payment_method: formData.payment_method,
          payment_reference: reference,
          for_period: selectedDuration.label,
          duration_months: selectedDuration.months,
        });

        setStep('success');
      } catch (err) {
        setError(err.response?.data?.error || 'Payment failed. Please try again.');
        setStep('form');
      }
    }, 1800);
  }

  const selectedDuration = DURATIONS[formData.duration_index];

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
            <h2>Payment Submitted</h2>
            <p>Your {selectedDuration.price.toLocaleString()} RWF payment for {selectedDuration.label} is awaiting admin confirmation. You'll get an email once it's approved.</p>
            <button className="btn-primary btn-full" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal payment-modal">
        <h2>Pay for Membership</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Duration</label>
            <div className="duration-selector">
              {DURATIONS.map((d, i) => (
                <button
                  type="button"
                  key={d.label}
                  className={`duration-btn ${formData.duration_index === i ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, duration_index: i })}
                >
                  <span className="duration-label">{d.label}</span>
                  <span className="duration-price">{d.price.toLocaleString()} RWF</span>
                </button>
              ))}
            </div>
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
            <p className="field-hint">Pay at the front desk, then submit here — an admin will confirm it.</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PaymentForm;