import { collapseBoard, getAllValidMoves, isSolutionFound, movePiece } from "../boardUtils";
import type { Board, PieceMap, Move, Node } from "../types";

export const beamSearch = (
    board: Board,
    pieces: PieceMap,
    heuristicFunction: (board: Board, pieces: PieceMap) => number,
    beamWidth: number
): { found: boolean, moveHistory: Move[], nodesVisited: number, timeTaken: number } => {
    const startTime = performance.now();
    let nodesVisited = 0;

    const initialH = heuristicFunction(board, pieces);
    const initialNode: Node = {
        board,
        pieces,
        f: initialH,
        h: initialH,
        moveHistory: []
    };

    let beam: Node[] = [initialNode];
    const visited = new Set<string>();

    while (beam.length > 0) {
        const nextBeam: Node[] = [];

        for (const currentNode of beam) {
            nodesVisited++;
            const boardKey = collapseBoard(currentNode.board);
            if (visited.has(boardKey)) continue;
            visited.add(boardKey);

            if (isSolutionFound(currentNode.pieces)) {
                const timeTaken = performance.now() - startTime;
                return {
                    found: true,
                    moveHistory: currentNode.moveHistory,
                    nodesVisited,
                    timeTaken
                };
            }

            const validMoves = getAllValidMoves(currentNode.board, currentNode.pieces);

            for (const validMove of validMoves) {
                const { board: newBoard, pieces: newPieces } = movePiece(currentNode.board, currentNode.pieces, validMove);
                const newKey = collapseBoard(newBoard);
                if (visited.has(newKey)) continue;

                const newH = heuristicFunction(newBoard, newPieces);
                const newNode: Node = {
                    board: newBoard,
                    pieces: newPieces,
                    f: newH,
                    h: newH,
                    moveHistory: [...currentNode.moveHistory, validMove]
                };

                nextBeam.push(newNode);
            }
        }

        nextBeam.sort((a, b) => a.h! - b.h!);
        beam = nextBeam.slice(0, beamWidth);
    }

    const timeTaken = performance.now() - startTime;
    return {
        found: false,
        moveHistory: [],
        nodesVisited,
        timeTaken
    };
};
