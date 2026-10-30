import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getEmployees } from '../../services/employeeService';
import { getDepartments } from '../../services/departmentService';
import { getAttendance } from '../../services/attendanceService';
import { getLeaveRequests } from '../../services/leaveService';
import { formatDate } from '../../utils/formatDate';
import { Download } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('employees');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'employees') {
        const res = await getEmployees({ limit: 500 });
        if (res.success) setData(res.data);
      } else if (reportType === 'departments') {
        const res = await getDepartments();
        if (res.success) setData(res.data);
      } else if (reportType === 'attendance') {
        const res = await getAttendance({ limit: 200 });
        if (res.success) setData(res.data);
      } else if (reportType === 'leaves') {
        const res = await getLeaveRequests({ limit: 200 });
        if (res.success) setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [reportType]);

  const exportCSV = () => {
    if (data.length === 0) return;
    let headers = [];
    let rows = [];

    if (reportType === 'employees') {
      headers = ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Joining Date', 'Status'];
      rows = data.map((e) => [
        e.employee_id,
        `${e.first_name} ${e.last_name}`,
        e.email,
        e.department_name || '',
        e.designation || '',
        e.joining_date ? e.joining_date.split('T')[0] : '',
        e.status,
      ]);
    } else if (reportType === 'departments') {
      headers = ['Name', 'Description', 'Employee Count'];
      rows = data.map((d) => [d.name, d.description || '', d.employee_count]);
    } else if (reportType === 'attendance') {
      headers = ['Employee', 'Date', 'Check In', 'Check Out', 'Status'];
      rows = data.map((a) => [
        `${a.first_name} ${a.last_name}`,
        a.date ? a.date.split('T')[0] : '',
        a.check_in || '',
        a.check_out || '',
        a.status,
      ]);
    } else if (reportType === 'leaves') {
      headers = ['Employee', 'Type', 'Start', 'End', 'Reason', 'Status'];
      rows = data.map((l) => [
        `${l.first_name} ${l.last_name}`,
        l.leave_type_name,
        l.start_date ? l.start_date.split('T')[0] : '',
        l.end_date ? l.end_date.split('T')[0] : '',
        l.reason || '',
        l.status,
      ]);
    }

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <Navbar title="Reports" subtitle="Generate and export system reports" />

      <div className="toolbar">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="employees">Employee List</option>
          <option value="departments">Department-wise</option>
          <option value="attendance">Attendance Report</option>
          <option value="leaves">Leave Report</option>
        </select>
        <button className="btn btn-primary" onClick={exportCSV} disabled={data.length === 0}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="card table-card">
        {loading ? (
          <p className="empty-text">Loading...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {reportType === 'employees' && (
                  <>
                    <th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Status</th>
                  </>
                )}
                {reportType === 'departments' && (
                  <><th>Name</th><th>Description</th><th>Employees</th></>
                )}
                {reportType === 'attendance' && (
                  <><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></>
                )}
                {reportType === 'leaves' && (
                  <><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Status</th></>
                )}
              </tr>
            </thead>
            <tbody>
              {reportType === 'employees' && data.map((e) => (
                <tr key={e.id}>
                  <td className="mono">{e.employee_id}</td>
                  <td>{e.first_name} {e.last_name}</td>
                  <td>{e.email}</td>
                  <td>{e.department_name || '-'}</td>
                  <td>{e.designation || '-'}</td>
                  <td><span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{e.status}</span></td>
                </tr>
              ))}
              {reportType === 'departments' && data.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.description || '-'}</td>
                  <td>{d.employee_count}</td>
                </tr>
              ))}
              {reportType === 'attendance' && data.map((a) => (
                <tr key={a.id}>
                  <td>{a.first_name} {a.last_name}</td>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.check_in || '-'}</td>
                  <td>{a.check_out || '-'}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
              {reportType === 'leaves' && data.map((l) => (
                <tr key={l.id}>
                  <td>{l.first_name} {l.last_name}</td>
                  <td>{l.leave_type_name}</td>
                  <td>{formatDate(l.start_date)}</td>
                  <td>{formatDate(l.end_date)}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan="6" className="empty-text">No data</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;