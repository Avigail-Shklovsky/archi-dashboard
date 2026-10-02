import { useState } from 'react';
import { api } from '../api.js';
import { useApp, levelLabel } from '../AppContext.jsx';

export default function TaskList({ project, onChange }) {
  const { meta } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [error, setError] = useState('');

  const base = `/projects/${project._id}/tasks`;
  const run = async (fn) => {
    setError('');
    try {
      onChange(await fn());
    } catch (e) {
      setError(e.message);
    }
  };

  const toggle = (task) => {
    // Optimistic update so the checkbox feels instant
    onChange({ ...project, tasks: project.tasks.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t)) });
    run(() => api(`${base}/${task._id}`, { method: 'PATCH', body: { done: !task.done } }));
  };

  const add = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    run(() => api(base, { method: 'POST', body: { title: newTitle } }));
    setNewTitle('');
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
  };

  const saveEdit = (task) => {
    setEditingId(null);
    const title = editTitle.trim();
    if (title && title !== task.title) {
      run(() => api(`${base}/${task._id}`, { method: 'PATCH', body: { title } }));
    }
  };

  const remove = (task) => run(() => api(`${base}/${task._id}`, { method: 'DELETE' }));

  // Group by category and level of detailing; manually added tasks (level null) go last
  const showCategory = project.categories.length > 1;
  const groups = [];
  for (const task of project.tasks) {
    const key = `${task.category}|${task.level}`;
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, level: task.level, category: task.category, tasks: [] }));
    g.tasks.push(task);
  }
  const order = (g) => (g.level === null ? Infinity : project.categories.indexOf(g.category) * 100 + g.level);
  groups.sort((a, b) => order(a) - order(b));

  return (
    <div className="tasks">
      {error && <div className="error">{error}</div>}

      {groups.map((g) => (
        <div key={g.key} className="task-group">
          <h3>{showCategory && g.category && `${g.category} · `}{levelLabel(meta, g.level)}</h3>
          <ul>
            {g.tasks.map((task) => (
              <li key={task._id} className={task.done ? 'done' : ''}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggle(task)}
                  aria-label={task.title}
                />
                {editingId === task._id ? (
                  <input
                    className="task-edit"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <span className="task-title" onDoubleClick={() => startEdit(task)}>{task.title}</span>
                )}
                <div className="task-actions">
                  <button className="icon-btn" title="עריכה" aria-label="עריכת משימה" onClick={() => startEdit(task)}>✎</button>
                  <button className="icon-btn" title="מחיקה" aria-label="מחיקת משימה" onClick={() => remove(task)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <form className="add-task" onSubmit={add}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="הוספת משימה חדשה…" />
        <button className="btn btn-primary" disabled={!newTitle.trim()}>הוספה</button>
      </form>
    </div>
  );
}
