import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getEmployee } from '../../services/employeeService';
import { formatDate } from '../../utils/formatDate';
import { Edit, ArrowLeft } from 'lucide-react';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployee(id)
      .then((res) => {
        if (res.success) setEmployee(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader text="Loading..." />;
  if (!employee) return <div className="page"><p>Employee not found</p></div>;

  return (
    <div className="page">
      <Navbar title="Employee Profile" subtitle={`${employee.first_name} ${employee.last_name}`} />

      <div className="toolbar">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <Link to={`/admin/employees/edit/${id}`} className="btn btn-primary">
          <Edit size={16} /> Edit
        </Link>
      </div>

      <div className="profile-card card">
        <div className="profile-header">
          <div className="avatar large">
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </div>
          <div>
            <h2>{employee.first_name} {employee.last_name}</h2>
            <p>{employee.designation || 'No designation'} · {employee.department_name || 'No department'}</p>
            <span className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {employee.status}
            </span>
          </div>
        </div>

        <div className="profile-grid">
          <div className="info-item">
            <label>Employee ID</label>
            <span className="mono">{employee.employee_id}</span>
          </div>
          <div className="info-item">
            <label>Email</label>
            <span>{employee.email}</span>
          </div>
          <div className="info-item">
            <label>Phone</label>
            <span>{employee.phone || '-'}</span>
          </div>
          <div className="info-item">
            <label>Department</label>
            <span>{employee.department_name || '-'}</span>
          </div>
          <div className="info-item">
            <label>Designation</label>
            <span>{employee.designation || '-'}</span>
          </div>
          <div className="info-item">
            <label>Joining Date</label>
            <span>{formatDate(employee.joining_date)}</span>
          </div>
          <div className="info-item">
            <label>Date of Birth</label>
            <span>{formatDate(employee.date_of_birth)}</span>
          </div>
          <div className="info-item">
            <label>Gender</label>
            <span>{employee.gender || '-'}</span>
          </div>
          <div className="info-item full">
            <label>Address</label>
            <span>{employee.address || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;