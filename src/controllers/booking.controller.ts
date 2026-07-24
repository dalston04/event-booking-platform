import { Request, Response, NextFunction } from 'express';
import { bookingService, BookingService } from '../services/booking.service.js';

export class BookingController {
  constructor(private service: BookingService = bookingService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next();
      const result = await this.service.reserveSeats(req.user.userId, req.body);

      if (result.type === 'WAITLIST') {
        res.status(202).json({
          status: 'success',
          message: 'Event is currently sold out. You have been placed on the waitlist.',
          data: result,
        });
        return;
      }

      res.status(201).json({
        status: 'success',
        message: 'Seats booked successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  public cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next();
      const booking = await this.service.cancelBooking(req.params.id as string, req.user.userId);
      res.status(200).json({
        status: 'success',
        message: 'Booking cancelled successfully',
        data: { booking },
      });
    } catch (err) {
      next(err);
    }
  };

  public getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next();
      const bookings = await this.service.getUserBookings(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: { bookings },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const bookingController = new BookingController();
