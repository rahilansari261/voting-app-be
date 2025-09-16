import { prisma } from '../lib/prisma';
import { CreatePollRequest, PollWithResults, PaginatedResponse, DashboardStats } from '../types';

export class PollService {
  async createPoll(pollData: CreatePollRequest, creatorId: string) {
    const { question, options, isPublished = false } = pollData;

    if (options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        isPublished,
        creatorId,
        options: {
          create: options.map(option => ({ text: typeof option === "string" ? option : option.text }))
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        options: true
      }
    });

    return poll;
  }

  async getPollById(id: string): Promise<PollWithResults> {
    const poll = await prisma.poll.findUnique({
      where: { id },
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
      throw new Error('Poll not found');
    }

    return this.formatPollWithResults(poll);
  }

  async getPollsByUserId(userId: string, status?: 'published' | 'draft' | 'all'): Promise<any[]> {
    let where: any = { creatorId: userId };
    
    if (status === 'published') {
      where.isPublished = true;
    } else if (status === 'draft') {
      where.isPublished = false;
    }
    // if status is 'all' or undefined, don't add isPublished filter

    const polls: any[] = await prisma.poll.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return polls.map(poll => this.formatPollWithResults(poll));
  }

  async getAllPolls(page = 1, limit = 10, publishedOnly = false): Promise<PaginatedResponse<PollWithResults>> {
    const skip = (page - 1) * limit;
    
    const where = publishedOnly ? { isPublished: true } : {};

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.poll.count({ where })
    ]);

    return {
      data: polls.map((poll: any) => this.formatPollWithResults(poll)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  private formatPollWithResults(poll: any): PollWithResults {
    const totalVotes = poll.options.reduce((sum: number, option: any) => 
      sum + option._count.votes, 0
    );

    const optionsWithResults = poll.options.map((option: any) => {
      const voteCount = option._count.votes;
      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

      return {
        id: option.id,
        text: option.text,
        voteCount,
        percentage: Math.round(percentage * 100) / 100
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      isPublished: poll.isPublished,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      creator: poll.creator,
      options: optionsWithResults,
      totalVotes
    };
  }

  async updatePoll(id: string, updates: Partial<CreatePollRequest>, userId: string) {
    // Check if user owns the poll
    const poll = await prisma.poll.findUnique({
      where: { id },
      select: { creatorId: true }
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.creatorId !== userId) {
      throw new Error('Unauthorized to update this poll');
    }

    // Build update data object, only including defined values
    const updateData: { question?: string; isPublished?: boolean } = {};
    
    if (updates.question !== undefined) {
      updateData.question = updates.question;
    }
    
    if (updates.isPublished !== undefined) {
      updateData.isPublished = updates.isPublished;
    }

    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        options: true
      }
    });

    return updatedPoll;
  }

  async deletePoll(id: string, userId: string): Promise<{ message: string }> {
    // Check if user owns the poll
    const poll = await prisma.poll.findUnique({
      where: { id },
      select: { creatorId: true }
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.creatorId !== userId) {
      throw new Error('Unauthorized to delete this poll');
    }

    await prisma.poll.delete({
      where: { id }
    });

    return { message: 'Poll deleted successfully' };
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get user's polls with vote counts
    const userPolls = await prisma.poll.findMany({
      where: { creatorId: userId },
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

    // Calculate user's poll statistics
    const publishedPolls = userPolls.filter(poll => poll.isPublished);
    const draftPolls = userPolls.filter(poll => !poll.isPublished);
    
    // Calculate total votes across user's published polls
    const totalVotes = userPolls.reduce((sum, poll) => {
      return sum + poll.options.reduce((optionSum: number, option: any) => 
        optionSum + option._count.votes, 0
      );
    }, 0);

    // Get active polls count (all published polls across platform)
    const activePolls = await prisma.poll.count({
      where: { isPublished: true }
    });

    // Get all published polls count
    const allPublishedPolls = await prisma.poll.count({
      where: { isPublished: true }
    });

    // Get recent polls (last 5 published polls across platform)
    const recentPolls = await prisma.poll.findMany({
      where: { isPublished: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
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

    return {
      myPolls: {
        total: userPolls.length,
        published: publishedPolls.length,
        drafts: draftPolls.length
      },
      totalVotes,
      activePolls,
      recentPolls: recentPolls.map(poll => this.formatPollWithResults(poll)),
      allPublishedPolls
    };
  }
}
