const mongoose = require('mongoose');

// Generate initial empty board
function generateBoard(rows, cols) {
  const board = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({
        value: 0, // 0 means empty, will be updated with rectangle IDs
        x: j,
        y: i
      });
    }
    board.push(row);
  }
  return board;
}

// Generate rectangles for the board
function generateRectangles(board) {
  const rectangles = [];
  const usedCells = new Set();
  const rows = board.length;
  const cols = board[0].length;
  
  // Helper function to find maximum possible rectangle size
  function findMaxRectangle(x, y) {
    let maxWidth = cols - x;
    let maxHeight = rows - y;
    
    // Find maximum possible width
    for (let w = 1; w <= maxWidth; w++) {
      if (usedCells.has(`${x + w - 1},${y}`)) {
        maxWidth = w - 1;
        break;
      }
    }
    
    // Find maximum possible height
    for (let h = 1; h <= maxHeight; h++) {
      for (let w = 0; w < maxWidth; w++) {
        if (usedCells.has(`${x + w},${y + h - 1}`)) {
          maxHeight = h - 1;
          break;
        }
      }
      if (maxHeight < h) break;
    }
    
    // Randomize the rectangle size within possible bounds
    const width = Math.min(maxWidth, Math.floor(Math.random() * 3) + 2); // 2-4 width
    const height = Math.min(maxHeight, Math.floor(Math.random() * 3) + 2); // 2-4 height
    
    return { width, height };
  }
  
  // Helper function to mark area as used
  function markAreaUsed(x, y, width, height) {
    for (let i = y; i < y + height; i++) {
      for (let j = x; j < x + width; j++) {
        usedCells.add(`${j},${i}`);
      }
    }
  }
  
  // Generate rectangles
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!usedCells.has(`${x},${y}`)) {
        // Find the largest possible rectangle
        const { width, height } = findMaxRectangle(x, y);
        
        // Create the rectangle
        const rectangle = {
          _id: new mongoose.Types.ObjectId(),
          width,
          height,
          area: width * height,
          isPlaced: false,
          x: null,
          y: null
        };
        
        rectangles.push(rectangle);
        markAreaUsed(x, y, width, height);
        
        // Update board cells with rectangle info
        for (let i = y; i < y + height; i++) {
          for (let j = x; j < x + width; j++) {
            board[i][j].value = rectangle._id.toString();
          }
        }
      }
    }
  }
  
  return rectangles;
}

// Check win condition
function checkWinCondition(board, placedRectangles) {
  // Create a map of all cells that should be covered
  const requiredCoverage = new Set();
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      requiredCoverage.add(`${j},${i}`);
    }
  }
  
  // Check all placed rectangles cover exactly the required cells
  for (const rect of placedRectangles) {
    for (let i = rect.y; i < rect.y + rect.height; i++) {
      for (let j = rect.x; j < rect.x + rect.width; j++) {
        const cellKey = `${j},${i}`;
        if (!requiredCoverage.has(cellKey)) {
          return false; // Overlapping or out of bounds
        }
        requiredCoverage.delete(cellKey);
      }
    }
  }
  
  return requiredCoverage.size === 0;
}

module.exports = {
  generateBoard,
  generateRectangles,
  checkWinCondition
};