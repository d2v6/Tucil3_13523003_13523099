import { useState } from "react";
import type { Car, EdgeGrid, PieceMap, Board, Move } from "../lib/types";
import { parseFileContents } from "../lib/helpers/validateInput";
import { aStar } from "../lib/algo/aStar";
import { gbfs } from "../lib/algo/gbfs";
import { fringeSearch } from "../lib/algo/fringeSearch";
import { ucs } from "../lib/algo/ucs";
import { distanceToExit } from "../lib/heuristics/distanceToExit";
import { blockingCars } from "../lib/heuristics/blockingCars";
import { recursiveBlockers } from "../lib/heuristics/recursiveBlockers";
import { combinedHeuristic } from "../lib/heuristics/combinedHeuristic";
import { moveNeededEstimate } from "../lib/heuristics/moveNeededEstimate";

interface ControlPanelProps {
  boardWidth: number;
  setBoardWidth: (width: number) => void;
  boardHeight: number;
  setBoardHeight: (height: number) => void;
  gridSize: number;
  cars: Car[];
  setCars: (cars: Car[]) => void;
  selectedEdgeGrid: EdgeGrid | null;
  setSelectedEdgeGrid: (grid: EdgeGrid | null) => void;
  totalBoardWidth: number;
  totalBoardHeight: number;
  solutionMoves: Move[];
  setSolutionMoves: (moves: Move[]) => void;
  solutionStep: number;
  setSolutionStep: (step: number) => void;
  convertCarsToBoard: () => { board: Board; pieces: PieceMap; overlaps: boolean };
  isAnimatingStep?: boolean;
  setIsAnimatingStep?: (isAnimating: boolean) => void;
  isAutoPlaying?: boolean;
  startAutoPlay?: () => void;
  stopAutoPlay?: () => void;
  originalBoardState: Car[];
  setOriginalBoardState: (cars: Car[]) => void;
  setIsReverse: (bool: boolean) => void;
}

const ControlPanel = ({
  boardWidth,
  setBoardWidth,
  boardHeight,
  setBoardHeight,
  cars,
  setCars,
  selectedEdgeGrid,
  setSelectedEdgeGrid,
  totalBoardWidth,
  totalBoardHeight,
  solutionMoves,
  setSolutionMoves,
  solutionStep,
  setSolutionStep,
  convertCarsToBoard,
  isAnimatingStep,
  isAutoPlaying,
  startAutoPlay,
  stopAutoPlay,
  originalBoardState,
  setOriginalBoardState,
  setIsReverse,
}: ControlPanelProps) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("aStar");
  const [selectedHeuristic, setSelectedHeuristic] = useState<string>("combined");
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [inputCarLength, setInputCarLength] = useState<number>(2);
  const [inputCarOrientation, setInputCarOrientation] = useState<boolean>(false);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [exitRow, setExitRow] = useState<number>(0);
  const [exitCol, setExitCol] = useState<number>(0);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [nodesFound, setNodesFound] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);

  const primaryCar = cars.find((car) => car.isPrimary);
  const isInitialState = solutionStep === -1;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      alert("Please upload a valid .txt file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseFileContents(text);

      if (!result.success) {
        alert(result.message);
        return;
      }

      if (result.width) setBoardWidth(result.width);
      if (result.height) setBoardHeight(result.height);
      if (result.exitGrid) setSelectedEdgeGrid(result.exitGrid);
      if (result.newCars) setCars(result.newCars);
    };
    reader.readAsText(file);
  };

  const getRandomCharacter = () => {
    const excludedChars = ["K", "P", ".", " "];
    const usedChars = cars.map((car) => car.id);

    for (let charCode = 65; charCode <= 90; charCode++) {
      const letter = String.fromCharCode(charCode);
      if (!excludedChars.includes(letter) && !usedChars.includes(letter)) {
        return letter;
      }
    }
  };

  const addCar = (size: number, isVertical: boolean, isPrimary: boolean) => {
    if (isPrimary && primaryCar) {
      alert("Only one primary car is allowed. Delete the existing primary car first.");
      return;
    }

    const normalCarsCount = cars.filter((car) => !car.isPrimary).length;

    if (!isPrimary && normalCarsCount >= 24) {
      alert("Maximum of 24 normal cars reached");
      return;
    }

    const newCar: Car = {
      id: isPrimary ? "P" : getRandomCharacter() || "*",
      isVertical,
      size,
      initialLeft: 0,
      initialTop: 0,
      isPrimary,
    };

    setCars([...cars, newCar]);
  };

  const solveBoard = () => {
    if (!selectedEdgeGrid) {
      alert("Please select an exit position first");
      return;
    }

    if (!cars.some((car) => car.isPrimary)) {
      alert("Please add a primary car first");
      return;
    }

    const { overlaps, board, pieces } = convertCarsToBoard();

    if (overlaps) {
      alert("There are overlapping cars, fix the positioning!");
      return;
    }

    setOriginalBoardState([...cars]);

    setIsSolving(true);
    setSolutionMoves([]);
    setSolutionStep(-1);

    let heuristicFunction;
    switch (selectedHeuristic) {
      case "distance":
        heuristicFunction = distanceToExit;
        break;
      case "blocking":
        heuristicFunction = blockingCars;
        break;
      case "recursive":
        heuristicFunction = recursiveBlockers;
        break;
      case "moveNeeded":
        heuristicFunction = moveNeededEstimate;
        break;
      default:
        heuristicFunction = combinedHeuristic;
    }

    let result;
    try {
      switch (selectedAlgorithm) {
        case "gbfs":
          result = gbfs(board, pieces, heuristicFunction);
          break;
        case "fringe":
          result = fringeSearch(board, pieces, heuristicFunction);
          break;
        case "ucs":
          result = ucs(board, pieces);
          break;
        default:
          result = aStar(board, pieces, heuristicFunction);
      }

      if (result && result.found) {
        setNodesFound(result.nodesVisited);
        setTimeTaken(result.timeTaken);
        setSolutionMoves(result.moveHistory);
        setShowSolution(true);
        alert(`Solution found in ${result.moveHistory.length} moves!`);
      } else {
        alert("No solution found!");
      }
    } catch (error) {
      console.error("Error solving board:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
            Upload
            <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
          </label>

          <div className="flex items-center">
            <label className="mr-1 text-sm">W:</label>
            <input type="number" min="2" value={boardWidth} onChange={(e) => setBoardWidth(parseInt(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-sm" />
          </div>

          <div className="flex items-center">
            <label className="mr-1 text-sm">H:</label>
            <input type="number" min="2" value={boardHeight} onChange={(e) => setBoardHeight(parseInt(e.target.value))} className="w-12 p-1 border border-gray-300 rounded text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <label className="mr-1 text-sm">Exit:</label>
            <input
              type="number"
              min={0}
              max={totalBoardHeight - 1}
              value={exitRow}
              onChange={(e) => {
                const val = Math.max(0, Math.min(totalBoardHeight - 1, parseInt(e.target.value) || 0));
                setExitRow(val);
                let newCol = exitCol;
                if (val !== 0 && val !== totalBoardHeight - 1) {
                  if (exitCol !== 0 && exitCol !== totalBoardWidth - 1) {
                    newCol = 0;
                  }
                }
                if ((val === 0 || val === totalBoardHeight - 1) && (newCol === 0 || newCol === totalBoardWidth - 1)) {
                  newCol = Math.min(Math.max(1, newCol), totalBoardWidth - 2);
                }
                setExitCol(newCol);
                setSelectedEdgeGrid({ row: val, col: newCol });
              }}
              className="w-12 p-1 border border-gray-300 rounded text-sm"
            />
            <span className="mx-1 text-sm">×</span>
            <input
              type="number"
              min={0}
              max={totalBoardWidth - 1}
              value={exitCol}
              onChange={(e) => {
                const val = Math.max(0, Math.min(totalBoardWidth - 1, parseInt(e.target.value) || 0));
                setExitCol(val);
                let newRow = exitRow;
                if (val !== 0 && val !== totalBoardWidth - 1) {
                  if (exitRow !== 0 && exitRow !== totalBoardHeight - 1) {
                    newRow = 0;
                  }
                }
                if ((val === 0 || val === totalBoardWidth - 1) && (newRow === 0 || newRow === totalBoardHeight - 1)) {
                  newRow = Math.min(Math.max(1, newRow), totalBoardHeight - 2);
                }
                setExitRow(newRow);
                setSelectedEdgeGrid({ row: newRow, col: val });
              }}
              className="w-12 p-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <button
            onClick={() => {
              setCars([]);
              setSelectedEdgeGrid(null);
              setShowSolution(false);
            }}
            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Car:</label>
          <div className="flex items-center">
            <label className="mr-1 text-sm">Len</label>
            <input
              type="number"
              min="2"
              value={inputCarLength}
              onChange={(e) => setInputCarLength(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
              className="w-12 p-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <button className="px-2 py-1 border border-gray-300 rounded text-sm" onClick={() => setInputCarOrientation(!inputCarOrientation)}>
            {inputCarOrientation ? "Vert" : "Horiz"}
          </button>

          <div className="flex items-center">
            <label className="mr-1 text-sm">Primary</label>
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={() => {
                if (!primaryCar || isPrimary) {
                  setIsPrimary(!isPrimary);
                }
              }}
              disabled={primaryCar && !isPrimary}
              className="w-4 h-4"
            />
          </div>
        </div>

        <button onClick={() => addCar(inputCarLength, inputCarOrientation, isPrimary)} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">
          Add Car
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Solver:</label>
          <select value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)} className="p-1 border border-gray-300 rounded text-sm" disabled={isSolving}>
            <option value="aStar">A*</option>
            <option value="gbfs">Greedy</option>
            <option value="fringe">Fringe</option>
            <option value="ucs">UCS</option>
          </select>

          <select
            value={selectedHeuristic}
            onChange={(e) => setSelectedHeuristic(e.target.value)}
            className="p-1 border border-gray-300 rounded text-sm"
            disabled={isSolving || selectedAlgorithm === "ucs"}
          >
            <option value="combined">Combined</option>
            <option value="distance">Distance</option>
            <option value="blocking">Blocking</option>
            <option value="recursive">Recursive</option>
            <option value="moveNeeded">Move Est.</option>
          </select>
        </div>

        <button onClick={solveBoard} disabled={isSolving} className={`px-3 py-1 ${isSolving ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"} text-white rounded text-sm`}>
          {isSolving ? "Solving..." : "Solve"}
        </button>
      </div>
      {showSolution && solutionMoves.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Solution: {solutionMoves.length} moves</span>
            <span className="text-sm font-medium">Nodes: {nodesFound}</span>
            <span className="text-sm font-medium">Time: {timeTaken.toPrecision(3)}ms</span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isAutoPlaying && stopAutoPlay) {
                    stopAutoPlay();
                  }
                  setIsReverse(true);
                  setSolutionStep(Math.max(-1, solutionStep - 1));
                  if (solutionStep === -1 && originalBoardState.length > 0) {
                    setCars([...originalBoardState]);
                  }
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:bg-gray-300"
              >
                ←
              </button>
              <span className="text-xs">
                Step {solutionStep + 1}/{solutionMoves.length}
              </span>
              <button
                onClick={() => {
                  if (isAutoPlaying && stopAutoPlay) {
                    stopAutoPlay();
                  }
                  setIsReverse(false);
                  setSolutionStep(Math.min(solutionMoves.length, solutionStep + 1));
                }}
                disabled={solutionStep === solutionMoves.length - 1}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:bg-gray-300"
              >
                →
              </button>
            </div>
          </div>

          <div className="mt-3 flex justify-center gap-2">
            {!isAutoPlaying ? (
              <button
                onClick={() => {
                  if (startAutoPlay) {
                    startAutoPlay();
                  }
                }}
                disabled={solutionStep === solutionMoves.length || isAnimatingStep}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs disabled:bg-gray-300 hover:bg-green-600"
              >
                Auto Play
              </button>
            ) : (
              <button
                onClick={() => {
                  if (stopAutoPlay) {
                    stopAutoPlay();
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Stop
              </button>
            )}
            <button
              onClick={() => {
                if (originalBoardState.length > 0) {
                  setCars([...originalBoardState]);
                }
                setSolutionStep(-1);
              }}
              disabled={isAnimatingStep || isInitialState}
              className="px-3 py-1 bg-gray-500 text-white rounded text-xs disabled:bg-gray-300 hover:bg-gray-600"
            >
              Reset Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
