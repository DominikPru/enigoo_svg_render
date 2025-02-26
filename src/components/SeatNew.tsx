import React, { useContext, useState, memo, useMemo } from "react";
import { Text, Line, Circle } from "react-native-svg";
import { ResizeContext, ResizeContextType } from "../provider/ResizeProvider";
import { Seat } from "../types";
import { seatManager } from "../utils/seatSelectionExport";

interface SeatComponentProps {
  item: Seat;
  row: number | undefined;
}

const Circle_R = 6; // Original radius
const Circle_R_selected = Circle_R + 2; // Larger radius for selected seat

const darkenColor = (color: string, percent: number): string => {
  // Ensure color is a valid hex color
  const hexColor = color.startsWith("#")
    ? color
    : color === "green"
    ? "#00FF00"
    : color === "gray"
    ? "#808080"
    : "#000000"; // Default to black if color is unrecognized

  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Darken the color
  const darken = (x: number) =>
    Math.max(0, Math.min(255, Math.floor(x * (1 - percent))));

  return `#${((1 << 24) | (darken(r) << 16) | (darken(g) << 8) | darken(b))
    .toString(16)
    .slice(1)
    .padStart(6, "0")}`;
};

const SeatNew = memo(
  ({ item, row }: SeatComponentProps) => {
    const { resizeScale, selectedCategoryId } = useContext(ResizeContext) as ResizeContextType;
    const [isSelected, setIsSelected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Get the base color of the seat regardless of selection
    const baseColor = useMemo(
      () => (
        item.blocked ? "#e5e5e5" : (item.category?.color || "#e5e5e5")
      ),
      [item.blocked, item.category?.color]
    );

    // Determine if seat should be faded (when category filter is active but seat isn't in that category)
    const shouldFade = useMemo(
      () => (
        selectedCategoryId && item.category?.id !== selectedCategoryId && !item.blocked
      ),
      [selectedCategoryId, item.category?.id, item.blocked]
    );

    // Calculate the final fill color
    const fillColor = useMemo(
      () => (isSelected ? darkenColor(baseColor, 0.2) : baseColor),
      [isSelected, baseColor]
    );

    // Calculate opacity based on category selection
    const seatOpacity = useMemo(
      () => (
        isLoading ? 0.5 : (shouldFade ? 0.2 : 1)
      ),
      [isLoading, shouldFade]
    );
   
    const handlePress = React.useCallback(() => {
      if (item.blocked || selectedCategoryId && item.category?.id !== selectedCategoryId) return;
    
      setIsLoading(true);
    
      seatManager
        .toggleSeat(item) // This triggers the seat toggle, including verification logic
        .then((isVerified) => {
          // Only toggle the selection state if the seat was successfully verified or added
          if (isVerified) {
            setIsSelected((prev) => !prev);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }, [item, selectedCategoryId]);


    if (item.isRowLabel) {
      const fontSize = 14 * resizeScale;

      return (
        <Text
          x={(item.x * resizeScale) - fontSize / 2}
          y={(item.y * resizeScale) + fontSize / 2}
          fontSize={fontSize}
          fontWeight="bold"
          fontStyle="italic"
        >
          {row?.toString()}
        </Text>
      );
    }

    return (
      <>
        <Circle
          cx={item.x * resizeScale}
          cy={item.y * resizeScale}
          r={
            isSelected
              ? Circle_R_selected * resizeScale
              : Circle_R * resizeScale
          }
          fill={fillColor}
          stroke={item.blocked ? "#dddddd" : "none"}
          strokeWidth={2}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handlePress}
          opacity={seatOpacity}
        />

        {isSelected && !isLoading && (
          <>
            <Line
              x1={item.x * resizeScale - 8}
              y1={item.y * resizeScale + 4}
              x2={item.x * resizeScale}
              y2={item.y * resizeScale + 12}
              stroke="white"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <Line
              x1={item.x * resizeScale}
              y1={item.y * resizeScale + 12}
              x2={item.x * resizeScale + 10}
              y2={item.y * resizeScale - 6}
              stroke="white"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </>
        )}
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item === nextProps.item && prevProps.row === nextProps.row
);

export default SeatNew;