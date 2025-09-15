// Type testing file - this will be excluded from build
import { 
  CreateUserRequest, 
  CreatePollRequest, 
  VoteRequest, 
  PollWithResults,
  SafeUser,
  JWTPayload,
  ApiError,
  PaginatedResponse,
  WebSocketEvents
} from './types';
import { TypeValidator } from './utils/typeValidation';

// Test type definitions
const testUser: SafeUser = {
  id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date()
};

const testCreateUser: CreateUserRequest = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testCreatePoll: CreatePollRequest = {
  question: 'Test question?',
  options: ['Option 1', 'Option 2'],
  isPublished: true
};

const testVote: VoteRequest = {
  pollOptionId: 'option-id'
};

const testPollResults: PollWithResults = {
  id: 'poll-id',
  question: 'Test question?',
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  creator: {
    id: 'user-id',
    name: 'Creator Name'
  },
  options: [
    {
      id: 'option-1',
      text: 'Option 1',
      voteCount: 5,
      percentage: 50.0
    },
    {
      id: 'option-2',
      text: 'Option 2',
      voteCount: 5,
      percentage: 50.0
    }
  ],
  totalVotes: 10
};

const testJWT: JWTPayload = {
  userId: 'user-id',
  iat: 1234567890,
  exp: 1234567890
};

const testApiError: ApiError = {
  error: 'Test Error',
  message: 'Test error message'
};

const testPaginatedResponse: PaginatedResponse<PollWithResults> = {
  data: [testPollResults],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    pages: 1
  }
};

const testWebSocketEvent: WebSocketEvents['poll-updated'] = testPollResults;

// Test type validation
const isValidUser = TypeValidator.validateCreateUserRequest(testCreateUser);
const isValidPoll = TypeValidator.validateCreatePollRequest(testCreatePoll);
const isValidVote = TypeValidator.validateVoteRequest(testVote);
const isValidEmail = TypeValidator.validateEmail('test@example.com');
const isValidPassword = TypeValidator.validatePassword('password123');

console.log('Type tests passed:', {
  isValidUser,
  isValidPoll,
  isValidVote,
  isValidEmail,
  isValidPassword
});

// This file is only for type checking and will not be compiled
export {};
