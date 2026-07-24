import { JwtUtil } from '../../utils/jwt.util.js';
import { UserPayload } from '../../types/auth.types.js';

describe('JwtUtil Unit Tests', () => {
  const mockPayload: UserPayload = {
    userId: 'usr_test_123456789',
    email: 'test.user@example.com',
    role: 'ADMIN',
  };

  it('should generate valid Access and Refresh token pairs', () => {
    const tokens = JwtUtil.generateTokenPair(mockPayload);

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('should verify and decode a valid Access Token', () => {
    const tokens = JwtUtil.generateTokenPair(mockPayload);
    const decoded = JwtUtil.verifyAccessToken(tokens.accessToken);

    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
  });

  it('should throw unauthorized AppError on invalid token signature', () => {
    expect(() => {
      JwtUtil.verifyAccessToken('invalid.jwt.signature');
    }).toThrow('Invalid access token');
  });
});
