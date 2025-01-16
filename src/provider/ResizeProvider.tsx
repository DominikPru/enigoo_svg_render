import { JSX, createContext, useEffect, useMemo, useState } from "react";
import { BaseInput, Coords } from "../types";
import { getResizeScale } from "../utils/resizer";
import { Dimensions } from "react-native";

export let DEVICE_WIDTH = Dimensions.get("window").width;
export let DEVICE_HEIGHT = Dimensions.get("window").height;

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
  coords: Coords;
  resizeScale: number;
  changeResizeScale: (increase: boolean) => void;
};

interface ResizeContextProps {
  children: JSX.Element;
  initialScale: number;
  data: BaseInput;
}

export const ResizeContext = createContext<ResizeContextType | undefined>(
  undefined
);

const ResizeProvider = ({
  children,
  initialScale,
  data,
}: ResizeContextProps) => {
  const [loading, setLoading] = useState(true);
  const [sourceData, setSourceData] = useState<BaseInput>(data);
  const [coords, setCoords] = useState<Coords>(sourceData.data.cords);
  const [resizeScale, setResizeScale] = useState(initialScale);

  const viewBoxBorder = useMemo<ViewBoxBorder>(() => {
    let lowx = Infinity;
    let lowy = Infinity;
    let highx = -Infinity;
    let highy = -Infinity;
    sourceData.data.rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (seat.x < lowx) {
          lowx = seat.x;
        }
        if (seat.x > highx) {
          highx = seat.x;
        }
        if (seat.y < lowy) {
          lowy = seat.y;
        }
        if (seat.y > highy) {
          highy = seat.y;
        }
      });
    });

    return {
      lowx,
      lowy,
      highx,
      highy,
    };
  }, [sourceData.data.rows]);

  const viewBox = useMemo<ViewBoxProps>(() => {
    return {
      x: viewBoxBorder.lowx * resizeScale,
      y: viewBoxBorder.lowy * resizeScale,
      width: (viewBoxBorder.highx - viewBoxBorder.lowx) * resizeScale,
      height: (viewBoxBorder.highy - viewBoxBorder.lowy) * resizeScale,
    };
  }, [resizeScale, viewBoxBorder]);

  useEffect(() => {
    if (resizeScale !== 1) {
      setCoords({
        width: sourceData.data.cords.width,
        height: sourceData.data.cords.height,
        x: sourceData.data.cords.x,
        y: sourceData.data.cords.y,
      });
      setLoading(false);
    } else {
      setResizeScale(
        getResizeScale(DEVICE_WIDTH, DEVICE_HEIGHT, viewBoxBorder)
      );
    }
  }, [resizeScale]);

  const changeResizeScale = (increase: boolean) => {
    if (increase) {
      if (resizeScale + 0.2 < 2) {
        setResizeScale((prevState) => prevState + 0.5);
      }
    } else {
      if (resizeScale - 0.5 > 0.1) {
        setResizeScale((prevState) => prevState - 0.5);
      }
    }
  };

  console.debug(resizeScale);

  if (loading) {
    return null;
  }

  return (
    <ResizeContext.Provider
      value={{ viewBox, coords, sourceData, resizeScale, changeResizeScale }}
    >
      {children}
    </ResizeContext.Provider>
  );
};

export default ResizeProvider;
