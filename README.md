# EventSync — Event Booking & Analytics SaaS Platform

EventSync is a production-grade backend application for managing events, reserving seats under high concurrency, processing background jobs, and serving real-time analytics metrics.

**Live Application Demo**: [https://event-booking-api-cxvg.onrender.com](https://event-booking-api-cxvg.onrender.com)

---

## What This Project Solves

When popular events open for ticket sales, thousands of users often attempt to reserve the last available seats simultaneously. Simple backend implementations suffer from **race conditions**, resulting in double-booking or negative seat counts.

EventSync handles high-concurrency seat reservations using **atomic PostgreSQL database transactions**. If an event is sold out, users are automatically placed into a position-tracked **Waitlist**. When a booking is cancelled, seats are recovered and top waitlisted users are automatically promoted.

---

## Core Features

- **Authentication & Authorization**: Password hashing with Bcrypt (10 salt rounds), dual-token JWT architecture (short-lived Access Tokens, long-lived Refresh Tokens), and Role-Based Access Control (`USER` vs `ADMIN`).
- **Event Engine**: Paginated search and filtering by price range, location, and dates.
- **Race Condition Prevention**: Double-booking protection enforced via atomic check-and-decrement updates (`availableSeats >= count`) inside isolated `prisma.$transaction` blocks.
- **Waitlist & Auto-Promotion**: Automated waitlist queuing when capacity reaches zero, with seat recovery and auto-promotion upon cancellation.
- **In-Memory Caching**: Redis Cache-Aside implementation for event listings with sub-millisecond read latency and pattern-based cache invalidation.
- **Asynchronous Background Workers**: BullMQ producer queues and worker consumers handling email notification jobs with exponential backoff retries.
- **Real-Time WebSockets**: Socket.IO room subscriptions emitting instant `seat:updated` availability events to connected clients.
- **Analytics Dashboard**: Aggregated SQL metrics (total users, total revenue, booking counts) and event sales rankings (`DENSE_RANK() OVER`).
- **DevOps & Containerization**: Multi-stage Docker production image (~120MB) and infrastructure blueprints for Render, Neon PostgreSQL, and Upstash Redis.

---

## System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │      Client Browser / REST API / WS      │
                    └────────────────────┬────────────────────┘
                                         │  HTTPS / WSS
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │    Node.js + Express Application Server  │
                    │   (Layered Controller-Service-Repo)     │
                    └────────────┬────────────────┬───────────┘
                                 │                │
             SQL Queries / ACID  │                │  In-Memory Cache,
             Transactions        │                │  Rate Limit & Queues
                                 ▼                ▼
                    ┌──────────────────┐    ┌──────────────────┐
                    │ Neon PostgreSQL  │    │  Upstash Redis   │
                    │ (Relational DB)  │    │ (Cache & BullMQ) │
                    └──────────────────┘    └──────────────────┘
```

---

## Tech Stack

- **Runtime & Language**: Node.js, TypeScript (Strict Mode, ESM `NodeNext`)
- **Web Framework**: Express.js
- **Database & ORM**: PostgreSQL, Prisma ORM
- **In-Memory Store & Queues**: Redis (`ioredis`), BullMQ
- **Real-Time Gateway**: Socket.IO
- **Security & Utilities**: Bcrypt.js, JSON Web Tokens (jsonwebtoken), Zod, Helmet, CORS, Pino Logger
- **Testing**: Jest, Supertest
- **Containerization & Deployment**: Docker, Docker Compose, Render, Neon, Upstash

---

## Getting Started Locally

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL and Redis (installed locally or via Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/event-booking-platform.git
cd event-booking-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/event_booking_db?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=super_secret_access_token_key_32_chars_min
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=super_secret_refresh_token_key_32_chars_min
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 4. Start Local Database & Redis (Via Docker Compose)

```bash
docker compose up -d postgres redis
```

### 5. Apply Database Migrations

```bash
npx prisma db push
```

### 6. Run the Application

```bash
# Start in development mode (hot reloading)
npm run dev

# Or build and run production bundle
npm run build
npm start
```

The application will start on `http://localhost:3000`.

---

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` — Register a new user (`fullName`, `email`, `password`, `role`)
- `POST /api/v1/auth/login` — Authenticate credentials and receive access/refresh tokens
- `GET /api/v1/auth/me` — Fetch active user profile (Requires Bearer token)

### Events
- `GET /api/v1/events` — List events with pagination (`?page=1&limit=10&search=Tech`)
- `GET /api/v1/events/:id` — Get single event details by ID
- `POST /api/v1/events` — Create new event (Requires `ADMIN` or Organizer token)
- `PUT /api/v1/events/:id` — Update event details (Requires Organizer token)
- `DELETE /api/v1/events/:id` — Delete event (Requires Organizer token)

### Bookings
- `POST /api/v1/bookings` — Reserve seats for an event (`eventId`, `seatCount`)
- `POST /api/v1/bookings/:id/cancel` — Cancel reservation and trigger seat recovery
- `GET /api/v1/bookings/history` — View user reservation history

### Analytics
- `GET /api/v1/analytics/dashboard` — Overview metrics & top-ranked events (Requires `ADMIN` token)

---

## Running Automated Tests

```bash
# Run unit and integration tests with Jest
npm test

# Run TypeScript type check
npm run type-check

# Run ESLint check
npm run lint
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
