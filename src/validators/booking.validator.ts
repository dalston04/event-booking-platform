import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().uuid({ message: 'eventId must be a valid UUID' }),
  seatCount: z
    .number()
    .int()
    .positive({ message: 'seatCount must be a positive integer' })
    .max(10, { message: 'Cannot book more than 10 seats per transaction' })
    .default(1),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
