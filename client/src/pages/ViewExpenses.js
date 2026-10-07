import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  food: '#D4A72C',
  travel: '#2F6F5E',
  bills: '#D95C5C',
  fees: '#164A3A',
  shopping: '#E6A23C',
  entertainment: '#6A4C93',
};

function getCategoryColor(category) {
  const key = category.trim().toLowerCase();
  return CATEGORY_COLORS[key] || '#71847D';
}

function ViewExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', category: '', date: '' });
  const { token } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setExpenses(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setEditForm({
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      date: new Date(exp.date).toISOString().split('T')[0],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (response.ok) {
        setEditingId(null);
        fetchExpenses();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        fetchExpenses();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <>
      {!loading && !error && (
        <div className="stats-row">
          <div className="stat-card total">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">₹{total.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Entries</div>
            <div className="stat-value">{expenses.length}</div>
          </div>
        </div>
      )}

      <div className="receipt">
        <div className="receipt-header">
          <div className="stamp">≡</div>
          <h2>All Expenses</h2>
        </div>
        <hr className="divider" />

        {loading && <p>Loading...</p>}
        {error && <div className="message error">{error}</div>}

        {!loading && !error && expenses.length === 0 && (
          <p>No expenses yet. Add one to get started!</p>
        )}

        {!loading &&
          expenses.map((exp) =>
            editingId === exp.id ? (
              <div className="edit-form" key={exp.id}>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title"
                />
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  placeholder="Category"
                />
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
                <div className="edit-actions">
                  <button className="btn-save" onClick={() => saveEdit(exp.id)}>Save</button>
                  <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="expense-row" key={exp.id}>
                <div className="expense-main">
                  <div className="expense-title">{exp.title}</div>
                  <div className="expense-meta">
                    <span
                      className="category-tag"
                      style={{ background: getCategoryColor(exp.category) }}
                    >
                      {exp.category}
                    </span>
                    <span className="expense-date">
                      {new Date(exp.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="expense-amount">₹{Number(exp.amount).toFixed(2)}</div>
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => startEdit(exp)} title="Edit">✏️</button>
                  <button className="icon-btn" onClick={() => deleteExpense(exp.id)} title="Delete">🗑️</button>
                </div>
              </div>
            )
          )}
      </div>
    </>
  );
}

export default ViewExpenses;