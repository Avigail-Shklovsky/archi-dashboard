import { useEffect, useRef, useState } from 'react';

// Dropdown with checkboxes; value is an array kept in the same order as `options`
export default function MultiSelect({ options, value, onChange, placeholder = 'בחירה…', id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(options.filter((o) => next.includes(o)));
  };

  return (
    <div className="multiselect" ref={ref}>
      <button
        type="button"
        id={id}
        className={`multiselect-trigger ${open ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {value.length ? (
          <span className="chips">
            {value.map((v) => <span key={v} className="chip">{v}</span>)}
          </span>
        ) : (
          <span className="muted">{placeholder}</span>
        )}
        <span className="chevron" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="multiselect-menu" role="listbox" aria-multiselectable="true">
          {options.map((opt) => (
            <li key={opt}>
              <label>
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
                {opt}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
