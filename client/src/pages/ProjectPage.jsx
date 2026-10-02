import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp, levelLabel, projectTitle, categoriesLabel } from '../AppContext.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import Progress from '../components/Progress.jsx';
import TaskList from '../components/TaskList.jsx';

export default function ProjectPage() {
  const { id } = useParams();
  const { meta } = useApp();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/projects/${id}`).then(setProject).catch((e) => setError(e.message));
  }, [id]);

  const save = async (data) => {
    setProject(await api(`/projects/${id}`, { method: 'PATCH', body: data }));
    setEditing(false);
  };

  const remove = async () => {
    if (!confirm(`למחוק את הפרויקט "${projectTitle(project)}"? לא ניתן לשחזר.`)) return;
    await api(`/projects/${id}`, { method: 'DELETE' });
    navigate('/');
  };

  if (error) return <><Link to="/" className="back">→ חזרה לפרויקטים</Link><div className="error">{error}</div></>;
  if (!project) return <p className="muted">טוען…</p>;

  const info = [
    ['כינוי / כתובת הפרויקט', project.title],
    ...(meta.typesWithCategories.includes(project.type) ? [['שם הפרויקט', categoriesLabel(project)]] : []),
    ['סוג הפרויקט', project.type],
    ['מטרת הפרויקט', project.purpose],
    ['איזו תוכנה', project.software],
    ['רמת פירוט', levelLabel(meta, project.detailLevel)],
  ];

  return (
    <>
      <Link to="/" className="back">→ חזרה לפרויקטים</Link>

      <div className="page-head">
        <div>
          <h1>{projectTitle(project)}</h1>
          <span className={`badge badge-${project.type === 'פנים' ? 'in' : 'out'}`}>{project.type}</span>
        </div>
        <button className="btn btn-danger-ghost" onClick={remove}>מחיקת פרויקט</button>
      </div>

      <div className="dashboard">
        <section className="card">
          <div className="section-head">
            <h2>פרטי הפרויקט</h2>
            {!editing && <button className="btn btn-ghost" onClick={() => setEditing(true)}>עריכה</button>}
          </div>
          {editing ? (
            <ProjectForm
              initial={project}
              submitLabel="שמירה"
              onSubmit={save}
              onCancel={() => setEditing(false)}
              levelHint="שינוי שם הפרויקט, הסוג או רמת הפירוט יעדכן את רשימת המשימות (משימות שהושלמו ומשימות שהוספתם יישמרו)"
            />
          ) : (
            <dl className="info-list">
              {info.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || <span className="muted">—</span>}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="card">
          <div className="section-head">
            <h2>משימות</h2>
          </div>
          <Progress tasks={project.tasks} />
          <TaskList project={project} onChange={setProject} />
        </section>
      </div>
    </>
  );
}
