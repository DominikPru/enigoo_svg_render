import React, { useCallback, useContext, useEffect } from "react";
import { View } from "react-native";
import { Svg, G, Rect, Text } from "react-native-svg";
import { SvgCssUri } from "react-native-svg/css";
import RowComponent from "../components/Row";
import { ResizeContext, ResizeContextType } from "../provider/ResizeProvider";

interface DrawablePlaceProps {
  containerDimensions: { height: number; width: number };
}

const DrawablePlace = ({ containerDimensions }: DrawablePlaceProps) => {
  const { sourceData, viewBox, resizeScale, triggerLoadCallback } = useContext(
    ResizeContext
  ) as ResizeContextType;

  // Check if SVGs exist
  const hasSvgs = sourceData.data.svgs && sourceData.data.svgs.length > 0;
  const svgWidth = hasSvgs
    ? sourceData.data.svgs[0].width * resizeScale
    : containerDimensions.width;
  const svgHeight = hasSvgs
    ? sourceData.data.svgs[0].height * resizeScale
    : containerDimensions.height;

  // Centering calculations
  const verticalOffset = (containerDimensions.height - svgHeight) / 2;
  const horizontalOffset = (containerDimensions.width - svgWidth) / 2;

  // Extract shapes and texts from sourceData
  const shapes = sourceData.data.shapes || [];
  const texts = sourceData.data.texts || [];

  // Trigger callback if no SVGs
  useEffect(() => {
    if (!hasSvgs) {
      setTimeout(() => {
        triggerLoadCallback();
      }, 500);
    }
  }, [hasSvgs, triggerLoadCallback]);

  // Render seat rows
  const renderRows = useCallback(() => {
    return sourceData.data.rows.map((item, index) => (
      <RowComponent item={item} key={index} />
    ));
  }, [sourceData]);

  // Render shapes
  const renderShapes = () => {
    return shapes.map((shape) => (
      <Rect
        key={shape.uuid}
        x={shape.x * resizeScale}
        y={shape.y * resizeScale}
        width={shape.width * resizeScale}
        height={shape.height * resizeScale}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        rx={shape.cornerRadius} // Rounded corners
        transform={`rotate(${shape.rotation}, ${shape.x + shape.width / 2}, ${
          shape.y + shape.height / 2
        })`} // Apply rotation
      />
    ));
  };

  // Render texts
  const renderTexts = () => {
    return texts.map((text) => (
      <Text
        key={text.uuid}
        x={text.x * resizeScale + text.fontSize / 2}
        y={text.y2 * resizeScale - text.fontSize / 2}
        fontSize={text.fontSize * resizeScale}
        fill={text.color}
        transform={`rotate(${text.rotation}, ${text.x * resizeScale}, ${
          text.y * resizeScale
        })`}
      >
        {text.text}
      </Text>
    ));
  };

  // Define ViewBox & Transform
  const effectiveViewBox = hasSvgs
    ? `0 0 ${svgWidth} ${svgHeight}`
    : `-50 0 ${viewBox.width + 70} ${viewBox.height}`;

  const transform = hasSvgs
    ? `translate(${
        resizeScale * -viewBox.x +
        (sourceData.data.svgs[0].x - viewBox.x) * -resizeScale
      }, ${
        resizeScale * -viewBox.y +
        (sourceData.data.svgs[0].y - viewBox.y) * -resizeScale
      })`
    : `translate(${-viewBox.x}, ${-viewBox.y})`;

  return (
    <View style={{ position: "relative" }}>
      {/* Render SVG Background if it exists */}
      {hasSvgs && (
        <SvgCssUri
          width={svgWidth}
          height={svgHeight}
          style={{
            position: "absolute",
            top: verticalOffset,
            left: horizontalOffset,
          }}
          uri={sourceData.data.svgs[0].data}
          onLayout={() => {
            setTimeout(() => {
              triggerLoadCallback();
            }, 500);
          }}
        />
      )}

      {/* Foreground SVG for Shapes, Texts & Seats */}
      <Svg
        width={svgWidth}
        height={svgHeight}
        style={{
          position: "absolute",
          top: verticalOffset,
          left: horizontalOffset,
        }}
        viewBox={effectiveViewBox}
      >
        <G transform={transform}>
          {renderShapes()} {/* Render dynamic shapes */}
          {renderTexts()} {/* Render dynamic texts */}
          {renderRows()} {/* Render seats */}
        </G>
      </Svg>
    </View>
  );
};

export default DrawablePlace;
