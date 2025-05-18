import type { Board, PieceMap } from "../types";

export const distanceToExit = (_board: Board, pieces: PieceMap): number => {
    const primaryPiece = pieces["P"];
    const exitPiece = pieces["K"];
    if (!primaryPiece || !exitPiece) {
        return Infinity;
    }

    if (primaryPiece.orientation === "Horizontal") {
        if (primaryPiece.pos.row !== exitPiece.pos.row) {
            return Infinity;
        }

        const startCol = primaryPiece.pos.col;
        const endCol = startCol + primaryPiece.size - 1;
        const exitCol = exitPiece.pos.col;

        if (exitCol < startCol) {
            return startCol - exitCol;
        } else {
            return exitCol - endCol;
        }

    } else if (primaryPiece.orientation === "Vertical") {
        if (primaryPiece.pos.col !== exitPiece.pos.col) {
            return Infinity;
        }

        const startRow = primaryPiece.pos.row;
        const endRow = startRow + primaryPiece.size - 1;
        const exitRow = exitPiece.pos.row;

        if (exitRow < startRow) {
            return startRow - exitRow;
        } else {
            return exitRow - endRow;
        }
    }

    return Infinity;
};
