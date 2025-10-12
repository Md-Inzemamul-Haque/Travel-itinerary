import express from "express";
import {
  createItinerary,
  deleteItinerary,
  getAllItinerary,
  getItineraryById,
  getSharedItineraryById,
  updateItinerary,
} from "../controllers/itineraryControllers.js";

export const itineraryRouter = express.Router();

itineraryRouter.post("/create", createItinerary);
itineraryRouter.get("/", getAllItinerary);
itineraryRouter.get("/:id", getItineraryById);
itineraryRouter.put("/:id", updateItinerary);
itineraryRouter.delete("/:id", deleteItinerary);
itineraryRouter.get("/share/:shareableId", getSharedItineraryById);
