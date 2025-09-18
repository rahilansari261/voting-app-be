import { Router } from "express";
import { VoteController } from "../controllers/voteController";
import { WebSocketService } from "../services/websocketService";
import { authenticateToken } from "../middleware/auth";

const createVoteRoutes = (wsService: WebSocketService) => {
  const router = Router();
  const voteController = new VoteController(wsService);

  // All vote routes require authentication
  router.post("/", authenticateToken, voteController.submitVote.bind(voteController));
  router.get("/poll/:id/results", authenticateToken, voteController.getPollResults.bind(voteController));
  router.get("/poll/:id/user", authenticateToken, voteController.getUserVote.bind(voteController));

  return router;
};

export default createVoteRoutes;
