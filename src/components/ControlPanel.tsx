import type { Car, EdgeGrid, PieceMap, Board, Move } from "../lib/types";

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
  inputCarLength: number;
  setInputCarLength: (length: number) => void;
  inputCarOrientation: boolean;
  setInputCarOrientation: (isVertical: boolean) => void;
  isPrimary: boolean;
  setIsPrimary: (isPrimary: boolean) => void;
  exitRow: number;
  setExitRow: (row: number) => void;
  exitCol: number;
  setExitCol: (col: number) => void;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algorithm: string) => void;
  selectedHeuristic: string;
  setSelectedHeuristic: (heuristic: string) => void;
  solutionMoves: Move[];
  setSolutionMoves: (moves: Move[]) => void;
  isSolving: boolean;
  setIsSolving: (isSolving: boolean) => void;
  solutionStep: number;
  setSolutionStep: (step: number) => void;
  showSolution: boolean;
  setShowSolution: (show: boolean) => void;
  convertCarsToBoard: () => { board: Board; pieces: PieceMap; overlaps: boolean };
  getRandomCharacter: () => string | undefined;
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
  inputCarLength,
  setInputCarLength,
  inputCarOrientation,
  setInputCarOrientation,
  isPrimary,
  setIsPrimary,
  exitRow,
  setExitRow,
  exitCol,
  setExitCol,
  selectedAlgorithm,
  setSelectedAlgorithm,
  selectedHeuristic,
  setSelectedHeuristic,
  solutionMoves,
  setSolutionMoves,
  isSolving,
  setIsSolving,
  solutionStep,
  setSolutionStep,
  showSolution,
  setShowSolution,
  convertCarsToBoard,
  getRandomCharacter,
}: ControlPanelProps) => {
  const primaryCar = cars.find((car) => car.isPrimary);

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
      console.log("File contents:", text);

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

  const addCar = (size: number, isVertical: boolean, isPrimary: boolean) => {
    if (isPrimary && primaryCar) {
      alert("Only one primary car is allowed. Delete the existing primary car first.");
      return;
    }

    if (cars.length > 24) {
      alert("Max cars reached");
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

    setIsSolving(true);
    setSolutionMoves([]);
    setSolutionStep(0);

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
      case "combined":
      default:
        heuristicFunction = combinedHeuristic;
        break;
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
        case "aStar":
        default:
          result = aStar(board, pieces, heuristicFunction);
          break;
      }

      console.log(result);

      if (result && result.found) {
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
    <div className="w-full flex flex-col items-center mb-6">
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        <div className="flex justify-center">
          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Upload .txt File
            <input type="file" accept=".txt,text/plain" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        <div className="flex items-center">
          <label className="mr-2 font-medium">Board Width:</label>
          <input
            id="width"
            type="number"
            min="3"
            max="10"
            value={boardWidth}
            onChange={(e) => setBoardWidth(Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))}
            className="w-16 p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center">
          <label className="mr-2 font-medium">Board Height:</label>
          <input
            id="height"
            type="number"
            min="3"
            max="10"
            value={boardHeight}
            onChange={(e) => setBoardHeight(Math.max(3, Math.min(10, parseInt(e.target.value) || 3)))}
            className="w-16 p-2 border border-gray-300 rounded"
          />
        </div>

        <button
          onClick={() => {
            setCars([]);
            setSelectedEdgeGrid(null);
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Board
        </button>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-4  flex-col">
        <p className="text-xl font-semibold mb-2 text-center">Input Exit</p>
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <label className="font-medium">Exit Row:</label>
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
              className="w-16 p-2 border border-gray-300 rounded"
            />
            <label className="font-medium">Exit Col:</label>
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
              className="w-16 p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        <div className="flex items-center justify-center text-center">Max row and col for exit = {totalBoardHeight - 1}</div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-center">Create Cars</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center">
            <label className="mr-2 font-medium">Length:</label>
            <input
              id="length"
              type="number"
              min="2"
              value={inputCarLength}
              onChange={(e) => setInputCarLength(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
              className="w-16 p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center">
            <label className="mr-2 font-medium">Orientation:</label>
            <button
              className="border border-gray-300 cursor-pointer p-2 rounded-lg"
              onClick={() => {
                setInputCarOrientation(!inputCarOrientation);
              }}
            >
              {inputCarOrientation ? "Vertical" : "Horizontal"}
            </button>
          </div>

          <div className="flex items-center">
            <label className="mr-2 font-medium">Primary Car:</label>
            <button
              className={`border border-gray-300 cursor-pointer p-2 rounded-lg ${primaryCar && !isPrimary ? "opacity-50" : ""}`}
              onClick={() => {
                if (!primaryCar || isPrimary) {
                  setIsPrimary(!isPrimary);
                }
              }}
              disabled={primaryCar && !isPrimary}
            >
              {isPrimary ? "True" : "False"}
            </button>
          </div>
          <button onClick={() => addCar(inputCarLength, inputCarOrientation, isPrimary)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Add Car
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-center">Solve Board</h2>
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <div>
            <label className="mr-2 font-medium">Algorithm:</label>
            <select value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)} className="p-2 border border-gray-300 rounded" disabled={isSolving}>
              <option value="aStar">A* Search</option>
              <option value="gbfs">Greedy Best-First Search</option>
              <option value="fringe">Fringe Search</option>
              <option value="ucs">Uniform Cost Search</option>
            </select>
          </div>

          <div>
            <label className="mr-2 font-medium">Heuristic:</label>
            <select value={selectedHeuristic} onChange={(e) => setSelectedHeuristic(e.target.value)} className="p-2 border border-gray-300 rounded" disabled={isSolving || selectedAlgorithm === "ucs"}>
              <option value="combined">Combined Heuristic</option>
              <option value="distance">Distance to Exit</option>
              <option value="blocking">Blocking Cars</option>
              <option value="recursive">Recursive Blockers</option>
              <option value="moveNeeded">Move Needed Estimate</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={solveBoard} disabled={isSolving} className={`px-4 py-2 ${isSolving ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"} text-white rounded`}>
            {isSolving ? "Solving..." : "Solve Board"}
          </button>
        </div>

        {showSolution && solutionMoves.length > 0 && (
          <div className="mt-4">
            <h3 className="text-center font-semibold">Solution: {solutionMoves.length} moves</h3>
            <div className="flex justify-center items-center gap-2 mt-2">
              <button onClick={() => setSolutionStep(Math.max(0, solutionStep - 1))} disabled={solutionStep === 0} className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300">
                Previous
              </button>
              <span className="font-medium">
                Step {solutionStep + 1}/{solutionMoves.length}
              </span>
              <button
                onClick={() => setSolutionStep(Math.min(solutionMoves.length - 1, solutionStep + 1))}
                disabled={solutionStep === solutionMoves.length - 1}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
              >
                Next
              </button>
            </div>
            <div className="mt-2 text-center">
              <p>
                Move: {solutionMoves[solutionStep].piece.id} {solutionMoves[solutionStep].direction}
                by {solutionMoves[solutionStep].steps} {solutionMoves[solutionStep].steps === 1 ? "step" : "steps"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Need to import necessary functions from validateInput
import { parseFileContents } from "../lib/helpers/validateInput";
// Need to import algorithm and heuristic functions
import { aStar } from "../lib/algo/aStar";
import { gbfs } from "../lib/algo/gbfs";
import { fringeSearch } from "../lib/algo/fringeSearch";
import { ucs } from "../lib/algo/ucs";
import { distanceToExit } from "../lib/heuristics/distanceToExit";
import { blockingCars } from "../lib/heuristics/blockingCars";
import { recursiveBlockers } from "../lib/heuristics/recursiveBlockers";
import { combinedHeuristic } from "../lib/heuristics/combinedHeuristic";
import { moveNeededEstimate } from "../lib/heuristics/moveNeededEstimate";

export default ControlPanel;
