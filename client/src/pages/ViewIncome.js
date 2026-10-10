import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ViewIncome() {
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ source: '', amount: '', date: '' });
  const { token } = useAuth();

  useEffect(() => {
    fetchIncome();
    
  }, []);

  const fetchIncome = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/income', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setIncome(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (inc) => {
    setEditingId(inc.id);
    setEditData({
      source: inc.source,
      amount: inc.amount,
      date: String(inc.date).slice(0, 10),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/income/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      const data = await response.json();
      if (response.ok) {
        setEditingId(null);
        setError('');
        fetchIncome();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteIncome = async (id) => {
    if (!window.confirm('Delete this income entry?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/income/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setError('');
        fetchIncome();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const total = income.reduce((sum, inc) => sum + Number(inc.amount), 0);

  return (
    <>
      {!loading && (
        <div className="stats-row">
          <div className="stat-card total">
            <div className="stat-label">Total Income</div>
            <div className="stat-value">₹{total.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Entries</div>
            <div className="stat-value">{income.length}</div>
          </div>
        </div>
      )}

      <div className="receipt">
        <div className="receipt-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stamp">💰</div>
            <h2>Income History</h2>
          </div>
          <Link
            to="/add-income"
            className="quick-action-btn gold"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            + Add Income
          </Link>
        </div>
        <hr className="divider" />

        {loading && <p>Loading...</p>}
        {error && <div className="message error">{error}</div>}

        {!loading && !error && income.length === 0 && (
          <p>No income recorded yet. Add your first entry!</p>
        )}

        {!loading &&
          income.map((inc) =>
            editingId === inc.id ? (
              <div className="edit-form" key={inc.id}>
                <input
                  type="text"
                  value={editData.source}
                  onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                  placeholder="Source"
                />
                <input
                  type="number"
                  step="0.01"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  placeholder="Amount"
                />
                <input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
                <div className="edit-actions">
                  <button className="btn-save" onClick={() => saveEdit(inc.id)}>
                    Save
                  </button>
                  <button className="btn-cancel" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="expense-row" key={inc.id}>
                <div className="expense-main">
                  <div className="expense-title">{inc.source}</div>
                  <div className="expense-meta">
                    <span className="expense-date">
                      {new Date(inc.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="income-amount">₹{Number(inc.amount).toFixed(2)}</div>
                <div className="row-actions">
                  <button className="icon-btn" title="Edit" onClick={() => startEdit(inc)}>
                    ✏️
                  </button>
                  <button className="icon-btn" title="Delete" onClick={() => deleteIncome(inc.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            )
          )}
      </div>
    </>
  );
}

export default ViewIncome;