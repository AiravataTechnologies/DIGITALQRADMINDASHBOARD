import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Admin } from '../models/Admin';

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';

export interface AuthRequest extends Request {
  admin?: any;
}

export const authenticateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Try to find admin in MongoDB first, then fallback
    try {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin) {
        req.admin = admin;
        return next();
      }
    } catch (mongoError) {
      // MongoDB not available, use fallback
    }

    // Fallback authentication for when MongoDB is not available
    if (decoded.id === 'admin-001') {
      req.admin = {
        _id: 'admin-001',
        id: 'admin-001',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      };
      return next();
    }

    return res.status(401).json({ message: 'Admin not found' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const generateToken = (adminId: string) => {
  return jwt.sign({ id: adminId }, JWT_SECRET, { expiresIn: '24h' });
};