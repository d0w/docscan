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

export interface Submission {
  id: string;
  student: User;
  files: File[];
  grade?: number;
  feedback?: string;
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
  submissionId?: string;
  contentType?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  studentIds: string[];
  dueDate: string;
  submissions?: Submission[];
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


