const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function register(req, res) {
  const { name, email, password, role = 'patient', phone } = req.body;

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password, and phone are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, passwordHash, role, phone]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    if (error && error.code === '42P01') {
      return res.status(500).json({ message: 'Database schema not initialized' });
    }

    const exposeErrors = String(process.env.EXPOSE_ERRORS || '').toLowerCase() === 'true';
    return res.status(500).json({
      message: 'Registration failed',
      ...(exposeErrors ? { error: error.message } : {})
    });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ message: 'Server misconfigured' });
  }

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password_hash;

    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    if (error && error.code === '42P01') {
      return res.status(500).json({ message: 'Database schema not initialized' });
    }

    const exposeErrors = String(process.env.EXPOSE_ERRORS || '').toLowerCase() === 'true';
    return res.status(500).json({
      message: 'Login failed',
      ...(exposeErrors ? { error: error.message } : {})
    });
  }
}

module.exports = {
  register,
  login
};
