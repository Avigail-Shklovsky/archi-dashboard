import { useEffect, useState } from 'react';
import { api } from '../api.js';

// Admin only (enforced by the server): who can sign in to the system
export default function TeamPage() {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api('/users').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/users', { method: 'POST', body: form });
      setForm({ name: '', email: '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!confirm(`להסיר את ${u.name} מהמערכת? הגישה שלה תיחסם מיד, והפרויקטים שלה יישארו ללא שיוך.`)) return;
    setError('');
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>עובדות</h1>
          <p className="muted">רק מי שמופיעה כאן (ומנהלים) יכולה להיכנס למערכת.</p>
        </div>
      </div>

      <div className="dashboard team">
        <section className="card">
          <h2>הוספת עובדת</h2>
          <form className="project-form team-form" onSubmit={add}>
            <label className="field">
              <span>שם</span>
              <input name="name" value={form.name} onChange={update} required />
            </label>
            <label className="field">
              <span>אימייל (חשבון Google)</span>
              <input name="email" type="email" dir="ltr" value={form.email} onChange={update} required />
            </label>
            {error && <div className="error">{error}</div>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy}>הוספה</button>
            </div>
            <small className="muted">העובדת תיכנס עם חשבון ה-Google של האימייל הזה.</small>
          </form>
        </section>

        <section className="card">
          <h2>צוות {users && <span className="muted small">({users.length})</span>}</h2>
          {!users && !error && <p className="muted">טוען…</p>}
          <ul className="team-list">
            {users?.map((u) => (
              <li key={u.id}>
                {u.picture ? <img className="avatar" src={u.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar avatar-empty" aria-hidden="true">{u.name.slice(0, 1)}</span>}
                <div className="team-who">
                  <strong>{u.name}</strong>
                  <span className="muted small" dir="ltr">{u.email}</span>
                </div>
                {u.role === 'admin' ? (
                  <span className="badge badge-priority-medium">מנהל</span>
                ) : (
                  <>
                    <span className={`badge ${u.joined ? 'badge-status-submitted' : 'badge-status-open'}`}>{u.joined ? 'פעילה' : 'טרם נכנסה'}</span>
                    <button className="icon-btn" title="הסרה" aria-label={`הסרת ${u.name}`} onClick={() => remove(u)}>✕</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
