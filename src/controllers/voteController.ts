import { Response } from "express";
import { VoteService } from "../services/voteService";
import { WebSocketService } from "../services/websocketService";
import { VoteRequest, AuthenticatedRequest } from "../types";
import ErrorResponse from "../utils/errorResponse";
import SuccessResponse from "../utils/successResponse";
import { StatusCodes } from "http-status-codes";

const voteService = new VoteService();

export class VoteController {
  private wsService: WebSocketService;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
  }

  async submitVote(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const voteData: VoteRequest = req.body;

      if (!req.user) {
        const eR = new ErrorResponse("Authentication required", null, null);
        return res.status(StatusCodes.UNAUTHORIZED).json(eR);
      }

      // Basic validation
      if (!voteData.optionIds || voteData.optionIds.length === 0) {
        const eR = new ErrorResponse("At least one poll option must be selected", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const vote: any = await voteService.submitVote(voteData, req.user.id);

      // Broadcast poll update via WebSocket
      try {
        await this.wsService.broadcastPollUpdate(vote.pollOption.pollId);
        this.wsService.broadcastVoteCast(vote.pollOption.pollId, vote.pollOptionId, req.user.id);
        console.log(`Broadcasted poll update and vote cast for poll ${vote.pollOption.pollId}`);
      } catch (wsError) {
        console.error("Error broadcasting poll update:", wsError);
        // Don't fail the vote submission if WebSocket broadcast fails
      }

      const sR = new SuccessResponse("Vote submitted successfully", vote, null);
      return res.status(StatusCodes.CREATED).json(sR);
    } catch (error) {
      console.error("Error submitting vote:", error);

      if (error instanceof Error) {
        if (error.message === "Poll option not found") {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.NOT_FOUND).json(eR);
        }
        if (error.message === "Cannot vote on unpublished poll") {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.BAD_REQUEST).json(eR);
        }
        if (error.message === "User has already voted on this poll") {
          const eR = new ErrorResponse(error.message, null, null);
          return res.status(StatusCodes.CONFLICT).json(eR);
        }
      }

      const eR = new ErrorResponse("Internal Server Error", null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getPollResults(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse("Poll ID is required", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      const results: any = await voteService.getPollResults(id);

      const sR = new SuccessResponse("Poll results fetched successfully", results, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error("Error fetching poll results:", error);

      if (error instanceof Error && error.message === "Poll not found") {
        const eR = new ErrorResponse(error.message, null, null);
        return res.status(StatusCodes.NOT_FOUND).json(eR);
      }

      const eR = new ErrorResponse("Internal Server Error", null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }

  async getUserVote(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { id } = req.params;
      if (!id) {
        const eR = new ErrorResponse("Poll ID is required", null, null);
        return res.status(StatusCodes.BAD_REQUEST).json(eR);
      }

      if (!req.user) {
        const eR = new ErrorResponse("Authentication required", null, null);
        return res.status(StatusCodes.UNAUTHORIZED).json(eR);
      }

      const vote = await voteService.getUserVote(id, req.user.id);

      const sR = new SuccessResponse("User vote fetched successfully", { vote }, null);
      return res.status(StatusCodes.OK).json(sR);
    } catch (error) {
      console.error("Error fetching user vote:", error);
      const eR = new ErrorResponse("Internal Server Error", null, null);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(eR);
    }
  }
}
