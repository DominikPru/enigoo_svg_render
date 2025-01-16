import React, {useContext, useState} from 'react';
import {Circle, Text, Line} from 'react-native-svg';
import {Seat} from '../types.ts';
import {ResizeContext, ResizeContextType} from '../provider/ResizeProvider.tsx';

interface SeatComponentProps {
  item: Seat;
  row: number | undefined;
  resizeScale: number;
}

const Circle_R = 6; // Original radius
const Circle_R_selected = Circle_R + 4; // Slightly larger for selected

const SeatNew = ({item, row}: SeatComponentProps) => {
  const {resizeScale} = useContext(ResizeContext) as ResizeContextType;
  const [isSelected, setIsSelected] = useState(false); // Selection state
  const [radius, setRadius] = useState(Circle_R * resizeScale); // Scaled radius
  const fillColor = item.blocked ? 'green' : item.category?.color || 'gray'; // Dynamic color

  const handlePress = () => {
    setIsSelected(prev => !prev); // Toggle selection
    setRadius(prevRadius =>
      isSelected ? Circle_R * resizeScale : Circle_R_selected * resizeScale,
    );
  };

  if (item.isRowLabel) {
    const fontSize = 14 * resizeScale; // Scaled font size
    const rowX = item.isSpaceLeft ? fontSize : -fontSize;

    return (
      <Text
        x={item.x * resizeScale + rowX + fontSize / 2}
        y={item.y * resizeScale + fontSize / 2}
        fontSize={fontSize}
        fontWeight="bold"
        fontStyle="italic">
        {row?.toString()}
      </Text>
    );
  }

  return (
    <>
      <Circle
        cx={item.x * resizeScale} // Scale x-coordinate
        cy={item.y * resizeScale} // Scale y-coordinate
        r={radius} // Scaled radius
        onPress={handlePress}
        fill={fillColor}
        stroke={item.blocked ? 'blue' : 'green'}
      />
      {isSelected && (
        <Line
          x1={item.x * resizeScale - 12} // Start of tick (twice as long)
          y1={item.y * resizeScale + 4} // Adjusted for better alignment
          x2={item.x * resizeScale - 4} // Middle of tick
          y2={item.y * resizeScale + 12} // Middle point of the tick
          stroke="white"
          strokeWidth={5} // Slightly thicker line
        />
      )}
      {isSelected && (
        <Line
          x1={item.x * resizeScale - 4} // Middle of tick
          y1={item.y * resizeScale + 12} // Middle point of the tick
          x2={item.x * resizeScale + 8} // End of tick (twice as long)
          y2={item.y * resizeScale - 8} // Adjusted for better alignment
          stroke="white"
          strokeWidth={5} // Slightly thicker line
        />
      )}
    </>
  );
};

export default SeatNew;
