import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  food: '#F59E0B',
  travel: '#3B82F6',
  bills: '#F43F5E',
  fees: '#14B8A6',
  shopping: '#8B5CF6',
  entertainment: '#EC4899',
};

const CATEGORY_ICONS = {
  food: '🍔',
  travel: '✈️',
  bills: '💡',
  fees: '🎓',
  shopping: '🛍️',
  entertainment: '🎬',
};

function getCategoryColor(category) {
  const key = category.trim().toLowerCase();
  return CATEGORY_COLORS[key] || '#71847D';
}

function getCategoryIcon(category) {
  const key = category.trim().toLowerCase();
  return CATEGORY_ICONS[key] || '💰';
}

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const [expRes, incRes] = await Promise.all([
          fetch('http://localhost:5000/api/expenses', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/api/income', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const expData = await expRes.json();
        const incData = await incRes.json();

        if (!expRes.ok) throw new Error(expData.error || 'Failed to load expenses');
        if (!incRes.ok) throw new Error(incData.error || 'Failed to load income');

        setExpenses(expData);
        setIncome(incData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const greetingHeader = (
    <div className="dashboard-header">
      <div className="dashboard-greeting">
        <h1>Good day, {user?.name} 👋</h1>
        <p>Here's your financial overview</p>
      </div>
      <div className="dashboard-header-icons">
        <div className="header-icon-btn">🔔</div>
        <div className="header-icon-btn">👤</div>
      </div>
    </div>
  );

  if (loading) return <div className="dashboard-page">{greetingHeader}<div className="panel"><p>Loading dashboard...</p></div></div>;
  if (error) return <div className="dashboard-page">{greetingHeader}<div className="panel"><div className="message error">{error}</div></div></div>;

  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpenses;

  const now = new Date();
  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const categoryTotals = {};
  expenses.forEach((e) => {
    const cat = e.category.trim();
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount);
  });

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="dashboard-page">
      {greetingHeader}

      <div className="dashboard-stats-row four-col">
        <div className="big-stat-card primary">
          <div className="stat-label">Balance</div>
          <div className="stat-value">₹{balance.toFixed(2)}</div>
        </div>
        <div className="big-stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value">₹{totalIncome.toFixed(2)}</div>
        </div>
        <div className="big-stat-card">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">₹{totalExpenses.toFixed(2)}</div>
        </div>
        <div className="big-stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">₹{monthTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div className="stamp">↻</div>
            <h2>Recent Transactions</h2>
          </div>

          {recent.length === 0 && <p>No expenses yet. Add your first expense to start tracking.</p>}

          {recent.map((exp) => (
            <div className="expense-row" key={exp.id}>
              <div
                className="tx-icon"
                style={{ background: getCategoryColor(exp.category) + '22' }}
              >
                {getCategoryIcon(exp.category)}
              </div>
              <div className="expense-main">
                <div className="expense-title">{exp.title}</div>
                <div className="expense-meta">
                  <span className="expense-date">
                    {exp.category} • {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="expense-amount">₹{Number(exp.amount).toFixed(2)}</div>
              <span className="expense-arrow">→</span>
            </div>
          ))}

          <Link to="/expenses" className="view-all-link">View all expenses →</Link>
        </div>

        <div className="dashboard-side-col">
          <div className="panel">
            <div className="panel-header">
              <div className="stamp">▤</div>
              <h2>Category Breakdown</h2>
            </div>

            {pieData.length === 0 && <p>No data yet.</p>}

            {pieData.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pie-legend">
                  {pieData
                    .sort((a, b) => b.value - a.value)
                    .map((entry) => (
                      <div className="pie-legend-row" key={entry.name}>
                        <span className="pie-legend-name">
                          <span
                            className="pie-legend-dot"
                            style={{ background: getCategoryColor(entry.name) }}
                          />
                          {entry.name}
                        </span>
                        <span className="pie-legend-amount">₹{entry.value.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="stamp">⚡</div>
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <Link to="/add-expense" className="quick-action-btn gold">
                ➕ Add Expense
              </Link>
              <Link to="/add-income" className="quick-action-btn">
                💵 Add Income
              </Link>
              <Link to="/expenses" className="quick-action-btn">
                📋 View All Expenses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;