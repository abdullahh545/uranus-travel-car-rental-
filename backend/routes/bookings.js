const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/bookings/create
router.post('/create', async (req, res) => {
  const { customer_id, pickup_location, dropoff_location, pickup_time, notes } = req.body;
  if (!customer_id || !pickup_location || !dropoff_location || !pickup_time) {
    return res.status(400).json({ error: 'customer_id, pickup_location, dropoff_location, and pickup_time are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO bookings (customer_id, pickup_location, dropoff_location, pickup_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [customer_id, pickup_location, dropoff_location, pickup_time, notes || null]
    );
    res.status(201).json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/all — Admin
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*,
             cu.name  AS customer_name,
             cu.phone AS customer_phone,
             du.name  AS driver_name,
             v.plate_number,
             v.make   AS vehicle_make,
             v.model  AS vehicle_model
      FROM bookings b
      LEFT JOIN users    cu ON b.customer_id = cu.id
      LEFT JOIN drivers  d  ON b.driver_id   = d.id
      LEFT JOIN users    du ON d.user_id      = du.id
      LEFT JOIN vehicles v  ON b.vehicle_id   = v.id
      ORDER BY b.created_at DESC
    `);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get all bookings error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/customer/:id — Get all bookings for a specific customer
router.get('/customer/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT b.*,
             du.name  AS driver_name,
             v.make   AS vehicle_make,
             v.model  AS vehicle_model,
             v.plate_number
      FROM bookings b
      LEFT JOIN drivers  d  ON b.driver_id  = d.id
      LEFT JOIN users    du ON d.user_id     = du.id
      LEFT JOIN vehicles v  ON b.vehicle_id  = v.id
      WHERE b.customer_id = $1
      ORDER BY b.created_at DESC
    `, [id]);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get customer bookings error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bookings/driver/:id — Get all bookings for a specific driver
router.get('/driver/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT b.*,
             cu.name  AS customer_name,
             cu.phone AS customer_phone,
             v.plate_number,
             v.make   AS vehicle_make,
             v.model  AS vehicle_model
      FROM bookings b
      LEFT JOIN users    cu ON b.customer_id = cu.id
      LEFT JOIN vehicles v  ON b.vehicle_id  = v.id
      WHERE b.driver_id = $1
      ORDER BY b.pickup_time DESC
    `, [id]);
    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get driver bookings error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/bookings/assign — Admin: assign driver + vehicle
router.put('/assign', async (req, res) => {
  const { booking_id, driver_id, vehicle_id } = req.body;
  if (!booking_id || !driver_id || !vehicle_id) {
    return res.status(400).json({ error: 'booking_id, driver_id, and vehicle_id are required' });
  }
  try {
    const result = await pool.query(
      `UPDATE bookings
       SET driver_id = $1, vehicle_id = $2, status = 'confirmed'
       WHERE id = $3 RETURNING *`,
      [driver_id, vehicle_id, booking_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

    await pool.query("UPDATE drivers SET status = 'busy' WHERE id = $1", [driver_id]);

    // Notify dashboard
    req.app.get('io').emit('booking:status:update', {
      booking_id: result.rows[0].id,
      status: 'confirmed',
      driver_id,
    });
    req.app.get('io').emit('driver:status:update', { driver_id, status: 'busy' });

    res.json({ booking: result.rows[0] });
  } catch (err) {
    console.error('Assign booking error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/bookings/status
router.put('/status', async (req, res) => {
  const { booking_id, status } = req.body;
  const valid = ['pending', 'confirmed', 'in_progress', 'arrived', 'completed', 'cancelled'];
  if (!booking_id || !status) return res.status(400).json({ error: 'booking_id and status are required' });
  if (!valid.includes(status)) return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });

  try {
    const result = await pool.query(
      `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
      [status, booking_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

    const booking = result.rows[0];

    if (status === 'completed' || status === 'cancelled') {
      if (booking.driver_id) {
        await pool.query("UPDATE drivers SET status = 'available' WHERE id = $1", [booking.driver_id]);
        // Notify dashboard of driver status change
        req.app.get('io').emit('driver:status:update', {
          driver_id: booking.driver_id,
          status: 'available',
        });
      }
    }

    // Notify all clients (dashboard, customer app) of the booking status change
    req.app.get('io').emit('booking:status:update', {
      booking_id: booking.id,
      status,
      driver_id: booking.driver_id,
      customer_id: booking.customer_id,
    });

    res.json({ booking });
  } catch (err) {
    console.error('Update booking status error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
