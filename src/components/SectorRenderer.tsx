import { ReactElement, useContext, useEffect, useCallback, useState } from 'react';
import { View } from 'react-native';
import { Svg, Path, Polygon, Circle, Rect } from 'react-native-svg';
import { SvgCss } from 'react-native-svg/css';
import { XMLParser } from 'fast-xml-parser';
import { ResizeContext, ResizeContextType } from '../provider/ResizeProvider';
import { SVGCircle, SVGGroup, SVGPath, SVGPolygon, SVGRect } from '../../src/types';

// Types
interface SectorRendererProps {
  containerDimensions: {
    height: number;
    width: number;
  };
}

// Constants
const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
} as const;

const LOAD_DELAY = 250;
const CIRCLE_SCALE_FACTOR = 1.3;
const DEFAULT_COLOR = "#F2F2F2";

export const SectorRenderer = ({ containerDimensions }: SectorRendererProps) => {
  const {
    sourceData,
    viewBox,
    triggerLoadCallback,
    triggerSectorCallback,
    selectedCategoryId
  } = useContext(ResizeContext) as ResizeContextType;
  
  // Loading state tracking
  const [backgroundSvgLoaded, setBackgroundSvgLoaded] = useState(false);
  const [overlaySvgReady, setOverlaySvgReady] = useState(false);

  // Helper functions
  const hasCategoryId = useCallback((sectorId: string): boolean => {
    if (!selectedCategoryId) return true;
    const sector = sourceData.sectors?.find(s => s.sector === sectorId);
    return sector?.categories.some(cat => cat.id === selectedCategoryId) ?? false;
  }, [sourceData.sectors, selectedCategoryId]);

  const getCategoryColor = useCallback((sectorId: string): string => {
    const sector = sourceData.sectors?.find(s => s.sector === sectorId);
    if (!sector?.categories.length) return DEFAULT_COLOR;
    
    if (selectedCategoryId && !sector.categories.some(cat => cat.id === selectedCategoryId)) {
      return DEFAULT_COLOR;
    }
  
    const [firstCategory, secondCategory] = sector.categories;
    if (firstCategory.price === 0 && secondCategory) {
      return secondCategory.color;
    }
    
    return firstCategory.color;
  }, [sourceData.sectors, selectedCategoryId]);

  const handlePress = useCallback((g: SVGGroup) => {
    if (selectedCategoryId) {
      const sector = sourceData.sectors?.find(s => s.sector === g['@_id']);
      if (!sector?.categories.some(cat => cat.id === selectedCategoryId)) return;
    }
    
    const selectedSector = sourceData.sectors?.find(
      (sector) => sector.sector === g['@_id']
    );
    
    if (selectedSector) {
      triggerSectorCallback(selectedSector);
    }
  }, [sourceData.sectors, selectedCategoryId, triggerSectorCallback]);

  // Effect to handle loading completion
  useEffect(() => {
    if (!sourceData?.svg) {
      // If no SVG, trigger callback after a short delay
      const timer = setTimeout(() => {
        triggerLoadCallback();
      }, LOAD_DELAY);
      return () => clearTimeout(timer);
    }
    
    // Only trigger callback when both SVG components are loaded
    if (sourceData.svg && backgroundSvgLoaded && overlaySvgReady) {
      const timer = setTimeout(() => {
        triggerLoadCallback();
      }, LOAD_DELAY);
      return () => clearTimeout(timer);
    }
  }, [sourceData?.svg, backgroundSvgLoaded, overlaySvgReady]);

  // Early return if no SVG data
  if (!sourceData?.svg) {
    return null;
  }

  // Parse SVG data
  const parser = new XMLParser(XML_PARSER_CONFIG);
  const jsonObj = parser.parse(sourceData.svg);
  const viewBoxValues = jsonObj.svg['@_viewBox'].split(' ');
  
  const calculateOffsets = () => ({
    vertical: (containerDimensions.height - viewBox.height) / 2,
    horizontal: (containerDimensions.width - viewBox.width) / 2
  });

  const { vertical: verticalOffset, horizontal: horizontalOffset } = calculateOffsets();

  // SVG element rendering functions
  const renderPath = (g: SVGGroup, path: SVGPath, index: number, pathIndex: number): ReactElement => (
    <Path
      key={`path-${index}-${pathIndex}`}
      d={path['@_d']}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => handlePress(g)}
      fill={selectedCategoryId && !hasCategoryId(g['@_id']) ? "rgba(0, 0, 0, 0.1)" : "transparent"}
    />
  );

  const renderPolygon = (g: SVGGroup, polygon: SVGPolygon, index: number, polygonIndex: number): ReactElement => (
    <Polygon
      key={`polygon-${index}-${polygonIndex}`}
      points={polygon['@_points']}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => handlePress(g)}
      fill={selectedCategoryId && !hasCategoryId(g['@_id']) ? "rgba(0, 0, 0, 0.1)" : "transparent"}
    />
  );

  const renderRect = (g: SVGGroup, rect: SVGRect, index: number, rectIndex: number): ReactElement => (
    <Rect
      key={`rect-${index}-${rectIndex}`}
      x={rect['@_x']}
      y={rect['@_y']}
      width={rect['@_width']}
      height={rect['@_height']}
      onStartShouldSetResponder={() => true}
      onResponderRelease={() => handlePress(g)}
      fill={selectedCategoryId && !hasCategoryId(g['@_id']) ? "rgba(0, 0, 0, 0.1)" : "transparent"}
    />
  );

  const renderCircle = (g: SVGGroup, circle: SVGCircle, index: number, circleIndex: number): ReactElement | null => (
    circle['@_visible'] === 'true' ? (
      <Circle
        key={`circle-${index}-${circleIndex}`}
        cx={circle['@_cx']}
        cy={circle['@_cy']}
        r={parseFloat(circle['@_r']) * CIRCLE_SCALE_FACTOR}
        fill={getCategoryColor(g['@_id'])}
      />
    ) : null
  );

  const renderSectorOverlays = (): ReactElement[] => {
    return jsonObj.svg.g
      .filter((g: SVGGroup) => g['@_class'] === 'sector')
      .flatMap((g: SVGGroup, index: number): ReactElement[] => {
        const overlays: ReactElement[] = [];

        if (g.path) {
          const paths = Array.isArray(g.path) ? g.path : [g.path];
          console.log(paths);
          paths.forEach((path, pathIndex) => {
            overlays.push(renderPath(g, path, index, pathIndex));
          });
        }

        if (g.polygon) {
          const polygons = Array.isArray(g.polygon) ? g.polygon : [g.polygon];
          polygons.forEach((polygon, polygonIndex) => {
            overlays.push(renderPolygon(g, polygon, index, polygonIndex));
          });
        }

        if (g.rect) {
          const rects = Array.isArray(g.rect) ? g.rect : [g.rect];
          rects.forEach((rect, rectIndex) => {
            const rectElement = renderRect(g, rect, index, rectIndex);
            if (rectElement) overlays.push(rectElement);
          });
        }

        if (g.circle) {
          const circles = Array.isArray(g.circle) ? g.circle : [g.circle];
          circles.forEach((circle, circleIndex) => {
            const circleElement = renderCircle(g, circle, index, circleIndex);
            if (circleElement) overlays.push(circleElement);
          });
        }

        return overlays;
      });
  };

  // Component render
  return (
    <View style={{ position: 'relative' }}>
      {sourceData.svg && (
        <>
          <SvgCss 
            xml={sourceData.svg} 
            viewBox={jsonObj.svg['@_viewBox']}  
            width={viewBoxValues[2]}
            height={viewBoxValues[3]}
            style={{
              position: 'absolute',
              top: verticalOffset,
              left: horizontalOffset,
            }}
            onLayout={() => {
              setBackgroundSvgLoaded(true);
            }}
            onError={() => {
              // Handle load errors gracefully
              console.warn("SVG background failed to load");
              setBackgroundSvgLoaded(true);
            }}
          />
     
          <Svg
            viewBox={jsonObj.svg['@_viewBox']}
            width={viewBoxValues[2]}
            height={viewBoxValues[3]}
            style={{
              position: 'absolute',
              top: verticalOffset,
              left: horizontalOffset,
            }}
            onLayout={() => {
              setOverlaySvgReady(true);
            }}
          >
            {renderSectorOverlays()}
          </Svg>
        </>
      )}
    </View>
  );
};

export default SectorRenderer;