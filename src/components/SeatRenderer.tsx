import { useCallback, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { Svg, G, Rect, Text } from 'react-native-svg';
import { SvgCssUri } from 'react-native-svg/css';
import RowComponent from '../components/Row';
import { ResizeContext, ResizeContextType } from '../provider/ResizeProvider';

export const SeatRenderer = ({ containerDimensions }) => {
  const { sourceData, viewBox, resizeScale, triggerLoadCallback } = useContext(
    ResizeContext
  ) as ResizeContextType;

  const hasSvgs = sourceData.data.svgs && sourceData.data.svgs.length > 0;
  const svgWidth = hasSvgs
    ? sourceData.data.svgs[0].width * resizeScale
    : viewBox.width;
  const svgHeight = hasSvgs
    ? sourceData.data.svgs[0].height * resizeScale
    : viewBox.height;

  const verticalOffset = (containerDimensions.height - (hasSvgs ? svgHeight : viewBox.height)) / 2;
  const horizontalOffset = (containerDimensions.width - (hasSvgs ? svgWidth : viewBox.width)) / 2;

  const shapes = sourceData.data.shapes || [];
  const texts = sourceData.data.texts || [];

  useEffect(() => {
    if (!hasSvgs || sourceData.data.rows.length > 0) {
      setTimeout(() => {
        triggerLoadCallback();
      }, 500);
    }
  }, [hasSvgs, sourceData.data.rows, triggerLoadCallback]);

  const renderRows = useCallback(() => {
    return sourceData.data.rows.map((item, index) => (
      <RowComponent item={item} key={index} />
    ));
  }, [sourceData.data.rows]);

  const renderShapes = useCallback(() => {
    return shapes.map(shape => (
      <Rect
        key={shape.uuid}
        x={shape.x * resizeScale}
        y={shape.y * resizeScale}
        width={shape.width * resizeScale}
        height={shape.height * resizeScale}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        rx={shape.cornerRadius}
        transform={`rotate(${shape.rotation}, ${(shape.x + shape.width / 2) * resizeScale}, ${
          (shape.y + shape.height / 2) * resizeScale
        })`}
      />
    ));
  }, [shapes, resizeScale]);

  const renderTexts = useCallback(() => {
    return texts.map(text => (
      <Text
        key={text.uuid}
        x={text.x * resizeScale + text.fontSize / 2}
        y={text.y2 * resizeScale - text.fontSize / 2}
        fontSize={text.fontSize * resizeScale}
        fill={text.color}
        transform={`rotate(${text.rotation}, ${text.x * resizeScale}, ${
          text.y * resizeScale
        })`}>
        {text.text}
      </Text>
    ));
  }, [texts, resizeScale]);

  const effectiveViewBox = hasSvgs
    ? `0 0 ${svgWidth} ${svgHeight}`
    : `${-14 * resizeScale / 2} ${-14 * resizeScale / 2} ${viewBox.width + 14 * resizeScale } ${viewBox.height + 14 * resizeScale}`;

  const svgTransform = hasSvgs
    ? `translate(${
        resizeScale * -viewBox.x +
        (sourceData.data.svgs[0].x - viewBox.x) * -resizeScale
      }, ${
        resizeScale * -viewBox.y +
        (sourceData.data.svgs[0].y - viewBox.y) * -resizeScale
      })`
    : `translate(${-viewBox.x}, ${-viewBox.y})`;

  return (
    <View style={{ position: 'relative' }}>
      {hasSvgs && (
        <SvgCssUri
          width={svgWidth}
          height={svgHeight}
          style={{
            position: 'absolute',
            top: verticalOffset,
            left: horizontalOffset,
          }}
          uri={sourceData.data.svgs[0].data}
          onLoad={() => {
            setTimeout(() => {
              triggerLoadCallback();
            }, 500);
          }}
        />
      )}

      <Svg
        width={svgWidth}
        height={svgHeight}
        style={{
          position: 'absolute',
          top: verticalOffset,
          left: horizontalOffset,
        }}
        viewBox={effectiveViewBox}>
        <G transform={svgTransform}>
          {renderShapes()}
          {renderTexts()}
          {renderRows()}
        </G>
      </Svg>
    </View>
  );
};

export default SeatRenderer;