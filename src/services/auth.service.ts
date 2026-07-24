import { userRepository, UserRepository } from '../repositories/user.repository.js';
import { PasswordUtil } from '../utils/password.util.js';
import { JwtUtil } from '../utils/jwt.util.js';
import { AppError } from '../utils/app-error.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { TokenPair, UserPayload } from '../types/auth.types.js';
import { Role } from '@prisma/client';

export interface UserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    createdAt: Date;
  };
  tokens: TokenPair;
}

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  /**
   * Registers a new user account
   */
  public async register(input: RegisterInput): Promise<AuthResponse> {
    // 1. Check if email already exists
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists');
    }

    // 2. Hash password
    const passwordHash = await PasswordUtil.hashPassword(input.password);

    // 3. Persist new user record
    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: input.role,
    });

    // 4. Generate JWT Dual Tokens
    const payload: UserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    };
    const tokens = JwtUtil.generateTokenPair(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  /**
   * Authenticates user login credentials
   */
  public async login(input: LoginInput): Promise<AuthResponse> {
    // 1. Find user by email
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password credentials');
    }

    // 2. Verify password match in constant time
    const isPasswordValid = await PasswordUtil.comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password credentials');
    }

    // 3. Issue new JWT Dual Tokens
    const payload: UserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    };
    const tokens = JwtUtil.generateTokenPair(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  /**
   * Retrieves profile details for an authenticated user
   */
  public async getCurrentUser(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User account not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const authService = new AuthService();
