import { useAuth } from '../context/AuthContext';
import {  Search } from 'lucide-react';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1>{title}</h1>
        {subtitle && <p className="navbar-subtitle">{subtitle}</p>}
      </div>
      <div className="navbar-right">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search..." />
        </div>
        
        <div className="user-info">
          <div className="avatar">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
            </span>
            <span className="user-role">{user?.role === 'admin' ? 'HR Manager' : 'Employee'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;