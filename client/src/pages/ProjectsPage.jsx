import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp, levelSummary, projectTitle, categoriesLabel } from '../AppContext.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import Progress from '../components/Progress.jsx';
import { TypeBadge, PriorityBadge, StatusBadge } from '../components/Badges.jsx';

const ALL = '';
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function ProjectsPage() {
  const { meta, isAdmin } = useApp();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: ALL, status: ALL, priority: ALL, assignee: ALL });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/projects').then(setProjects).catch((e) => setError(e.message));
  }, []);

  const create = async (data) => {
    const project = await api('/projects', { method: 'POST', body: data });
    navigate(`/projects/${project._id}`);
  };

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  // Everyone who has a project, for the admin's "assigned to" filter
  const assignees = [...new Map((projects || []).filter((p) => p.assignedTo).map((p) => [p.assignedTo.id, p.assignedTo])).values()];

  const search = filters.search.trim().toLowerCase();
  const visible = (projects || [])
    .filter((p) => !search || [projectTitle(p), p.purpose].join(' ').toLowerCase().includes(search))
    .filter((p) => filters.type === ALL || p.type === filters.type)
    .filter((p) => filters.status === ALL || p.status === filters.status)
    .filter((p) => filters.priority === ALL || p.priority === filters.priority)
    .filter((p) => filters.assignee === ALL || (filters.assignee === 'none' ? !p.assignedTo : p.assignedTo?.id === filters.assignee))
    // Open work first, most urgent first
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'open' ? -1 : 1) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isAdmin ? 'כל הפרויקטים' : 'הפרויקטים שלי'}</h1>
          {projects && <p className="muted">{visible.length} מתוך {projects.length} פרויקטים</p>}
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setCreating(true)}>+ פרויקט חדש</button>}
      </div>

      {projects?.length > 0 && (
        <div className="filters">
          <input className="filter-search" type="search" placeholder="חיפוש…" value={filters.search} onChange={setFilter('search')} aria-label="חיפוש פרויקט" />
          <select value={filters.type} onChange={setFilter('type')} aria-label="סינון לפי סוג">
            <option value={ALL}>כל הסוגים</option>
            {meta.projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.status} onChange={setFilter('status')} aria-label="סינון לפי סטטוס">
            <option value={ALL}>כל הסטטוסים</option>
            {meta.statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filters.priority} onChange={setFilter('priority')} aria-label="סינון לפי עדיפות">
            <option value={ALL}>כל העדיפויות</option>
            {meta.priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {isAdmin && (
            <select value={filters.assignee} onChange={setFilter('assignee')} aria-label="סינון לפי שיוך">
              <option value={ALL}>כל העובדות</option>
              <option value="none">לא משויך</option>
              {assignees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {!projects && !error && <p className="muted">טוען…</p>}

      {projects?.length === 0 && (
        <div className="card empty">
          {isAdmin ? (
            <>
              <h2>עדיין אין פרויקטים</h2>
              <p className="muted">צרו פרויקט ושייכו אותו לעובדת - רשימת המשימות תיווצר אוטומטית לפי רמת הפירוט.</p>
              <button className="btn btn-primary" onClick={() => setCreating(true)}>+ פרויקט חדש</button>
            </>
          ) : (
            <>
              <h2>אין פרויקטים משויכים אלייך</h2>
              <p className="muted">כשמנהל ישייך אלייך פרויקט, הוא יופיע כאן.</p>
            </>
          )}
        </div>
      )}
      {projects?.length > 0 && visible.length === 0 && <p className="muted">אין פרויקטים שמתאימים לסינון.</p>}

      <div className="grid">
        {visible.map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`} className={`card project-card ${p.status === 'submitted' ? 'is-submitted' : ''}`}>
            <div className="project-card-head">
              <h2>{projectTitle(p)}</h2>
              <TypeBadge type={p.type} />
            </div>
            <div className="badges">
              <StatusBadge status={p.status} />
              <PriorityBadge priority={p.priority} />
            </div>
            <p className="muted small">
              {[categoriesLabel(p), levelSummary(meta, p), p.software].filter(Boolean).join(' · ')}
            </p>
            {isAdmin && <p className="small">{p.assignedTo ? `משויך ל: ${p.assignedTo.name}` : <span className="muted">לא משויך</span>}</p>}
            {p.purpose && <p className="clamp">{p.purpose}</p>}
            <Progress tasks={p.tasks} />
          </Link>
        ))}
      </div>

      {creating && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setCreating(false)}>
          <div className="card modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
            <h2 id="new-project-title">פרויקט חדש</h2>
            <ProjectForm
              submitLabel="יצירת פרויקט"
              onSubmit={create}
              onCancel={() => setCreating(false)}
              levelHint="רשימת המשימות תיווצר אוטומטית לפי סוג הפרויקט, רמת הפירוט והתוכנה"
            />
          </div>
        </div>
      )}
    </>
  );
}
