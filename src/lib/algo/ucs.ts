import { collapseBoard, getAllValidMoves, isSolutionFound, movePiece } from "../boardUtils";
import { PrioQueue } from "../prioqueue";
import type { Board, PieceMap, Move} from "../types"

interface Node {
    board: Board;
    pieces: PieceMap;
    cost: number;
    moveHistory: Move[];
}

export const ucs = (board: Board, pieces: PieceMap): {found: boolean, moveHistory: Move[]} => {
    const openList = new PrioQueue<Node>((a, b) => a.cost - b.cost);
    const closedList = new Map<string, number>();

    const initialNode: Node = {
        board: board,
        pieces: pieces,
        cost: 0,
        moveHistory: []
    };

    openList.push(initialNode);
    closedList

    while (!openList.isEmpty()) {
        const currentNode = openList.pop();
        if (!currentNode) {
            continue;
        }
        const boardKey = collapseBoard(currentNode.board);
        if (closedList.has(boardKey) && closedList.get(boardKey)! < currentNode.cost) {
            continue;
        }
        closedList.set(boardKey, currentNode.cost);

        if (isSolutionFound(currentNode.pieces)) {
            return {found: true, moveHistory: currentNode.moveHistory };
        }

        const validMoves = getAllValidMoves(currentNode.board, currentNode.pieces);

        for (const validMove of validMoves) {
            const { board: newBoard, pieces: newPieces } = movePiece(currentNode.board, currentNode.pieces, validMove);
            const newBoardKey = collapseBoard(newBoard);
            if (closedList.has(newBoardKey) && closedList.get(newBoardKey)! < currentNode.cost + 1) {
                continue;
            }

            const newNode: Node = {
                board: newBoard,
                pieces: newPieces,
                cost: currentNode.cost + 1,
                moveHistory: [...currentNode.moveHistory, validMove]
            };
            openList.push(newNode);
        }
    }
    return {found: false, moveHistory: [] };
} 