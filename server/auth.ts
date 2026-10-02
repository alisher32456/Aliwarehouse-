import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'rozgar_super_secret_production_key_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'RESELLER';
  business_name?: string;
  city?: string;
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is missing or invalid'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = queryOne<AuthUser>(
      'SELECT id, name, email, phone, username, role, status, business_name, city FROM users WHERE id = ?',
      [payload.id]
    );

    if (!user) {
      res.status(401).json({ success: false, message: 'User account not found' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      if (user.status === 'PENDING_APPROVAL') {
        res.status(403).json({
          success: false,
          status: 'PENDING_APPROVAL',
          message: 'Your account is waiting for admin approval.'
        });
        return;
      }
      if (user.status === 'REJECTED') {
        res.status(403).json({
          success: false,
          status: 'REJECTED',
          message: 'Your registration was not approved.'
        });
        return;
      }
      if (user.status === 'SUSPENDED') {
        res.status(403).json({
          success: false,
          status: 'SUSPENDED',
          message: 'Your account has been suspended. Please contact support.'
        });
        return;
      }
      res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact administrator.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not possess the required administrator privileges'
      });
      return;
    }

    next();
  };
}
