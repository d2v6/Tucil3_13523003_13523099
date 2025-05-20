import type { Board, PieceMap } from "../types"

export const blockingCars = (board: Board, pieces: PieceMap): number => {
    const primaryPiece = pieces["P"];
    const exitPiece = pieces["K"];

    const blockers = new Set<string>();

    if (primaryPiece.orientation === "Horizontal") {
        const startCol = primaryPiece.pos.col;
        const endCol = startCol + primaryPiece.size - 1;
        if (exitPiece.pos.col > endCol) {
            for (let c = endCol + 1; c <= exitPiece.pos.col; c++) {
                const cell = board.grid[primaryPiece.pos.row][c];
                if (cell !== ".") {
                    blockers.add(cell); 
                }
            }
        } else if (exitPiece.pos.col < startCol) {
            for (let c = exitPiece.pos.col + 1; c < startCol; c++) {
                const cell = board.grid[primaryPiece.pos.row][c];
                if (cell !== ".") {
                    blockers.add(cell);
                }
            }
        }
    } else {
        const startRow = primaryPiece.pos.row;
        const endRow = startRow + primaryPiece.size - 1;
        if (exitPiece.pos.row > endRow) {
            for (let r = endRow + 1; r <= exitPiece.pos.row; r++) {
                const cell = board.grid[r][primaryPiece.pos.col];
                if (cell !== ".") {
                    blockers.add(cell);
                }
            }
        } else if (exitPiece.pos.row < startRow) {
            for (let r = exitPiece.pos.row + 1; r < startRow; r++) {
                const cell = board.grid[r][primaryPiece.pos.col];
                if (cell !== ".") {
                    blockers.add(cell);
                }
            }
        }
    }

    return blockers.size;
};
