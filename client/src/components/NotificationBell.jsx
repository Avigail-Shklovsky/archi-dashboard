import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { BellIcon } from './Icons.jsx';

const POLL_MS = 30_000;

function messageOf(n) {
  const title = `"${n.projectTitle}"`;
  switch (n.type) {
    case 'project_submitted':
      return `${n.actorName} הגישה את הפרויקט ${title}`;
    case 'project_assigned':
      return `שויך אלייך פרויקט חדש: ${title}`;
    case 'tasks_added':
      return n.count === 1 ? `נוספה משימה חדשה לפרויקט ${title}` : `נוספו ${n.count} משימות חדשות לפרויקט ${title}`;
    default:
      return title;
  }
}

// Written out by hand: the browser's Hebrew wording reads "לפני דקה (1)"
function timeAgo(date) {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60_000);
  if (minutes < 1) return 'עכשיו';
  if (minutes === 1) return 'לפני דקה';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'לפני שעה';
  if (hours === 2) return 'לפני שעתיים';
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(date).toLocaleDateString('he-IL');
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [data, setData] = useState({ items: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = useCallback(() => api('/notifications').then(setData).catch(() => {}), []);

  // Check for new notifications every 30 seconds while the tab is visible, and when coming back to it
  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      setData((d) => ({
        unread: Math.max(0, d.unread - 1),
        items: d.items.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      }));
      api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    }
    navigate(`/projects/${n.project}`);
  };

  const readAll = async () => {
    setData((d) => ({ unread: 0, items: d.items.map((x) => ({ ...x, read: true })) }));
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
  };

  const label = data.unread ? `התראות, ${data.unread} חדשות` : 'התראות';

  return (
    <div className="bell" ref={ref}>
      <button type="button" className="icon-btn header-icon" onClick={toggle} aria-label={label} title="התראות" aria-expanded={open} aria-haspopup="true">
        <BellIcon />
        {data.unread > 0 && <span className="bell-count" aria-hidden="true">{data.unread > 9 ? '9+' : data.unread}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="dialog" aria-label="התראות">
          <div className="bell-head">
            <strong>התראות</strong>
            {data.unread > 0 && <button type="button" className="link-btn" onClick={readAll}>סימון הכל כנקרא</button>}
          </div>
          {data.items.length === 0 ? (
            <p className="muted bell-empty">אין התראות</p>
          ) : (
            <ul className="bell-list">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={n.read ? '' : 'unread'} onClick={() => openItem(n)}>
                    <span className="bell-text">{messageOf(n)}</span>
                    <span className="bell-time muted small">{timeAgo(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
