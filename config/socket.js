const socketio = require('socket.io');
const Game = require('../models/game');
const Player = require('../models/player');
const { generateBoard, generateRectangles, checkWinCondition } = require('../gameLogic/gameLogic');

const configureSockets = (server) => {
  const io = socketio(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on('connect', () => {
      console.log('Connected to server with socket.id:', socket.id);
    });

    socket.on('initGame', async (data) => {
      try {
        const { rows, cols, playerId } = data;
        if (!rows || !cols || rows < 5 || cols < 5 || rows > 20 || cols > 20) {
          throw new Error('Invalid board dimensions. Must be between 5 and 20.');
        }

        const board = generateBoard(rows, cols);
        const rectangles = generateRectangles(board);

        const game = new Game({
          board,
          rectangles,
          placedRectangles: [],
          isCompleted: false,
          startTime: new Date(),
          playerId: playerId || socket.id
        });

        await game.save();

        socket.emit('gameInitialized', {
          gameId: game._id,
          board,
          rectangles,
          message: 'Game initialized successfully'
        });

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('placeRectangle', async (data) => {
      try {
        const { gameId, rectangleId, position, playerId } = data;
        const game = await Game.findById(gameId);

        if (!game) throw new Error('Game not found');
        if (game.isCompleted) throw new Error('Game already completed');
        
        const rectangle = game.rectangles.find(r => r._id.toString() === rectangleId);
        if (!rectangle) throw new Error('Rectangle not found');
        
        if (position.x + rectangle.width > game.board[0].length || 
            position.y + rectangle.height > game.board.length) {
          throw new Error('Placement out of bounds');
        }

        const wouldOverlap = game.placedRectangles.some(placed => {
          return position.x < placed.x + placed.width &&
                position.x + rectangle.width > placed.x &&
                position.y < placed.y + placed.height &&
                position.y + rectangle.height > placed.y;
        });

        if (wouldOverlap) throw new Error('Rectangles would overlap');

        const placedRectangle = {
          ...rectangle.toObject(),
          x: position.x,
          y: position.y,
          isPlaced: true
        };

        game.placedRectangles.push(placedRectangle);
        
        const isWin = checkWinCondition(game.board, game.placedRectangles);
        if (isWin) {
          game.isCompleted = true;
          game.endTime = new Date();
          game.completionTime = (game.endTime - game.startTime) / 1000;
          
          if (playerId) {
            await Player.findByIdAndUpdate(playerId, {
              $inc: { gamesWon: 1, totalTimePlayed: game.completionTime },
              $set: { lastPlayed: new Date() }
            }, { upsert: true });
          }
        }

        await game.save();

        if (isWin) {
          io.to(gameId).emit('gameWon', {
            message: 'Congratulations! You solved the puzzle!',
            timeElapsed: game.completionTime,
            gameId: game._id
          });
        } else {
          io.to(gameId).emit('rectanglePlaced', {
            placedRectangle,
            message: 'Rectangle placed successfully'
          });
        }

      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('saveProgress', async (data) => {
      try {
        const { gameId, playerId } = data;
        const game = await Game.findById(gameId);
        
        if (!game) throw new Error('Game not found');
        
        await Player.findByIdAndUpdate(playerId, {
          $addToSet: { savedGames: gameId },
          $set: { lastSaved: new Date() }
        }, { upsert: true });
        
        socket.emit('progressSaved', {
          message: 'Game progress saved successfully'
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = configureSockets;