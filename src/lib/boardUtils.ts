import type { Board, Move, PieceMap } from "./types";

export const cloneBoard = (board: Board): Board => ({
    width: board.width,
    height: board.height,
    grid: board.grid.map(row => [...row])
});

export const getAllValidMoves = (board: Board, pieces: PieceMap): Move[] => {
    const results: Move[] = [];

    Object.values(pieces).forEach(piece => {
        if (piece.symbol = "K") {
            return;
        }

        if (!piece.orientation || piece.orientation === "Unknown") {
            return;
        }

        if (piece.orientation === "Horizontal") {
            let step = 1;
            const row = piece.pos.row;
            const leftmostCol = piece.pos.col;
            const rightmostCol = piece.pos.col + piece.size - 1;

            // Check left moves
            while (leftmostCol - step >= 0) {
                const currentCell = board.grid[row][leftmostCol - step];
                if (currentCell === ".") {
                    results.push({ piece, direction: "Left", steps: step });
                    step++;
                } else if (currentCell === "K" && piece.symbol === "P") {
                    results.push({ piece, direction: "Left", steps: step });
                    break;
                } else {
                    break;
                }
            }

            // Check right moves
            step = 1;
            while (rightmostCol + step < board.width) {
                const currentCell = board.grid[row][rightmostCol + step];
                if (currentCell === ".") {
                    results.push({ piece, direction: "Right", steps: step });
                    step++;
                } else if (currentCell === "K" && piece.symbol === "P") {
                    results.push({ piece, direction: "Right", steps: step });
                    break;
                } else {
                    break;
                }
            }
        } else if (piece.orientation === "Vertical") {
            let step = 1;
            const col = piece.pos.col;
            const topmostRow = piece.pos.row;
            const bottommostRow = piece.pos.row + piece.size - 1;

            // Check up moves
            while (topmostRow - step >= 0) {
                const currentCell = board.grid[topmostRow - step][col];
                if (currentCell === ".") {
                    results.push({ piece, direction: "Up", steps: step });
                    step++;
                } else if (currentCell === "K" && piece.symbol === "P") {
                    results.push({ piece, direction: "Up", steps: step });
                    break;
                } else {
                    break;
                }
            }

            // Check down moves
            step = 1;
            while (bottommostRow + step < board.height) {
                const currentCell = board.grid[bottommostRow + step][col];
                if (currentCell === ".") {
                    results.push({ piece, direction: "Down", steps: step });
                    step++;
                } else if (currentCell === "K" && piece.symbol === "P") {
                    results.push({ piece, direction: "Down", steps: step });
                    break;
                } else {
                    break;
                }
            }
        }
    });
    return results;
}

export const movePiece = (board: Board, pieces: PieceMap, move: Move): { board: Board, pieces: PieceMap } => {
    const newBoard = cloneBoard(board);
    const currentPiece = move.piece;

    if (!currentPiece.orientation || currentPiece.orientation === "Unknown") {
        return { board: newBoard, pieces: {...pieces} };
    }
    
    // Clear old positions
    for (let i = 0; i < currentPiece.size; i++) {
        if (currentPiece.orientation === "Horizontal") {
            newBoard.grid[currentPiece.pos.row][currentPiece.pos.col + i] = ".";
        } else if (currentPiece.orientation === "Vertical") {
            newBoard.grid[currentPiece.pos.row + i][currentPiece.pos.col] = ".";
        }
    }

    let newRow = currentPiece.pos.row;
    let newCol = currentPiece.pos.col;
    switch(move.direction) {
        case "Left":
            newCol -= move.steps;
            break;
        case "Right":
            newCol += move.steps;
            break;
        case "Up":
            newRow -= move.steps;
            break
        case "Down":
            newRow += move.steps;
            break;
    }
    
    // Save new positions
    for (let i = 0; i < currentPiece.size; i++) {
        if (currentPiece.orientation === "Horizontal") {
            newBoard.grid[newRow][newCol + i] = currentPiece.symbol;
        } else if (currentPiece.orientation === "Vertical") {
            newBoard.grid[newRow +i][newCol] = currentPiece.symbol;
        }
    }

    // Update map
    const newPieces = { ...pieces };
    newPieces[currentPiece.symbol] = { ...currentPiece, pos: { row: newRow, col: newCol}};

    return { board: newBoard, pieces: newPieces};
}