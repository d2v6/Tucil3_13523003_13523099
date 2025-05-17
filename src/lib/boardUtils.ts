import type { Board, Move, PieceMap } from "./types";

export const cloneBoard = (board: Board): Board => ({
    width: board.width,
    height: board.height,
    grid: board.grid.map(row => [...row])
});

export const isNextToExit = (
    row: number,
    col: number,
    exitRow: number,
    exitCol: number,
    orientation: "Horizontal" | "Vertical"
): boolean => {
    if (orientation === "Horizontal") {
        return row === exitRow && Math.abs(col - exitCol) === 1;
    } else {
        return col === exitCol && Math.abs(row - exitRow) === 1;
    }
};

export const getAllValidMoves = (board: Board, pieces: PieceMap): Move[] => {
    const results: Move[] = [];

    const exitPiece = pieces["K"];
    const exitRow = exitPiece.pos.row;
    const exitCol = exitPiece.pos.col;

    Object.values(pieces).forEach(piece => {
        if (piece.id === "K") {
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

                    if (piece.id === "P" && isNextToExit(row, leftmostCol - step, exitRow, exitCol, piece.orientation)) {
                        break;
                    }
                    step++;
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

                    if (piece.id === "P" && isNextToExit(row, rightmostCol + step, exitRow, exitCol, piece.orientation)) {
                        break;
                    }
                    step++;
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

                    if (piece.id === "P" && isNextToExit(topmostRow - step, col, exitRow, exitCol, piece.orientation)) {
                        break;
                    }
                    step++;
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

                    if (piece.id === "P" && isNextToExit(bottommostRow + step, col, exitRow, exitCol, piece.orientation)) {
                        break;
                    }
                    step++;
                } else {
                    break;
                }
            }
        }
    });

    return results;
};


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
            newBoard.grid[newRow][newCol + i] = currentPiece.id;
        } else if (currentPiece.orientation === "Vertical") {
            newBoard.grid[newRow +i][newCol] = currentPiece.id;
        }
    }

    // Update map
    const newPieces = { ...pieces };
    newPieces[currentPiece.id] = { ...currentPiece, pos: { row: newRow, col: newCol}};

    return { board: newBoard, pieces: newPieces};
}

export const collapseBoard = (board: Board): string => {
    return board.grid.flat().join("");

}

export const isSolutionFound = (pieces: PieceMap): boolean => {
    const primaryPiece = pieces["P"];
    const exitPiece = pieces["K"];
    if (!primaryPiece || !exitPiece) {
        return false;
    }

    const exitRow = exitPiece.pos.row;
    const exitCol = exitPiece.pos.col;

    const { pos, size, orientation } = primaryPiece;

    if (orientation === "Horizontal") {
        if (pos.row === exitRow) {
            const leftEdge = pos.col;
            const rightEdge = pos.col + size - 1;
            if (exitCol >= rightEdge || exitCol <= leftEdge) {
                return true;
            }
        }
    } else if (orientation === "Vertical") {
        if (pos.col === exitCol) {
            const topEdge = pos.row;
            const bottomEdge = pos.row + size - 1;
            if (exitRow >= bottomEdge || exitRow <= topEdge) {
                return true;
            }
        }
    }

    return false;
};