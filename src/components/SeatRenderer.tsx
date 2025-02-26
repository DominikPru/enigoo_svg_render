import React, {
  useState,
  useRef,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import {View} from 'react-native';
import {Svg, G, Rect, Text, Ellipse, Circle} from 'react-native-svg';
import {SvgCssUri} from 'react-native-svg/css';
import RowComponent from '../components/Row';
import {ResizeContext, ResizeContextType} from '../provider/ResizeProvider';

interface SeatRendererProps {
  containerDimensions: {height: number; width: number};
}

const LOAD_DELAY = 250;
const PADDING = 500;

export const SeatRenderer = ({containerDimensions}: SeatRendererProps) => {
  const {sourceData, viewBox, resizeScale, triggerLoadCallback} = useContext(
    ResizeContext,
  ) as ResizeContextType;

  const [svgBackgroundLoaded, setSvgBackgroundLoaded] = useState(
    !sourceData.data.svgs || sourceData.data.svgs.length === 0,
  );
  const [mainSvgLayoutReady, setMainSvgLayoutReady] = useState(false);

  const hasSvgs = sourceData.data.svgs && sourceData.data.svgs.length > 0;

  const svgWidth = hasSvgs
    ? sourceData.data.svgs[0].width * resizeScale
    : viewBox.width;
  const svgHeight = hasSvgs
    ? sourceData.data.svgs[0].height * resizeScale
    : viewBox.height;

  const verticalOffset =
    (containerDimensions.height - (hasSvgs ? svgHeight : viewBox.height)) / 2;
  const horizontalOffset =
    (containerDimensions.width - (hasSvgs ? svgWidth : viewBox.width)) / 2;

  const shapes = sourceData.data.shapes || [];
  const texts = sourceData.data.texts || [];

  useEffect(() => {
    if (svgBackgroundLoaded && mainSvgLayoutReady) {
      setTimeout(() => {
        triggerLoadCallback();
      }, LOAD_DELAY);
    }
  }, [svgBackgroundLoaded, mainSvgLayoutReady, triggerLoadCallback]);

  const renderRows = useCallback(() => {
    return sourceData.data.rows.map((item, index) => (
      <RowComponent item={item} key={index} />
    ));
  }, [sourceData.data.rows]);

  const renderShapes = useCallback(() => {
    return shapes.map(shape => {
      const commonProps = {
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
      };

      if (shape.type === 'ellipse') {
        return (
          <Ellipse
            key={shape.uuid}
            {...commonProps}
            cx={shape.x * resizeScale}
            cy={shape.y * resizeScale}
            rx={shape.radiusX * resizeScale}
            ry={shape.radiusY * resizeScale}
            transform={`rotate(${shape.rotation}, ${shape.x * resizeScale}, ${
              shape.y * resizeScale
            })`}
          />
        );
      }

      return (
        <Rect
          key={shape.uuid}
          {...commonProps}
          x={shape.x * resizeScale}
          y={shape.y * resizeScale}
          width={shape.width * resizeScale}
          height={shape.height * resizeScale}
          rx={shape.cornerRadius}
          ry={shape.cornerRadius}
          transform={`rotate(${shape.rotation}, ${shape.x * resizeScale}, ${
            shape.y * resizeScale
          })`}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
        />
      );
    });
  }, [shapes, resizeScale]);

  const renderTexts = useCallback(() => {
    return texts.map(text => {
      const {rotation, fontSize, color, text: content, uuid, x, y} = text;
      const [textSize, setTextSize] = useState({width: 0, height: 0});
      const [isLayoutReady, setIsLayoutReady] = useState(false);

      const scaledFontSize = fontSize * resizeScale;

      const handleTextLayout = useCallback(event => {
        const {width, height} = event.nativeEvent.layout;
        setTextSize({width, height});
        setIsLayoutReady(true);
      }, []);

      useEffect(() => {
        if (isLayoutReady) {
          console.log(`✅ Text "${content}" is ready.`);
        }
      }, [isLayoutReady]);

      // Ensure layout is ready before rendering
      if (!isLayoutReady) {
        return (
          <Text
            key={uuid}
            x={x * resizeScale}
            y={y * resizeScale}
            fontSize={scaledFontSize}
            fill="transparent" // Invisible initial render
            onLayout={handleTextLayout}>
            {content}
          </Text>
        );
      }

      // ✅ Correct center calculation
      const centerX = x * resizeScale + textSize.width / 2;
      const centerY = y * resizeScale + scaledFontSize / 2 + textSize.height / 2;

      console.log(`🔹 Center point for "${content}": (${centerX}, ${centerY})`);
      console.log(
        `🔹 Text size for "${content}": (${textSize.width}, ${textSize.height})`,
      );
      console.log(`🔹 Rotation for "${content}": ${rotation}`);
      console.log(
        `🔹 Position for "${content}": (${x * resizeScale}, ${
          y * resizeScale
        })`,
      );

      return (
        <Text
          key={uuid}
          x={centerX}
          y={centerY}
          fontSize={scaledFontSize}
          fill={color}
          textAnchor="middle"
          alignmentBaseline="middle"
          transform={`rotate(${rotation}, ${x * resizeScale}, ${
            y * resizeScale
          })`}>
          {content}
        </Text>
      );
    });
  }, [texts, resizeScale]);

  const effectiveViewBox = hasSvgs
    ? `0 0 ${svgWidth + PADDING} ${svgHeight + PADDING}`
    : `${(-14 * resizeScale) / 2} ${(-14 * resizeScale) / 2} ${
        viewBox.width + 14 * resizeScale
      } ${viewBox.height + 14 * resizeScale}`;

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
    <View style={{position: 'relative'}}>
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
          onError={error => {
            console.error('SVG Load Error:', error);
            setSvgBackgroundLoaded(true);
          }}
          onLoad={() => {
            setSvgBackgroundLoaded(true);
          }}
        />
      )}

      <Svg
        width={hasSvgs ? svgWidth + PADDING : svgWidth}
        height={hasSvgs ? svgHeight + PADDING : svgHeight}
        style={{
          position: 'absolute',
          top: verticalOffset,
          left: horizontalOffset,
        }}
        viewBox={effectiveViewBox}
        onLayout={() => {
          setMainSvgLayoutReady(true);
        }}>
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
