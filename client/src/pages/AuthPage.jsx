import { useState } from 'react';
import { useApp } from '../AppContext.jsx';

export default function AuthPage() {
  const { authenticate } = useApp();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authenticate(mode, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden="true" />
          ניהול פרויקטים
        </div>
        <h1>{isRegister ? 'הרשמה' : 'התחברות'}</h1>

        {isRegister && (
          <label className="field">
            <span>שם מלא</span>
            <input name="name" value={form.name} onChange={update} required autoFocus />
          </label>
        )}
        <label className="field">
          <span>אימייל</span>
          <input name="email" type="email" dir="ltr" value={form.email} onChange={update} required />
        </label>
        <label className="field">
          <span>סיסמה</span>
          <input name="password" type="password" dir="ltr" value={form.password} onChange={update} required minLength={6} />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {isRegister ? 'יצירת חשבון' : 'כניסה'}
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}
        >
          {isRegister ? 'כבר יש לך חשבון? להתחברות' : 'אין לך חשבון? להרשמה'}
        </button>
      </form>
    </div>
  );
}
