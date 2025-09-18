import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketService } from "./services/websocketService";

// Import routes
import userRoutes from "./routes/userRoutes";
import pollRoutes from "./routes/pollRoutes";
import createVoteRoutes from "./routes/voteRoutes";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4007;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Middleware
app.use(helmet());

const allowedOrigins = ["https://voting.hudhudapp.in", "http://localhost:4006"];

const corsOptions = {
  origin: (origin: string, callback: (err: Error | null, allow: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ["x-app-type"],
  allowedHeaders: ["Content-Type", "Authorization", "x-app-type"],
};

app.use(cors(corsOptions as CorsOptions));
// origin: process.env.CORS_ORIGIN || "https://voting.hudhudapp.in",
// origin: "*",
// credentials: true

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    websocket: {
      totalClients: wsService.getTotalClientCount(),
    },
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/votes", createVoteRoutes(wsService));

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler:", error);

  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred",
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server initialized`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Export for testing
export { app, wsService };
