import { useState } from 'react';
import { useApp } from '../AppContext.jsx';
import MultiSelect from './MultiSelect.jsx';

const EMPTY = { title: '', categories: [], type: 'פנים', purpose: '', software: '', detailLevel: 1 };

// Shared form for creating a project and editing its info block
export default function ProjectForm({ initial, submitLabel, onSubmit, onCancel, levelHint }) {
  const { meta } = useApp();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const usesCategories = meta.typesWithCategories.includes(form.type);

  const submit = async (e) => {
    e.preventDefault();
    if (usesCategories && !form.categories.length) return setError('יש לבחור לפחות שם פרויקט אחד');
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        ...form,
        categories: usesCategories ? form.categories : [],
        detailLevel: Number(form.detailLevel),
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

      <label className="field">
        <span>רמת פירוט</span>
        <select name="detailLevel" value={form.detailLevel} onChange={update}>
          {meta.detailLevels.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        {levelHint && <small className="muted">{levelHint}</small>}
      </label>

      {error && <div className="error">{error}</div>}

      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>}
      </div>
    </form>
  );
}
