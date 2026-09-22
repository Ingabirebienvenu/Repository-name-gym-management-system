import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/members', label: 'Members' },
    { path: '/trainers', label: 'Trainers' },
    { path: '/classes', label: 'Classes' },
    { path: '/payments', label: 'Payments' },
    { path: '/attendance', label: 'Attendance' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">🏋️ Gym Manager</div>
      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.path}>
            <Link
              to={link.path}
              className={location.pathname === link.path ? 'active' : ''}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;