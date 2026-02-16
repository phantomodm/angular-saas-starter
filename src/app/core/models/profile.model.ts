/**
 * Extended user profile model for CRUD operations
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  bio?: string;
  company?: string;
  location?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  website?: string;
  roles: string[];
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended' | 'onboarding';
  emailVerified: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  lastPasswordChange?: Date;
}

export interface CreateProfileRequest {
  email: string;
  displayName: string;
  photoUrl?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  company?: string;
  location?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  website?: string;
  photoUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OnboardingData {
  displayName: string;
  company?: string;
  location?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  bio?: string;
  website?: string;
}
