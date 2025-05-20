import type { Board, PieceMap } from "../types"

export const blockingCars = (board: Board, pieces: PieceMap): number => {
    const primaryPiece = pieces["P"];
    const exitPiece = pieces["K"];

    if (!primaryPiece || !exitPiece || !primaryPiece.pos || !exitPiece.pos) {
        return 0;
    }

    const blockers = new Set<string>();
    const height = board.height;
    const width = board.width;

    if (primaryPiece.orientation === "Horizontal") {
        const row = primaryPiece.pos.row;
        const startCol = primaryPiece.pos.col;
        const endCol = startCol + primaryPiece.size - 1;

        if (exitPiece.pos.col === width) {
            for (let c = endCol + 1; c < width; c++) {
                const cell = board.grid[row][c];
                if (cell !== ".") blockers.add(cell);
            }
        } else if (exitPiece.pos.col === -1) {
            for (let c = 0; c < startCol; c++) {
                const cell = board.grid[row][c];
                if (cell !== ".") blockers.add(cell);
            }
        }
    } else {
        const col = primaryPiece.pos.col;
        const startRow = primaryPiece.pos.row;
        const endRow = startRow + primaryPiece.size - 1;

        if (exitPiece.pos.row === height) {
            for (let r = endRow + 1; r < height; r++) {
                const cell = board.grid[r][col];
                if (cell !== ".") blockers.add(cell);
            }
        } else if (exitPiece.pos.row === -1) {
            for (let r = 0; r < startRow; r++) {
                const cell = board.grid[r][col];
                if (cell !== ".") blockers.add(cell);
            }
        }
    }

    return blockers.size;
};

