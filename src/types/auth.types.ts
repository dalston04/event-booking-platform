export type UserRole = 'USER' | 'ADMIN';

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
