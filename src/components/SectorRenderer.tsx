import { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { Svg, Path, Polygon, Text } from 'react-native-svg';
import { SvgCss } from 'react-native-svg/css';
import { XMLParser } from 'fast-xml-parser';
import { ResizeContext, ResizeContextType } from '../provider/ResizeProvider';

export const SectorRenderer = ({ containerDimensions }) => {
  const { sourceData, viewBox, triggerLoadCallback } = useContext(
    ResizeContext
  ) as ResizeContextType;

  if (!sourceData?.svg) {
    setTimeout(() => {
        triggerLoadCallback();
      }, 200);
    return (
        <></>
    ); 
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
  });

  const jsonObj = parser.parse(sourceData?.svg);

  const verticalOffset = (containerDimensions.height - viewBox.height) / 2;
  const horizontalOffset = (containerDimensions.width - viewBox.width) / 2;

  const viewBoxValues = jsonObj.svg['@_viewBox'].split(' ');

  useEffect(() => {
    if (sourceData.svg) {
      setTimeout(() => {
        triggerLoadCallback();
      }, 500);
    }
  }, [sourceData.svg, triggerLoadCallback]);

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
          >
            {jsonObj.svg.g
              .filter((gFilter) => gFilter["@_class"] === 'sector')
              .map((g, index) => {
                const overlays = [];
     
                if (g.path) {
                  const paths = Array.isArray(g.path) ? g.path : [g.path];
                  paths.forEach((path, pathIndex) => {
                    overlays.push(
                      <Path
                        key={`path-${index}-${pathIndex}`} 
                        d={path['@_d']}
                        fill="transparent"
                        stroke="blue"
                        strokeWidth={5}
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={() => {
                          console.log(`Path Clicked: ${g['@_id'] || 'No ID'}`);
                        }}
                      />
                    );
                  });
                }
     
                if (g.polygon) {
                  const polygons = Array.isArray(g.polygon) ? g.polygon : [g.polygon];
                  polygons.forEach((polygon, polygonIndex) => {
                    overlays.push(
                      <Polygon
                        key={`polygon-${index}-${polygonIndex}`}
                        points={polygon['@_points']}
                        fill="transparent"
                        stroke="red"
                        strokeWidth={5}
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={() => {
                          console.log(`Polygon Clicked: ${g['@_id'] || 'No ID'}`);
                        }}
                      />
                    );
                  });
                }
     
                return overlays;
              })}
          </Svg>
        </>
      )}
    </View>
  );
};

export default SectorRenderer;