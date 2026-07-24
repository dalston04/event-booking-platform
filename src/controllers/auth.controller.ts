import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from '../services/auth.service.js';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.register(req.body);
      res.status(201).json({
        status: 'success',
        message: 'User account registered successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.login(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next();
      }
      const user = await this.service.getCurrentUser(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
