import { JSX, createContext, useMemo, useState } from "react";
import { XMLParser } from "fast-xml-parser";
import { BaseInput, renderTypes } from "../types";

const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
} as const;

// Types
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
  triggerLoadCallback: () => void;
  renderType: renderTypes;
};

interface ResizeContextProps {
  children: JSX.Element;
  initialScale: number;
  data: BaseInput;
  loadCallback: () => void;
  renderType: renderTypes;
}

export const ResizeContext = createContext<ResizeContextType | undefined>(undefined);

const calculateViewBoxBorder = (sourceData: BaseInput): ViewBoxBorder => {
  let border = {
    lowx: Infinity,
    lowy: Infinity,
    highx: -Infinity,
    highy: -Infinity,
  };

  const updateBounds = ({ x, y, width = 0, height = 0 } = {}) => {
    if (x !== undefined && y !== undefined) {
      border.lowx = Math.min(border.lowx, x);
      border.lowy = Math.min(border.lowy, y);
      border.highx = Math.max(border.highx, x + width);
      border.highy = Math.max(border.highy, y + height);
    }
  };

  sourceData.data.rows.forEach(row => row.seats.forEach(updateBounds));
  sourceData.data.shapes.forEach(updateBounds);
  sourceData.data.texts.forEach(updateBounds);

  return border;
};

const calculateViewBox = (
  renderType: renderTypes,
  viewBoxBorder: ViewBoxBorder,
  resizeScale: number,
  viewBoxValues: number[]
): ViewBoxProps => {
  if (renderType === renderTypes.SEAT) {
    return {
      x: viewBoxBorder.lowx * resizeScale,
      y: viewBoxBorder.lowy * resizeScale,
      width: (viewBoxBorder.highx - viewBoxBorder.lowx) * resizeScale,
      height: (viewBoxBorder.highy - viewBoxBorder.lowy) * resizeScale,
    };
  }

  if (renderType === renderTypes.SECTOR) {
    return {
      x: viewBoxValues[0],
      y: viewBoxValues[1],
      width: viewBoxValues[2],
      height: viewBoxValues[3],
    };
  }

  return { x: 0, y: 0, width: 0, height: 0 };
};

const ResizeProvider = ({
  children,
  initialScale,
  data,
  loadCallback,
  renderType
}: ResizeContextProps) => {
  // State
  const [sourceData, setSourceData] = useState<BaseInput>(data);
  const [resizeScale, setResizeScale] = useState(initialScale);

  // Parse SVG data (sector only)
  const parser = new XMLParser(XML_PARSER_CONFIG);
  const jsonObj = sourceData?.svg && parser.parse(sourceData?.svg);
  const viewBoxValues = jsonObj?.svg?.['@_viewBox']
    ? jsonObj.svg['@_viewBox'].split(' ').map(Number)
    : [0, 0, 0, 0];

  // Memoized values
  const viewBoxBorder = useMemo(
    () => calculateViewBoxBorder(sourceData),
    [sourceData.data.rows]
  );

  const viewBox = useMemo(
    () => calculateViewBox(renderType, viewBoxBorder, resizeScale, viewBoxValues),
    [resizeScale, viewBoxBorder, viewBoxValues, renderType]
  );

  const triggerLoadCallback = () => {
    loadCallback?.();
  };

  const contextValue: ResizeContextType = {
    viewBox,
    sourceData,
    resizeScale,
    triggerLoadCallback,
    renderType
  };

  return (
    <ResizeContext.Provider value={contextValue}>
      {children}
    </ResizeContext.Provider>
  );
};

export default ResizeProvider;