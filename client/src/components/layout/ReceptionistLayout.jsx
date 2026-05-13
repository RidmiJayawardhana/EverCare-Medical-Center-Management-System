import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Topbar from '../common/Topbar';

const navItems = [
  { to: '/receptionist', end: true, label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { section: 'Operations' },
  { to: '/receptionist/appointments', label: 'Appointments', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { to: '/receptionist/book', label: 'Book for Patient', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg> },
];

const titles = { '/receptionist': 'Reception Dashboard', '/receptionist/appointments': 'Appointments', '/receptionist/book': 'Book Appointment' };

export default function ReceptionistLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="receptionist" />
      <div className="main-content">
        <Topbar title={titles[pathname] || 'Reception'} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
