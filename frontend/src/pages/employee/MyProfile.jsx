import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/authService';
import { updateOwnProfile } from '../../services/employeeService';
import { formatDate } from '../../utils/formatDate';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getMe()
      .then((res) => {
        if (res.success) {
          setProfile(res.user);
          setForm({ phone: res.user.phone || '', address: res.user.address || '' });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await updateOwnProfile(form);
      if (res.success) {
        setProfile((p) => ({ ...p, phone: form.phone, address: form.address }));
        updateUser({ phone: form.phone });
        setEditing(false);
        setMessage('Profile updated successfully');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page">
      <Navbar title="My Profile" subtitle="View and update your personal information" />

      {message && <div className="alert alert-success">{message}</div>}

      <div className="profile-card card">
        <div className="profile-header">
          <div className="avatar large">
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </div>
          <div>
            <h2>{profile?.firstName} {profile?.lastName}</h2>
            <p>{profile?.designation || 'Employee'} · {profile?.department || 'No Department'}</p>
          </div>
          {!editing && (
            <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {!editing ? (
          <div className="profile-grid">
            <div className="info-item">
              <label>Employee ID</label>
              <span className="mono">{profile?.empCode || '-'}</span>
            </div>
            <div className="info-item">
              <label>Email</label>
              <span>{profile?.email}</span>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <span>{profile?.phone || '-'}</span>
            </div>
            <div className="info-item">
              <label>Department</label>
              <span>{profile?.department || '-'}</span>
            </div>
            <div className="info-item">
              <label>Designation</label>
              <span>{profile?.designation || '-'}</span>
            </div>
            <div className="info-item">
              <label>Joining Date</label>
              <span>{formatDate(profile?.joiningDate)}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MyProfile;