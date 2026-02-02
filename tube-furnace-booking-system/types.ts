
export interface Booking {
  id: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  name: string;
  sample: string;
  gas: string;
  notes?: string;
  createdAt: string;
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  data?: Booking[];
  editCode?: string;
}

export interface NewBooking {
  startDateTime: string;
  endDateTime: string;
  name: string;
  sample: string;
  gas: string;
  notes?: string;
}

export interface UpdateBooking extends NewBooking {
  id: string;
}
