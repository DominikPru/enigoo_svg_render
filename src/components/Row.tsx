import { PropsWithChildren, useCallback, memo } from 'react';
import SeatNew from './SeatNew';
import { Row } from '../types';

interface RowProps {
  item: Row;
}

const RowComponent = memo((props: PropsWithChildren<RowProps>) => {
  const renderSeats = useCallback(() => {
    return props.item.seats.map((item) => {
      return (
        <SeatNew
          item={item}
          row={props.item.label}
          key={item.uuid}  // Using a unique identifier for the key
        />
      );
    });
  }, [props.item.seats, props.item.label]);

  return <>{renderSeats()}</>;
});

export default RowComponent;
