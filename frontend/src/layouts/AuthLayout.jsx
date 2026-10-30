import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🌿</span>
          <h1>HRM System</h1>
          <p>People · Process · Progress</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;