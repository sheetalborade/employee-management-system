import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { getLeaveRequests, reviewLeave } from '../../services/leaveService';
import { formatDate } from '../../utils/formatDate';
import { Check, X } from 'lucide-react';

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [comments, setComments] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getLeaveRequests({ status: statusFilter || undefined, limit: 50 });
      if (res.success) setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleReview = async (status) => {
    try {
      await reviewLeave(reviewModal.id, { status, comments });
      setReviewModal(null);
      setComments('');
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
      <Navbar title="Leave Requests" subtitle="Approve or reject employee leave applications" />

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card table-card">
        {loading ? <Loader /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="name-cell">
                      <div className="avatar small">{r.first_name?.[0]}{r.last_name?.[0]}</div>
                      <div>
                        <div>{r.first_name} {r.last_name}</div>
                        <small>{r.department_name}</small>
                      </div>
                    </div>
                  </td>
                  <td>{r.leave_type_name}</td>
                  <td>{formatDate(r.start_date)}</td>
                  <td>{formatDate(r.end_date)}</td>
                  <td className="reason-cell">{r.reason || '-'}</td>
                  <td><span className={`badge ${statusClass(r.status)}`}>{r.status}</span></td>
                  <td>
                    {r.status === 'pending' && (
                      <div className="action-btns">
                        <button className="icon-btn success" title="Approve" onClick={() => setReviewModal({ ...r, action: 'approved' })}>
                          <Check size={16} />
                        </button>
                        <button className="icon-btn danger" title="Reject" onClick={() => setReviewModal({ ...r, action: 'rejected' })}>
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan="7" className="empty-text">No leave requests</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{reviewModal.action === 'approved' ? 'Approve' : 'Reject'} Leave Request</h3>
            <p>
              <strong>{reviewModal.first_name} {reviewModal.last_name}</strong> — {reviewModal.leave_type_name}
              <br />
              {formatDate(reviewModal.start_date)} to {formatDate(reviewModal.end_date)}
            </p>
            <div className="form-group">
              <label>Comments (optional)</label>
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
              <button
                className={`btn ${reviewModal.action === 'approved' ? 'btn-primary' : 'btn-danger'}`}
                onClick={() => handleReview(reviewModal.action)}
              >
                {reviewModal.action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;