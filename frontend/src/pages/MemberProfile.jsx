import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMemberProfile, saveMemberProfile, changeMemberPassword } from '../services/profileApi';
import './MemberPortal.css';
import './MemberProfile.css';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function MemberProfile() {
  const { user, token, role, loginUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);       // { type, text } for the details form

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwNotice, setPwNotice] = useState(null);

  function fillForm(p) {
    setForm({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      email: p.email || '',
      phone: p.phone || '',
      date_of_birth: p.date_of_birth || '',
    });
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await getMemberProfile(user.id);
        setProfile(res.data);
        fillForm(res.data);
      } catch (err) {
        console.error(err);
        setNotice({ type: 'error', text: 'Could not load your profile.' });
      } finally {
        setLoading(false);
      }
    }
    if (user) load();
  }, [user?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = profile && (
    form.first_name !== (profile.first_name || '') ||
    form.last_name !== (profile.last_name || '') ||
    form.email !== (profile.email || '') ||
    form.phone !== (profile.phone || '') ||
    form.date_of_birth !== (profile.date_of_birth || '')
  );

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setNotice(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await saveMemberProfile(user.id, form);
      const updated = res.data.profile;
      setProfile(updated);
      fillForm(updated);
      // keep the name in the navbar / dashboard in sync without logging out
      loginUser({
        token,
        role,
        user: { ...user, first_name: updated.first_name, last_name: updated.last_name, email: updated.email },
      });
      setNotice({ type: 'ok', text: 'Your profile has been updated.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.error || 'Failed to update your profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    setPwNotice(null);
    if (pw.new_password.length < 6) {
      setPwNotice({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (pw.new_password !== pw.confirm) {
      setPwNotice({ type: 'error', text: 'The two new passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      await changeMemberPassword(user.id, {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      setPw({ current_password: '', new_password: '', confirm: '' });
      setPwNotice({ type: 'ok', text: 'Password changed. Use it next time you log in.' });
    } catch (err) {
      setPwNotice({ type: 'error', text: err.response?.data?.error || 'Failed to change the password.' });
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) return <div className="member-dashboard"><p className="loading-text">Loading your profile...</p></div>;
  if (!profile) return <div className="member-dashboard"><p className="mp-notice error">{notice?.text || 'Profile not found.'}</p></div>;

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="member-dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-sub">Keep your details up to date. Your trainers and the gym use them to contact you.</p>
        </div>
      </div>

      <div className="mp-layout">
        <div className="mp-main">
          <form className="panel" onSubmit={handleSave}>
            <h3 className="panel-title">Personal details</h3>

            <div className="mp-grid">
              <label>
                <span>First name</span>
                <input name="first_name" value={form.first_name} onChange={onChange} maxLength={50} required />
              </label>
              <label>
                <span>Last name</span>
                <input name="last_name" value={form.last_name} onChange={onChange} maxLength={50} required />
              </label>
              <label className="wide">
                <span>Email</span>
                <input type="email" name="email" value={form.email} onChange={onChange} maxLength={100} required />
                <small>This is also the email you log in with and where we send your notifications.</small>
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" value={form.phone} onChange={onChange} maxLength={20} placeholder="+250 7xx xxx xxx" />
              </label>
              <label>
                <span>Date of birth</span>
                <input type="date" name="date_of_birth" value={form.date_of_birth} max={todayISO()} onChange={onChange} />
              </label>
            </div>

            {notice && <p className={`mp-notice ${notice.type}`}>{notice.text}</p>}

            <div className="mp-actions">
              <button type="button" className="mp-secondary" disabled={!dirty || saving}
                      onClick={() => { fillForm(profile); setNotice(null); }}>Reset</button>
              <button type="submit" className="mp-primary" disabled={!dirty || saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          <form className="panel" onSubmit={handlePassword}>
            <h3 className="panel-title">Change password</h3>
            <div className="mp-grid">
              <label className="wide">
                <span>Current password</span>
                <input type="password" autoComplete="current-password" value={pw.current_password}
                       onChange={(e) => { setPw({ ...pw, current_password: e.target.value }); setPwNotice(null); }} required />
              </label>
              <label>
                <span>New password</span>
                <input type="password" autoComplete="new-password" value={pw.new_password} minLength={6}
                       onChange={(e) => { setPw({ ...pw, new_password: e.target.value }); setPwNotice(null); }} required />
              </label>
              <label>
                <span>Confirm new password</span>
                <input type="password" autoComplete="new-password" value={pw.confirm}
                       onChange={(e) => { setPw({ ...pw, confirm: e.target.value }); setPwNotice(null); }} required />
              </label>
            </div>
            {pwNotice && <p className={`mp-notice ${pwNotice.type}`}>{pwNotice.text}</p>}
            <div className="mp-actions">
              <button type="submit" className="mp-primary" disabled={pwSaving}>
                {pwSaving ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </div>

        <aside className="mp-side">
          <div className="panel mp-card">
            <div className="mp-avatar">{initials}</div>
            <h3>{profile.first_name} {profile.last_name}</h3>
            <p className="mp-email">{profile.email}</p>
            <span className={`mp-status ${String(profile.membership_status || '').toLowerCase()}`}>
              {profile.membership_status}
            </span>
          </div>
          <div className="panel">
            <h3 className="panel-title">Membership</h3>
            <div className="mp-row"><span>Plan</span><strong>{profile.membership_type}</strong></div>
            <div className="mp-row"><span>Member since</span><strong>{fmtDate(profile.join_date)}</strong></div>
            <div className="mp-row"><span>Valid from</span><strong>{fmtDate(profile.membership_start_date)}</strong></div>
            <div className="mp-row"><span>Valid until</span><strong>{fmtDate(profile.membership_end_date)}</strong></div>
            <p className="mp-hint">Plan and status are managed by the gym. Contact the front desk to change them.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MemberProfile;