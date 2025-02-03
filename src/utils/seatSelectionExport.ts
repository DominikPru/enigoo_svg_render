import { Seat } from '@dominikprusa/enigoo_svg_render/src/types';

class SeatSelectionManager {
  private static instance: SeatSelectionManager;
  private selectedSeats: Seat[] = [];
  private listeners: Array<(seats: Seat[]) => void> = [];
  private verificationCallback: ((seat: Seat) => Promise<boolean>) | null = null;

  private constructor() {}

  static getInstance(): SeatSelectionManager {
    if (!SeatSelectionManager.instance) {
      SeatSelectionManager.instance = new SeatSelectionManager();
    }
    return SeatSelectionManager.instance;
  }

  setVerificationCallback(callback: (seat: Seat) => Promise<boolean>) {
    this.verificationCallback = callback;
  }

  async toggleSeat(seat: Seat): Promise<boolean> {
    const exists = this.selectedSeats.some(s => s.id === seat.id);

    if (!this.verificationCallback) {
      if (exists) {
        this.removeSeat(seat);
      } else {
        this.addSeat(seat);
      }
      return true;
    }

    if (exists) {
      this.removeSeat(seat);
      return true;
    }

    try {
      const isVerified = await this.verificationCallback(seat);
      if (isVerified) {
        this.addSeat(seat);
      }
      return isVerified;
    } catch (error) {
      return false;
    }
  }

  addSeat(seat: Seat) {
    if (!this.selectedSeats.some(s => s.id === seat.id)) {
      this.selectedSeats.push(seat);
      this.notifyListeners();
    }
  }

  removeSeat(seat: Seat) {
    const initialSeatsLength = this.selectedSeats.length;
    this.selectedSeats = this.selectedSeats.filter(s => s.id !== seat.id);
    if (this.selectedSeats.length !== initialSeatsLength) {
      this.notifyListeners();
    }
  }

  clearSelectedSeats() {
    if (this.selectedSeats.length > 0) {
      this.selectedSeats = [];
      this.notifyListeners();
    }
  }

  getSelectedSeats(): Seat[] {
    return [...this.selectedSeats];
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
