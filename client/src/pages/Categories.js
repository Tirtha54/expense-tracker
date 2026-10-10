import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Categories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const loadData = async () => {
    try {
      const [catRes, expRes] = await Promise.all([
        fetch('http://localhost:5000/api/categories', { headers: authHeaders }),
        fetch('http://localhost:5000/api/expenses', { headers: authHeaders }),
      ]);
      const catData = await catRes.json();
      const expData = await expRes.json();
      if (catRes.ok) setCategories(catData);
      else setError(catData.error);
      if (expRes.ok) setExpenses(expData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const addCategory = async () => {
    if (!name.trim()) {
      setError('Enter a category name');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name, color }),
      });
      const data = await response.json();
      if (response.ok) {
        setName('');
        setError('');
        loadData();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Existing expenses keep their label.')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await response.json();
      if (response.ok) {
        setError('');
        loadData();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // expenses that belong to one category
  const expensesFor = (catName) =>
    expenses.filter((e) => String(e.category).toLowerCase() === catName.toLowerCase());

  // group those expenses by title: { title, count, total }
  const itemsFor = (catName) => {
    const groups = {};
    expensesFor(catName).forEach((e) => {
      const key = String(e.title).trim().toLowerCase();
      if (!groups[key]) groups[key] = { title: e.title, count: 0, total: 0 };
      groups[key].count += 1;
      groups[key].total += Number(e.amount);
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  };

  return (
    <div className="receipt">
      <div className="receipt-header">
        <div className="stamp">🏷️</div>
        <h2>Categories</h2>
      </div>
      <hr className="divider" />

      <div className="form-group">
        <label>New category</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Gym, Maid, Office commute..."
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: '56px', padding: '4px', cursor: 'pointer' }}
            title="Pick a color"
          />
        </div>
      </div>
      <button className="submit-btn" onClick={addCategory}>
        Add category
      </button>

      {error && <div className="message error">{error}</div>}

      <div style={{ marginTop: '24px' }}>
        {loading && <p>Loading...</p>}
        {categories.map((c) => {
          const total = expensesFor(c.name).reduce((s, e) => s + Number(e.amount), 0);
          const isOpen = openId === c.id;
          const items = isOpen ? itemsFor(c.name) : [];

          return (
            <div key={c.id}>
              <div
                className="expense-row"
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenId(isOpen ? null : c.id)}
              >
                <span
                  className="pie-legend-dot"
                  style={{ background: c.color, width: 14, height: 14 }}
                />
                <div className="expense-main">
                  <div
                    className="expense-title"
                    style={{ marginBottom: 0, textTransform: 'capitalize' }}
                  >
                    {c.name}
                  </div>
                </div>
                <div className="expense-amount">₹{total.toFixed(2)}</div>
                <span className="expense-arrow">{isOpen ? '▲' : '▼'}</span>
                <button
                  className="icon-btn"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCategory(c.id);
                  }}
                >
                  🗑️
                </button>
              </div>

              {isOpen && (
                <div style={{ padding: '4px 12px 12px 36px' }}>
                  {items.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No expenses in this category yet.
                    </p>
                  )}
                  {items.map((it) => (
                    <div
                      key={it.title}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span>
                        {it.title}
                        <span style={{ color: 'var(--text-secondary)' }}> ×{it.count}</span>
                      </span>
                      <span style={{ fontWeight: 600 }}>₹{it.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Categories;