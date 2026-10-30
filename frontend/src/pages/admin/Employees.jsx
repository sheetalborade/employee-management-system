import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getEmployees, deleteEmployee } from '../../services/employeeService';
import { getDepartments } from '../../services/departmentService';
import { formatDate } from '../../utils/formatDate';
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getEmployees({
        page,
        limit: 10,
        search,
        department: deptFilter,
        status: statusFilter,
      });
      if (res.success) {
        setEmployees(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDepartments().then((r) => r.success && setDepartments(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [page, deptFilter, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async () => {
    try {
      await deleteEmployee(deleteId);
      setDeleteId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  return (
    <div className="page">
      <Navbar title="Employees" subtitle="Manage all employees in your organization" />

      <div className="toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Link to="/admin/employees/add" className="btn btn-primary">
          <Plus size={16} /> Add Employee
        </Link>
      </div>

      <div className="card table-card">
        {loading ? (
          <Loader />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.employee_id}</td>
                    <td>
                      <div className="name-cell">
                        <div className="avatar small">{e.first_name?.[0]}{e.last_name?.[0]}</div>
                        {e.first_name} {e.last_name}
                      </div>
                    </td>
                    <td>{e.email}</td>
                    <td>{e.department_name || '-'}</td>
                    <td>{e.designation || '-'}</td>
                    <td>{formatDate(e.joining_date)}</td>
                    <td>
                      <span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" title="View" onClick={() => navigate(`/admin/employees/${e.id}`)}>
                          <Eye size={16} />
                        </button>
                        <button className="icon-btn" title="Edit" onClick={() => navigate(`/admin/employees/edit/${e.id}`)}>
                          <Edit size={16} />
                        </button>
                        {e.status === 'active' && (
                          <button className="icon-btn danger" title="Deactivate" onClick={() => setDeleteId(e.id)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-text">No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span>Page {page} of {pagination.totalPages} ({pagination.total} total)</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Deactivate Employee"
        message="Are you sure you want to deactivate this employee? They will no longer be able to log in."
        confirmText="Deactivate"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Employees;