import { Navigate, Route, Routes, Link, NavLink } from 'react-router-dom';
import { useApp } from './AppContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import TeamPage from './pages/TeamPage.jsx';

export default function App() {
  const { user, isAdmin, meta, loading, logout } = useApp();

  if (loading) return <div className="center-screen muted">טוען…</div>;
  if (!meta) return <div className="center-screen"><div className="error">לא ניתן להתחבר לשרת. נסו לרענן את הדף.</div></div>;
  if (!user) return <AuthPage />;

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="תלם מדידות הנדסיות" className="brand-logo" />
          <span className="brand-name">ניהול פרויקטים</span>
        </Link>
        {isAdmin && (
          <nav className="topnav">
            <NavLink to="/" end>פרויקטים</NavLink>
            <NavLink to="/team">צוות</NavLink>
          </nav>
        )}
        <div className="topbar-user">
          {isAdmin && <span className="admin-badge" dir="ltr">Admin Dashboard</span>}
          {user.picture && <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />}
          <span>שלום, {user.name}</span>
          <button className="btn btn-ghost" onClick={logout}>התנתקות</button>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
          {isAdmin && <Route path="/team" element={<TeamPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
