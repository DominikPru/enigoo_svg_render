import { Seat } from '@dominikprusa/enigoo_svg_render/src/types';

type Listener = (seats: Seat[]) => void;

export const createSeatManager = () => {
  let selectedSeats: Seat[] = [];
  let listeners: Listener[] = [];
  let verificationCallback: ((seat: Seat) => Promise<boolean>) | null = null;

  const notifyListeners = () => {
    listeners.forEach(listener => listener([...selectedSeats]));
  };

  const setVerificationCallback = (callback: (seat: Seat) => Promise<boolean>) => {
    verificationCallback = callback;
  };

  const toggleSeat = async (seat: Seat): Promise<boolean> => {
    const exists = selectedSeats.some(s => s.id === seat.id);

    if (!verificationCallback) {
      if (exists) {
        selectedSeats = selectedSeats.filter(s => s.id !== seat.id);
      } else {
        selectedSeats.push(seat);
      }
      notifyListeners();
      return true;
    }

    if (exists) {
      selectedSeats = selectedSeats.filter(s => s.id !== seat.id);
      notifyListeners();
      return true;
    }

    try {
      const isVerified = await verificationCallback(seat);
      if (isVerified) {
        selectedSeats.push(seat);
        notifyListeners();
      }
      return isVerified;
    } catch (error) {
      return false;
    }
  };

  const addSeat = (seat: Seat) => {
    if (!selectedSeats.some(s => s.id === seat.id)) {
      selectedSeats.push(seat);
      notifyListeners();
    }
  };

  const removeSeat = (seat: Seat) => {
    const initialLength = selectedSeats.length;
    selectedSeats = selectedSeats.filter(s => s.id !== seat.id);
    if (selectedSeats.length !== initialLength) {
      notifyListeners();
    }
  };

  const clearSelectedSeats = () => {
    if (selectedSeats.length > 0) {
      selectedSeats = [];
      notifyListeners();
    }
  };

  const getSelectedSeats = (): Seat[] => {
    return [...selectedSeats];
  };

  const subscribe = (listener: Listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  };

  return {
    setVerificationCallback,
    toggleSeat,
    addSeat,
    removeSeat,
    clearSelectedSeats,
    getSelectedSeats,
    subscribe
  };
};

export const seatManager = createSeatManager();