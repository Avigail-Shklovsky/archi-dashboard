import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AppContext = createContext(null);

const VIEW_KEY = 'archi-view';
function readView() {
  try {
    return localStorage.getItem(VIEW_KEY);
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = getToken()
      ? api('/auth/me')
          .then((d) => setUser(d.user))
          .catch((e) => e.status === 401 && setToken(null)) // keep the login on temporary errors
      : Promise.resolve();
    const loadMeta = api('/meta').then(setMeta).catch(() => {});
    Promise.all([loadUser, loadMeta]).finally(() => setLoading(false));
  }, []);

  // `credential` is the ID token returned by the Google sign-in button
  const loginWithGoogle = async (credential) => {
    const { token, user } = await api('/auth/google', { method: 'POST', body: { credential } });
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    window.google?.accounts.id.disableAutoSelect();
    setToken(null);
    setUser(null);
  };

  // An admin can switch to "העבודה שלי": the screens of a worker, showing only the projects assigned to them.
  // This only changes what is shown - the server still treats them as an admin.
  const [workView, setWorkViewState] = useState(() => readView() === 'mine');
  const setWorkView = (on) => {
    setWorkViewState(on);
    try {
      localStorage.setItem(VIEW_KEY, on ? 'mine' : 'admin');
    } catch {
      // the choice just isn't remembered
    }
  };
  const canAdmin = user?.role === 'admin';

  return (
    <AppContext.Provider
      value={{ user, canAdmin, isAdmin: canAdmin && !workView, workView, setWorkView, meta, loading, loginWithGoogle, logout }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

// Heading of a group of tasks: a level of a project name (category), or of a חוץ project (category null)
export function levelLabel(meta, value, category = null) {
  if (value === meta.generalLevel.value) return meta.generalLevel.label;
  if (value === meta.submitLevel.value) return meta.submitLevel.label;
  const levels = category ? meta.categoryLevels[category]?.levels ?? [] : meta.detailLevels;
  return levels.find((d) => d.value === value)?.label ?? 'משימות נוספות';
}

// The levels of a project name (null for חוץ) that are part of the project - as in the server's taskTemplates.js
export function levelsFor(project, category) {
  const range = (n) => Array.from({ length: n || 0 }, (_, i) => i + 1);
  if (category === 'תכנון אדריכלי') return [...(project.drawings || [])].sort((a, b) => a - b);
  if (category === 'שטחים') return range(project.areaLevel);
  return range(project.detailLevel);
}

// e.g. "תכנון אדריכלי: תוכנית תנוחה, חתכים · שטחים: רמת פירוט 2 - תוכנית כוללנית"
export function levelSummary(meta, project) {
  if (!meta.typesWithCategories.includes(project.type)) return levelLabel(meta, project.detailLevel);
  return project.categories
    .map((category) => {
      const set = meta.categoryLevels[category];
      if (!set) return null;
      const chosen = set.pick ? levelsFor(project, category) : [project.areaLevel];
      const names = chosen.map((v) => set.levels.find((l) => l.value === v)).filter(Boolean).map((l) => (set.pick ? l.name : l.label));
      return names.length ? `${category}: ${names.join(', ')}` : null;
    })
    .filter(Boolean)
    .join(' · ');
}

const labelOf = (list, value) => list.find((x) => x.value === value)?.label ?? value;
export const priorityLabel = (meta, value) => labelOf(meta.priorities, value);
export const statusLabel = (meta, value) => labelOf(meta.statuses, value);

export const categoriesLabel = (project) => project.categories.join(' · ');
export const projectTitle = (project) => project.title || categoriesLabel(project) || project.type;
