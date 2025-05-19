import { useState, useCallback, useEffect, useRef } from "react";
import type { Direction } from "../lib/types";

interface DraggableCarProps {
  id: string;
  width: number;
  height: number;
  minTop: number;
  maxTop: number;
  minLeft: number;
  maxLeft: number;
  initialTop: number;
  initialLeft: number;
  onPositionChange?: (id: string, top: number, left: number) => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
  inputGridSize: number;
  deleteCarById: (id: string) => void;
  isPrimary: boolean;
  moveDirection?: Direction | null;
  moveSteps?: number;
  isExecutingMove?: boolean;
}

const DraggableCar = ({
  id,
  width,
  height,
  minTop,
  maxTop,
  minLeft,
  maxLeft,
  initialTop,
  initialLeft,
  onPositionChange,
  parentRef,
  inputGridSize,
  deleteCarById,
  isPrimary,
  moveDirection,
  moveSteps,
  isExecutingMove,
}: DraggableCarProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [parentBounds, setParentBounds] = useState({ top: 0, left: 0 });
  const [zIndex, setZIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<number | null>(null);

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
      if (isAnimating) return;
      setDragging(true);
      setOffset({
        x: e.clientX - position.left,
        y: e.clientY - position.top,
      });
      setZIndex(10);
    },
    [position, isAnimating]
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
          const relativeTop = Math.round((newTop - parentBounds.top - minTop) / inputGridSize) - 1;
          const relativeLeft = Math.round((newLeft - parentBounds.left - minLeft) / inputGridSize) - 1;

          if (onPositionChange) {
            onPositionChange(id, relativeTop, relativeLeft);
          }
        }, 100);
        return {
          top: newTop,
          left: newLeft,
        };
      }
      deleteCarById(id);
      return prev;
    });
  }, [minTop, maxTop, minLeft, maxLeft, snapToGrid, isWithinParentBounds, id, onPositionChange, parentBounds, deleteCarById, inputGridSize]);

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

  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isExecutingMove && moveDirection && moveSteps && moveSteps > 0 && !isAnimating) {
      if (animationTimerRef.current !== null) {
        clearTimeout(animationTimerRef.current);
      }

      setIsAnimating(true);
      setZIndex(5);

      let newTop = position.top;
      let newLeft = position.left;

      switch (moveDirection) {
        case "Up":
          newTop -= moveSteps * inputGridSize;
          break;
        case "Down":
          newTop += moveSteps * inputGridSize;
          break;
        case "Left":
          newLeft -= moveSteps * inputGridSize;
          break;
        case "Right":
          newLeft += moveSteps * inputGridSize;
          break;
      }

      newTop = Math.max(parentBounds.top + minTop, Math.min(parentBounds.top + maxTop, newTop));
      newLeft = Math.max(parentBounds.left + minLeft, Math.min(parentBounds.left + maxLeft, newLeft));

      setPosition({
        top: newTop,
        left: newLeft,
      });

      animationTimerRef.current = window.setTimeout(() => {
        const snappedTop = snapToGrid(newTop, minTop, maxTop, false);
        const snappedLeft = snapToGrid(newLeft, minLeft, maxLeft, true);

        setPosition({
          top: snappedTop,
          left: snappedLeft,
        });

        const relativeTop = Math.round((snappedTop - parentBounds.top - minTop) / inputGridSize) - 1;
        const relativeLeft = Math.round((snappedLeft - parentBounds.left - minLeft) / inputGridSize) - 1;

        if (onPositionChange) {
          onPositionChange(id, relativeTop, relativeLeft);
        }

        setIsAnimating(false);
        setZIndex(1);
        animationTimerRef.current = null;
      }, 300);
    }
  }, [isExecutingMove, moveDirection, moveSteps, isAnimating, inputGridSize, position, parentBounds, minTop, maxTop, minLeft, maxLeft, onPositionChange, id, snapToGrid]);

  return (
    <div
      className="absolute cursor-move rounded-lg"
      style={{
        top: position.top,
        left: position.left,
        zIndex,
        width,
        height,
        transition: isAnimating ? "top 0.3s ease-out, left 0.3s ease-out" : "none",
      }}
      onMouseDown={handleMouseDown}
      data-position={`${position.top},${position.left}`}
      data-parent-bounds={`${parentBounds.top}`}
    >
      <div
        className={`text-white flex justify-center items-center text-center w-full h-full rounded-lg border-2 ${isPrimary ? "border-red-950 bg-red-500" : "border-blue-950 bg-blue-500"}`}
        style={{
          boxShadow: isAnimating
            ? isPrimary
              ? "0 0 40px 10px gold"
              : "0 0 40px 10px cyan"
            : dragging
            ? isPrimary
              ? "0 0 40px 10px blue"
              : "0 0 40px 10px red"
            : isPrimary
            ? "0 0 20px 0 red"
            : "0 0 20px 0 blue",
          transition: "box-shadow 0.2s",
        }}
      >
        {id}
      </div>
    </div>
  );
};

export default DraggableCar;
