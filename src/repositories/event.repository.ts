import { Event, Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { CreateEventInput, UpdateEventInput, EventQueryInput } from '../validators/event.validator.js';

export interface PaginatedEventsResult {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EventRepository {
  /**
   * Creates a new Event record
   */
  public async create(organizerId: string, input: CreateEventInput): Promise<Event> {
    return prisma.event.create({
      data: {
        title: input.title,
        description: input.description,
        location: input.location,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        capacity: input.capacity,
        availableSeats: input.capacity, // Initially availableSeats = capacity
        price: input.price,
        organizerId,
      },
    });
  }

  /**
   * Finds an event by primary key ID
   */
  public async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  /**
   * Updates an existing event record
   */
  public async update(id: string, input: UpdateEventInput): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.location && { location: input.location }),
        ...(input.startTime && { startTime: new Date(input.startTime) }),
        ...(input.endTime && { endTime: new Date(input.endTime) }),
        ...(input.capacity !== undefined && { capacity: input.capacity }),
        ...(input.price !== undefined && { price: input.price }),
      },
    });
  }

  /**
   * Deletes an event record
   */
  public async delete(id: string): Promise<Event> {
    return prisma.event.delete({
      where: { id },
    });
  }

  /**
   * Searches and filters events with pagination
   */
  public async findManyWithFilters(query: EventQueryInput): Promise<PaginatedEventsResult> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, location, minPrice, maxPrice, startDate, endDate } = query;

    const parsedMinPrice = minPrice !== undefined ? Number(minPrice) : undefined;
    const parsedMaxPrice = maxPrice !== undefined ? Number(maxPrice) : undefined;

    const where: Prisma.EventWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
        ],
      }),
      ...(location && { location: { contains: String(location), mode: 'insensitive' } }),
      ...((parsedMinPrice !== undefined || parsedMaxPrice !== undefined) && {
        price: {
          ...(parsedMinPrice !== undefined && { gte: parsedMinPrice }),
          ...(parsedMaxPrice !== undefined && { lte: parsedMaxPrice }),
        },
      }),
      ...((startDate || endDate) && {
        startTime: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
        include: {
          organizer: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const eventRepository = new EventRepository();
