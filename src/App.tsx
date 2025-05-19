import { useState, useRef, useEffect } from "react";
import DraggableCar from "./components/DraggableCar";
import ControlPanel from "./components/ControlPanel";
import { rules } from "./lib/constant/rules";
import type { Car, EdgeGrid, Board, PieceMap, Move, Piece } from "./lib/types";

function App() {
  const [boardWidth, setBoardWidth] = useState<number>(6);
  const [boardHeight, setBoardHeight] = useState<number>(6);
  const [gridSize, setgridSize] = useState<number>(80);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedEdgeGrid, setSelectedEdgeGrid] = useState<EdgeGrid | null>(null);
  const [inputCarLength, setInputCarLength] = useState<number>(2);
  const [inputCarOrientation, setInputCarOrientation] = useState<boolean>(false);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [exitRow, setExitRow] = useState<number>(0);
  const [exitCol, setExitCol] = useState<number>(0);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("aStar");
  const [selectedHeuristic, setSelectedHeuristic] = useState<string>("combined");
  const [solutionMoves, setSolutionMoves] = useState<Move[]>([]);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solutionStep, setSolutionStep] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isAnimatingStep, setIsAnimatingStep] = useState<boolean>(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [originalBoardState, setOriginalBoardState] = useState<Car[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);
  const totalBoardWidth = boardWidth + 2;
  const totalBoardHeight = boardHeight + 2;

  useEffect(() => {
    if (showSolution && solutionMoves.length > 0) {
      setIsAnimatingStep(true);
    }
  }, [solutionStep, showSolution, solutionMoves.length]);

  const startAutoPlay = () => {
    if (isAutoPlaying) return;

    setIsAutoPlaying(true);
    const interval = setInterval(() => {
      setSolutionStep((prevStep) => {
        if (prevStep < solutionMoves.length - 1) {
          setIsAnimatingStep(true);
          setTimeout(() => setIsAnimatingStep(false), 350);
          return prevStep + 1;
        } else {
          stopAutoPlay();
          return prevStep;
        }
      });
    }, 1000);

    setAutoPlayInterval(interval);
  };

  const stopAutoPlay = () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    }
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    if (isAnimatingStep) {
      const timer = setTimeout(() => {
        setIsAnimatingStep(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isAnimatingStep]);

  useEffect(() => {
    return () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };
  }, [autoPlayInterval]);

  useEffect(() => {
    const maxGridSize = 80;
    const minGridSize = 20;
    const largest = Math.max(boardWidth, boardHeight);

    const newGridSize = Math.round(maxGridSize - ((maxGridSize - minGridSize) * (largest - 3)) / 9);

    setgridSize(Math.max(minGridSize, Math.min(maxGridSize, newGridSize)));
  }, [boardWidth, boardHeight]);

  const isEdgeGrid = (row: number, col: number) => {
    return row === 0 || row === totalBoardHeight - 1 || col === 0 || col === totalBoardWidth - 1;
  };

  const isCornerCell = (row: number, col: number) => {
    return (row === 0 && col === 0) || (row === 0 && col === totalBoardWidth - 1) || (row === totalBoardHeight - 1 && col === 0) || (row === totalBoardHeight - 1 && col === totalBoardWidth - 1);
  };

  const ExitMarker = ({ position, gridSize }: { position: EdgeGrid | null; gridSize: number }) => {
    if (!position) return null;

    const style = {
      position: "absolute" as const,
      width: gridSize,
      height: gridSize,
      backgroundColor: "yellow",
      border: "2px solid black",
      borderRadius: "8px",
      zIndex: 5,
      top: position.row * gridSize,
      left: position.col * gridSize,
    };

    return <div style={style} className="exit-marker" />;
  };

  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < totalBoardHeight; row++) {
      for (let col = 0; col < totalBoardWidth; col++) {
        const isCorner = isCornerCell(row, col);
        const isEdge = isEdgeGrid(row, col);

        const dataAttributes = !isEdge
          ? {
              "data-row": row - 1,
              "data-col": col - 1,
            }
          : {};

        grid.push(
          <div
            key={`${row}-${col}`}
            className="border border-gray-300"
            style={{
              width: gridSize,
              height: gridSize,
              backgroundColor: isCorner || isEdge ? "gray" : "white",
            }}
            {...dataAttributes}
          />
        );
      }
    }
    return grid;
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

  const updateCarPosition = (id: string, top: number, left: number) => {
    setCars((prevCars) => prevCars.map((car) => (car.id === id ? { ...car, initialTop: top, initialLeft: left } : car)));
  };

  const deleteCarById = (id: string) => {
    setCars((prevCars) => prevCars.filter((car) => car.id !== id));
  };

  const convertCarsToBoard = (): { board: Board; pieces: PieceMap; overlaps: boolean } => {
    const grid: string[][] = Array(boardHeight)
      .fill(null)
      .map(() => Array(boardWidth).fill("."));

    const piecesMap: PieceMap = {};
    let hasOverlaps = false;

    if (selectedEdgeGrid) {
      const exitPiece: Piece = {
        id: "K",
        pos: {
          row: selectedEdgeGrid.row - 1,
          col: selectedEdgeGrid.col - 1,
        },
        orientation: "Unknown",
        size: 1,
      };
      piecesMap["K"] = exitPiece;

      if (exitPiece.pos.row >= 0 && exitPiece.pos.row < boardHeight && exitPiece.pos.col >= 0 && exitPiece.pos.col < boardWidth) {
        grid[exitPiece.pos.row][exitPiece.pos.col] = "K";
      }
    }

    for (const car of cars) {
      const piece: Piece = {
        id: car.id,
        pos: {
          row: car.initialTop,
          col: car.initialLeft,
        },
        orientation: car.isVertical ? "Vertical" : "Horizontal",
        size: car.size,
      };
      piecesMap[car.id] = piece;

      for (let i = 0; i < car.size; i++) {
        const row = car.isVertical ? car.initialTop + i : car.initialTop;
        const col = car.isVertical ? car.initialLeft : car.initialLeft + i;

        if (grid[row][col] !== ".") {
          hasOverlaps = true;
        }
        grid[row][col] = car.id;
      }
    }

    return {
      board: {
        width: boardWidth,
        height: boardHeight,
        grid,
      },
      pieces: piecesMap,
      overlaps: hasOverlaps,
    };
  };

  const boardWidthPx = boardWidth * gridSize;
  const boardHeightPx = boardHeight * gridSize;
  const totalBoardWidthPx = totalBoardWidth * gridSize;
  const totalBoardHeightPx = totalBoardHeight * gridSize;

  return (
    <main className="relative flex flex-row  items-center p-4 w-full min-h-screen bg-gray-100">
      <div className="w-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-6 text-center">Unblock Car Game</h1>
        <ControlPanel
          boardWidth={boardWidth}
          setBoardWidth={setBoardWidth}
          boardHeight={boardHeight}
          setBoardHeight={setBoardHeight}
          gridSize={gridSize}
          cars={cars}
          setCars={setCars}
          selectedEdgeGrid={selectedEdgeGrid}
          setSelectedEdgeGrid={setSelectedEdgeGrid}
          totalBoardWidth={totalBoardWidth}
          totalBoardHeight={totalBoardHeight}
          inputCarLength={inputCarLength}
          setInputCarLength={setInputCarLength}
          inputCarOrientation={inputCarOrientation}
          setInputCarOrientation={setInputCarOrientation}
          isPrimary={isPrimary}
          setIsPrimary={setIsPrimary}
          exitRow={exitRow}
          setExitRow={setExitRow}
          exitCol={exitCol}
          setExitCol={setExitCol}
          selectedAlgorithm={selectedAlgorithm}
          setSelectedAlgorithm={setSelectedAlgorithm}
          selectedHeuristic={selectedHeuristic}
          setSelectedHeuristic={setSelectedHeuristic}
          solutionMoves={solutionMoves}
          setSolutionMoves={setSolutionMoves}
          isSolving={isSolving}
          setIsSolving={setIsSolving}
          solutionStep={solutionStep}
          setSolutionStep={setSolutionStep}
          showSolution={showSolution}
          setShowSolution={setShowSolution}
          convertCarsToBoard={convertCarsToBoard}
          getRandomCharacter={getRandomCharacter}
          isAnimatingStep={isAnimatingStep}
          setIsAnimatingStep={setIsAnimatingStep}
          isAutoPlaying={isAutoPlaying}
          startAutoPlay={startAutoPlay}
          stopAutoPlay={stopAutoPlay}
          originalBoardState={originalBoardState}
          setOriginalBoardState={setOriginalBoardState}
        />
        <div className="flex flex-col items-center justify-center">
          <h2 className="font-bold text-3xl">Rules</h2>
          <div>
            {rules.map((rule, index) => (
              <p key={index}>
                {index + 1}. {rule}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 relative w-full flex items-center justify-center">
        <div
          ref={boardRef}
          className="grid bg-white"
          style={{
            gridTemplateColumns: `repeat(${totalBoardWidth}, ${gridSize}px)`,
            gridTemplateRows: `repeat(${totalBoardHeight}, ${gridSize}px)`,
            width: totalBoardWidthPx,
            height: totalBoardHeightPx,
            position: "relative",
          }}
        >
          {renderGrid()}
          <ExitMarker position={selectedEdgeGrid} gridSize={gridSize} />
        </div>
      </div>

      {cars.map((car) => (
        <DraggableCar
          key={car.id}
          id={car.id}
          width={car.isVertical ? gridSize : car.size * gridSize}
          height={car.isVertical ? car.size * gridSize : gridSize}
          minTop={0}
          maxTop={boardHeightPx - (car.isVertical ? car.size : 1) * gridSize + 1.75 * gridSize}
          minLeft={0}
          maxLeft={boardWidthPx - (car.isVertical ? 1 : car.size) * gridSize + 1.75 * gridSize}
          initialTop={(car.initialTop + 1) * gridSize}
          initialLeft={(car.initialLeft + 1) * gridSize}
          parentRef={boardRef}
          onPositionChange={updateCarPosition}
          inputGridSize={gridSize}
          deleteCarById={deleteCarById}
          isPrimary={car.isPrimary}
          isExecutingMove={isAnimatingStep && showSolution && solutionMoves.length > 0 && solutionMoves[solutionStep]?.piece.id === car.id}
          moveDirection={isAnimatingStep && showSolution && solutionMoves.length > 0 && solutionMoves[solutionStep]?.piece.id === car.id ? solutionMoves[solutionStep].direction : undefined}
          moveSteps={isAnimatingStep && showSolution && solutionMoves.length > 0 && solutionMoves[solutionStep]?.piece.id === car.id ? solutionMoves[solutionStep].steps : undefined}
        />
      ))}
    </main>
  );
}

export default App;
