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

  return (
    <AppContext.Provider value={{ user, meta, loading, loginWithGoogle, logout }}>
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
