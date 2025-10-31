export interface TimeSlot {
  value: string; // HH:MM format
  label: string; // Display format
  displayTime: string; // 12-hour format
}

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Handle next day (times after midnight)
  if (totalMinutes >= 1440) {
    totalMinutes = totalMinutes - 1440;
  }
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
};

export const getEndTime = (startTime: string, duration: 30 | 60): string => {
  return addMinutesToTime(startTime, duration);
};

export const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const isWeekendDay = isWeekend(date);
  
  // Club timings:
  // Monday-Friday: 14:00 (2 PM) to 02:00 (2 AM next day)
  // Saturday-Sunday: 12:00 (12 PM) to 03:00 (3 AM next day)
  
  const startHour = isWeekendDay ? 12 : 14; // 12 PM or 2 PM
  const endHour = isWeekendDay ? 27 : 26; // 3 AM or 2 AM (next day, so 24+3=27 or 24+2=26)
  
  let currentMinutes = startHour * 60; // Convert to minutes
  const endMinutes = endHour * 60;
  
  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    
    // Handle times after midnight (24+ hours)
    const displayHours = hours >= 24 ? hours - 24 : hours;
    const time24 = `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    const time12 = formatTime12Hour(time24);
    const nextDay = hours >= 24 ? ' (Next Day)' : '';
    
    slots.push({
      value: time24,
      label: `${time12}${nextDay}`,
      displayTime: time12,
    });
    
    currentMinutes += 30; // 30-minute intervals
  }
  
  return slots;
};

export const isValidTimeSlot = (date: Date, time: string, duration: 30 | 60): boolean => {
  const isWeekendDay = isWeekend(date);
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  const startLimit = isWeekendDay ? 12 * 60 : 14 * 60; // 12 PM or 2 PM
  const endLimit = isWeekendDay ? 3 * 60 : 2 * 60; // 3 AM or 2 AM
  
  // Check if start time is within limits
  if (timeInMinutes < startLimit) return false;
  
  // Calculate end time
  const endTimeInMinutes = timeInMinutes + duration;
  
  // Check if end time is within limits (considering next day)
  if (timeInMinutes >= startLimit && endTimeInMinutes <= 24 * 60) {
    // Same day booking
    return true;
  }
  
  // Next day booking (after midnight)
  if (endTimeInMinutes > 24 * 60) {
    const nextDayEndMinutes = endTimeInMinutes - 24 * 60;
    return nextDayEndMinutes <= endLimit;
  }
  
  return false;
};

export const getTimeSlotDisplay = (startTime: string, endTime: string): string => {
  return `${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}`;
};


