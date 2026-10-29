import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../AppContext.jsx';
import MultiSelect from './MultiSelect.jsx';

const EMPTY = {
  title: '', categories: [], type: 'פנים', purpose: '', software: '',
  drawings: [], areaLevel: 1, detailLevel: 1, priority: 'medium', assignedTo: '',
};

// Admin form for creating a project and editing its info block
export default function ProjectForm({ initial, submitLabel, onSubmit, onCancel, levelHint }) {
  const { meta } = useApp();
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    // A level only applies to some types / project names, so it may be empty; offer level 1 then
    areaLevel: initial?.areaLevel ?? 1,
    detailLevel: initial?.detailLevel ?? 1,
    categories: (initial?.categories ?? []).filter((c) => meta.projectCategories.includes(c)),
    assignedTo: initial?.assignedTo?.id ?? '',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api('/users').then(setUsers).catch(() => {});
  }, []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const usesCategories = meta.typesWithCategories.includes(form.type);
  const planning = meta.categoryLevels['תכנון'];
  const areas = meta.categoryLevels['שטחים'];
  const hasPlanning = usesCategories && form.categories.includes('תכנון');
  const hasAreas = usesCategories && form.categories.includes('שטחים');
  const planningLevel = (value) => planning.levels.find((l) => l.value === value);

  const submit = async (e) => {
    e.preventDefault();
    if (usesCategories && !form.categories.length) return setError('יש לבחור לפחות שם פרויקט אחד');
    if (hasPlanning && !form.drawings.length) return setError('יש לבחור לפחות שרטוט אחד לתכנון');
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        ...form,
        categories: usesCategories ? form.categories : [],
        drawings: hasPlanning ? form.drawings : [],
        areaLevel: hasAreas ? Number(form.areaLevel) : null,
        detailLevel: usesCategories ? null : Number(form.detailLevel),
        assignedTo: form.assignedTo || null,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="project-form" onSubmit={submit}>
      <label className="field">
        <span>כינוי / כתובת הפרויקט</span>
        <input name="title" value={form.title} onChange={update} required autoFocus placeholder="לדוגמה: רחוב הרצל 12, רעננה" />
      </label>

      <fieldset className="field">
        <legend>סוג הפרויקט</legend>
        <div className="segmented">
          {meta.projectTypes.map((t) => (
            <label key={t} className={form.type === t ? 'active' : ''}>
              <input type="radio" name="type" value={t} checked={form.type === t} onChange={update} />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      {usesCategories && (
        <div className="field">
          <label htmlFor="project-categories">שם הפרויקט</label>
          <MultiSelect
            id="project-categories"
            options={meta.projectCategories}
            value={form.categories}
            onChange={(categories) => setForm({ ...form, categories })}
            placeholder="בחירת שם פרויקט (אפשר כמה)"
          />
        </div>
      )}

      <label className="field">
        <span>מטרת הפרויקט</span>
        <textarea name="purpose" rows={3} value={form.purpose} onChange={update} />
      </label>

      <label className="field">
        <span>איזו תוכנה</span>
        <input name="software" list="software-options" value={form.software} onChange={update} placeholder="לדוגמה: Revit" />
        <datalist id="software-options">
          {meta.softwareOptions.map((s) => <option key={s} value={s} />)}
        </datalist>
      </label>

      {hasPlanning && (
        <div className="field">
          <label htmlFor="project-drawings">רמת פירוט - תכנון (אילו שרטוטים)</label>
          <MultiSelect
            id="project-drawings"
            options={planning.levels.map((l) => l.value)}
            value={form.drawings}
            onChange={(drawings) => setForm({ ...form, drawings })}
            optionLabel={(v) => planningLevel(v).label}
            chipLabel={(v) => planningLevel(v).name}
            placeholder="בחירת שרטוטים (אפשר כמה)"
          />
        </div>
      )}

      {hasAreas && (
        <label className="field">
          <span>רמת פירוט - שטחים</span>
          <select name="areaLevel" value={form.areaLevel} onChange={update}>
            {areas.levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <small className="muted">כל רמה כוללת גם את המשימות של הרמות שלפניה.</small>
        </label>
      )}

      {!usesCategories && (
        <label className="field">
          <span>רמת פירוט</span>
          <select name="detailLevel" value={form.detailLevel} onChange={update}>
            {meta.detailLevels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </label>
      )}
      {levelHint && <small className="muted">{levelHint}</small>}

      <div className="field-row">
        <label className="field">
          <span>משויך ל</span>
          <select name="assignedTo" value={form.assignedTo} onChange={update}>
            <option value="">— לא משויך —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </label>
        <label className="field">
          <span>עדיפות</span>
          <select name="priority" value={form.priority} onChange={update}>
            {meta.priorities.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <small className="muted">ברשימה מופיעים מי שכבר נכנסו למערכת לפחות פעם אחת.</small>

      {error && <div className="error">{error}</div>}

      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>}
      </div>
    </form>
  );
}
