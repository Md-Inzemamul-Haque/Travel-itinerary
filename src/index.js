import connectDB from "../config/db.js";
import redisClient from "../config/redisClient.js";
import app from "./app.js";
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();
    app.listen(PORT, () => {
      console.log(`Running in ${process.env.NODE_ENV} mode at PORT: ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
