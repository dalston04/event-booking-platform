import { JwtUtil } from '../src/utils/jwt.util.js';

async function runAuthVerification(): Promise<void> {
  const userToken = JwtUtil.generateTokenPair({
    userId: 'usr_regular_123',
    email: 'user@example.com',
    role: 'USER',
  }).accessToken;

  const adminToken = JwtUtil.generateTokenPair({
    userId: 'usr_admin_999',
    email: 'admin@example.com',
    role: 'ADMIN',
  }).accessToken;

  const baseUrl = 'http://localhost:3000/api/v1/protected';

  console.log('--- EMPIRICAL AUTHENTICATION & AUTHORIZATION VERIFICATION ---');

  // Test 1: No Token
  const res1 = await fetch(`${baseUrl}/profile`);
  console.log('1. GET /profile [No Token] -> Status:', res1.status, await res1.json());

  // Test 2: Regular User Token on Profile Route
  const res2 = await fetch(`${baseUrl}/profile`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log('2. GET /profile [USER Token] -> Status:', res2.status, await res2.json());

  // Test 3: Regular User Token on Admin Route (Should fail 403)
  const res3 = await fetch(`${baseUrl}/admin-dashboard`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  console.log('3. GET /admin-dashboard [USER Token] -> Status:', res3.status, await res3.json());

  // Test 4: Admin Token on Admin Route (Should succeed 200)
  const res4 = await fetch(`${baseUrl}/admin-dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('4. GET /admin-dashboard [ADMIN Token] -> Status:', res4.status, await res4.json());
}

runAuthVerification().catch(console.error);
