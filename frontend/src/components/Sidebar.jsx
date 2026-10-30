import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  FileText,
  BarChart3,
  User,
  Settings,
  LogOut,
  ClipboardList,
  Calendar,
  KeyRound,
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/admin/leaves', icon: ClipboardList, label: 'Leave Requests' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/profile', icon: User, label: 'My Profile' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const employeeLinks = [
  { to: '/employee', icon: LayoutDashboard, label: 'My Dashboard', end: true },
  { to: '/employee/profile', icon: User, label: 'My Profile' },
  { to: '/employee/attendance', icon: CalendarCheck, label: 'My Attendance' },
  { to: '/employee/leaves', icon: ClipboardList, label: 'My Leave' },
  { to: '/employee/holidays', icon: Calendar, label: 'Holidays' },
  { to: '/employee/settings', icon: KeyRound, label: 'Change Password' },
];

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : employeeLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🌿</div>
        <div>
          <h2>HRM System</h2>
          <span>People · Process · Progress</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <link.icon size={18} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;