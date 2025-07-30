const mongoose = require('mongoose');

const rectangleSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  width: Number,
  height: Number,
  area: Number,
  isPlaced: Boolean,
  x: Number,
  y: Number
});

const cellSchema = new mongoose.Schema({
  value: String, // Rectangle ID or 0 for empty
  x: Number,
  y: Number
});

const gameSchema = new mongoose.Schema({
  board: [[cellSchema]],
  rectangles: [rectangleSchema],
  placedRectangles: [rectangleSchema],
  isCompleted: Boolean,
  startTime: Date,
  endTime: Date,
  completionTime: Number, // in seconds
  playerId: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);