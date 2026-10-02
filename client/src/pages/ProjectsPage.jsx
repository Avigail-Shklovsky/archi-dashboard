import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp, levelLabel, projectTitle, categoriesLabel } from '../AppContext.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import Progress from '../components/Progress.jsx';

export default function ProjectsPage() {
  const { meta } = useApp();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(null);
  const [filter, setFilter] = useState('הכל');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/projects').then(setProjects).catch((e) => setError(e.message));
  }, []);

  const create = async (data) => {
    const project = await api('/projects', { method: 'POST', body: data });
    navigate(`/projects/${project._id}`);
  };

  const visible = (projects || []).filter((p) => filter === 'הכל' || p.type === filter);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>הפרויקטים שלי</h1>
          {projects && <p className="muted">{projects.length} פרויקטים</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ פרויקט חדש</button>
      </div>

      {projects?.length > 0 && (
        <div className="segmented filter">
          {['הכל', ...meta.projectTypes].map((t) => (
            <button key={t} className={filter === t ? 'active' : ''} onClick={() => setFilter(t)}>{t}</button>
          ))}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {!projects && !error && <p className="muted">טוען…</p>}

      {projects?.length === 0 && (
        <div className="card empty">
          <h2>עדיין אין פרויקטים</h2>
          <p className="muted">צרו פרויקט ראשון - רשימת המשימות תיווצר אוטומטית לפי רמת הפירוט.</p>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>+ פרויקט חדש</button>
        </div>
      )}

      <div className="grid">
        {visible.map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`} className="card project-card">
            <div className="project-card-head">
              <h2>{projectTitle(p)}</h2>
              <span className={`badge badge-${p.type === 'פנים' ? 'in' : 'out'}`}>{p.type}</span>
            </div>
            <p className="muted small">
              {[categoriesLabel(p), levelLabel(meta, p.detailLevel), p.software].filter(Boolean).join(' · ')}
            </p>
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
              levelHint="רשימת המשימות תיווצר אוטומטית לפי סוג הפרויקט ורמת הפירוט"
            />
          </div>
        </div>
      )}
    </>
  );
}
