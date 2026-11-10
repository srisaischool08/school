import { Link } from 'react-router-dom';
import { SCHOOL_INFO } from '../constants/schoolInfo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>SRISAI MODEL SCHOOL</h3>
          <p>Nurturing excellence, values, and future-ready learners.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/academics">Academics</Link></li>
            <li><Link to="/admissions">Admissions</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4>Admissions</h4>
          <ul>
            <li>School Hours: 8:30 AM - 3:30 PM</li>
            <li>Admission Desk: Mon - Sat</li>
            <li>Support: <a href={`mailto:${SCHOOL_INFO.email}`}>{SCHOOL_INFO.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© 2026 SRISAI MODEL SCHOOL. All rights reserved.</div>
    </footer>
  );
}
