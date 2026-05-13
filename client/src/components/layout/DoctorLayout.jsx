import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Topbar from '../common/Topbar';

const navItems = [
  { to: '/doctor', end: true, label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { section: 'Practice' },
  { to: '/doctor/appointments', label: 'Appointments', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { to: '/doctor/schedule', label: 'My Schedule', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { section: 'Account' },
  { to: '/doctor/profile', label: 'My Profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

const titles = { '/doctor': 'Doctor Dashboard', '/doctor/appointments': 'My Appointments', '/doctor/schedule': 'My Schedule', '/doctor/profile': 'My Profile' };

export default function DoctorLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="doctor" />
      <div className="main-content">
        <Topbar title={titles[pathname] || 'Doctor'} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
