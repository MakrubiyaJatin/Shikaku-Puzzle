const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const configureSockets = require('./config/socket');
const gameRoutes = require('./routes/game');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
connectDB();

// Routes
app.use('/game', gameRoutes);
app.get('/play', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views', 'game.html'));
});

// Create server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io Configuration
configureSockets(server);