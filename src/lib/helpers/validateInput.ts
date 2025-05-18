import type { Car, Piece, EdgeGrid } from "../types";

export const parseFileContents = (content: string) => {
  const result: {
    success: boolean;
    message?: string;
    newCars?: Car[];
    width?: number;
    height?: number;
    exitGrid?: EdgeGrid;
  } = { success: false };

  try {
    const lines = content.trim().split("\n");
    if (lines.length < 1) {
      result.message = "File is empty!";
      return result;
    }

    const dimensions = lines[0].split(" ");
    if (dimensions.length !== 2) {
      result.message = "Invalid board dimensions format!";
      return result;
    }

    const width = parseInt(dimensions[0]);
    const height = parseInt(dimensions[1]);

    if (parseInt(lines[2].trim()) > 24) {
      result.message = "Max 24 cars on board!";
      return result;
    }

    const newCars: Piece[] = [];
    const exitPiece: Piece = {
      id: "K",
      pos: { row: 0, col: 0 },
      orientation: "Horizontal",
      size: 1,
    };

    for (let i = 2; i < lines.length; i++) {
      const parts = lines[i].split("");
      for (let j = 0; j < parts.length; j++) {
        let carExists = false;

        if (parts[j] === "K") {
          if (exitPiece.orientation !== "Unknown") {
            exitPiece.orientation = "Unknown";
            exitPiece.pos = { row: i - 2, col: j };
          } else {
            result.message = "Multiple Exits found!";
            return result;
          }
        }

        for (let k = 0; k < newCars.length; k++) {
          if (newCars[k].id === parts[j]) {
            carExists = true;
            break;
          }
        }

        if (parts[j] !== " " && parts[j] !== "." && parts[j] !== "K") {
          if (!carExists) {
            const newPiece: Piece = {
              id: parts[j],
              pos: { row: i - 2, col: j },
              orientation: "Unknown",
              size: 1,
            };
            newCars.push(newPiece);
          } else {
            const pieceIndex = newCars.findIndex((p) => p.id === parts[j]);
            if (pieceIndex !== -1) {
              const piece = newCars[pieceIndex];
              const currentRow = i - 2;
              const currentCol = j;

              const isVerticalConnection = currentRow === piece.pos.row + 1;
              const isHorizontalConnection = currentCol === piece.pos.col + 1;

              if (piece.orientation === "Unknown") {
                if (isHorizontalConnection) {
                  piece.orientation = "Horizontal";
                } else if (isVerticalConnection) {
                  piece.orientation = "Vertical";
                } else {
                  result.message = `Multiple pieces with id ${piece.id} found!`;
                  return result;
                }
              }

              if (piece.orientation === "Horizontal" && isVerticalConnection) {
                result.message = "Invalid piece shape!";
                return result;
              } else if (piece.orientation === "Vertical" && isHorizontalConnection) {
                result.message = "Invalid piece shape!";
                return result;
              }

              piece.size++;
              newCars[pieceIndex] = piece;
            }
          }
        }
      }
    }

    if (newCars.length - 1 !== parseInt(lines[1].trim())) {
      result.message = "Numbers of cars not the same as input";
      return result;
    }

    const exitGrid = {
      row: exitPiece.pos.row ? exitPiece.pos.row + 1 : 0,
      col: exitPiece.pos.col ? exitPiece.pos.col + 1 : 0,
    };

    const gameCars: Car[] = newCars.map((piece) => ({
      id: piece.id,
      isVertical: piece.orientation === "Vertical",
      size: piece.size,
      initialLeft: exitPiece.pos.col ? piece.pos.col : piece.pos.col - 1,
      initialTop: exitPiece.pos.row ? piece.pos.row : piece.pos.row - 1,
      isPrimary: piece.id === "P",
    }));

    result.success = true;
    result.newCars = gameCars;
    result.width = width;
    result.height = height;
    result.exitGrid = exitGrid;

    return result;
  } catch (error) {
    result.message = `Error parsing file: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
};
