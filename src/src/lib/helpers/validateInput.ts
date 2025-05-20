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
    const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalizedContent.trim().split("\n");

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

    if (isNaN(width) || isNaN(height)) {
      result.message = "Board dimensions must be valid numbers!";
      return result;
    }

    if (width <= 0 || height <= 0) {
      result.message = "Board dimensions must be positive numbers!";
      return result;
    }

    const carCount = parseInt(lines[1].trim());
    if (isNaN(carCount)) {
      result.message = "Car count must be a valid number!";
      return result;
    }

    if (carCount > 24) {
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
      if (!lines[i].trim()) continue;

      const parts = lines[i].split("");
      for (let j = 0; j < parts.length; j++) {
        let carExists = false;
        const char = parts[j];

        if (char === " " || char === "." || char === "\r" || char === "\n" || !char.trim()) {
          continue;
        }

        if (char === "K") {
          if (exitPiece.orientation !== "Unknown") {
            exitPiece.orientation = "Unknown";
            exitPiece.pos = { row: i - 2, col: j };
          } else {
            result.message = "Multiple Exits found!";
            return result;
          }
          continue;
        }

        if (!/^[A-Z]$/.test(char)) {
          result.message = `Invalid car ID: "${char}". IDs must be single capital alphabetical characters.`;
          return result;
        }

        for (let k = 0; k < newCars.length; k++) {
          if (newCars[k].id === char) {
            carExists = true;
            break;
          }
        }

        if (!carExists) {
          const newPiece: Piece = {
            id: char,
            pos: { row: i - 2, col: j },
            orientation: "Unknown",
            size: 1,
          };
          newCars.push(newPiece);
        } else {
          const pieceIndex = newCars.findIndex((p) => p.id === char);
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

    if (newCars.length - 1 !== carCount) {
      result.message = `Numbers of cars not the same as input (found ${newCars.length}, expected ${carCount} + 1(primary car))`;
      return result;
    }

    for (let i = 0; i < newCars.length; i++) {
      if (newCars[i].size <= 1) {
        result.message = `Car ${newCars[i].id} has size below 2`;
        return result;
      }
    }

    if (exitPiece.orientation === "Horizontal" && exitPiece.pos.row === 0 && exitPiece.pos.col === 0) {
      result.message = "No exit marker (K) found in the puzzle!";
      return result;
    }

    const isExitTop = exitPiece.pos.row == 0 && lines[exitPiece.pos.row + 2].split("").length != width + 1;
    const isExitLeft = exitPiece.pos.col == 0 && lines[exitPiece.pos.row + 2].split("").length == width + 1;
    const isExitRight = exitPiece.pos.col == width && lines[exitPiece.pos.row + 2].split("").length == width + 1;
    const isExitBottom = exitPiece.pos.row == height && lines[exitPiece.pos.row + 2].split("").length != width + 1;

    const maxCol = lines.length - 2;
    let maxRow = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().split("").length > maxRow) {
        maxRow = lines[i].trim().split("").length;
      }
    }

    if (isExitTop) {
      for (let i = 3; i < lines.length; i++) {
        if (lines[i].trim().split("").length != width) {
          result.message = `Row ${i} doesn't have ${width} columns!`;
          return result;
        }
      }
      if (maxCol != height + 1) {
        console.log(maxCol);
        result.message = `Amount of rows not the same as input!`;
        return result;
      }
    } else if (isExitLeft) {
      for (let i = 2; i < lines.length; i++) {
        if (lines[i].split("").length != width + 1) {
          result.message = `Row ${i} doesn't have ${width} columns!`;
          return result;
        }
      }
      if (maxCol != height) {
        result.message = `Amount of rows not the same as input!`;
        return result;
      }
    } else if (isExitRight) {
      for (let i = 2; i < lines.length; i++) {
        if (i == exitPiece.pos.row + 2 && lines[i].split("").length != width + 1) {
          result.message = `Row ${i} contains exit but doesn't have ${width + 1} columns!`;
          return result;
        } else if (lines[i].trim().split("").length != width && i != exitPiece.pos.row + 2) {
          result.message = `Row ${i} doesn't have ${width} columns!`;
          return result;
        }
      }
      if (maxCol != height) {
        result.message = `Amount of rows not the same as input!`;
        return result;
      }
    } else if (isExitBottom) {
      for (let i = 2; i < lines.length - 1; i++) {
        if (lines[i].trim().split("").length != width) {
          if (i == exitPiece.pos.row - 2 && lines[i].trim().split("").length != width + 1) {
            result.message = `Row ${i} doesn't have ${width} columns!`;
            return result;
          }
        }
      }
      if (maxCol != height + 1) {
        result.message = `Amount of rows not the same as input!`;
        return result;
      }
    }

    if (!(isExitTop || isExitLeft || isExitRight || isExitBottom)) {
      result.message = `Exit must be at the edge!`;
      return result;
    }

    const gameCars: Car[] = newCars.map((piece) => ({
      id: piece.id,
      isVertical: piece.orientation === "Vertical",
      size: piece.size,
      initialLeft: isExitLeft ? piece.pos.col - 1 : piece.pos.col,
      initialTop: isExitTop ? piece.pos.row - 1 : piece.pos.row,
      isPrimary: piece.id === "P",
    }));

    const exitGrid = {
      row: isExitTop ? exitPiece.pos.row : exitPiece.pos.row + 1,
      col: isExitLeft ? exitPiece.pos.col : exitPiece.pos.col + 1,
    };

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
