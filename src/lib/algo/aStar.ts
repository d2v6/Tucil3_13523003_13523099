import { collapseBoard, getAllValidMoves, isSolutionFound, movePiece } from "../boardUtils";
import { PrioQueue } from "../prioQueue";
import type { Board, PieceMap, Move, Node} from "../types"

export const aStar = (
    board: Board, 
    pieces: PieceMap, 
    heuristicFunction: (board: Board, pieces: PieceMap) => number
): {found: boolean, moveHistory: Move[]} => {
    const openList = new PrioQueue<Node>((a, b) => a.f - b.f);
    const closedList = new Map<string, number>();
    const initialG = 0;
    const initialH = heuristicFunction(board, pieces);

    const initialNode: Node = {
        board: board,
        pieces: pieces,
        f: initialG + initialH,
        g: initialG,
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
        if (closedList.has(boardKey) && closedList.get(boardKey)! <= currentNode.g!) {
            continue;
        }
        closedList.set(boardKey, currentNode.g!);

        if (isSolutionFound(currentNode.pieces)) {
            return {found: true, moveHistory: currentNode.moveHistory };
        }

        const validMoves = getAllValidMoves(currentNode.board, currentNode.pieces);

        for (const validMove of validMoves) {
            const { board: newBoard, pieces: newPieces } = movePiece(currentNode.board, currentNode.pieces, validMove);
            const newBoardKey = collapseBoard(newBoard);
            const newGValue = currentNode.g! + 1;
            const newHValue = heuristicFunction(newBoard, newPieces);
            const newFValue = newGValue + newHValue;
            if (closedList.has(newBoardKey) && closedList.get(newBoardKey)! <= newGValue) {
                continue;
            }

            const newNode: Node = {
                board: newBoard,
                pieces: newPieces,
                f: newFValue,
                g: newGValue,
                h: newHValue,
                moveHistory: [...currentNode.moveHistory, validMove]
            };
            openList.push(newNode);
        }
    }
    return {found: false, moveHistory: [] };
} 