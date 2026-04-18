const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const [totalBookings, pendingRides, activeDrivers, totalDrivers, totalVehicles] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM bookings'),
        pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'"),
        pool.query("SELECT COUNT(*) FROM drivers WHERE status = 'available'"),
        pool.query('SELECT COUNT(*) FROM drivers'),
        pool.query('SELECT COUNT(*) FROM vehicles'),
      ]);

    res.json({
      totalBookings:  parseInt(totalBookings.rows[0].count),
      pendingRides:   parseInt(pendingRides.rows[0].count),
      activeDrivers:  parseInt(activeDrivers.rows[0].count),
      totalDrivers:   parseInt(totalDrivers.rows[0].count),
      totalVehicles:  parseInt(totalVehicles.rows[0].count),
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
