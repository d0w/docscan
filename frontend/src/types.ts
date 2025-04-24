export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin"
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface File {
  id: string;
  filename: string;
  filepath: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Classroom {
  id: string;
  name: string;
  teacherId: string;
  students: User[];
  assignments: Assignment[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  name: string;
  username: string;
  password: string;
  role: UserRole;
}


