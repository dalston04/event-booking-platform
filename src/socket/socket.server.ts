import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';

export interface SeatUpdatePayload {
  eventId: string;
  availableSeats: number;
  updatedAt: string;
}

export interface LiveBookingPayload {
  bookingId: string;
  eventId: string;
  seatCount: number;
  timestamp: string;
}

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`⚡ Socket Client Connected [ID: ${socket.id}]`);

    // 1. Join specific Event Room for live seat updates
    socket.on('join-event-room', (eventId: string) => {
      const room = `event:${eventId}`;
      socket.join(room);
      logger.info(`⚡ Socket [${socket.id}] joined room [${room}]`);
    });

    // 2. Leave specific Event Room
    socket.on('leave-event-room', (eventId: string) => {
      const room = `event:${eventId}`;
      socket.leave(room);
      logger.info(`⚡ Socket [${socket.id}] left room [${room}]`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`⚡ Socket Client Disconnected [ID: ${socket.id}] | Reason: ${reason}`);
    });
  });

  return io;
}

/**
 * Broadcasts live seat availability updates to all clients in a specific event room
 */
export function broadcastSeatUpdate(payload: SeatUpdatePayload): void {
  if (!io) return;
  const room = `event:${payload.eventId}`;
  io.to(room).emit('seat:updated', payload);
  logger.info(`⚡ Broadcasted seat:updated to room [${room}] | Available: ${payload.availableSeats}`);
}

/**
 * Broadcasts live booking activity to global admin monitoring channels
 */
export function broadcastLiveBooking(payload: LiveBookingPayload): void {
  if (!io) return;
  io.emit('live:booking', payload);
  logger.info(`⚡ Broadcasted live:booking globally | Booking ID: ${payload.bookingId}`);
}
