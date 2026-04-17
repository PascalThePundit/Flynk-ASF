import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNextSabbathTimes() {
  const now = new Date();
  const nextFriday = new Date();
  nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
  nextFriday.setHours(18, 0, 0, 0); // 6:00 PM

  const nextSaturday = new Date();
  nextSaturday.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
  nextSaturday.setHours(18, 0, 0, 0); // 6:00 PM

  return { Friday: nextFriday, Saturday: nextSaturday };
}
