import { useApp, priorityLabel, statusLabel } from '../AppContext.jsx';

export function TypeBadge({ type }) {
  return <span className={`badge badge-${type === 'פנים' ? 'in' : 'out'}`}>{type}</span>;
}

export function PriorityBadge({ priority }) {
  const { meta } = useApp();
  return <span className={`badge badge-priority-${priority}`}>עדיפות {priorityLabel(meta, priority)}</span>;
}

// A ghost's project: nobody else sees it
export function HiddenBadge() {
  return <span className="badge badge-hidden" title="רק את רואה את הפרויקט הזה">נסתר</span>;
}

export function StatusBadge({ status }) {
  const { meta } = useApp();
  return <span className={`badge badge-status-${status}`}>{statusLabel(meta, status)}</span>;
}
