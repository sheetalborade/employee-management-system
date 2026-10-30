import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../services/departmentService';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | dept object for edit
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDepartments();
      if (res.success) setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ name: '', description: '' });
    setError('');
    setModal('add');
  };

  const openEdit = (d) => {
    setForm({ name: d.name, description: d.description || '' });
    setError('');
    setModal(d);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'add') {
        await createDepartment(form);
      } else {
        await updateDepartment(modal.id, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDepartment(deleteId);
      setDeleteId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete');
      setDeleteId(null);
    }
  };

  return (
    <div className="page">
      <Navbar title="Departments" subtitle="Manage organization departments" />

      <div className="toolbar">
        <div />
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="card table-card">
        {loading ? <Loader /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Employees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.description || '-'}</td>
                  <td>{d.employee_count}</td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn" onClick={() => openEdit(d)}><Edit size={16} /></button>
                      <button className="icon-btn danger" onClick={() => setDeleteId(d.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr><td colSpan="4" className="empty-text">No departments yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add Department' : 'Edit Department'}</h3>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Department"
        message="Are you sure? This cannot be undone if no employees are assigned."
        confirmText="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default Departments;