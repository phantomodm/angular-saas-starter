export interface User {
  id: string;
  administrator?: string;
  email: string;
  company_name: string;
  logoUrl?: string;
  displayName: string;
  photoUrl?: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
}

export type AuthProvider = 'firebase' | 'cognito' | 'azure' | 'supabase';


