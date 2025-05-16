import { useState, useCallback, useEffect } from "react";

interface DraggableCarProps {
  width: number;
  height: number;
  minTop: number;
  maxTop: number;
  minLeft: number;
  maxLeft: number;
  initialTop: number;
  initialLeft: number;
  onDragEnd?: () => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
  inputGridSize: number;
}

const DraggableCar = ({ width, height, minTop, maxTop, minLeft, maxLeft, initialTop, initialLeft, onDragEnd, parentRef, inputGridSize }: DraggableCarProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [parentBounds, setParentBounds] = useState({ top: 0, left: 0 });
  const [zIndex, setZIndex] = useState(1);

  useEffect(() => {
    if (parentRef.current) {
      const parentBounds = parentRef.current.getBoundingClientRect();
      setPosition({
        top: parentBounds.top + minTop + initialTop,
        left: parentBounds.left + minLeft + initialLeft,
      });
      setParentBounds({
        top: parentBounds.top,
        left: parentBounds.left,
      });
    }
  }, [parentRef, minTop, minLeft, initialTop, initialLeft]);

  const isWithinParentBounds = useCallback(
    (top: number, left: number) => {
      if (!parentRef.current) return false;
      return top >= parentBounds.top + minTop && top <= parentBounds.top + maxTop && left >= parentBounds.left + minLeft && left <= parentBounds.left + maxLeft;
    },
    [parentBounds, minTop, maxTop, minLeft, maxLeft, parentRef]
  );

  const snapToGrid = useCallback(
    (position: number, min: number, max: number, isHorizontal: boolean) => {
      const parentPosition = isHorizontal ? parentBounds.left + inputGridSize : parentBounds.top + inputGridSize;
      const relativePosition = position - (parentPosition + min);
      const snappedRelativePosition = Math.round(relativePosition / inputGridSize) * inputGridSize;
      const snappedPosition = parentPosition + min + snappedRelativePosition;

      return Math.max(parentPosition + min, Math.min(parentPosition + max, snappedPosition));
    },
    [parentBounds.top, parentBounds.left, inputGridSize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setDragging(true);
      setOffset({
        x: e.clientX - position.left,
        y: e.clientY - position.top,
      });
      setZIndex(10);
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;

      let newTop = e.clientY - offset.y;
      let newLeft = e.clientX - offset.x;

      if (window.innerWidth > 768) {
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - height));
      }
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - width));

      setPosition({
        top: newTop,
        left: newLeft,
      });
    },
    [dragging, offset, height, width]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setZIndex(1);

    setPosition((prev) => {
      if (isWithinParentBounds(prev.top, prev.left)) {
        const newTop = snapToGrid(prev.top, minTop, maxTop, false);
        const newLeft = snapToGrid(prev.left, minLeft, maxLeft, true);
        setTimeout(() => {
          if (onDragEnd) {
            onDragEnd();
          }
        }, 100);
        return {
          top: newTop,
          left: newLeft,
        };
      }
      return prev;
    });
  }, [minTop, maxTop, minLeft, maxLeft, snapToGrid, isWithinParentBounds, onDragEnd]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute cursor-move rounded-lg border-2 border-blue-950 bg-blue-500"
      style={{
        top: position.top,
        left: position.left,
        zIndex,
        width,
        height,
        boxShadow: dragging ? "0 0 40px 10px red, 0 0 40px 0 yellow" : "0 0 20px 0 blue",
        transition: "box-shadow 0.2s",
      }}
      onMouseDown={handleMouseDown}
      data-position={`${position.top},${position.left}`}
      data-parent-bounds={`${parentBounds.top}`}
    ></div>
  );
};

export default DraggableCar;
