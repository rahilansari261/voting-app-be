import { prisma } from '../lib/prisma';
import { VoteRequest } from '../types';

export interface VoteResult {
  id: string;
  userId: string;
  pollOptionId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
  pollOption: {
    id: string;
    text: string;
    pollId: string;
  };
}

export interface PollResults {
  pollId: string;
  question: string;
  totalVotes: number;
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
    percentage: number;
  }>;
}

export class VoteService {
  async submitVote(voteData: VoteRequest, userId: string): Promise<VoteResult> {
    const { optionIds } = voteData;

    // Validate that at least one option is provided
    if (!optionIds || optionIds.length === 0) {
      throw new Error('At least one poll option must be selected');
    }

    // For now, we'll only handle single selection (first option)
    // TODO: Implement multiple selection if needed
    const pollOptionId = optionIds[0];

    // Additional validation to ensure pollOptionId is defined
    if (!pollOptionId) {
      throw new Error('Invalid poll option selected');
    }

    // Verify poll option exists and get poll info
    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: {
        poll: {
          select: {
            id: true,
            isPublished: true
          }
        }
      }
    });

    if (!pollOption) {
      throw new Error('Poll option not found');
    }

    if (!pollOption.poll.isPublished) {
      throw new Error('Cannot vote on unpublished poll');
    }

    // Check if user has already voted on this poll
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId: pollOption.poll.id
        }
      }
    });

    if (existingVote) {
      throw new Error('User has already voted on this poll');
    }

    // Create the vote
    const vote = await prisma.vote.create({
      data: {
        userId,
        pollOptionId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        pollOption: {
          select: {
            id: true,
            text: true,
            pollId: true
          }
        }
      }
    });

    return {
      id: vote.id,
      userId: vote.userId,
      pollOptionId: vote.pollOptionId,
      createdAt: vote.createdAt,
      user: vote.user,
      pollOption: vote.pollOption
    };
  }

  async getPollResults(pollId: string): Promise<PollResults> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
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
      pollId: poll.id,
      question: poll.question,
      totalVotes,
      options: optionsWithResults
    };
  }

  async getUserVote(pollId: string, userId: string) {
    const vote = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId
        }
      },
      include: {
        pollOption: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });

    return vote;
  }
}