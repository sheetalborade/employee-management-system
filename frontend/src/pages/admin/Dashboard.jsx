import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getDashboardStats, getRecentEmployees } from '../../services/employeeService';
import { getLeaveTrends } from '../../services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { Users, Building2, CalendarCheck, ClipboardList, UserPlus, Eye, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes, trendsRes] = await Promise.all([
          getDashboardStats(),
          getRecentEmployees(),
          getLeaveTrends(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (recentRes.success) setRecent(recentRes.data);
        if (trendsRes.success) setTrends(trendsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;

  const cards = [
    { title: 'Total Employees', value: stats?.totalEmployees || 0, icon: Users, color: 'green', link: '/admin/employees' },
    { title: 'Active Employees', value: stats?.activeEmployees || 0, icon: Users, color: 'blue', sub: `${stats?.inactiveEmployees || 0} inactive` },
    { title: 'Departments', value: stats?.totalDepartments || 0, icon: Building2, color: 'purple', link: '/admin/departments' },
    { title: 'Pending Leaves', value: stats?.pendingLeaveRequests || 0, icon: ClipboardList, color: 'orange', link: '/admin/leaves' },
  ];

  return (
    <div className="page">
      <Navbar
        title="Dashboard"
        subtitle={`Welcome back, ${user?.firstName || 'Admin'}! Here's what's happening in your organization.`}
      />

      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.title} className={`stat-card stat-${c.color}`}>
            <div className="stat-icon">
              <c.icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-title">{c.title}</span>
              <span className="stat-value">{c.value}</span>
              {c.sub && <span className="stat-sub">{c.sub}</span>}
            </div>
            {c.link && (
              <Link to={c.link} className="stat-link">→</Link>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Employee Growth</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats?.growthTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Leave Trends</h3>
          </div>
          <div className="leave-trends">
            {trends.map((t) => (
              <div key={t.name} className="trend-item">
                <div className="trend-info">
                  <span className="trend-name">{t.name}</span>
                  <span className="trend-days">{t.days} days</span>
                </div>
                <div className="trend-bar-bg">
                  <div className="trend-bar" style={{ width: `${t.percentage}%` }} />
                </div>
                <span className="trend-pct">{t.percentage}%</span>
              </div>
            ))}
            {trends.length === 0 && <p className="empty-text">No leave data yet</p>}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Recently Added Employees</h3>
            <Link to="/admin/employees" className="btn-link">View All →</Link>
          </div>
          <div className="recent-list">
            {recent.map((e) => (
              <div key={e.id} className="recent-item">
                <div className="avatar small">
                  {e.first_name?.[0]}{e.last_name?.[0]}
                </div>
                <div className="recent-info">
                  <span className="name">{e.first_name} {e.last_name}</span>
                  <span className="meta">{e.department_name || 'No Dept'} · {e.employee_id}</span>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="empty-text">No employees yet</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <Link to="/admin/employees/add" className="action-btn primary">
              <UserPlus size={18} /> Add Employee
            </Link>
            <Link to="/admin/employees" className="action-btn">
              <Eye size={18} /> View All Employees
            </Link>
            <Link to="/admin/departments" className="action-btn">
              <Building2 size={18} /> Manage Departments
            </Link>
            <Link to="/admin/attendance" className="action-btn">
              <CalendarCheck size={18} /> Mark Attendance
            </Link>
            <Link to="/admin/leaves" className="action-btn">
              <ClipboardList size={18} /> Leave Requests
            </Link>
            <Link to="/admin/reports" className="action-btn">
              <BarChart3 size={18} /> Generate Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;