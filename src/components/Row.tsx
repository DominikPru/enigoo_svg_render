import React, {Fragment, PropsWithChildren, useCallback} from 'react';
import SeatNew from './SeatNew.tsx';
import {Row} from '../types.ts';

interface RowProps {
  item: Row;
  resizeScale: number;
}

const RowComponent = (props: PropsWithChildren<RowProps>) => {
  const renderSeats = useCallback(() => {
    return props.item.seats.map((item, index) => {
      return (
        <SeatNew
          item={item}
          row={props.item.label}
          key={index}
          resizeScale={props.resizeScale}
        />
      );
    });
  }, [props.item.seats, props.item.label, props.resizeScale]);

  return <>{renderSeats()}</>;
};

export default RowComponent;
