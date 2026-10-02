import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AppContext = createContext(null);

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

  const authenticate = async (mode, form) => {
    const { token, user } = await api(`/auth/${mode}`, { method: 'POST', body: form });
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, meta, loading, authenticate, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

export function levelLabel(meta, value) {
  if (value === meta.generalLevel.value) return meta.generalLevel.label;
  return meta.detailLevels.find((d) => d.value === value)?.label ?? 'משימות נוספות';
}

export const categoriesLabel = (project) => project.categories.join(' · ');
export const projectTitle = (project) => project.title || categoriesLabel(project) || project.type;
