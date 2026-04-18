const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, hash, phone || null]
    );

    const user  = result.rows[0];
    const token = jwt.sign({ id: user.id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user  = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/driver-register
router.post('/driver-register', async (req, res) => {
  const { name, email, password, phone, license_number } = req.body;
  if (!name || !email || !password || !license_number)
    return res.status(400).json({ error: 'Name, email, password, and license number are required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'driver')
       RETURNING id, name, email, phone, role`,
      [name, email, hash, phone || null]
    );
    const user = userResult.rows[0];

    const driverResult = await pool.query(
      `INSERT INTO drivers (user_id, license_number, status)
       VALUES ($1, $2, 'offline')
       RETURNING *`,
      [user.id, license_number]
    );
    const driver = { ...driverResult.rows[0], name: user.name, email: user.email, phone: user.phone };

    const token = jwt.sign({ id: driver.id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, driver });
  } catch (err) {
    console.error('Driver register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/driver-login
router.post('/driver-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await pool.query(
      `SELECT d.*, u.name, u.email, u.phone, u.password_hash
       FROM drivers d JOIN users u ON d.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const driver = result.rows[0];
    const match  = await bcrypt.compare(password, driver.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: driver.id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash: _, ...safe } = driver;
    res.json({ token, driver: safe });
  } catch (err) {
    console.error('Driver login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
