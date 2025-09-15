import { CreateUserRequest, CreatePollRequest, VoteRequest } from '../types';

// Type validation utilities
export class TypeValidator {
  static validateCreateUserRequest(data: any): data is CreateUserRequest {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.name === 'string' &&
      typeof data.email === 'string' &&
      typeof data.password === 'string' &&
      data.name.trim().length > 0 &&
      data.email.trim().length > 0 &&
      data.password.length >= 6
    );
  }

  static validateCreatePollRequest(data: any): data is CreatePollRequest {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.question === 'string' &&
      Array.isArray(data.options) &&
      data.options.length >= 2 &&
      data.options.every((option: any) => typeof option === 'string' && option.trim().length > 0) &&
      (data.isPublished === undefined || typeof data.isPublished === 'boolean')
    );
  }

  static validateVoteRequest(data: any): data is VoteRequest {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.pollOptionId === 'string' &&
      data.pollOptionId.trim().length > 0
    );
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  static validateId(id: string): boolean {
    return typeof id === 'string' && id.trim().length > 0;
  }

  static validatePaginationParams(page: any, limit: any): { page: number; limit: number } {
    const parsedPage = parseInt(String(page)) || 1;
    const parsedLimit = parseInt(String(limit)) || 10;
    
    return {
      page: Math.max(1, parsedPage),
      limit: Math.min(Math.max(1, parsedLimit), 100) // Cap at 100 items per page
    };
  }
}

// Type guards for runtime type checking
export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Error types for better error handling
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TypeError extends Error {
  constructor(message: string, public expectedType?: string, public actualType?: string) {
    super(message);
    this.name = 'TypeError';
  }
}
