import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { WebSocketEvents, JWTPayload, PollWithResults } from '../types';

export class WebSocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        // origin: process.env.CORS_ORIGIN || "https://voting.hudhudapp.in",
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id);

      // Authenticate the connection
      const token = socket.handshake.query.token as string;
      let userId: string | null = null;

      if (token) {
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) {
            socket.emit('error', {
              code: 'AUTH_ERROR',
              message: 'JWT secret not configured',
              timestamp: new Date()
            });
            socket.disconnect();
            return;
          }

          const decoded = jwt.verify(token, secret) as JWTPayload;
          userId = decoded.userId;
        } catch (error) {
          console.error('JWT verification error:', error);
          socket.emit('error', {
            code: 'AUTH_ERROR',
            message: 'Invalid authentication token',
            timestamp: new Date()
          });
          socket.disconnect();
          return;
        }
      }

      // Handle joining poll rooms
      socket.on('join-poll', async (data: WebSocketEvents['join-poll']) => {
        try {
          const { pollId } = data;
          
          // Verify poll exists and is published
          const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: { id: true, isPublished: true }
          });

          if (!poll) {
            socket.emit('error', {
              code: 'POLL_NOT_FOUND',
              message: 'Poll not found',
              timestamp: new Date()
            });
            return;
          }

          if (!poll.isPublished) {
            socket.emit('error', {
              code: 'POLL_NOT_PUBLISHED',
              message: 'Poll is not published',
              timestamp: new Date()
            });
            return;
          }

          socket.join(`poll:${pollId}`);
          socket.emit('joined-poll', {
            pollId,
            status: 'success',
            timestamp: new Date()
          });

          console.log(`Client ${socket.id} joined poll ${pollId}`);
        } catch (error) {
          console.error('Error joining poll:', error);
          socket.emit('error', {
            code: 'SERVER_ERROR',
            message: 'Failed to join poll',
            timestamp: new Date()
          });
        }
      });

      // Handle leaving poll rooms
      socket.on('leave-poll', (data: WebSocketEvents['leave-poll']) => {
        const { pollId } = data;
        socket.leave(`poll:${pollId}`);
        socket.emit('left-poll', {
          pollId,
          status: 'success',
          timestamp: new Date()
        });

        console.log(`Client ${socket.id} left poll ${pollId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast poll updates to all clients in a specific poll room
  async broadcastPollUpdate(pollId: string): Promise<void> {
    try {
      // Get updated poll data with results
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          creator: {
            select: {
              id: true,
              name: true
            }
          },
          options: {
            include: {
              _count: {
                select: { votes: true }
              }
            }
          }
        }
      });

      if (!poll) {
        console.error(`Poll ${pollId} not found for broadcast`);
        return;
      }

      // Calculate results
      const totalVotes = poll.options.reduce((sum: number, option: any) => 
        sum + option._count.votes, 0
      );

      const optionsWithResults = poll.options.map((option: any)  => {
        const voteCount = option._count.votes;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return {
          id: option.id,
          text: option.text,
          voteCount,
          percentage: Math.round(percentage * 100) / 100
        };
      });

      const pollData: PollWithResults = {
        id: poll.id,
        question: poll.question,
        isPublished: poll.isPublished,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        creator: poll.creator,
        options: optionsWithResults,
        totalVotes
      };

      // Broadcast to all clients in the poll room
      this.io.to(`poll:${pollId}`).emit('poll-updated', pollData);

      console.log(`Broadcasted poll update for poll ${pollId} to ${this.io.sockets.adapter.rooms.get(`poll:${pollId}`)?.size || 0} clients`);
    } catch (error) {
      console.error('Error broadcasting poll update:', error);
    }
  }

  // Broadcast vote cast event
  broadcastVoteCast(pollId: string, pollOptionId: string, userId: string): void {
    const voteData: WebSocketEvents['vote-cast'] = {
      pollId,
      pollOptionId,
      userId,
      timestamp: new Date()
    };

    this.io.to(`poll:${pollId}`).emit('vote-cast', voteData);
    console.log(`Broadcasted vote cast for poll ${pollId}`);
  }

  // Get connected clients count for a poll
  getPollClientCount(pollId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`poll:${pollId}`);
    return room ? room.size : 0;
  }

  // Get total connected clients
  getTotalClientCount(): number {
    return this.io.sockets.sockets.size;
  }
}
