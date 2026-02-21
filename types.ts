export interface User {
  id: string;
  name: string;
  login: string;
  role: 'ADMIN' | 'USER';
}

export interface Child {
  id: string;
  name: string;
  responsibleName: string;
  responsibleContact: string;
  allergies?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildAttendance {
  date: string; // dd/MM/yyyy
  shift: 'MORNING' | 'NIGHT';
  present: boolean;
  child: { id: string; name: string };
  markedBy: { id: string; name: string };
}

export interface SundayAvailability {
  date: string; // dd/MM/yyyy
  shift: 'MORNING' | 'NIGHT';
  user: { id: string; name: string };
}

export interface SundayReport {
  date: string; // dd/MM/yyyy
  shift: 'MORNING' | 'NIGHT';
  availableUsers: { id: string; name: string }[];
  remainingSlots: number;
  attendances: ChildAttendance[];
}

export interface SundayCalendarItem {
  date: string; // dd/MM/yyyy
  reports: SundayReport[];
}

export interface SundayCalendarResponse {
  monthYear: string; // MM/yyyy
  sundays: SundayCalendarItem[];
}

export interface AuthResponse {
  token: string;
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}
