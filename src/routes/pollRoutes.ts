import { Router } from "express";
import { PollController } from "../controllers/pollController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const pollController = new PollController();

// All poll routes require authentication
router.post("/", authenticateToken, pollController.createPoll.bind(pollController));
router.get("/", pollController.getAllPolls.bind(pollController));
router.get("/dashboard", authenticateToken, pollController.getPollsByUserId.bind(pollController));
router.get("/dashboard/stats", authenticateToken, pollController.getDashboardStats.bind(pollController));
router.get("/:id", pollController.getPollById.bind(pollController));
router.put("/:id", authenticateToken, pollController.updatePoll.bind(pollController));
router.delete("/:id", authenticateToken, pollController.deletePoll.bind(pollController));

export default router;
