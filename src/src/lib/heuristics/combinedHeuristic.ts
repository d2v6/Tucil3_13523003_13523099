import type { Board, PieceMap } from "../types";
import { blockingCars } from "./blockingCars";
import { distanceToExit } from "./distanceToExit";
import { moveNeededEstimate } from "./moveNeededEstimate";

export const combinedHeuristic = (board: Board, pieces: PieceMap): number => {
    return distanceToExit(board, pieces) + blockingCars(board, pieces) + 0.5 * moveNeededEstimate(board, pieces);
}


