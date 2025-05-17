import { collapseBoard, getAllValidMoves, isSolutionFound, movePiece } from "../boardUtils";
import { PrioQueue } from "../prioQueue";
import type { Board, PieceMap, Move, Node} from "../types"

export const ucs = (
    board: Board, 
    pieces: PieceMap
): {found: boolean, moveHistory: Move[]} => {
    const openList = new PrioQueue<Node>((a, b) => a.f - b.f);
    const closedList = new Map<string, number>();
    const initialG = 0;

    const initialNode: Node = {
        board: board,
        pieces: pieces,
        f: initialG,
        g: initialG,
        moveHistory: []
    };

    openList.push(initialNode);

    while (!openList.isEmpty()) {
        const currentNode = openList.pop();
        if (!currentNode) {
            continue;
        }
        const boardKey = collapseBoard(currentNode.board);
        if (closedList.has(boardKey) && closedList.get(boardKey)! < currentNode.f) {
            continue;
        }
        closedList.set(boardKey, currentNode.f);

        if (isSolutionFound(currentNode.pieces)) {
            return {found: true, moveHistory: currentNode.moveHistory };
        }

        const validMoves = getAllValidMoves(currentNode.board, currentNode.pieces);

        for (const validMove of validMoves) {
            const { board: newBoard, pieces: newPieces } = movePiece(currentNode.board, currentNode.pieces, validMove);
            const newBoardKey = collapseBoard(newBoard);
            const newGValue = currentNode.g! + 1;
            const newFValue = newGValue;
            if (closedList.has(newBoardKey) && closedList.get(newBoardKey)! < newFValue) {
                continue;
            }

            const newNode: Node = {
                board: newBoard,
                pieces: newPieces,
                f: newFValue,
                g: newGValue,
                moveHistory: [...currentNode.moveHistory, validMove]
            };
            openList.push(newNode);
        }
    }
    return {found: false, moveHistory: [] };
} 