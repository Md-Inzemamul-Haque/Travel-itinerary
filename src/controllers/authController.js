import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const openRoutes = ["/api/itineraries/share", "/api/itineraries/public"];

  const isOpenRoute = openRoutes.some((route) =>
    req.originalUrl.startsWith(route)
  );

  if (isOpenRoute) {
    return next();
  }

  if (!authHeader?.startsWith("Bearer "))
    return next(new AppError("Authorization token error", 401));

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError("Invalid token", 401));
  }
};
