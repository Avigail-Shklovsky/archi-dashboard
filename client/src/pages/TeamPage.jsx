import { useEffect, useState } from 'react';
import { api } from '../api.js';
import RowMenu from '../components/RowMenu.jsx';

// Admin only (enforced by the server): who can sign in to the system
export default function TeamPage() {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // { id, name } while renaming
  const [removing, setRemoving] = useState(null); // the user waiting for delete confirmation

  const load = () => api('/users').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  // Run a server call, show its error, reload the list
  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    if (await run(() => api('/users', { method: 'POST', body: form }))) setForm({ name: '', email: '' });
  };

  const saveName = async (e) => {
    e.preventDefault();
    const { id, name } = editing;
    if (await run(() => api(`/users/${id}`, { method: 'PATCH', body: { name } }))) setEditing(null);
  };

  const confirmRemove = async () => {
    if (await run(() => api(`/users/${removing.id}`, { method: 'DELETE' }))) setRemoving(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>צוות</h1>
          <p className="muted">רק מי שמופיעה כאן (ומנהלים) יכולה להיכנס למערכת.</p>
        </div>
      </div>

      {error && !removing && <div className="error">{error}</div>}

      <div className="dashboard team">
        <section className="card">
          <h2>הוספת עובדת</h2>
          <form className="project-form team-form" onSubmit={add}>
            <label className="field">
              <span>שם</span>
              <input name="name" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>אימייל (חשבון Google)</span>
              <input name="email" type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy}>הוספה</button>
            </div>
            <small className="muted">העובדת תיכנס עם חשבון ה-Google של האימייל הזה.</small>
          </form>
        </section>

        <section className="card">
          <h2>חברי הצוות {users && <span className="muted small">({users.length})</span>}</h2>
          {!users && !error && <p className="muted">טוען…</p>}
          <ul className="team-list">
            {users?.map((u) => (
              <li key={u.id}>
                {u.picture ? <img className="avatar" src={u.picture} alt="" referrerPolicy="no-referrer" /> : <span className="avatar avatar-empty" aria-hidden="true">{u.name.slice(0, 1)}</span>}

                {editing?.id === u.id ? (
                  <form className="team-rename" onSubmit={saveName}>
                    <input
                      value={editing.name}
                      maxLength={100}
                      autoFocus
                      aria-label="שם העובדת"
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                    />
                    <button className="btn btn-primary" disabled={busy || !editing.name.trim()}>שמירה</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>ביטול</button>
                  </form>
                ) : (
                  <>
                    <div className="team-who">
                      <strong>{u.name}</strong>
                      <span className="muted small" dir="ltr">{u.email}</span>
                    </div>
                    {u.role === 'admin' && <span className="badge badge-priority-medium">מנהל</span>}
                    <RowMenu
                      label={`פעולות עבור ${u.name}`}
                      items={[
                        { label: 'עריכת שם', onClick: () => setEditing({ id: u.id, name: u.name }) },
                        ...(u.role === 'admin' ? [] : [{ label: 'מחיקה', danger: true, onClick: () => setRemoving(u) }]),
                      ]}
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {removing && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setRemoving(null)}>
          <div className="card modal" role="alertdialog" aria-modal="true" aria-labelledby="remove-title" aria-describedby="remove-desc">
            <h2 id="remove-title">מחיקת {removing.name}</h2>
            <div id="remove-desc" className="warning">
              <p><strong>שימו לב:</strong></p>
              <ul>
                <li>הגישה של {removing.name} למערכת תיחסם מיד, גם אם היא מחוברת עכשיו.</li>
                <li>כל הפרויקטים שמשויכים אליה יישארו ללא שיוך, ויהיה צריך לשייך אותם מחדש.</li>
                <li>אפשר להוסיף אותה שוב בעתיד עם אותו אימייל.</li>
              </ul>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="form-actions">
              <button className="btn btn-danger" onClick={confirmRemove} disabled={busy} autoFocus>מחיקה</button>
              <button className="btn btn-ghost" onClick={() => setRemoving(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
