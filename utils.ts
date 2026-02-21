import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Setup clsx and tailwind-merge manually to avoid dependency issues in this environment if they aren't pre-installed.
// However, standard React environments usually allow these. I will implement a simple version to be safe.

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatMonthYear = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

export const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

export const getNextSunday = (fromDate: Date): Date => {
  const date = new Date(fromDate);
  const day = date.getDay();
  const distance = (7 - day) % 7;
  date.setDate(date.getDate() + (distance === 0 ? 7 : distance));
  return date;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const getFirstName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  return parts[0] || 'Usuario';
};

export const playSound = (type: 'click' | 'success' | 'error') => {
  // Micro-sound system implementation placeholder
  // in a real app, use Audio API
  console.log(`[Audio] Playing ${type} sound`);
};

export const parsePtDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

export const isPastDate = (dateStr: string): boolean => {
  const date = parsePtDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const isCurrentMonth = (monthDate: Date): boolean => {
  const now = new Date();
  return monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear();
};

export const isFutureMonth = (monthDate: Date): boolean => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const compareMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  return compareMonth > currentMonth;
};
