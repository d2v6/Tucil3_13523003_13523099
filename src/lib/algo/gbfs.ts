import { collapseBoard, getAllValidMoves, isSolutionFound, movePiece } from "../boardUtils";
import { PrioQueue } from "../prioQueue";
import type { Board, PieceMap, Move, Node} from "../types"

export const gbfs = (
    board: Board, 
    pieces: PieceMap, 
    heuristicFunction: (board: Board, pieces: PieceMap) => number
): {found: boolean, moveHistory: Move[]} => {
    const openList = new PrioQueue<Node>((a, b) => a.f - b.f);
    const closedList = new Map<string, number>();
    const initialH = heuristicFunction(board, pieces);
    const initialNode: Node = {
        board: board,
        pieces: pieces,
        f: initialH,
        h: initialH,
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
            const newHValue = heuristicFunction(newBoard, newPieces);
            const newFValue = newHValue;
            if (closedList.has(newBoardKey) && closedList.get(newBoardKey)! < newFValue) {
                continue;
            }

            const newNode: Node = {
                board: newBoard,
                pieces: newPieces,
                f: newFValue,
                h: newHValue,
                moveHistory: [...currentNode.moveHistory, validMove]
            };
            openList.push(newNode);
        }
    }
    return {found: false, moveHistory: [] };
} 