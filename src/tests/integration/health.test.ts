import request from 'supertest';
import { createApp } from '../../app.js';

describe('Health Endpoints Integration Tests', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 OK with system status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toBe('Event Booking Platform API is operational');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('timestamp');
  });

  it('GET /api/v1/unknown-route should return 404 Not Found', async () => {
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toBe('Requested route does not exist');
  });
});
