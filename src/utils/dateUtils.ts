import { format, addDays, isBefore, startOfDay } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatTime = (time: string): string => {
  return time;
};

export const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const getNext7Days = (): Date[] => {
  const days: Date[] = [];
  const today = startOfDay(new Date());
  
  for (let i = 0; i < 7; i++) {
    days.push(addDays(today, i));
  }
  
  return days;
};

export const isDateInNext7Days = (date: Date): boolean => {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 7);
  
  return !isBefore(date, today) && isBefore(date, maxDate);
};

export const getMinBookingDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getMaxBookingDate = (): string => {
  return format(addDays(new Date(), 6), 'yyyy-MM-dd');
};

