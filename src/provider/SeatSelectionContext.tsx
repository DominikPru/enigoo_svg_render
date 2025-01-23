import React, { createContext, useState, useContext, useCallback } from 'react';
import { Seat } from '../types';

interface SeatSelectionContextType {
  selectedSeats: Seat[];
  toggleSeat: (seat: Seat) => void;
  clearSelectedSeats: () => void;
}

const SeatSelectionContext = createContext<SeatSelectionContextType>({
  selectedSeats: [],
  toggleSeat: () => {},
  clearSelectedSeats: () => {}
});

export const SeatSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  const toggleSeat = useCallback((seat: Seat) => {
    setSelectedSeats(current => 
      current.some(s => s.id === seat.id)
        ? current.filter(s => s.id !== seat.id)
        : [...current, seat]
    );
  }, []);

  const clearSelectedSeats = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  return (
    <SeatSelectionContext.Provider value={{ selectedSeats, toggleSeat, clearSelectedSeats }}>
      {children}
    </SeatSelectionContext.Provider>
  );
};

export const useSeatSelection = () => {
  const context = useContext(SeatSelectionContext);
  if (!context) {
    throw new Error('useSeatSelection must be used within a SeatSelectionProvider');
  }
  return context;
};