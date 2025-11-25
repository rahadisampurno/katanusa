export const BookingStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PENDING_PAYMENT: 'pending_payment',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export interface Booking {
  id: string;
  expertId: string;
  expertName: string;
  expertRole: string;
  expertImage: string;
  topic: string;
  date: string; // ISO date string or formatted string depending on usage, keeping string for now
  time: string;
  status: BookingStatus;
  canReschedule?: boolean;
}
