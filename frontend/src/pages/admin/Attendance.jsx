import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getAttendance, markAttendance } from '../../services/attendanceService';
import { getEmployees } from '../../services/employeeService';
import { formatDate, formatTime, getToday } from '../../utils/formatDate';

const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(getToday());
  const [showMark, setShowMark] = useState(false);
  const [form, setForm] = useState({ employeeId: '', status: 'present', checkIn: '09:00', checkOut: '18:00' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAttendance({ date, limit: 50 });
      if (res.success) setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees({ limit: 100, status: 'active' }).then((r) => r.success && setEmployees(r.data));
  }, []);

  useEffect(() => { load(); }, [date]);

  const handleMark = async (e) => {
    e.preventDefault();
    try {
      await markAttendance({ ...form, date });
      setShowMark(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const statusClass = (s) => {
    const map = { present: 'badge-success', absent: 'badge-danger', late: 'badge-warning', on_leave: 'badge-info', half_day: 'badge-warning' };
    return map[s] || '';
  };

  return (
    <div className="page">
      <Navbar title="Attendance" subtitle="View and mark employee attendance" />

      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="date-input" />
        <button className="btn btn-primary" onClick={() => setShowMark(true)}>Mark Attendance</button>
      </div>

      <div className="card table-card">
        {loading ? <Loader /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar small">{r.first_name?.[0]}{r.last_name?.[0]}</div>
                      {r.first_name} {r.last_name}
                    </div>
                  </td>
                  <td>{r.department_name || '-'}</td>
                  <td>{formatDate(r.date)}</td>
                  <td>{formatTime(r.check_in)}</td>
                  <td>{formatTime(r.check_out)}</td>
                  <td><span className={`badge ${statusClass(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan="6" className="empty-text">No attendance records for this date</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showMark && (
        <div className="modal-overlay" onClick={() => setShowMark(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Mark Attendance — {formatDate(date)}</h3>
            <form onSubmit={handleMark}>
              <div className="form-group">
                <label>Employee *</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="on_leave">On Leave</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
              <div className="form-group">
                <label>Check In</label>
                <input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Check Out</label>
                <input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowMark(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;