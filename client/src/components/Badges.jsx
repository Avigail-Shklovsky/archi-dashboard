import { useApp, priorityLabel, statusLabel } from '../AppContext.jsx';

export function TypeBadge({ type }) {
  return <span className={`badge badge-${type === 'פנים' ? 'in' : 'out'}`}>{type}</span>;
}

export function PriorityBadge({ priority }) {
  const { meta } = useApp();
  return <span className={`badge badge-priority-${priority}`}>עדיפות {priorityLabel(meta, priority)}</span>;
}

export function StatusBadge({ status }) {
  const { meta } = useApp();
  return <span className={`badge badge-status-${status}`}>{statusLabel(meta, status)}</span>;
}
