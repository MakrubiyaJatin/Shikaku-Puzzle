const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const { generateBoard, generateRectangles } = require('../gameLogic/gameLogic');

// Start new game
router.get('/new', async (req, res) => {
  try {
    const rows = parseInt(req.query.rows) || 8;
    const cols = parseInt(req.query.cols) || 8;
    
    const board = generateBoard(rows, cols);
    const rectangles = generateRectangles(board);
    
    const game = new Game({
      board,
      rectangles,
      placedRectangles: [],
      isCompleted: false,
      startTime: new Date(),
      playerId: req.sessionID
    });
    
    await game.save();
    
    res.render('game', {
      gameId: game._id,
      rows,
      cols,
      board,
      rectangles
    });
    
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Continue existing game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).send('Game not found');
    }
    
    res.render('game', {
      gameId: game._id,
      rows: game.board.length,
      cols: game.board[0].length,
      board: game.board,
      rectangles: game.rectangles,
      placedRectangles: game.placedRectangles
    });
    
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;