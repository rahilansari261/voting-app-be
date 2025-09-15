import { Response } from 'express';
import { VoteService } from '../services/voteService';
import { VoteRequest, AuthenticatedRequest } from '../types';
import ErrorResponse from '../utils/errorResponse';
import SuccessResponse from '../utils/successResponse';
import { StatusCodes } from 'http-status-codes';

const voteService = new VoteService();

export class VoteController {
  async submitVote(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const voteData: VoteRequest = req.body;
      
      if (!req.user) {
        const eR = new ErrorResponse('Authentication required', null, null);
        return res.status(StatusCodes.UNAUTHORIZED).json(eR);
      }

      // Basic validation
      if (!voteData.pollOptionId) {
        const eR = new ErrorResponse('Poll option ID is required', null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const vote: any = await voteService.submitVote(voteData, req.user.id);
      
      const sR = new SuccessResponse('Vote submitted successfully', vote, null);
      return res.status(StatusCodes.CREATED).json(sR);
    } catch (error) {
      console.error('Error submitting vote:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Poll option not found') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.NOT_FOUND).json(eR);
        }
        if (error.message === 'Cannot vote on unpublished poll') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.BAD_REQUEST).json(eR);
        }
        if (error.message === 'User has already voted on this poll') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.CONFLICT).json(eR);
        }
      }
      
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getPollResults(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse('Poll ID is required', null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const results: any = await voteService.getPollResults(id);
      
      const sR = new SuccessResponse('Poll results fetched successfully', results, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error('Error fetching poll results:', error);
      
      if (error instanceof Error && error.message === 'Poll not found') {
        const eR = new ErrorResponse(error.message, null, null);
        return res.status(StatusCodes.NOT_FOUND).json(eR);
      }
      
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getUserVote(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse('Poll ID is required', null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }
      
      if (!req.user) {
        const eR = new ErrorResponse('Authentication required', null, null);
        return res.status(StatusCodes.UNAUTHORIZED).json(eR);
      }

      const vote = await voteService.getUserVote(id, req.user.id);
      
      const sR = new SuccessResponse('User vote fetched successfully', { vote }, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error('Error fetching user vote:', error);
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }
}
