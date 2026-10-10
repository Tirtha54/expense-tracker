import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

function QuickAdd() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setCategory((prev) => prev || data[0].name);
        }
      })
      .catch(() => {});
  }, [open, token]);

  const close = () => { setOpen(false);
    setAmount('');
    setNote('');
    setError('');
    setType('expense');
  };

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    if (type === 'expense' && !category) {
      setError('Choose a category');
      return;
    }
    if (type === 'income' && !note.trim()) {
      setError('Enter the income source');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const isExpense = type === 'expense';
    const url = isExpense
      ? 'http://localhost:5000/api/expenses'
      : 'http://localhost:5000/api/income';
    const body = isExpense
      ? { title: note.trim() || category, amount, category, date: today }
      : { source: note.trim(), amount, date: today };

    setSaving(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        close();
        window.location.reload();
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <button className="fab" title="Quick add" onClick={() => setOpen(true)}>
        +
      </button>

      {open && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                className={`pill ${type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </button>
              <button
                className={`pill ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                Income
              </button>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250"
                autoFocus
              />
            </div>

            {type === 'expense' && (
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>{type === 'expense' ? 'Note (optional)' : 'Source'}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={type === 'expense' ? 'Swiggy' : 'Salary'}
              />
            </div>

            {error && (
              <div className="message error" style={{ marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <div className="edit-actions">
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn-cancel" onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

export default QuickAdd;