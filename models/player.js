const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  gamesWon: { type: Number, default: 0 },
  totalTimePlayed: { type: Number, default: 0 }, // in seconds
  savedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
  lastPlayed: Date,
  lastSaved: Date
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);