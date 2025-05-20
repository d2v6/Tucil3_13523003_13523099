import type { Board, Move, PieceMap } from "../types";

const boardToString = (board: Board): string => {
  return board.grid.map((row) => row.join("")).join("\n");
};

export const generateSolutionText = (initialBoard: Board, moveHistory: Move[], boardStates: Board[]): string => {
  let output = "Starting Board\n";
  output += boardToString(initialBoard);

  moveHistory.forEach((move, index) => {
    const moveNumber = index + 1;
    output += `Move ${moveNumber}: ${move.piece.id}-${move.direction} ${move.steps} step`;

    if (index + 1 < boardStates.length) {
      output += `\n${boardToString(boardStates[index + 1])}`;
    }
  });

  return output;
};

export const downloadSolutionFile = (initialBoard: Board, moveHistory: Move[], boardStates: Board[], filename: string = "solution.txt"): void => {
  const content = generateSolutionText(initialBoard, moveHistory, boardStates);

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateBoardStates = (initialBoard: Board, moveHistory: Move[], pieces: PieceMap): Board[] => {
  const states: Board[] = [initialBoard];
  let currentBoard = initialBoard;
  let currentPieces = pieces;

  for (const move of moveHistory) {
    const newBoard: Board = {
      width: currentBoard.width,
      height: currentBoard.height,
      grid: currentBoard.grid.map((row) => [...row]),
    };

    const pieceId = move.piece.id;
    const piece = currentPieces[pieceId];

    for (let i = 0; i < piece.size; i++) {
      if (piece.orientation === "Horizontal") {
        newBoard.grid[piece.pos.row][piece.pos.col + i] = ".";
      } else if (piece.orientation === "Vertical") {
        newBoard.grid[piece.pos.row + i][piece.pos.col] = ".";
      }
    }

    let newRow = piece.pos.row;
    let newCol = piece.pos.col;

    switch (move.direction) {
      case "Left":
        newCol -= move.steps;
        break;
      case "Right":
        newCol += move.steps;
        break;
      case "Up":
        newRow -= move.steps;
        break;
      case "Down":
        newRow += move.steps;
        break;
    }

    for (let i = 0; i < piece.size; i++) {
      if (piece.orientation === "Horizontal") {
        newBoard.grid[newRow][newCol + i] = pieceId;
      } else if (piece.orientation === "Vertical") {
        newBoard.grid[newRow + i][newCol] = pieceId;
      }
    }

    currentPieces = {
      ...currentPieces,
      [pieceId]: {
        ...piece,
        pos: { row: newRow, col: newCol },
      },
    };

    states.push(newBoard);
    currentBoard = newBoard;
  }

  return states;
};
