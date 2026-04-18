require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// ─── Attach io to app so routes can emit events ───────────────────────────────
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/drivers',  require('./routes/drivers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/stats',    require('./routes/stats'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Uranus Travel API is running' });
});

// ─── Socket.io — real-time driver location ────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  // Driver emits their location: { driver_id, latitude, longitude }
  socket.on('driver:location', (data) => {
    const { driver_id, latitude, longitude } = data;
    // Broadcast to all connected dashboard/customer clients
    io.emit('driver:location:update', { driver_id, latitude, longitude });
  });

  // Driver joins their own room so admin can target them
  socket.on('driver:join', (driver_id) => {
    socket.join(`driver_${driver_id}`);
    console.log(`[socket] driver ${driver_id} joined room driver_${driver_id}`);
  });

  // Booking status change notification
  socket.on('booking:status', (data) => {
    const { booking_id, status, user_id } = data;
    io.emit('booking:status:update', { booking_id, status, user_id });
  });

  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('PostgreSQL connected — uranus_travel');
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
