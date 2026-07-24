import { bookingRepository, BookingRepository, BookingReservationResult } from '../repositories/booking.repository.js';
import { CreateBookingInput } from '../validators/booking.validator.js';
import { Booking } from '@prisma/client';
import { addEmailJob } from '../queues/email.queue.js';
import { userRepository } from '../repositories/user.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { broadcastSeatUpdate, broadcastLiveBooking } from '../socket/socket.server.js';
import { redisService, RedisService } from '../redis/redis.service.js';

export class BookingService {
  constructor(
    private bookingRepo: BookingRepository = bookingRepository,
    private cache: RedisService = redisService,
  ) {}

  /**
   * Reserves seats or joins waitlist if sold out, enqueuing background email jobs and emitting realtime Socket.IO updates
   */
  public async reserveSeats(userId: string, input: CreateBookingInput): Promise<BookingReservationResult> {
    const result = await this.bookingRepo.reserveSeatsTx(userId, input.eventId, input.seatCount);

    // Invalidate Redis event caches to ensure instant UI sync across all clients
    await this.cache.del(`event:${input.eventId}`);
    await this.cache.delPattern('events:list:*');

    const user = await userRepository.findById(userId);

    // Fetch updated event details for realtime seat broadcast
    const updatedEvent = await eventRepository.findById(input.eventId);
    if (updatedEvent) {
      broadcastSeatUpdate({
        eventId: updatedEvent.id,
        availableSeats: updatedEvent.availableSeats,
        updatedAt: new Date().toISOString(),
      });
    }

    if (user) {
      if (result.type === 'BOOKING' && result.booking) {
        // Broadcast live booking event
        broadcastLiveBooking({
          bookingId: result.booking.id,
          eventId: result.booking.eventId,
          seatCount: result.booking.seatCount,
          timestamp: new Date().toISOString(),
        });

        // Enqueue background email job
        await addEmailJob('send-booking-confirmation', {
          type: 'BOOKING_CONFIRMATION',
          to: user.email,
          subject: 'Booking Confirmation - Event Platform',
          payload: {
            bookingId: result.booking.id,
            eventId: result.booking.eventId,
            seatCount: result.booking.seatCount,
          },
        });
      } else if (result.type === 'WAITLIST' && result.waitlist) {
        await addEmailJob('send-waitlist-notification', {
          type: 'WAITLIST_NOTIFICATION',
          to: user.email,
          subject: 'Waitlist Confirmation - Event Platform',
          payload: {
            waitlistId: result.waitlist.id,
            position: result.waitlist.position,
          },
        });
      }
    }

    return result;
  }

  /**
   * Cancels a booking, triggers waitlist auto-promotion, and emits realtime Socket.IO seat updates
   */
  public async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
    const cancelledBooking = await this.bookingRepo.cancelBookingTx(bookingId, userId);

    // Invalidate Redis event caches
    await this.cache.del(`event:${cancelledBooking.eventId}`);
    await this.cache.delPattern('events:list:*');

    // Broadcast updated seat availability
    const updatedEvent = await eventRepository.findById(cancelledBooking.eventId);
    if (updatedEvent) {
      broadcastSeatUpdate({
        eventId: updatedEvent.id,
        availableSeats: updatedEvent.availableSeats,
        updatedAt: new Date().toISOString(),
      });
    }

    return cancelledBooking;
  }

  /**
   * Fetches user's booking history
   */
  public async getUserBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepo.findUserBookings(userId);
  }
}

export const bookingService = new BookingService();
