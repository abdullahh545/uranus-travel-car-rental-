const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// GET /api/drivers/available
router.get('/available', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, u.name, u.phone, d.license_number,
             d.status, d.rating, d.total_trips,
             v.id AS vehicle_id, v.make, v.model, v.plate_number, v.vehicle_type
      FROM drivers d
      JOIN  users    u ON d.user_id   = u.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      WHERE d.status = 'available'
      ORDER BY u.name ASC
    `);
    res.json({ drivers: result.rows });
  } catch (err) {
    console.error('Get available drivers error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/drivers/all — Admin
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, u.name, u.email, u.phone, d.license_number,
             d.status, d.rating, d.total_trips, d.created_at,
             v.id AS vehicle_id, v.make, v.model, v.plate_number, v.vehicle_type
      FROM drivers d
      JOIN  users    u ON d.user_id   = u.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      ORDER BY u.name ASC
    `);
    res.json({ drivers: result.rows });
  } catch (err) {
    console.error('Get all drivers error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/drivers/:id/status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['available', 'busy', 'offline'];
  if (!status || !valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }
  try {
    const result = await pool.query(
      `UPDATE drivers SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });

    // Notify dashboard of driver status change
    req.app.get('io').emit('driver:status:update', { driver_id: parseInt(id), status });

    res.json({ driver: result.rows[0] });
  } catch (err) {
    console.error('Update driver status error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/drivers — Admin: add a new driver
router.post('/', async (req, res) => {
  const { name, email, password, phone, license_number } = req.body;
  if (!name || !email || !password || !license_number)
    return res.status(400).json({ error: 'name, email, password, and license_number are required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'driver')
       RETURNING id, name, email, phone`,
      [name, email, hash, phone || null]
    );
    const user = userResult.rows[0];

    const driverResult = await client.query(
      `INSERT INTO drivers (user_id, license_number, status)
       VALUES ($1, $2, 'offline')
       RETURNING *`,
      [user.id, license_number]
    );

    await client.query('COMMIT');
    res.status(201).json({
      driver: { ...driverResult.rows[0], name: user.name, email: user.email, phone: user.phone, total_trips: 0, rating: 0 }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add driver error:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/drivers/:id — Admin: remove a driver
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const driverRow = await client.query('SELECT user_id FROM drivers WHERE id = $1', [id]);
    if (driverRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Driver not found' });
    }
    const userId = driverRow.rows[0].user_id;

    await client.query('DELETE FROM drivers WHERE id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete driver error:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/drivers/location
router.put('/location', async (req, res) => {
  const { driver_id, latitude, longitude } = req.body;
  if (!driver_id || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'driver_id, latitude, and longitude are required' });
  }
  try {
    const result = await pool.query(
      `UPDATE drivers SET updated_at = NOW() WHERE id = $1 RETURNING id`,
      [driver_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ driver: result.rows[0] });
  } catch (err) {
    console.error('Update driver location error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/drivers/:id — Admin: update driver details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, license_number, status } = req.body;

  const validStatuses = ['available', 'busy', 'offline'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const driverRow = await client.query('SELECT user_id FROM drivers WHERE id = $1', [id]);
    if (driverRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Driver not found' });
    }
    const userId = driverRow.rows[0].user_id;

    await client.query(
      `UPDATE users SET
         name  = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = $3
       WHERE id = $4`,
      [name || null, email || null, phone ?? null, userId]
    );

    const fields = [];
    const values = [];
    let i = 1;
    if (license_number) { fields.push(`license_number = $${i++}`); values.push(license_number); }
    if (status)          { fields.push(`status = $${i++}`);         values.push(status); }
    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE drivers SET ${fields.join(', ')} WHERE id = $${i}`, values);
    }

    const result = await client.query(`
      SELECT d.id, u.name, u.email, u.phone, d.license_number,
             d.status, d.rating, d.total_trips, d.created_at,
             v.id AS vehicle_id, v.make, v.model, v.plate_number, v.vehicle_type
      FROM drivers d
      JOIN  users u ON d.user_id = u.id
      LEFT JOIN vehicles v ON v.driver_id = d.id
      WHERE d.id = $1
    `, [id]);

    await client.query('COMMIT');
    res.json({ driver: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update driver error:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
