import { z } from 'zod';

const baseEventSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(150, { message: 'Title cannot exceed 150 characters' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters long' }),
  location: z
    .string()
    .min(2, { message: 'Location is required' }),
  startTime: z
    .string()
    .datetime({ message: 'Start time must be a valid ISO 8601 date string' }),
  endTime: z
    .string()
    .datetime({ message: 'End time must be a valid ISO 8601 date string' }),
  capacity: z
    .number()
    .int()
    .positive({ message: 'Capacity must be a positive integer' }),
  price: z
    .number()
    .min(0, { message: 'Price cannot be negative' }),
});

export const createEventSchema = baseEventSchema.refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be strictly after start time',
    path: ['endTime'],
  },
);

export const updateEventSchema = baseEventSchema.partial();

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
