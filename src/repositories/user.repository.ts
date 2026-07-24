import { User, Role } from '@prisma/client';
import { prisma } from '../database/prisma.js';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: Role;
}

export class UserRepository {
  /**
   * Finds a user by unique email address
   */
  public async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Finds a user by unique primary key ID
   */
  public async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Creates a new User record in PostgreSQL database
   */
  public async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role || 'USER',
      },
    });
  }
}

export const userRepository = new UserRepository();
