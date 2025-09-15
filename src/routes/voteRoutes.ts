import { Router } from 'express';
import { VoteController } from '../controllers/voteController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const voteController = new VoteController();

// All vote routes require authentication
router.post(
  "/",
  authenticateToken,
  voteController.submitVote.bind(voteController)
);
router.get(
  "/poll/:id/results",
  voteController.getPollResults.bind(voteController)
);
router.get('/poll/:id/user', voteController.getUserVote.bind(voteController));

export default router;
