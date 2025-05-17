export interface Board {
    width: number;
    height: number;
    grid: string[][];
}

export interface Position {
    row: number;
    col: number;
}

export type Orientation = "Horizontal" | "Vertical" | "Unknown" // Unknown is for the exit

export interface Piece {
    symbol: string;
    pos: Position; // topleftmost of the piece
    orientation: Orientation;
    size: number;
}

export type PieceMap = Record<string, Piece>;

export type Direction = "Up" | "Down" | "Left" | "Right"

export interface Move {
    piece: Piece;
    direction: Direction;
    steps: number;
}

export interface Node {
    board: Board;
    pieces: PieceMap;
    f: number;
    g?: number;
    h?: number;
    moveHistory: Move[];
}