import { Request } from 'express';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// User without sensitive data
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Authenticated request with properly typed user
export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreatePollRequest {
  question: string;
  options: (string | { text: string })[];
  isPublished?: boolean;
}

export interface VoteRequest {
  pollOptionId: string;
}

export interface PollWithResults {
  id: string;
  question: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string;
  };
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
    percentage: number;
  }>;
  totalVotes: number;
}

export interface WebSocketEvents {
  'join-poll': { pollId: string };
  'leave-poll': { pollId: string };
  'poll-updated': PollWithResults;
  'vote-cast': {
    pollId: string;
    pollOptionId: string;
    userId: string;
    timestamp: Date;
  };
  'error': {
    code: string;
    message: string;
    timestamp: Date;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

