import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getMyLeaves, applyLeave, cancelLeave, getLeaveTypes, getLeaveBalance } from '../../services/leaveService';
import { formatDate } from '../../utils/formatDate';
import { Plus, X } from 'lucide-react';

const MyLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [types, setTypes] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [leaveRes, typeRes, balRes] = await Promise.all([
        getMyLeaves(),
        getLeaveTypes(),
        getLeaveBalance(),
      ]);
      if (leaveRes.success) setLeaves(leaveRes.data);
      if (typeRes.success) setTypes(typeRes.data);
      if (balRes.success) setBalance(balRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await applyLeave(form);
      setShowApply(false);
      setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return;
    try {
      await cancelLeave(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const statusClass = (s) => {
    const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-secondary' };
    return map[s] || '';
  };

  return (
    <div className="page">
      <Navbar title="My Leave" subtitle="Apply for leave and track your requests" />

      <div className="balance-row">
        {balance.map((b) => (
          <div key={b.id} className="balance-chip">
            <span>{b.name}</span>
            <strong>{b.remaining}/{b.max_days}</strong>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div />
        <button className="btn btn-primary" onClick={() => setShowApply(true)}>
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      <div className="card table-card">
        {loading ? <Loader /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td>{l.leave_type_name}</td>
                  <td>{formatDate(l.start_date)}</td>
                  <td>{formatDate(l.end_date)}</td>
                  <td>{l.reason || '-'}</td>
                  <td><span className={`badge ${statusClass(l.status)}`}>{l.status}</span></td>
                  <td>
                    {l.status === 'pending' && (
                      <button className="icon-btn danger" title="Cancel" onClick={() => handleCancel(l.id)}>
                        <X size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr><td colSpan="6" className="empty-text">No leave requests yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showApply && (
        <div className="modal-overlay" onClick={() => setShowApply(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Apply for Leave</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleApply}>
              <div className="form-group">
                <label>Leave Type *</label>
                <select value={form.leaveTypeId} onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })} required>
                  <option value="">Select Type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (max {t.max_days} days)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowApply(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeave;