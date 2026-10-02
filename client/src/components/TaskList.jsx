import { useState } from 'react';
import { api } from '../api.js';
import { useApp, levelLabel } from '../AppContext.jsx';

const groupKey = (category, level) => `${category}|${level}`;

export default function TaskList({ project, onChange }) {
  const { meta } = useApp();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dropKey, setDropKey] = useState(null);

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

  // Move a manually added task to another level (target.level null = "משימות נוספות")
  const move = (taskId, target) => {
    const task = project.tasks.find((t) => t._id === taskId);
    if (!task || groupKey(task.category, task.level) === target.key) return;
    const { level, category } = target;
    onChange({ ...project, tasks: project.tasks.map((t) => (t._id === taskId ? { ...t, level, category } : t)) });
    run(() => api(`${base}/${taskId}`, { method: 'PATCH', body: { level, category } }));
  };

  // Every place a manual task can go: each project name x each level up to the project's level,
  // plus "משימות נוספות". Level 0 only where that project name has general tasks.
  const usesCategories = meta.typesWithCategories.includes(project.type);
  const categories = usesCategories ? project.categories : [null];
  const targets = [];
  for (const category of categories) {
    const hasGeneral = project.tasks.some((t) => t.category === category && t.level === meta.generalLevel.value);
    const levels = [...(hasGeneral ? [meta.generalLevel.value] : []), ...meta.detailLevels.map((l) => l.value)];
    for (const level of levels.filter((l) => l <= project.detailLevel)) {
      targets.push({ key: groupKey(category, level), category, level });
    }
  }
  targets.push({ key: groupKey(null, null), category: null, level: null });

  // Group tasks by project name and level; manually added tasks without a level go last
  const showCategory = project.categories.length > 1;
  const groups = [];
  for (const task of project.tasks) {
    const key = groupKey(task.category, task.level);
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, level: task.level, category: task.category, tasks: [] }));
    g.tasks.push(task);
  }
  // While dragging, show empty levels as drop zones too
  if (draggingId) {
    for (const t of targets) if (!groups.some((g) => g.key === t.key)) groups.push({ ...t, tasks: [] });
  }
  const order = (g) => (g.level === null ? Infinity : categories.indexOf(g.category) * 100 + g.level);
  groups.sort((a, b) => order(a) - order(b));

  const targetLabel = (t) => `${showCategory && t.category ? `${t.category} · ` : ''}${levelLabel(meta, t.level)}`;
  const isTarget = (key) => targets.some((t) => t.key === key);

  const endDrag = () => {
    setDraggingId(null);
    setDropKey(null);
  };

  return (
    <div className={`tasks ${draggingId ? 'is-dragging' : ''}`}>
      {error && <div className="error">{error}</div>}

      {groups.map((g) => {
        const droppable = draggingId && isTarget(g.key);
        return (
          <div
            key={g.key}
            className={`task-group ${droppable ? 'droppable' : ''} ${dropKey === g.key ? 'drop-over' : ''}`}
            onDragOver={(e) => {
              if (!droppable) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dropKey !== g.key) setDropKey(g.key);
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setDropKey(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (droppable) move(draggingId, g);
              endDrag();
            }}
          >
            <h3>{targetLabel(g)}</h3>
            <ul>
              {g.tasks.map((task) => {
                const manual = !task.templateKey;
                return (
                  <li
                    key={task._id}
                    className={`${task.done ? 'done' : ''} ${manual ? 'manual' : ''} ${draggingId === task._id ? 'dragging' : ''}`}
                    draggable={manual && editingId !== task._id}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', task._id);
                      setDraggingId(task._id);
                    }}
                    onDragEnd={endDrag}
                  >
                    {manual && <span className="drag-handle" title="גררו לרמת פירוט" aria-hidden="true">⠿</span>}
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
                      {manual && (
                        // Keyboard / touch alternative to dragging
                        <select
                          className="move-select"
                          title="העברה לרמת פירוט"
                          aria-label="העברה לרמת פירוט"
                          value={groupKey(task.category, task.level)}
                          onChange={(e) => move(task._id, targets.find((t) => t.key === e.target.value))}
                        >
                          {targets.map((t) => <option key={t.key} value={t.key}>{targetLabel(t)}</option>)}
                        </select>
                      )}
                      <button className="icon-btn" title="עריכה" aria-label="עריכת משימה" onClick={() => startEdit(task)}>✎</button>
                      <button className="icon-btn" title="מחיקה" aria-label="מחיקת משימה" onClick={() => remove(task)}>✕</button>
                    </div>
                  </li>
                );
              })}
              {droppable && g.tasks.length === 0 && <li className="drop-hint">שחררו כאן</li>}
            </ul>
          </div>
        );
      })}

      <form className="add-task" onSubmit={add}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="הוספת משימה חדשה…" />
        <button className="btn btn-primary" disabled={!newTitle.trim()}>הוספה</button>
      </form>
      <p className="muted small hint">משימות שהוספתם אפשר לגרור (⠿) לכל רמת פירוט.</p>
    </div>
  );
}
