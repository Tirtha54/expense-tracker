require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};


app.get('/', (req, res) => {
  res.send('API working');
});


app.get('/api/db-test', async (req, res) => {
  try {
    await sql.connect(dbConfig);
    const result = await sql.query('SELECT 1 + 1 AS result');
    res.json({ dbConnected: true, result: result.recordset[0].result });
  } catch (err) {
    res.status(500).json({ dbConnected: false, error: err.message });
  }
});
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}


app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const pool = await sql.connect(dbConfig);

    
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, passwordHash)
      .query('INSERT INTO users (name, email, password_hash) VALUES (@name, @email, @password_hash)');

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.recordset[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    
    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', requireAuth, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const userId = req.user.userId;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: 'All fields (title, amount, category, date) are required' });
    }

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('title', sql.NVarChar, title)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('category', sql.NVarChar, category)
      .input('date', sql.Date, date)
      .input('user_id', sql.Int, userId)
      .query('INSERT INTO expenses (title, amount, category, date, user_id) VALUES (@title, @amount, @category, @date, @user_id)');

    res.status(201).json({ message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/income', requireAuth, async (req, res) => {
  try {
    const { source, amount, date } = req.body;
    const userId = req.user.userId;

    if (!source || !amount || !date) {
      return res.status(400).json({ error: 'Source, amount, and date are required' });
    }

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('source', sql.NVarChar, source)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('date', sql.Date, date)
      .input('user_id', sql.Int, userId)
      .query('INSERT INTO income (source, amount, date, user_id) VALUES (@source, @amount, @date, @user_id)');

    res.status(201).json({ message: 'Income added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/income', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT * FROM income WHERE user_id = @user_id ORDER BY date DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT * FROM expenses WHERE user_id = @user_id ORDER BY date DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.put('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;
    const userId = req.user.userId;

    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, userId)
      .input('title', sql.NVarChar, title)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('category', sql.NVarChar, category)
      .input('date', sql.Date, date)
      .query(`UPDATE expenses
              SET title = @title, amount = @amount, category = @category, date = @date
              WHERE id = @id AND user_id = @user_id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/expenses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, userId)
      .query('DELETE FROM expenses WHERE id = @id AND user_id = @user_id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/income/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { source, amount, date } = req.body;
    const userId = req.user.userId;

    if (!source || !amount || !date) {
      return res.status(400).json({ error: 'Source, amount, and date are required' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, userId)
      .input('source', sql.NVarChar, source)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('date', sql.Date, date)
      .query(`UPDATE income
              SET source = @source, amount = @amount, date = @date
              WHERE id = @id AND user_id = @user_id`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json({ message: 'Income updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/income/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('user_id', sql.Int, userId)
      .query('DELETE FROM income WHERE id = @id AND user_id = @user_id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json({ message: 'Income deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const DEFAULT_CATEGORIES = [
  ['food', '#F59E0B'],
  ['travel', '#3B82F6'],
  ['bills', '#F43F5E'],
  ['fees', '#14B8A6'],
  ['shopping', '#8B5CF6'],
  ['entertainment', '#EC4899'],
];


app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await sql.connect(dbConfig);

    let result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query('SELECT id, name, color FROM categories WHERE user_id = @user_id ORDER BY id');

    if (result.recordset.length === 0) {
      for (const [name, color] of DEFAULT_CATEGORIES) {
        await pool.request()
          .input('user_id', sql.Int, userId)
          .input('name', sql.NVarChar, name)
          .input('color', sql.NVarChar, color)
          .query('INSERT INTO categories (user_id, name, color) VALUES (@user_id, @name, @color)');
      }
      result = await pool.request()
        .input('user_id', sql.Int, userId)
        .query('SELECT id, name, color FROM categories WHERE user_id = @user_id ORDER BY id');
    }

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const name = (req.body.name || '').trim().toLowerCase();
    const color = req.body.color || '#8B5CF6';

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    if (name.length > 50) {
      return res.status(400).json({ error: 'Name must be 50 characters or less' });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Invalid color' });
    }

    const pool = await sql.connect(dbConfig);
    const existing = await pool.request()
      .input('user_id', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .query('SELECT id FROM categories WHERE user_id = @user_id AND name = @name');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'This category already exists' });
    }

    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('name', sql.NVarChar, name)
      .input('color', sql.NVarChar, color)
      .query('INSERT INTO categories (user_id, name, color) VALUES (@user_id, @name, @color)');

    res.status(201).json({ message: 'Category added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('user_id', sql.Int, userId)
      .query('DELETE FROM categories WHERE id = @id AND user_id = @user_id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});