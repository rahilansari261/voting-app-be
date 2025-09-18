# Real-Time Polling Application

A robust backend service for a real-time polling application built with Node.js, Express, TypeScript, PostgreSQL, Prisma, and WebSocket support.

## Features

- **User Management**: Create and authenticate users with JWT tokens
- **Poll Management**: Create, read, update, and delete polls with multiple options
- **Voting System**: Submit votes with validation (one vote per user per poll)
- **Real-time Updates**: Live poll results via WebSocket connections
- **Room-based Broadcasting**: Efficient real-time updates for specific polls
- **Type Safety**: Full TypeScript implementation with Prisma ORM

## Live Demo

🌐 **Try the application live**: [https://voting.hudhudapp.in/](https://voting.hudhudapp.in/)

## Video Demonstration

Watch the application in action: [Real-Time Polling App Demo](https://www.loom.com/share/e79c13afbeaa4321b66c6b20abd5ebd0?sid=d4a5bf79-ff67-49d8-a191-687df0312d05)

## Getting Started

### Sample Users

The application comes with 4 pre-configured sample users for testing:

| Email | Password |
|-------|----------|
| user1@gmail.com | password123 |
| user2@gmail.com | password123 |
| user3@gmail.com | password123 |
| user4@gmail.com | password123 |

### How to Use

1. **Sign Up or Login**: Use one of the sample users above or create a new account by signing up
2. **Create a Poll**: After logging in, create a new poll with multiple options
3. **Cast Votes**: Users can vote on polls (one vote per user per poll)
4. **Real-time Updates**: Online users will be notified instantly when votes are cast or polls are updated

## Tech Stack

- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT tokens
- **Security**: bcrypt for password hashing, helmet for security headers

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 13 or higher
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voting-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/voting_app"
   JWT_SECRET="your-super-secret-jwt-key"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database with sample data
   npm run db:seed
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build && npm start
   ```

## API Endpoints

### Authentication
- `POST /api/users` - Create a new user
- `POST /api/users/login` - Login and get JWT token
- `GET /api/users/:id` - Get user by ID (requires auth)

### Polls
- `POST /api/polls` - Create a new poll (requires auth)
- `GET /api/polls` - Get all polls with pagination (requires auth)
- `GET /api/polls/:id` - Get poll by ID with results (requires auth)
- `PUT /api/polls/:id` - Update poll (requires auth, owner only)
- `DELETE /api/polls/:id` - Delete poll (requires auth, owner only)

### Votes
- `POST /api/votes` - Submit a vote (requires auth)
- `GET /api/votes/poll/:id/results` - Get poll results (requires auth)
- `GET /api/votes/poll/:id/user` - Get user's vote for a poll (requires auth)

## WebSocket Events

### Client Events
- `join-poll` - Join a poll room to receive updates
- `leave-poll` - Leave a poll room

### Server Events
- `poll-updated` - Poll results updated (broadcasted to poll room)
- `vote-cast` - New vote cast (broadcasted to poll room)
- `error` - Error occurred

## Database Schema

The application uses the following main entities:

- **User**: Users who can create polls and vote
- **Poll**: Polls with questions and publication status
- **PollOption**: Options for each poll
- **Vote**: Votes connecting users to poll options

### Relationships
- One-to-Many: User → Polls, Poll → PollOptions
- Many-to-Many: User ↔ PollOption (through Vote table)

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

### Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── types/           # TypeScript type definitions
├── lib/             # Utility libraries (Prisma client)
└── index.ts         # Application entry point

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Database seeding script
```

## Testing

The application includes comprehensive test coverage:

- Unit tests for services and utilities
- Integration tests for API endpoints
- WebSocket connection and event tests
- Load testing for concurrent operations

Run tests with:
```bash
npm test
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention via Prisma
- CORS configuration
- Security headers with helmet
- Rate limiting (configurable)

## Performance

- Database connection pooling
- Efficient WebSocket room management
- Optimized database queries
- Horizontal scaling support

## Deployment

The application is ready for deployment with:

- Docker support (Dockerfile included)
- Environment-based configuration
- Health check endpoints
- Graceful shutdown handling
- Production-ready logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the ISC License.
