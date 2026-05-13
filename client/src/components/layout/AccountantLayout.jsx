import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Topbar from '../common/Topbar';

const navItems = [
  { to: '/accountant', end: true, label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { section: 'Finance' },
  { to: '/accountant/payments', label: 'Payments', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { to: '/accountant/reports', label: 'Reports', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
];

const titles = { '/accountant': 'Accounts Dashboard', '/accountant/payments': 'Payment Records', '/accountant/reports': 'Financial Reports' };

export default function AccountantLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="accountant" />
      <div className="main-content">
        <Topbar title={titles[pathname] || 'Accounts'} />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
