import {DEVICE_WIDTH, ViewBoxBorder} from '../provider/ResizeProvider.tsx';

export const getResizeScale = (
  deviceWidth: number,
  deviceHeight: number,
  viewBoxBorder: ViewBoxBorder,
) => {
  return Math.min(
    deviceWidth / (viewBoxBorder.highx - viewBoxBorder.lowx),
    deviceHeight / (viewBoxBorder.highy - viewBoxBorder.lowy),
  );
};
