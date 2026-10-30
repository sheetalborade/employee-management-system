import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getEmployee, updateEmployee } from '../../services/employeeService';
import { getDepartments } from '../../services/departmentService';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([getEmployee(id), getDepartments()]);
        if (empRes.success) {
          const e = empRes.data;
          setForm({
            firstName: e.first_name || '',
            lastName: e.last_name || '',
            email: e.email || '',
            phone: e.phone || '',
            departmentId: e.department_id || '',
            designation: e.designation || '',
            joiningDate: e.joining_date ? e.joining_date.split('T')[0] : '',
            dateOfBirth: e.date_of_birth ? e.date_of_birth.split('T')[0] : '',
            gender: e.gender || '',
            address: e.address || '',
            status: e.status || 'active',
          });
        }
        if (deptRes.success) setDepartments(deptRes.data);
      } catch (err) {
        setError('Failed to load employee');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await updateEmployee(id, {
        ...form,
        departmentId: form.departmentId || null,
      });
      if (res.success) {
        navigate(`/admin/employees/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading..." />;

  return (
    <div className="page">
      <Navbar title="Edit Employee" subtitle="Update employee details" />

      <div className="card form-card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email || ''} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input name="designation" value={form.designation} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Joining Date</label>
              <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} rows={3} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;