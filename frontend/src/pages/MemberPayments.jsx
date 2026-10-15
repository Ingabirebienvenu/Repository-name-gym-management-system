import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPaymentsByMember, getMember } from '../services/api';
import PaymentForm from '../components/payments/PaymentForm';
import './MemberPortal.css';

const PLANS = [
  { label: '1 Month', months: 1, price: 15000 },
  { label: '3 Months', months: 3, price: 40000, note: 'Save 5,000 RWF' },
  { label: '6 Months', months: 6, price: 75000, note: 'Save 15,000 RWF' },
  { label: '12 Months', months: 12, price: 140000, note: 'Best value' },
];

const METHODS = [
  { name: 'MTN Mobile Money', icon: '📱', hint: '078 / 079 numbers' },
  { name: 'Airtel Money', icon: '📲', hint: '072 / 073 numbers' },
  { name: 'Bank Transfer', icon: '🏦', hint: 'Rwandan bank account' },
  { name: 'Cash', icon: '💵', hint: 'Pay at the front desk' },
];

const METHOD_ICON = Object.fromEntries(METHODS.map((m) => [m.name, m.icon]));

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function printReceipt(p, user) {
  const w = window.open('', '_blank', 'width=640,height=760');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Receipt #${esc(p.payment_id)}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}
    h1{margin:0 0 4px}.sub{color:#64748b;margin:0 0 28px}
    table{width:100%;border-collapse:collapse}td{padding:10px 0;border-bottom:1px solid #e2e8f0}
    td:first-child{color:#64748b;width:45%}.total{font-size:1.4rem;font-weight:700}
    .paid{display:inline-block;background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:20px;font-weight:700}
  </style></head><body>
  <h1>Gym Manager</h1><p class="sub">Payment receipt #${esc(p.payment_id)}</p>
  <table>
    <tr><td>Member</td><td>${esc(user.first_name)} ${esc(user.last_name)}</td></tr>
    <tr><td>Date</td><td>${esc(p.payment_date)}</td></tr>
    <tr><td>Period</td><td>${esc(p.for_period || `${p.duration_months || 1} month(s)`)}</td></tr>
    <tr><td>Payment method</td><td>${esc(p.payment_method)}</td></tr>
    <tr><td>Reference</td><td>${esc(p.payment_reference || '—')}</td></tr>
    <tr><td>Membership starts</td><td>${esc(p.membership_start_date || '—')}</td></tr>
    <tr><td>Membership ends</td><td>${esc(p.membership_end_date || '—')}</td></tr>
    <tr><td>Status</td><td><span class="paid">${esc(p.status)}</span></td></tr>
    <tr><td>Amount</td><td class="total">${Number(p.amount).toLocaleString()} RWF</td></tr>
  </table>
  <script>window.onload=function(){window.print();}<\/script>
  </body></html>`);
  w.document.close();
}

function MemberPayments() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const [mRes, pRes] = await Promise.all([getMember(user.id), getPaymentsByMember(user.id)]);
      setProfile(mRes.data);
      setPayments(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div className="member-dashboard"><p className="loading-text">Loading payments...</p></div>;

  const paid = payments.filter((p) => p.status === 'Paid');
  const pending = payments.filter((p) => p.status === 'Pending');
  const totalPaid = paid.reduce((s, p) => s + Number(p.amount || 0), 0);

  const remaining = daysUntil(profile?.membership_end_date);
  const hasDates = profile?.membership_start_date && profile?.membership_end_date;
  let pct = 0;
  if (hasDates) {
    const total = new Date(profile.membership_end_date) - new Date(profile.membership_start_date);
    const left = new Date(profile.membership_end_date) - new Date();
    pct = total > 0 ? Math.max(0, Math.min(100, Math.round((left / total) * 100))) : 0;
  }

  let statusText = 'No membership yet';
  let statusClass = 'none';
  if (remaining !== null) {
    if (remaining > 0) { statusText = 'Active'; statusClass = remaining <= 7 ? 'warn' : 'ok'; }
    else { statusText = 'Expired'; statusClass = 'expired'; }
  }

  return (
    <div className="member-dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-sub">Your membership, payment methods and history.</p>
        </div>
        <button className="btn-pay-hero dark" onClick={() => setShowForm(true)}>
          {remaining > 0 ? 'Renew Membership' : 'Pay for Membership'}
        </button>
      </div>

      {pending.length > 0 && (
        <p className="dashboard-message warn">
          {pending.length} payment{pending.length > 1 ? 's are' : ' is'} awaiting admin confirmation.
          Your membership dates will be set and emailed to you after approval.
        </p>
      )}

      <div className="pay-top">
        <div className="panel membership-card">
          <div className="mc-head">
            <h3 className="panel-title">Membership</h3>
            <span className={`mc-status ${statusClass}`}>{statusText}</span>
          </div>
          <p className="mc-type">{profile?.membership_type || 'Basic'} plan</p>
          {hasDates ? (
            <>
              <div className="mc-dates">
                <div><span>Started</span><strong>{profile.membership_start_date}</strong></div>
                <div><span>Ends</span><strong>{profile.membership_end_date}</strong></div>
                <div><span>Remaining</span><strong>{remaining > 0 ? `${remaining} days` : 'Expired'}</strong></div>
              </div>
              <div className="mc-bar"><div className={`mc-fill ${statusClass}`} style={{ width: `${pct}%` }} /></div>
            </>
          ) : (
            <p className="muted">Pay for a plan below and an admin will activate your membership.</p>
          )}
        </div>

        <div className="pay-summary">
          <div className="member-stat-card">
            <div className="stat-icon icon-green">✅</div>
            <div><h3>Total Paid</h3><p>{totalPaid.toLocaleString()} RWF</p></div>
          </div>
          <div className="member-stat-card">
            <div className="stat-icon icon-amber">⏳</div>
            <div><h3>Pending</h3><p>{pending.length}</p></div>
          </div>
        </div>
      </div>

      <section>
        <div className="section-heading"><h2>Membership Plans</h2></div>
        <div className="plan-grid">
          {PLANS.map((pl) => (
            <div key={pl.months} className="plan-card">
              <h3>{pl.label}</h3>
              <p className="plan-price">{pl.price.toLocaleString()} <small>RWF</small></p>
              <p className="plan-note">{pl.note || `${Math.round(pl.price / pl.months).toLocaleString()} RWF / month`}</p>
              <button className="btn-primary" onClick={() => setShowForm(true)}>Choose</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-heading"><h2>Accepted Payment Methods</h2></div>
        <div className="method-grid">
          {METHODS.map((m) => (
            <div key={m.name} className="method-card">
              <span className="method-icon">{m.icon}</span>
              <div><strong>{m.name}</strong><span>{m.hint}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-heading"><h2>Payment History</h2></div>
        {payments.length === 0 ? (
          <div className="empty-state small"><p>No payments yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr><th>Date</th><th>Period</th><th>Method</th><th>Reference</th><th>Amount</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td>{p.payment_date}</td>
                    <td>{p.for_period || `${p.duration_months || 1} month(s)`}</td>
                    <td>{METHOD_ICON[p.payment_method] || '💳'} {p.payment_method}</td>
                    <td className="mono">{p.payment_reference || '—'}</td>
                    <td><strong>{Number(p.amount).toLocaleString()} RWF</strong></td>
                    <td><span className={`status-pill status-${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'Paid' && (
                        <button className="btn-link" onClick={() => printReceipt(p, user)}>Receipt</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && <PaymentForm onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

export default MemberPayments;