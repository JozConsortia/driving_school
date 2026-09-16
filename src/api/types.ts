export type Role = "LEARNER" | "INSTRUCTOR" | "SCHOOL_ADMIN" | "SYSTEM_ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LicenceCategory {
  id: string;
  code: string;
  name: string;
}

export interface SchoolSearchResult {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  avgRating: number | null;
  reviewCount: number;
  services: { licenceCategory: string; pricePerHour: number }[];
  vehicleTypes: string[];
  instructorCount: number;
}

export interface Instructor {
  id: string;
  bio: string | null;
  status: string;
  user: { id: string; name: string; email: string; phone: string | null };
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  licencePlate: string;
  transmission: "MANUAL" | "AUTOMATIC";
  status: string;
}

export interface SchoolProfile {
  id: string;
  name: string;
  description: string | null;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  avgRating?: number | null;
  services: { id: string; pricePerHour: number; licenceCategory: LicenceCategory }[];
  instructors: Instructor[];
  vehicles: Vehicle[];
  reviews: { id: string; rating: number; comment: string | null; createdAt: string; user: { name: string } }[];
}

export interface AvailabilitySlot {
  id: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  school?: { id: string; name: string; city: string };
  instructor?: { id?: string; user: { name: string; phone?: string | null } };
  learner?: { user: { name: string; phone?: string | null } };
  vehicle?: Vehicle | null;
  licenceCategory?: LicenceCategory;
  lessonRecord?: { notes: string | null; progress: string | null; attendance: string } | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  schools: SchoolSearchResult[];
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}
