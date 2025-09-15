import { Response } from 'express';
import { PollService } from '../services/pollService';
import { CreatePollRequest, AuthenticatedRequest, PollWithResults, PaginatedResponse } from '../types';
import ErrorResponse from '../utils/errorResponse';
import SuccessResponse from '../utils/successResponse';
import { StatusCodes } from 'http-status-codes';

const pollService = new PollService();

export class PollController {
  async createPoll(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const pollData: CreatePollRequest = req.body;

      console.log('pollData', pollData);
      
      if (!req.user) {
        const eR = new ErrorResponse('Authentication required', null, null);
        return res.status(StatusCodes.UNAUTHORIZED).json(eR);
      }

      // Basic validation
      if (!pollData.question || !pollData.options || !Array.isArray(pollData.options)) {
        const eR = new ErrorResponse('Question and options array are required', null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const poll = await pollService.createPoll(pollData, req.user.id);
      
      const sR = new SuccessResponse('Poll created successfully', poll, null);
      return res.status(StatusCodes.CREATED).json(sR);
    } catch (error) {
      console.error('Error creating poll:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Poll must have at least 2 options') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.BAD_REQUEST).json(eR);
        }
      }
      
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getPollById(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse('Poll ID is required', null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const poll: PollWithResults = await pollService.getPollById(id);
      
      const sR = new SuccessResponse('Poll fetched successfully', poll, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error('Error fetching poll:', error);
      
      if (error instanceof Error && error.message === 'Poll not found') {
        const eR = new ErrorResponse(error.message, null, null);
        return res.status(StatusCodes.NOT_FOUND).json(eR);
      }
      
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getAllPolls(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const published = req.query.published === 'true' || false;
      const result: PaginatedResponse<PollWithResults> = await pollService.getAllPolls(page, limit, published);
      
      const sR = new SuccessResponse('Polls fetched successfully', result, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error('Error fetching polls:', error);
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async updatePoll(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse('Poll ID is required', null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const updates: Partial<CreatePollRequest> = req.body;
      
      if (!req.user) {
        const eR = new ErrorResponse('Authentication required', null, null);
        return res.status(StatusCodes.UNAUTHORIZED).json(eR);
      }

      const poll = await pollService.updatePoll(id, updates, req.user.id);
      
      const sR = new SuccessResponse('Poll updated successfully', poll, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error('Error updating poll:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Poll not found') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.NOT_FOUND).json(eR);
        }
        if (error.message === 'Unauthorized to update this poll') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.FORBIDDEN).json(eR);
        }
      }
      
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async deletePoll(req: AuthenticatedRequest, res: Response): Promise<any> {
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

      const result = await pollService.deletePoll(id, req.user.id);
      
      const sR = new SuccessResponse('Poll deleted successfully', result, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error('Error deleting poll:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Poll not found') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.NOT_FOUND).json(eR);
        }
        if (error.message === 'Unauthorized to delete this poll') {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.FORBIDDEN).json(eR);
        }
      }
      
      const eR = new ErrorResponse('Internal Server Error', null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }
}
