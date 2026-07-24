import { JwtUtil } from './utils/jwt.util.js';
import { UserPayload } from './types/auth.types.js';

function testJwtUtility(): void {
  console.log('--- TESTING JWT ACCESS & REFRESH TOKEN UTILITY ---');

  const mockUser: UserPayload = {
    userId: 'usr_998877665544332211',
    email: 'alex.engineer@example.com',
    role: 'ADMIN',
  };

  // 1. Generate Tokens
  const tokens = JwtUtil.generateTokenPair(mockUser);
  console.log('Generated Access Token (truncated):', tokens.accessToken.substring(0, 35) + '...');
  console.log('Generated Refresh Token (truncated):', tokens.refreshToken.substring(0, 35) + '...');

  // 2. Verify Valid Access Token
  const decodedAccess = JwtUtil.verifyAccessToken(tokens.accessToken);
  console.log('Decoded Access Token Payload:', decodedAccess);
  console.log('Matches User ID:', decodedAccess.userId === mockUser.userId);
  console.log('Matches Role:', decodedAccess.role === 'ADMIN');

  // 3. Verify Valid Refresh Token
  const decodedRefresh = JwtUtil.verifyRefreshToken(tokens.refreshToken);
  console.log('Decoded Refresh Token Payload:', decodedRefresh);

  // 4. Test Invalid Token Error Interception
  try {
    JwtUtil.verifyAccessToken('invalid.jwt.token.string');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err) {
      console.log('Caught Tampered Token Exception (Expected):', (err as Error).message);
    }
  }
}

testJwtUtility();
