import { Booking, Waitlist, BookingStatus } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/app-error.js';

export interface BookingReservationResult {
  type: 'BOOKING' | 'WAITLIST';
  booking?: Booking;
  waitlist?: Waitlist;
}

export class BookingRepository {
  /**
   * Atomic Transaction: Reserve Seats OR Place User on Waitlist
   */
  public async reserveSeatsTx(
    userId: string,
    eventId: string,
    seatCount: number,
  ): Promise<BookingReservationResult> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch Event with current available seat count
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw AppError.notFound(`Event with ID [${eventId}] not found`);
      }

      // 2. Check if enough seats are available
      if (event.availableSeats < seatCount) {
        // Event is sold out or insufficient seats -> Join Waitlist
        const existingWaitlist = await tx.waitlist.findUnique({
          where: {
            userId_eventId: { userId, eventId },
          },
        });

        if (existingWaitlist) {
          throw AppError.conflict('You are already on the waitlist for this event');
        }

        const waitlistCount = await tx.waitlist.count({
          where: { eventId },
        });

        const waitlist = await tx.waitlist.create({
          data: {
            userId,
            eventId,
            position: waitlistCount + 1,
          },
        });

        return { type: 'WAITLIST', waitlist };
      }

      // 3. Atomic Seat Decrement Guard: Update available seats where availableSeats >= seatCount
      const updatedEvent = await tx.event.updateMany({
        where: {
          id: eventId,
          availableSeats: { gte: seatCount }, // Guard condition prevents race condition overbooking
        },
        data: {
          availableSeats: { decrement: seatCount },
        },
      });

      if (updatedEvent.count === 0) {
        throw AppError.conflict('Seats were claimed by another user just now. Please try again.');
      }

      // 4. Create Booking record
      const booking = await tx.booking.create({
        data: {
          userId,
          eventId,
          seatCount,
          status: BookingStatus.CONFIRMED,
        },
        include: {
          event: {
            select: { id: true, title: true, location: true, startTime: true },
          },
        },
      });

      return { type: 'BOOKING', booking };
    });
  }

  /**
   * Atomic Transaction: Cancel Booking & Promote Waitlisted User
   */
  public async cancelBookingTx(bookingId: string, userId: string): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { event: true },
      });

      if (!booking) {
        throw AppError.notFound(`Booking with ID [${bookingId}] not found`);
      }

      if (booking.userId !== userId) {
        throw AppError.forbidden('You are not authorized to cancel this booking');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw AppError.badRequest('Booking is already cancelled');
      }

      // 1. Update Booking status to CANCELLED
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // 2. Increment available seats back
      await tx.event.update({
        where: { id: booking.eventId },
        data: { availableSeats: { increment: booking.seatCount } },
      });

      // 3. Waitlist Auto-Promotion check: If users exist on waitlist, check top waitlisted user
      const topWaitlist = await tx.waitlist.findFirst({
        where: { eventId: booking.eventId },
        orderBy: { position: 'asc' },
      });

      if (topWaitlist && booking.seatCount >= 1) {
        // Auto-promote top waitlist user
        await tx.booking.create({
          data: {
            userId: topWaitlist.userId,
            eventId: booking.eventId,
            seatCount: 1,
            status: BookingStatus.CONFIRMED,
          },
        });

        // Decrement 1 seat for promoted user
        await tx.event.update({
          where: { id: booking.eventId },
          data: { availableSeats: { decrement: 1 } },
        });

        // Delete promoted user from waitlist
        await tx.waitlist.delete({
          where: { id: topWaitlist.id },
        });
      }

      return cancelledBooking;
    });
  }

  /**
   * Retrieves booking history for a user
   */
  public async findUserBookings(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: { id: true, title: true, location: true, startTime: true, endTime: true, price: true },
        },
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
