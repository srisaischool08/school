import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About School' },
  { to: '/academics', label: 'Academics' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/login', label: 'Login' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const portalLink =
    user?.role === 'STUDENT'
      ? '/student/dashboard'
      : user?.role === 'TEACHER'
        ? '/teacher/dashboard'
        : user?.role === 'SUPER_ADMIN' || user?.role?.startsWith('ADMIN')
          ? '/admin/dashboard'
          : '/login';

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link to="/" className="brand" aria-label="SRISAI Model School home">
          <div className="brand-mark">S</div>
          <div>
            <strong>SRISAI</strong>
            <span>MODEL SCHOOL</span>
          </div>
        </Link>

        <button className="menu-toggle" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`main-nav ${mobileOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              {item.label}
            </NavLink>
          ))}

          {user && (
            <>
              <Link to={portalLink} className="nav-link portal-link" onClick={() => setMobileOpen(false)}>
                My Portal
              </Link>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
