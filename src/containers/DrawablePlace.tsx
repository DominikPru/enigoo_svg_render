import React, { useCallback, useContext } from "react";
import {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
  ResizeContext,
  ResizeContextType,
} from "../provider/ResizeProvider";
import RowComponent from "../components/Row";
import { Svg, G } from "react-native-svg";
import { SvgCssUri } from "react-native-svg/css";
import { View } from "react-native";

const DrawablePlace = () => {
  const { sourceData, viewBox, resizeScale } = useContext(
    ResizeContext
  ) as ResizeContextType;

  const svgWidth = sourceData.data.svgs[0].width * resizeScale;
  const svgHeight = sourceData.data.svgs[0].height * resizeScale;

  // Calculate offsets to center the SVG
  const verticalOffset = (DEVICE_HEIGHT - svgHeight) / 2;
  const horizontalOffset = (DEVICE_WIDTH - svgWidth) / 2;

  const renderRows = useCallback(() => {
    return sourceData.data.rows.map((item, index) => (
      <RowComponent item={item} key={index} resizeScale={resizeScale} />
    ));
  }, [sourceData]);

  return (
    <View style={{ position: "relative" }}>
      {/* Scaled Background SVG */}
      <SvgCssUri
        width={svgWidth} // Scaled width
        height={svgHeight} // Scaled height
        style={{
          position: "absolute",
          top: verticalOffset,
          left: horizontalOffset,
        }}
        uri={sourceData.data.svgs[0].data}
      />
      {/* Foreground SVG for Seats */}
      <Svg
        width={svgWidth}
        height={svgHeight}
        style={{
          position: "absolute",
          top: verticalOffset,
          left: horizontalOffset,
        }}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <G
          transform={`translate(${
            resizeScale * -viewBox.x +
            (sourceData.data.svgs[0].x - viewBox.x) * -resizeScale
          }, ${
            resizeScale * -viewBox.y +
            (sourceData.data.svgs[0].y - viewBox.y) * -resizeScale
          })`}
        >
          {renderRows()}
        </G>
      </Svg>
    </View>
  );
};

export default DrawablePlace;
