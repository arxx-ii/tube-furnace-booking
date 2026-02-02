
import { Booking, BookingResponse, NewBooking, UpdateBooking } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbx_v0U8zR8QJ_BqGkXkLw9kZ7U1p2Q5m3D4_YOUR_ID_HERE/exec';
const isMockMode = API_URL.includes('YOUR_ID_HERE');
const STORAGE_KEY = 'tube_furnace_bookings_v2';

export const api = {
  async getBookings(date: string): Promise<Booking[]> {
    if (isMockMode) {
      const all: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const dayStart = new Date(`${date}T00:00:00`).getTime();
      const dayEnd = new Date(`${date}T23:59:59.999`).getTime();
      
      return all.filter(b => {
        const bStart = new Date(b.startDateTime).getTime();
        const bEnd = new Date(b.endDateTime).getTime();
        return bStart < dayEnd && bEnd > dayStart;
      });
    }

    try {
      const response = await fetch(`${API_URL}?date=${date}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result: BookingResponse = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  async createBooking(booking: NewBooking): Promise<{ success: boolean; message?: string }> {
    if (isMockMode) {
      const all: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      
      const reqStart = new Date(booking.startDateTime).getTime();
      const reqEnd = new Date(booking.endDateTime).getTime();

      const hasConflict = all.some(b => {
        const bStart = new Date(b.startDateTime).getTime();
        const bEnd = new Date(b.endDateTime).getTime();
        return !(reqEnd <= bStart || reqStart >= bEnd);
      });

      if (hasConflict) return { success: false, message: 'Time slot conflict detected across dates.' };

      const newBooking: Booking = {
        ...booking,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, newBooking]));
      
      return { success: true, message: 'Booking created' };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'CREATE', ...booking }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Failed to connect to backend.' };
    }
  },

  async updateBooking(data: UpdateBooking): Promise<{ success: boolean; message?: string }> {
    if (isMockMode) {
      const all: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const index = all.findIndex(b => b.id === data.id);
      if (index === -1) return { success: false, message: 'Booking not found' };

      const reqStart = new Date(data.startDateTime).getTime();
      const reqEnd = new Date(data.endDateTime).getTime();
      const hasConflict = all.some(b => {
        if (b.id === data.id) return false;
        const bStart = new Date(b.startDateTime).getTime();
        const bEnd = new Date(b.endDateTime).getTime();
        return !(reqEnd <= bStart || reqStart >= bEnd);
      });

      if (hasConflict) return { success: false, message: 'Update failed: New range overlaps with another booking.' };

      all[index] = { ...all[index], ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return { success: true, message: 'Booking updated' };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'UPDATE', ...data }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Update failed.' };
    }
  },

  async deleteBooking(id: string): Promise<{ success: boolean; message?: string }> {
    if (isMockMode) {
      const all: Booking[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(b => b.id !== id)));
      return { success: true, message: 'Booking deleted' };
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Delete failed.' };
    }
  }
};
