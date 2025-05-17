import { useState, useRef, useEffect } from "react";
import DraggableCar from "./components/DraggableCar";
import { rules } from "./lib/constant/rules";

interface Car {
  id: string;
  width: number;
  height: number;
  isVertical: boolean;
  grids: number;
  initialLeft: number;
  initialTop: number;
}

interface EdgeCell {
  row: number;
  col: number;
}

function App() {
  const [boardWidth, setBoardWidth] = useState<number>(6);
  const [boardHeight, setBoardHeight] = useState<number>(6);
  const [gridSize, setgridSize] = useState<number>(80);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedEdgeCell, setSelectedEdgeCell] = useState<EdgeCell | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const totalBoardWidth = boardWidth + 2;
  const totalBoardHeight = boardHeight + 2;

  useEffect(() => {
    const maxGridSize = 80;
    const minGridSize = 32;
    const maxBoard = 10;
    const largest = Math.max(boardWidth, boardHeight);
    const newGridSize = Math.round(maxGridSize - ((maxGridSize - minGridSize) * (largest - 3)) / (maxBoard - 3));
    setgridSize(newGridSize);
  }, [boardWidth, boardHeight]);

  const isEdgeCell = (row: number, col: number) => {
    return row === 0 || row === totalBoardHeight - 1 || col === 0 || col === totalBoardWidth - 1;
  };

  const isCornerCell = (row: number, col: number) => {
    return (row === 0 && col === 0) || (row === 0 && col === totalBoardWidth - 1) || (row === totalBoardHeight - 1 && col === 0) || (row === totalBoardHeight - 1 && col === totalBoardWidth - 1);
  };

  const handleEdgeCellClick = (row: number, col: number) => {
    if (isCornerCell(row, col)) return;
    if (isEdgeCell(row, col)) {
      setSelectedEdgeCell({ row, col });
    }
  };

  const renderGrid = () => {
    const grid = [];
    for (let row = 0; row < totalBoardHeight; row++) {
      for (let col = 0; col < totalBoardWidth; col++) {
        const isCorner = isCornerCell(row, col);
        const isEdge = isEdgeCell(row, col);
        const isSelected = selectedEdgeCell && selectedEdgeCell.row === row && selectedEdgeCell.col === col;

        const dataAttributes = !isEdge
          ? {
              "data-row": row - 1,
              "data-col": col - 1,
            }
          : {};

        grid.push(
          <div
            key={`${row}-${col}`}
            className={`border border-gray-300 ${!isCorner ? "cursor-pointer" : "cursor-default"} rounded-lg`}
            style={{
              width: gridSize,
              height: gridSize,
              backgroundColor: isCorner ? "gray" : isEdge ? (isSelected ? "yellow" : "red") : "white",
            }}
            onClick={isEdge && !isCorner ? () => handleEdgeCellClick(row, col) : undefined}
            {...dataAttributes}
          />
        );
      }
    }
    return grid;
  };

  const addCar = (grids: number, isVertical: boolean) => {
    const newCar: Car = {
      id: `car-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      width: isVertical ? 1 : grids,
      height: isVertical ? grids : 1,
      isVertical,
      grids,
      initialLeft: 0,
      initialTop: 0,
    };
    setCars([...cars, newCar]);
  };

  const updateCarPosition = (id: string, top: number, left: number) => {
    setCars((prevCars) => prevCars.map((car) => (car.id === id ? { ...car, initialTop: top, initialLeft: left } : car)));
  };

  const deleteCarById = (id: string) => {
    setCars((prevCars) => prevCars.filter((car) => car.id !== id));
  };

  const boardWidthPx = boardWidth * gridSize;
  const boardHeightPx = boardHeight * gridSize;
  const totalBoardWidthPx = totalBoardWidth * gridSize;
  const totalBoardHeightPx = totalBoardHeight * gridSize;

  return (
    <main className="relative flex flex-col items-center p-4 w-full min-h-screen bg-gray-100">
      <div className="absolute top-[40%] left-10 flex flex-col">
        {rules.map((rule, index) => (
          <p key={index}>
            {index + 1}. {rule}
          </p>
        ))}
      </div>
      <h1 className="text-3xl font-bold mb-6 text-center">Unblock Car Game</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex items-center">
          <label htmlFor="width" className="mr-2 font-medium">
            Width:
          </label>
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
          <label htmlFor="height" className="mr-2 font-medium">
            Height:
          </label>
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

        <button onClick={() => setCars([])} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Clear Board
        </button>
      </div>

      <div className="mb-8 relative">
        <div
          ref={boardRef}
          className="grid  bg-white"
          style={{
            gridTemplateColumns: `repeat(${totalBoardWidth}, ${gridSize}px)`,
            gridTemplateRows: `repeat(${totalBoardHeight}, ${gridSize}px)`,
            width: totalBoardWidthPx,
            height: totalBoardHeightPx,
          }}
        >
          {renderGrid()}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-center">Available Cars</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={() => addCar(2, false)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
            Add 2×1 Car
          </button>
          <button onClick={() => addCar(3, false)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
            Add 3×1 Car
          </button>
          <button onClick={() => addCar(2, true)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add 1×2 Car
          </button>
          <button onClick={() => addCar(3, true)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            Add 1×3 Car
          </button>
        </div>
      </div>

      {cars.map((car) => (
        <DraggableCar
          key={car.id}
          id={car.id}
          width={car.width * gridSize}
          height={car.height * gridSize}
          minTop={0}
          maxTop={boardHeightPx - car.height * gridSize + 1.75 * gridSize}
          minLeft={0}
          maxLeft={boardWidthPx - car.width * gridSize + 1.75 * gridSize}
          initialTop={car.initialTop ? car.initialTop : boardHeightPx + 20 + Math.random() * 20}
          initialLeft={car.initialLeft ? car.initialLeft : (boardWidthPx - car.width * gridSize) / 2 + Math.random() * 40 - 20}
          parentRef={boardRef}
          onPositionChange={updateCarPosition}
          inputGridSize={gridSize}
          deleteCarById={deleteCarById}
        />
      ))}
    </main>
  );
}

export default App;
