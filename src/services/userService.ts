import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { CreateUserRequest, SafeUser, JWTPayload } from '../types';

export class UserService {
  async createUser(userData: CreateUserRequest): Promise<SafeUser> {
    const { name, email, password, confirmPassword } = userData;

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  async getUserById(id: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  async validateCredentials(email: string, password: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log('user', user);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    console.log('password', password);
    const isValidPassword =   await bcrypt.compare(password, user.password);
    console.log('isValidPassword', isValidPassword);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const payload: JWTPayload = { userId };
    
    return jwt.sign(
      payload,
      secret,
      { expiresIn: '7d' }
    );
  }
}
