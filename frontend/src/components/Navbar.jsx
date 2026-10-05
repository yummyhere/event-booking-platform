import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link to="/events" className="brand" aria-label="Gather home">
          <span className="brand-mark" aria-hidden="true">g</span>
          <span>gather<span className="brand-period">.</span></span>
        </Link>
        <div className="nav-links">
          <NavLink to="/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Discover</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/my-bookings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>My bookings</NavLink>
              {isAdmin && <NavLink to="/admin/events" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Manage Events</NavLink>}
              <span className="nav-user">Hi, {user?.name?.split(' ')[0]}</span>
              <button className="nav-logout" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Log in</NavLink>
              <Link to="/register" className="button button-small">Join Gather</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}