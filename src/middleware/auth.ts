import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, JWTPayload, SafeUser } from '../types';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Access token required' 
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'JWT secret not configured'
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    if (!decoded.userId) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token payload' 
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token' 
      });
      return;
    }

    // Properly type the user object
    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    req.user = safeUser;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Invalid or expired token' 
    });
  }
};

export const optionalAuthenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without authentication
    req.user = undefined as any;
    next();
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'JWT secret not configured'
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    if (!decoded.userId) {
      // Invalid token payload, continue without authentication
      req.user = undefined as any;
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, createdAt: true }
    });

    if (!user) {
      // User not found, continue without authentication
      req.user = undefined as any;
      next();
      return;
    }

    // Properly type the user object
    const safeUser: SafeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };

    req.user = safeUser;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    // Token verification failed, continue without authentication
    req.user = undefined as any;
    next();
  }
};
