import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import { UserPayload, TokenPair } from '../types/auth.types.js';
import { AppError } from './app-error.js';

export class JwtUtil {
  /**
   * Generates both Access Token and Refresh Token for an authenticated user
   */
  public static generateTokenPair(payload: UserPayload): TokenPair {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  /**
   * Verifies an Access Token and returns the decoded payload claims
   */
  public static verifyAccessToken(token: string): UserPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Access token has expired');
      }
      throw AppError.unauthorized('Invalid access token');
    }
  }

  /**
   * Verifies a Refresh Token and returns the decoded payload claims
   */
  public static verifyRefreshToken(token: string): UserPayload {
    try {
      const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as UserPayload;
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Refresh token has expired, please log in again');
      }
      throw AppError.unauthorized('Invalid refresh token');
    }
  }
}
