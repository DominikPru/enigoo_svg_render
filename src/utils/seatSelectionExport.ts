import { Seat } from '../types';

class SeatSelectionManager {
  private static instance: SeatSelectionManager;
  private selectedSeats: Seat[] = [];
  private listeners: Array<(seats: Seat[]) => void> = [];

  private constructor() {}

  static getInstance(): SeatSelectionManager {
    if (!SeatSelectionManager.instance) {
      SeatSelectionManager.instance = new SeatSelectionManager();
    }
    return SeatSelectionManager.instance;
  }

  addSeat(seat: Seat) {
    if (!this.selectedSeats.some(s => s.id === seat.id)) {
      this.selectedSeats.push(seat);
      this.notifyListeners();
    }
  }

  removeSeat(seat: Seat) {
    this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id);
    this.notifyListeners();
  }

  toggleSeat(seat: Seat) {
    const exists = this.selectedSeats.some(s => s.id === seat.id);
    if (exists) {
      this.removeSeat(seat);
    } else {
      this.addSeat(seat);
    }
  }

  getSelectedSeats(): Seat[] {
    return [...this.selectedSeats];
  }

  clearSelectedSeats() {
    this.selectedSeats = [];
    this.notifyListeners();
  }

  subscribe(listener: (seats: Seat[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.selectedSeats]));
  }
}

export const seatSelection = SeatSelectionManager.getInstance();