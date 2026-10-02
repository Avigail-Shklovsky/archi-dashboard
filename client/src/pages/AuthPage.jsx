import { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext.jsx';

// Waits for the Google Identity Services script (loaded in index.html)
function whenGoogleReady(callback) {
  if (window.google?.accounts?.id) return callback();
  const timer = setInterval(() => {
    if (window.google?.accounts?.id) {
      clearInterval(timer);
      callback();
    }
  }, 100);
  return () => clearInterval(timer);
}

export default function AuthPage() {
  const { meta, loginWithGoogle } = useApp();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const clientId = meta.googleClientId;

  useEffect(() => {
    if (!clientId) return;
    return whenGoogleReady(() => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setError('');
          setBusy(true);
          try {
            await loginWithGoogle(credential);
          } catch (err) {
            setError(err.message);
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        locale: 'he',
        width: 300,
      });
    });
  }, [clientId, loginWithGoogle]);

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <img src="/logo.png" alt="תלם מדידות הנדסיות" className="auth-logo" />
        <h1>ניהול פרויקטים</h1>
        <p className="muted">ההרשמה וההתחברות מתבצעות עם חשבון Google.</p>

        {clientId ? (
          <div className="google-btn" ref={buttonRef} aria-busy={busy} />
        ) : (
          <div className="error">התחברות עם Google עדיין לא הוגדרה (חסר GOOGLE_CLIENT_ID בשרת).</div>
        )}

        {busy && <p className="muted">מתחבר…</p>}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
