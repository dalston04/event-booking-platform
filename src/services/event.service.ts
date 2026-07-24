import { eventRepository, EventRepository, PaginatedEventsResult } from '../repositories/event.repository.js';
import { CreateEventInput, UpdateEventInput, EventQueryInput } from '../validators/event.validator.js';
import { AppError } from '../utils/app-error.js';
import { Event } from '@prisma/client';
import { UserPayload } from '../types/auth.types.js';
import { redisService, RedisService } from '../redis/redis.service.js';

export class EventService {
  constructor(
    private eventRepo: EventRepository = eventRepository,
    private cache: RedisService = redisService,
  ) {}

  /**
   * Creates a new event and invalidates list caches
   */
  public async createEvent(user: UserPayload, input: CreateEventInput): Promise<Event> {
    const event = await this.eventRepo.create(user.userId, input);
    await this.cache.delPattern('events:list:*');
    return event;
  }

  /**
   * Retrieves a single event by ID using the Cache-Aside Pattern
   */
  public async getEventById(id: string): Promise<Event> {
    const cacheKey = `event:${id}`;

    // 1. Cache Read Attempt
    const cachedEvent = await this.cache.getJson<Event>(cacheKey);
    if (cachedEvent) {
      return cachedEvent;
    }

    // 2. Cache Miss: Fetch from PostgreSQL
    const event = await this.eventRepo.findById(id);
    if (!event) {
      throw AppError.notFound(`Event with ID [${id}] not found`);
    }

    // 3. Populate Redis Cache (TTL = 3600 seconds)
    await this.cache.setJson(cacheKey, event, 3600);

    return event;
  }

  /**
   * Lists events with paginated search and filter options
   */
  public async getEvents(query: EventQueryInput): Promise<PaginatedEventsResult> {
    const cacheKey = `events:list:${JSON.stringify(query)}`;

    // 1. Cache Read Attempt
    const cachedResult = await this.cache.getJson<PaginatedEventsResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 2. Cache Miss: Query Database
    const result = await this.eventRepo.findManyWithFilters(query);

    // 3. Cache Result for 300 seconds (5 minutes)
    await this.cache.setJson(cacheKey, result, 300);

    return result;
  }

  /**
   * Updates an existing event and invalidates associated Redis caches
   */
  public async updateEvent(
    id: string,
    user: UserPayload,
    input: UpdateEventInput,
  ): Promise<Event> {
    const existingEvent = await this.getEventById(id);

    if (existingEvent.organizerId !== user.userId && user.role !== 'ADMIN') {
      throw AppError.forbidden('Forbidden. Only the event organizer or an Admin can modify this event.');
    }

    const updatedEvent = await this.eventRepo.update(id, input);

    // Invalidate Cache
    await this.cache.del(`event:${id}`);
    await this.cache.delPattern('events:list:*');

    return updatedEvent;
  }

  /**
   * Deletes an existing event and invalidates associated Redis caches
   */
  public async deleteEvent(id: string, user: UserPayload): Promise<Event> {
    const existingEvent = await this.getEventById(id);

    if (existingEvent.organizerId !== user.userId && user.role !== 'ADMIN') {
      throw AppError.forbidden('Forbidden. Only the event organizer or an Admin can delete this event.');
    }

    const deletedEvent = await this.eventRepo.delete(id);

    // Invalidate Cache
    await this.cache.del(`event:${id}`);
    await this.cache.delPattern('events:list:*');

    return deletedEvent;
  }
}

export const eventService = new EventService();
