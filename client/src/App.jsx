import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { useApp } from './AppContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';

export default function App() {
  const { user, meta, loading, logout } = useApp();

  if (loading) return <div className="center-screen muted">טוען…</div>;
  if (!meta) return <div className="center-screen"><div className="error">לא ניתן להתחבר לשרת. נסו לרענן את הדף.</div></div>;
  if (!user) return <AuthPage />;

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          ניהול פרויקטים
        </Link>
        <div className="topbar-user">
          <span>שלום, {user.name}</span>
          <button className="btn btn-ghost" onClick={logout}>התנתקות</button>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
