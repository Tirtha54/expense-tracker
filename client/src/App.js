import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ViewExpenses from './pages/ViewExpenses';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import AddIncome from './pages/AddIncome';
import ViewIncome from './pages/ViewIncome';
import Categories from './pages/Categories';

function ProtectedLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-expense" element={<div className="page-content"><AddExpense /></div>} />
          <Route path="/income" element={<div className="page-content"><ViewIncome /></div>} />
         <Route path="/add-income" element={<div className="page-content"><AddIncome /></div>} />
          <Route path="/expenses" element={<div className="page-content"><ViewExpenses /></div>} />
          <Route path="/categories" element={<div className="page-content"><Categories /></div>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;