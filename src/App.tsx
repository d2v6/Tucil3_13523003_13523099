import { useState, useRef, useEffect } from "react";
import DraggableCar from "./components/DraggableCar";
import ControlPanel from "./components/ControlPanel";
import { rules } from "./lib/constant/rules";
import type { Car, EdgeGrid, Board, PieceMap, Move, Piece, Direction } from "./lib/types";

function App() {
  const [boardWidth, setBoardWidth] = useState<number>(6);
  const [boardHeight, setBoardHeight] = useState<number>(6);
  const [gridSize, setgridSize] = useState<number>(80);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedEdgeGrid, setSelectedEdgeGrid] = useState<EdgeGrid | null>(null);

  const [solutionMoves, setSolutionMoves] = useState<Move[]>([]);
  const [currentSolutionStep, setCurrentSolutionStep] = useState<number>(0);
  const [isAnimatingStep, setIsAnimatingStep] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [originalBoardState, setOriginalBoardState] = useState<Car[]>([]);

  const [isDisplayable, setIsDisplayble] = useState<boolean>(true);

  const boardRef = useRef<HTMLDivElement>(null);
  const totalBoardWidth = boardWidth + 2;
  const totalBoardHeight = boardHeight + 2;

  const boardWidthPx = boardWidth * gridSize;
  const boardHeightPx = boardHeight * gridSize;
  const totalBoardWidthPx = totalBoardWidth * gridSize;
  const totalBoardHeightPx = totalBoardHeight * gridSize;

  const autoPlayIntervalRef = useRef<number | null>(null);

  const startAutoPlay = () => {
    setIsAutoPlaying(true);

    if (autoPlayIntervalRef.current !== null) {
      window.clearInterval(autoPlayIntervalRef.current);
    }

    autoPlayIntervalRef.current = window.setInterval(() => {
      setCurrentSolutionStep((currentSolutionStep) => {
        if (currentSolutionStep < solutionMoves.length - 1) {
          setIsAnimatingStep(true);
          return currentSolutionStep + 1;
        } else {
          stopAutoPlay();
          return currentSolutionStep;
        }
      });
    }, 350);
  };

  const stopAutoPlay = () => {
    if (autoPlayIntervalRef.current !== null) {
      window.clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    setIsAutoPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (autoPlayIntervalRef.current !== null) {
        window.clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsAnimatingStep(true);
    const animationTimer = setTimeout(() => {
      setIsAnimatingStep(false);
    }, 1);
    return () => {
      clearTimeout(animationTimer);
    };
  }, [currentSolutionStep, isReverse]);

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

  const getReverseDirection = (direction: Direction): Direction => {
    switch (direction) {
      case "Up":
        return "Down";
      case "Down":
        return "Up";
      case "Left":
        return "Right";
      case "Right":
        return "Left";
      default:
        return direction;
    }
  };

  return (
    <main className="relative flex flex-row  items-center p-4 w-full min-h-screen bg-gray-100">
      <div className="w-full flex flex-col items-center justify-center gap-10">
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
          solutionMoves={solutionMoves}
          setSolutionMoves={setSolutionMoves}
          solutionStep={currentSolutionStep}
          setSolutionStep={setCurrentSolutionStep}
          convertCarsToBoard={convertCarsToBoard}
          isAnimatingStep={isAnimatingStep}
          setIsAnimatingStep={setIsAnimatingStep}
          isAutoPlaying={isAutoPlaying}
          startAutoPlay={startAutoPlay}
          stopAutoPlay={stopAutoPlay}
          originalBoardState={originalBoardState}
          setOriginalBoardState={setOriginalBoardState}
          setIsReverse={setIsReverse}
          setIsDisplayable={setIsDisplayble}
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
      {isDisplayable && (
        <>
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
              isExecutingMove={
                isAnimatingStep &&
                solutionMoves.length > 0 &&
                (isReverse ? currentSolutionStep < solutionMoves.length - 1 && solutionMoves[currentSolutionStep + 1]?.piece.id === car.id : solutionMoves[currentSolutionStep]?.piece.id === car.id)
              }
              moveDirection={
                isAnimatingStep && solutionMoves.length > 0
                  ? isReverse
                    ? currentSolutionStep < solutionMoves.length - 1 && solutionMoves[currentSolutionStep + 1]?.piece.id === car.id
                      ? getReverseDirection(solutionMoves[currentSolutionStep + 1].direction)
                      : undefined
                    : solutionMoves[currentSolutionStep]?.piece.id === car.id
                    ? solutionMoves[currentSolutionStep].direction
                    : undefined
                  : undefined
              }
              moveSteps={
                isAnimatingStep && solutionMoves.length > 0
                  ? isReverse
                    ? currentSolutionStep < solutionMoves.length - 1 && solutionMoves[currentSolutionStep + 1]?.piece.id === car.id
                      ? solutionMoves[currentSolutionStep + 1].steps
                      : undefined
                    : solutionMoves[currentSolutionStep]?.piece.id === car.id
                    ? solutionMoves[currentSolutionStep].steps
                    : undefined
                  : undefined
              }
            />
          ))}
        </>
      )}
    </main>
  );
}

export default App;
