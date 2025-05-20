import type { Board, Piece, PieceMap } from "../types";

export const recursiveBlockers = (board: Board, pieces: PieceMap): number => {
    const visited = new Set<string>();
    const primaryPiece = pieces["P"];
    if (!primaryPiece) return 0;

    visited.add(primaryPiece.id);
    let total = 0;

    const directBlockers = getDirectBlockers(board, pieces, primaryPiece);

    for (const blocker of directBlockers) {
        const current = pieces[blocker];
        const spaceForward = estimateSpaceNeeded(primaryPiece, current, true);
        const spaceBackward = estimateSpaceNeeded(primaryPiece, current, false);
        total += getRecursiveBlockValue(current, spaceForward, spaceBackward, board, pieces, visited);
    }

    return total;
};

const getRecursiveBlockValue = (
    piece: Piece,
    spaceForward: number,
    spaceBackward: number,
    board: Board,
    pieces: PieceMap,
    visited: Set<string>
): number => {
    visited.add(piece.id);
    let value = 1;

    for (const other of Object.values(pieces)) {
        if (visited.has(other.id) || other.id === piece.id || other.id === "K") {
            continue;
        }
        if (!isPhysicallyBlocking(piece, other, spaceForward, spaceBackward)) {
            continue;
        }

        const canForward = canSlide(piece, other, spaceForward, board, true);
        const canBackward = canSlide(piece, other, spaceBackward, board, false);

        const needForward = estimateSpaceNeeded(piece, other, true);
        const needBackward = estimateSpaceNeeded(piece, other, false);

        let valueForward = Number.MAX_SAFE_INTEGER;
        let valueBackward = Number.MAX_SAFE_INTEGER;

        if (!canForward) {
            valueForward = getRecursiveBlockValue(other, needForward, needBackward, board, pieces, visited);
        }
        if (!canBackward) {
            valueBackward = getRecursiveBlockValue(other, needForward, needBackward, board, pieces, visited);
        }

        value += Math.min(valueForward, valueBackward);
    }
    return value;
};

const estimateSpaceNeeded = (piece: Piece, blocker: Piece, forward: boolean): number => {
    if (piece.orientation === blocker.orientation) {
        return 1;
    }
    const pieceFixed = piece.orientation === "Horizontal" ? piece.pos.row : piece.pos.col;
    const blockStart = piece.orientation === "Horizontal" ? blocker.pos.row : blocker.pos.col;
    const blockEnd = blockStart + blocker.size - 1;

    if (forward) {
        return Math.max(0, blockEnd - pieceFixed + 1);
    } else {
        return Math.max(0, pieceFixed - blockStart + 1);
    }
};

const canSlide = (
    car: Piece,
    blocker: Piece,
    needed: number,
    board: Board,
    forward: boolean
): boolean => {
    if (car.orientation !== blocker.orientation) return false;
    if (!blocker.orientation || blocker.orientation === "Unknown") return false;

    const width = board.width;
    const height = board.height;

    if (blocker.orientation === "Horizontal") {
        const leftmostCol = blocker.pos.col;
        const rightmostCol = blocker.pos.col + blocker.size - 1;

        if (forward) {
            let step = 1;
            while (rightmostCol + step < width) {
                const cell = board.grid[blocker.pos.row][rightmostCol + step];
                if (cell === ".") {
                    if (step >= needed) return true;
                    step++;
                } else {
                    break;
                }
            }
        } else {
            let step = 1;
            while (leftmostCol - step >= 0) {
                const cell = board.grid[blocker.pos.row][leftmostCol - step];
                if (cell === ".") {
                    if (step >= needed) return true;
                    step++;
                } else {
                    break;
                }
            }
        }
    } else if (blocker.orientation === "Vertical") {
        const topmostRow = blocker.pos.row;
        const bottommostRow = blocker.pos.row + blocker.size - 1;

        if (forward) {
            let step = 1;
            while (bottommostRow + step < height) {
                const cell = board.grid[bottommostRow + step][blocker.pos.col];
                if (cell === ".") {
                    if (step >= needed) return true;
                    step++;
                } else {
                    break;
                }
            }
        } else {
            let step = 1;
            while (topmostRow - step >= 0) {
                const cell = board.grid[topmostRow - step][blocker.pos.col];
                if (cell === ".") {
                    if (step >= needed) return true;
                    step++;
                } else {
                    break;
                }
            }
        }
    }

    return false;
};


const isPhysicallyBlocking = (
    piece: Piece,
    other: Piece,
    spaceForward: number,
    spaceBackward: number
): boolean => {
    const occupied = new Set<string>();

    for (let i = 0; i < other.size; i++) {
        const r = other.orientation === "Horizontal" ? other.pos.row : other.pos.row + i;
        const c = other.orientation === "Horizontal" ? other.pos.col + i : other.pos.col;
        occupied.add(`${r},${c}`);
    }

    for (let i = 1; i <= spaceForward; i++) {
        for (let j = 0; j < piece.size; j++) {
            const r = piece.orientation === "Horizontal" ? piece.pos.row : piece.pos.row + j + i;
            const c = piece.orientation === "Horizontal" ? piece.pos.col + j + i : piece.pos.col;
            const key = `${r},${c}`;
            if (occupied.has(key)) return true;
        }
    }

    for (let i = 1; i <= spaceBackward; i++) {
        for (let j = 0; j < piece.size; j++) {
            const r = piece.orientation === "Horizontal" ? piece.pos.row : piece.pos.row + j - i;
            const c = piece.orientation === "Horizontal" ? piece.pos.col + j - i : piece.pos.col;
            const key = `${r},${c}`;
            if (occupied.has(key)) return true;
        }
    }

    return false;
};


const getDirectBlockers = (board: Board, pieces: PieceMap, piece: Piece): Set<string> => {
    const exitPiece = pieces["K"];
    const blockers = new Set<string>();
    const height = board.height;
    const width = board.width;

    if (!exitPiece || !exitPiece.pos) {
        return blockers;
    }

    if (piece.orientation === "Horizontal") {
        const row = piece.pos.row;
        const startCol = piece.pos.col;
        const endCol = startCol + piece.size - 1;

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
        const col = piece.pos.col;
        const startRow = piece.pos.row;
        const endRow = startRow + piece.size - 1;

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

    return blockers;
};
