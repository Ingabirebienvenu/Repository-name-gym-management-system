import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, user, logoutUser } = useAuth();

  const adminLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/members', label: 'Members' },
    { path: '/trainers', label: 'Trainers' },
    { path: '/classes', label: 'Classes' },
    { path: '/payments', label: 'Payments' },
    { path: '/attendance', label: 'Attendance' },
  ];
  const trainerLinks = [{ path: '/trainer', label: 'Dashboard' }];
  const memberLinks = [{ path: '/member', label: 'Dashboard' }];

  const links = role === 'admin' ? adminLinks : role === 'trainer' ? trainerLinks : memberLinks;

  function handleLogout() {
    logoutUser();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">🏋️ Gym Manager</div>
      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.path}>
            <Link to={link.path} className={location.pathname === link.path ? 'active' : ''}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="navbar-user">
        <span>{user?.first_name || user?.full_name || 'Account'}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;