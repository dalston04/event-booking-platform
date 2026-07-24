import { Request, Response, NextFunction } from 'express';
import { eventService, EventService } from '../services/event.service.js';
import { EventQueryInput } from '../validators/event.validator.js';

export class EventController {
  constructor(private service: EventService = eventService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next();
      const event = await this.service.createEvent(req.user, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Event created successfully',
        data: { event },
      });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await this.service.getEventById(req.params.id as string);
      res.status(200).json({
        status: 'success',
        data: { event },
      });
    } catch (err) {
      next(err);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryInput = req.query as unknown as EventQueryInput;
      const result = await this.service.getEvents(queryInput);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next();
      const event = await this.service.updateEvent(req.params.id as string, req.user, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Event updated successfully',
        data: { event },
      });
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next();
      await this.service.deleteEvent(req.params.id as string, req.user);
      res.status(200).json({
        status: 'success',
        message: 'Event deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}

export const eventController = new EventController();
