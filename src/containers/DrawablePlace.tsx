import { useContext } from 'react';
import { ResizeContext, ResizeContextType } from '../provider/ResizeProvider';
import { renderTypes } from '@dominikprusa/enigoo_svg_render/src/types';
import { SectorRenderer } from '../components/SectorRenderer';
import { SeatRenderer } from '../components/SeatRenderer';

const DrawablePlace = ({ containerDimensions }) => {
  const { renderType } = useContext(ResizeContext) as ResizeContextType;
  const isSector = renderType === renderTypes.SECTOR;
  
  return isSector ? (
    <SectorRenderer containerDimensions={containerDimensions} />
  ) : (
    <SeatRenderer containerDimensions={containerDimensions} />
  );
};

export default DrawablePlace;