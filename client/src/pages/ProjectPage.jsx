import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp, levelSummary, projectTitle, categoriesLabel, priorityLabel, statusLabel } from '../AppContext.jsx';
import ProjectForm from '../components/ProjectForm.jsx';
import Progress from '../components/Progress.jsx';
import TaskList from '../components/TaskList.jsx';
import { TypeBadge, PriorityBadge, StatusBadge } from '../components/Badges.jsx';

const formatDate = (d) => new Date(d).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });

export default function ProjectPage() {
  const { id } = useParams();
  const { meta, user, isAdmin } = useApp();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  // Task ticks are saved in the background one after another; submit waits for them to finish
  const saves = useRef(Promise.resolve());
  const enqueueSave = (save) => {
    saves.current = saves.current.then(save);
  };

  useEffect(() => {
    api(`/projects/${id}`).then(setProject).catch((e) => setError(e.message));
  }, [id]);

  const save = async (data) => {
    setProject(await api(`/projects/${id}`, { method: 'PATCH', body: data }));
    setEditing(false);
  };

  // Delete / submit / reopen: confirm, call the server, show its answer
  const action = async (question, fn) => {
    if (question && !confirm(question)) return;
    setActionError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    action(`למחוק את הפרויקט "${projectTitle(project)}"? לא ניתן לשחזר.`, async () => {
      await api(`/projects/${id}`, { method: 'DELETE' });
      navigate('/');
    });
  const submit = () =>
    action('להגיש את הפרויקט? אחרי ההגשה לא ניתן לשנות את המשימות.', async () => {
      await saves.current;
      setProject(await api(`/projects/${id}/submit`, { method: 'POST' }));
    });
  const reopen = () =>
    action('לפתוח מחדש את הפרויקט? העובדת תוכל לשנות משימות ולהגיש שוב.', async () =>
      setProject(await api(`/projects/${id}/reopen`, { method: 'POST' }))
    );

  if (error) return <><Link to="/" className="back">→ חזרה לפרויקטים</Link><div className="error">{error}</div></>;
  if (!project) return <p className="muted">טוען…</p>;

  const isAssignee = project.assignedTo?.id === user.id;
  const isOpen = project.status === 'open';
  const allDone = project.tasks.length > 0 && project.tasks.every((t) => t.done);
  const remaining = project.tasks.filter((t) => !t.done).length;

  const info = [
    ['כינוי / כתובת הפרויקט', project.title],
    ...(meta.typesWithCategories.includes(project.type) ? [['שם הפרויקט', categoriesLabel(project)]] : []),
    ['סוג הפרויקט', project.type],
    ['מטרת הפרויקט', project.purpose],
    ['איזו תוכנה', project.software],
    ['רמת פירוט', levelSummary(meta, project)],
    ['משויך ל', project.assignedTo?.name],
    ['עדיפות', priorityLabel(meta, project.priority)],
    ['סטטוס', statusLabel(meta, project.status) + (project.submittedAt ? ` · ${formatDate(project.submittedAt)}` : '')],
  ];

  return (
    <>
      <Link to="/" className="back">→ חזרה לפרויקטים</Link>

      <div className="page-head">
        <div>
          <h1>{projectTitle(project)}</h1>
          <div className="badges">
            <TypeBadge type={project.type} />
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
        </div>
        {isAdmin && (
          <div className="head-actions">
            {!isOpen && <button className="btn btn-ghost" onClick={reopen} disabled={busy}>פתיחה מחדש</button>}
            <button className="btn btn-danger-ghost" onClick={remove} disabled={busy}>מחיקת פרויקט</button>
          </div>
        )}
      </div>
      {actionError && <div className="error">{actionError}</div>}

      <div className="dashboard">
        <section className="card">
          <div className="section-head">
            <h2>פרטי הפרויקט</h2>
            {isAdmin && !editing && <button className="btn btn-ghost" onClick={() => setEditing(true)}>עריכה</button>}
          </div>
          {editing ? (
            <ProjectForm
              initial={project}
              submitLabel="שמירה"
              onSubmit={save}
              onCancel={() => setEditing(false)}
              levelHint="שינוי שם הפרויקט, הסוג, רמת הפירוט או התוכנה יעדכן את רשימת המשימות (משימות שהושלמו ומשימות שהוספו ידנית יישמרו)"
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
          <TaskList
            project={project}
            onChange={setProject}
            canManage={isAdmin}
            canToggle={isAdmin || (isAssignee && isOpen)}
            enqueueSave={enqueueSave}
          />

          {isAssignee && (
            <div className={`submit-box ${isOpen ? '' : 'is-submitted'}`}>
              {isOpen ? (
                <>
                  <p className="muted small">
                    {allDone ? 'כל המשימות בוצעו - אפשר להגיש.' : `נשארו ${remaining} משימות לפני שאפשר להגיש.`}
                  </p>
                  <button className="btn btn-primary" onClick={submit} disabled={!allDone || busy}>הגשת הפרויקט</button>
                </>
              ) : (
                <p>הפרויקט הוגש ב-{formatDate(project.submittedAt)}.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
