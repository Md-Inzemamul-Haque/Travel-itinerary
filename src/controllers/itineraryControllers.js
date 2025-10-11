import { ItineraryModel } from "../models/ItineraryModel.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const createItinerary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { title, destination, startDate, endDate, activities } = req.body;

  if (!title || !destination || !startDate || !endDate) {
    return next(new AppError("Data missing", 400));
  }

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);

  const existingItinerary = await ItineraryModel.findOne({
    userId,
    startDate: { $lte: newEnd },
    endDate: { $gte: newStart },
    status: true,
  });

  if (existingItinerary) {
    return next(
      new AppError("You already have itinerary which overlaps these dates")
    );
  }

  const newItinerary = await ItineraryModel.create({
    userId,
    title,
    destination,
    startDate,
    endDate,
    activities,
    status: true,
  });

  res.status(201).json({
    status: "success",
    data: newItinerary,
  });
});

export const getAllItinerary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const itineraries = await ItineraryModel.find({
    userId,
  });

  res.status(200).json({
    message: itineraries?.length ? "success" : "No itinerary found",
    data: itineraries,
  });
});

export const getItineraryById = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const itineraryId = req.params.id;

  if (!itineraryId) {
    return next(new AppError("Itinerary Id missing", 400));
  }

  const itineraries = await ItineraryModel.find({
    userId,
    _id: itineraryId,
    status: true,
  });

  res.status(200).json({
    message: itineraries?.length ? "success" : "No itinerary found",
    data: itineraries,
  });
});

export const updateItinerary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const itineraryId = req.params.id;
  const { title, destination, startDate, endDate, activities } = req.body;

  if (!itineraryId) {
    return next(new AppError("Itinerary Id missing", 400));
  }

  const itinerary = await ItineraryModel.findOne({
    _id: itineraryId,
    userId,
    status: true,
  });

  if (!itinerary) {
    return next(new AppError("Itinerary not found", 404));
  }

  const newStart = startDate ? new Date(startDate) : itinerary.startDate;
  const newEnd = endDate ? new Date(endDate) : itinerary.endDate;

  const conflict = await ItineraryModel.findOne({
    userId,
    _id: { $ne: itineraryId },
    startDate: { $lte: newEnd },
    endDate: { $gte: newStart },
    status: true,
  });

  if (conflict) {
    return next(
      new AppError("You already have itinerary which overlaps these dates", 400)
    );
  }

  if (title) itinerary.title = title;
  if (destination) itinerary.destination = destination;
  if (startDate) itinerary.startDate = startDate;
  if (endDate) itinerary.endDate = endDate;
  if (activities) itinerary.activities = activities;

  await itinerary.save();

  res.status(201).json({
    status: "success",
    data: itinerary,
  });
});

export const deleteItinerary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const itineraryId = req.params.id;

  if (!itineraryId) {
    return next(new AppError("Itinerary Id missing", 400));
  }

  const itinerary = await ItineraryModel.findOne({
    _id: itineraryId,
    userId,
    status: true,
  });

  if (!itinerary) {
    return next(new AppError("Itinerary not found", 404));
  }

  itinerary.status = false;
  itinerary.save();

  return res.status(200).json({
    status: "success",
  });
});
