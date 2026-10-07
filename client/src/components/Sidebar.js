import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
    const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">₹</span>
        Expensely
      </div>

      <div className="sidebar-section-label">Main</div>
      <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="sidebar-icon">🏠</span> Dashboard
      </NavLink>
            <NavLink to="/income" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="sidebar-icon">💵</span> Income
      </NavLink>
      <NavLink to="/add-expense" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="sidebar-icon">➕</span> Add Expense
      </NavLink>
      <NavLink to="/expenses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        <span className="sidebar-icon">📋</span> View Expenses
      </NavLink>
            <div className="sidebar-footer">
        <div className="sidebar-user">👤 {user?.name}</div>
        <button className="sidebar-link logout-btn" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;