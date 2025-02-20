import {JSX, createContext, useMemo, useState} from 'react';
import {XMLParser} from 'fast-xml-parser';
import {BaseInput, Sector, renderTypes} from '../types';

const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
} as const;

export interface ViewBoxBorder {
  lowx: number;
  lowy: number;
  highx: number;
  highy: number;
}

export interface ViewBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeContextType = {
  viewBox: ViewBoxProps;
  sourceData: BaseInput;
  resizeScale: number;
  selectedCategoryId: number | null;
  setSelectedCategoryId: (id: number | null) => void;
  triggerLoadCallback: () => void;
  triggerSectorCallback: (sector: Sector | undefined) => void;
  renderType: renderTypes;
};

interface ResizeContextProps {
  children: JSX.Element;
  initialScale: number;
  data: BaseInput;
  loadCallback?: (() => void) | undefined;
  sectorCallback?: ((sector: Sector | undefined) => void) | undefined;
  renderType: renderTypes;
}

interface BoundsInput {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

// Create a default context value with no-op functions for optional callbacks
const defaultContextValue: ResizeContextType = {
  viewBox: {x: 0, y: 0, width: 0, height: 0},
  sourceData: {} as BaseInput,
  resizeScale: 1,
  selectedCategoryId: null,
  setSelectedCategoryId: () => {},
  triggerLoadCallback: () => {},
  triggerSectorCallback: () => {},
  renderType: renderTypes.SECTOR,
};

export const ResizeContext =
  createContext<ResizeContextType>(defaultContextValue);

  const calculateViewBoxBorder = (
    sourceData: BaseInput,
    renderType: renderTypes,
  ): ViewBoxBorder => {
    if (renderType === renderTypes.SECTOR) {
      return { lowx: 0, lowy: 0, highx: 0, highy: 0 };
    }
  
    let border = {
      lowx: Infinity,
      lowy: Infinity,
      highx: -Infinity,
      highy: -Infinity,
    };
  
    const updateBounds = (
      bounds: BoundsInput = { x: 0, y: 0, width: 0, height: 0, rotation: 0, x2: 0, y2: 0 },
    ) => {
      const { x = 0, y = 0, x2 = 0, y2 = 0 } = bounds;
  
      // For text elements, use both x, y and x2, y2 to define bounds
      if (bounds.x2 !== undefined && bounds.y2 !== undefined) {
        border.lowx = Math.min(border.lowx, x, x2);
        border.lowy = Math.min(border.lowy, y, y2);
        border.highx = Math.max(border.highx, x, x2);
        border.highy = Math.max(border.highy, y, y2);
      } else {
        // For other elements, just use x and y
        border.lowx = Math.min(border.lowx, x);
        border.lowy = Math.min(border.lowy, y);
        border.highx = Math.max(border.highx, x);
        border.highy = Math.max(border.highy, y);
      }
    };
  
    // Loop through rows, shapes, and texts
    sourceData.data?.rows?.forEach(row => row.seats?.forEach(updateBounds));
    sourceData.data?.shapes?.forEach(updateBounds);
    sourceData.data?.texts?.forEach(updateBounds);  // This will now apply the x2, y2 logic
  
    // If no bounds were updated, return default border
    if (border.lowx === Infinity) {
      return { lowx: 0, lowy: 0, highx: 0, highy: 0 };
    }
  
    return border;
  };
  
const calculateViewBox = (
  renderType: renderTypes,
  viewBoxBorder: ViewBoxBorder,
  resizeScale: number,
  viewBoxValues: number[],
): ViewBoxProps => {
  if (renderType === renderTypes.SECTOR) {
    return {
      x: viewBoxValues[0],
      y: viewBoxValues[1],
      width: viewBoxValues[2],
      height: viewBoxValues[3],
    };
  }

  // 🔹 Increase padding for safety
  const padding = 20; // Try adjusting this value if needed

  return {
    x: (viewBoxBorder.lowx - padding) * resizeScale,
    y: (viewBoxBorder.lowy - padding) * resizeScale,
    width: (viewBoxBorder.highx - viewBoxBorder.lowx + 2 * padding) * resizeScale,
    height: (viewBoxBorder.highy - viewBoxBorder.lowy + 2 * padding) * resizeScale,
  };
};


const ResizeProvider = ({
  children,
  initialScale,
  data,
  loadCallback,
  sectorCallback,
  renderType,
}: ResizeContextProps) => {
  const [sourceData, setSourceData] = useState<BaseInput>(data);
  const [resizeScale, setResizeScale] = useState(initialScale);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const parser = new XMLParser(XML_PARSER_CONFIG);
  const jsonObj = sourceData?.svg ? parser.parse(sourceData.svg) : null;
  const viewBoxValues = jsonObj?.svg?.['@_viewBox']
    ? jsonObj.svg['@_viewBox'].split(' ').map(Number)
    : [0, 0, 0, 0];

  const viewBoxBorder = useMemo(
    () => calculateViewBoxBorder(sourceData, renderType),
    [sourceData.data?.rows, renderType],
  );

  const viewBox = useMemo(
    () =>
      calculateViewBox(renderType, viewBoxBorder, resizeScale, viewBoxValues),
    [resizeScale, viewBoxBorder, viewBoxValues, renderType],
  );

  // Safe callback triggers with optional chaining
  const triggerLoadCallback = () => {
    loadCallback?.();
  };

  const triggerSectorCallback = (sector: Sector | undefined) => {
    sectorCallback?.(sector);
  };  

  const contextValue: ResizeContextType = {
    viewBox,
    sourceData,
    resizeScale,
    selectedCategoryId,
    setSelectedCategoryId,
    triggerLoadCallback,
    triggerSectorCallback,
    renderType,
  };

  return (
    <ResizeContext.Provider value={contextValue}>
      {children}
    </ResizeContext.Provider>
  );
};

export default ResizeProvider;
