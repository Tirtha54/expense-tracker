import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function AddExpense() {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) setCategory(data[0].name);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, amount, category, date }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Expense added successfully!');
        setIsError(false);
        setTitle('');
        setAmount('');
        setDate('');
      } else {
        setMessage('Error: ' + data.error);
        setIsError(true);
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
      setIsError(true);
    }
  };

  return (
    <div className="receipt">
      <div className="receipt-header">
        <div className="stamp">₹</div>
        <h2>New Entry</h2>
      </div>
      <hr className="divider" />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Swiggy, Groceries"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-btn">Add Expense</button>
      </form>

      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default AddExpense;