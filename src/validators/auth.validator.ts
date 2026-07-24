import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password cannot exceed 100 characters' }),
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(100, { message: 'Full name cannot exceed 100 characters' }),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
