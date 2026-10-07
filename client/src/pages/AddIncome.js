import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AddIncome() {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ source, amount, date }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Income added successfully!');
        setIsError(false);
        setSource('');
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
        <div className="stamp">💵</div>
        <h2>Add Income</h2>
      </div>
      <hr className="divider" />

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Source</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Salary, Freelance"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
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

        <button type="submit" className="submit-btn">Add Income</button>
      </form>

      {message && (
        <div className={`message ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default AddIncome;