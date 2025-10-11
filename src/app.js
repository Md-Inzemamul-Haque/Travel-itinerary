import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { userRouter } from "./routes/userRoutes.js";
import { AppError } from "./utils/AppError.js";
import { itineraryRouter } from "./routes/itineraryRoutes.js";
import { authMiddleware } from "./controllers/authController.js";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

dotenv.config();
const app = express();
app.use(helmet());
app.use(express.json());
app.use(limiter);

app.get("/api", (req, res) => {
  res.send("Travel itinerary is running");
});

app.use("/auth", userRouter);
app.use("/itineraries", authMiddleware, itineraryRouter);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({ status, message });
});

export default app;
