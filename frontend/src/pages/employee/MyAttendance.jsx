import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getMyAttendance } from '../../services/attendanceService';
import { formatDate, formatTime } from '../../utils/formatDate';

const MyAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    setLoading(true);
    getMyAttendance({ month, year })
      .then((res) => {
        if (res.success) setRecords(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const statusClass = (s) => {
    const map = { present: 'badge-success', absent: 'badge-danger', late: 'badge-warning', on_leave: 'badge-info', half_day: 'badge-warning' };
    return map[s] || '';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="page">
      <Navbar title="My Attendance" subtitle="View your attendance history" />

      <div className="toolbar">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {months.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="card table-card">
        {loading ? <Loader /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatTime(r.check_in)}</td>
                  <td>{formatTime(r.check_out)}</td>
                  <td><span className={`badge ${statusClass(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan="4" className="empty-text">No attendance records for this month</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;