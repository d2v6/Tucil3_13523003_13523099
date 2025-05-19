import { collapseBoard, getAllValidMoves, isSolutionFound, movePiece } from "../boardUtils";
import type { Board, PieceMap, Move, Node } from "../types";

export const fringeSearch = (
    board: Board,
    pieces: PieceMap,
    heuristicFunction: (board: Board, pieces: PieceMap) => number
): { found: boolean, moveHistory: Move[], nodesVisited: number, timeTaken: number } => {
    const startTime = performance.now();
    let nodesVisited = 0;
    
    const startH = heuristicFunction(board, pieces);
    const initialNode: Node = {
        board,
        pieces,
        g: 0,
        h: startH,
        f: startH,
        moveHistory: []
    };

    let limit = initialNode.f!;
    let fringe: Node[] = [initialNode];
    const visited = new Map<string, number>();

    while (fringe.length > 0) {
        const nextFringe: Node[] = [];
        let minF = Infinity;

        for (const current of fringe) {
            nodesVisited++;
            
            const boardKey = collapseBoard(current.board);
            if (visited.has(boardKey) && visited.get(boardKey)! <= current.g!) {
                continue;
            } 
            
            visited.set(boardKey, current.g!);

            if (isSolutionFound(current.pieces)) {
                const timeTaken = performance.now() - startTime;
                return { 
                    found: true, 
                    moveHistory: current.moveHistory,
                    nodesVisited,
                    timeTaken
                };
            }

            const validMoves = getAllValidMoves(current.board, current.pieces);
            for (const move of validMoves) {
                const { board: newBoard, pieces: newPieces } = movePiece(current.board, current.pieces, move);
                const newG = current.g! + 1;
                const newH = heuristicFunction(newBoard, newPieces);
                const newF = newG + newH;

                const newKey = collapseBoard(newBoard);
                if (visited.has(newKey) && visited.get(newKey)! <= newG) {
                    continue;
                }
                
                const newNode: Node = {
                    board: newBoard,
                    pieces: newPieces,
                    g: newG,
                    h: newH,
                    f: newF,
                    moveHistory: [...current.moveHistory, move]
                };

                if (newF <= limit) {
                    nextFringe.push(newNode);
                } else {
                    minF = Math.min(minF, newF);
                }
            }
        }

        if (nextFringe.length === 0) {
            if (minF === Infinity) break;
            limit = minF;
        }

        fringe = nextFringe;
    }

    const timeTaken = performance.now() - startTime;
    return { 
        found: false, 
        moveHistory: [],
        nodesVisited,
        timeTaken
    };
};