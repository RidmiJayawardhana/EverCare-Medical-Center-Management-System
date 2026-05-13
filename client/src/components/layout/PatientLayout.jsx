import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Topbar from '../common/Topbar';

const navItems = [
  { to: '/patient', end: true, label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { section: 'Services' },
  { to: '/patient/doctors', label: 'Find Doctors', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  { to: '/patient/book', label: 'Book Appointment', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg> },
  { to: '/patient/appointments', label: 'My Appointments', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
];

const titles = { '/patient': 'Patient Dashboard', '/patient/doctors': 'Find Doctors', '/patient/book': 'Book Appointment', '/patient/appointments': 'My Appointments' };

export default function PatientLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="patient" />
      <div className="main-content">
        <Topbar title={titles[pathname] || 'Patient'} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
