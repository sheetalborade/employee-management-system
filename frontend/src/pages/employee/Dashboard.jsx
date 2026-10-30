import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { getMyAttendance } from '../../services/attendanceService';
import { getMyLeaves, getLeaveBalance, getHolidays } from '../../services/leaveService';
import { formatDate } from '../../utils/formatDate';
import { CalendarCheck, ClipboardList, Calendar, Clock } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date();
        const [attRes, leaveRes, balRes, holRes] = await Promise.all([
          getMyAttendance({ month: now.getMonth() + 1, year: now.getFullYear() }),
          getMyLeaves(),
          getLeaveBalance(),
          getHolidays(now.getFullYear()),
        ]);
        if (attRes.success) setAttendance(attRes.data);
        if (leaveRes.success) setLeaves(leaveRes.data.slice(0, 5));
        if (balRes.success) setBalance(balRes.data);
        if (holRes.success) {
          const upcoming = holRes.data.filter((h) => new Date(h.date) >= new Date()).slice(0, 5);
          setHolidays(upcoming);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader text="Loading..." />;

  const presentDays = attendance.filter((a) => ['present', 'late'].includes(a.status)).length;
  const absentDays = attendance.filter((a) => a.status === 'absent').length;

  return (
    <div className="page">
      <Navbar
        title="My Dashboard"
        subtitle={`Welcome back, ${user?.firstName || 'Employee'}!`}
      />

      <div className="stats-grid">
        <div className="stat-card stat-green">
          <div className="stat-icon"><CalendarCheck size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Present this month</span>
            <span className="stat-value">{presentDays}</span>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon"><Clock size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Absent this month</span>
            <span className="stat-value">{absentDays}</span>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><ClipboardList size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Pending Leaves</span>
            <span className="stat-value">{leaves.filter((l) => l.status === 'pending').length}</span>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><Calendar size={22} /></div>
          <div className="stat-info">
            <span className="stat-title">Upcoming Holidays</span>
            <span className="stat-value">{holidays.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Leave Balance</h3>
            <Link to="/employee/leaves" className="btn-link">Apply Leave →</Link>
          </div>
          <div className="balance-grid">
            {balance.map((b) => (
              <div key={b.id} className="balance-item">
                <span className="balance-name">{b.name}</span>
                <div className="balance-nums">
                  <span className="remaining">{b.remaining}</span>
                  <span className="total">/ {b.max_days}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (b.remaining / b.max_days) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {balance.length === 0 && <p className="empty-text">No leave types configured</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Leave Requests</h3>
          </div>
          <div className="recent-list">
            {leaves.map((l) => (
              <div key={l.id} className="recent-item">
                <div className="recent-info">
                  <span className="name">{l.leave_type_name}</span>
                  <span className="meta">{formatDate(l.start_date)} – {formatDate(l.end_date)}</span>
                </div>
                <span className={`badge badge-${l.status === 'approved' ? 'success' : l.status === 'pending' ? 'warning' : 'danger'}`}>
                  {l.status}
                </span>
              </div>
            ))}
            {leaves.length === 0 && <p className="empty-text">No leave requests yet</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Upcoming Holidays</h3>
        </div>
        <div className="holiday-list">
          {holidays.map((h) => (
            <div key={h.id} className="holiday-item">
              <div className="holiday-date">
                <span className="day">{new Date(h.date).getDate()}</span>
                <span className="month">{new Date(h.date).toLocaleString('en', { month: 'short' })}</span>
              </div>
              <div>
                <span className="name">{h.name}</span>
                {h.description && <span className="meta">{h.description}</span>}
              </div>
            </div>
          ))}
          {holidays.length === 0 && <p className="empty-text">No upcoming holidays</p>}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;