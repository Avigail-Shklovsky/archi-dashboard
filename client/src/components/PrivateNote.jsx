import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const SAVE_DELAY_MS = 800;

// The signed-in person's own notes on a project (the server never shows them to anyone else).
// Open when there is something written, closed otherwise. Saved automatically while typing.
export default function PrivateNote({ projectId }) {
  const [text, setText] = useState(null); // null while loading
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'
  const timer = useRef(null);
  const pending = useRef(null); // text typed but not sent yet

  const url = `/projects/${projectId}/note`;

  useEffect(() => {
    api(url)
      .then((note) => {
        setText(note.text);
        setOpen(Boolean(note.text.trim()));
      })
      .catch(() => setText(''));
  }, [url]);

  const save = async () => {
    clearTimeout(timer.current);
    if (pending.current === null) return;
    const value = pending.current;
    pending.current = null;
    setStatus('saving');
    try {
      await api(url, { method: 'PUT', body: { text: value } });
      if (pending.current === null) setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  // Don't lose the last words when leaving the page
  useEffect(() => () => {
    if (pending.current !== null) api(url, { method: 'PUT', body: { text: pending.current } }).catch(() => {});
    clearTimeout(timer.current);
  }, [url]);

  const change = (e) => {
    setText(e.target.value);
    pending.current = e.target.value;
    setStatus('');
    clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DELAY_MS);
  };

  if (text === null) return null;

  return (
    <section className="card note-card">
      <button type="button" className={`note-toggle ${open ? 'open' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="group-chevron" aria-hidden="true">‹</span>
        <h2>ההערות שלי</h2>
        <span className="note-private">פרטי</span>
      </button>
      {open && (
        <div className="note-body">
          <textarea
            rows={5}
            value={text}
            maxLength={5000}
            onChange={change}
            onBlur={save}
            placeholder="מה חשוב לך לזכור בפרויקט הזה"
            aria-label="ההערות שלי"
          />
          <div className={`note-status small ${status}`} aria-live="polite">
            {status === 'saving' && 'שומר…'}
            {status === 'saved' && '✓ נשמר'}
            {status === 'error' && 'השמירה נכשלה. נסו להקליד שוב.'}
          </div>
        </div>
      )}
    </section>
  );
}
