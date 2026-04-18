const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/vehicles/all
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.make, v.model, v.year, v.plate_number,
             v.vehicle_type, v.capacity, v.created_at,
             u.name  AS driver_name,
             d.id    AS driver_id,
             d.status AS driver_status
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      LEFT JOIN users   u ON d.user_id   = u.id
      ORDER BY v.make, v.model
    `);
    res.json({ vehicles: result.rows });
  } catch (err) {
    console.error('Get all vehicles error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/vehicles — Admin: add a new vehicle
router.post('/', async (req, res) => {
  const { make, model, year, plate_number, vehicle_type, capacity, driver_id } = req.body;
  if (!make || !model || !year || !plate_number || !vehicle_type || !capacity)
    return res.status(400).json({ error: 'make, model, year, plate_number, vehicle_type, and capacity are required' });

  const validTypes = ['sedan', 'luxury', 'suv'];
  if (!validTypes.includes(vehicle_type))
    return res.status(400).json({ error: `vehicle_type must be one of: ${validTypes.join(', ')}` });

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (make, model, year, plate_number, vehicle_type, capacity, driver_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [make, model, parseInt(year), plate_number, vehicle_type, parseInt(capacity), driver_id || null]
    );
    res.status(201).json({ vehicle: result.rows[0] });
  } catch (err) {
    console.error('Add vehicle error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/vehicles/:id — Admin: update vehicle details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { make, model, year, plate_number, vehicle_type, capacity, driver_id } = req.body;

  const validTypes = ['sedan', 'luxury', 'suv'];
  if (vehicle_type && !validTypes.includes(vehicle_type)) {
    return res.status(400).json({ error: `vehicle_type must be one of: ${validTypes.join(', ')}` });
  }

  try {
    await pool.query(
      `UPDATE vehicles SET
         make         = COALESCE($1, make),
         model        = COALESCE($2, model),
         year         = COALESCE($3, year),
         plate_number = COALESCE($4, plate_number),
         vehicle_type = COALESCE($5, vehicle_type),
         capacity     = COALESCE($6, capacity),
         driver_id    = $7
       WHERE id = $8`,
      [
        make || null, model || null,
        year ? parseInt(year) : null,
        plate_number || null, vehicle_type || null,
        capacity ? parseInt(capacity) : null,
        driver_id ? parseInt(driver_id) : null,
        id,
      ]
    );

    const result = await pool.query(`
      SELECT v.id, v.make, v.model, v.year, v.plate_number,
             v.vehicle_type, v.capacity, v.created_at,
             u.name AS driver_name, d.id AS driver_id, d.status AS driver_status
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      LEFT JOIN users   u ON d.user_id   = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    console.error('Update vehicle error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/vehicles/:id — Admin: remove a vehicle
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error('Delete vehicle error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
