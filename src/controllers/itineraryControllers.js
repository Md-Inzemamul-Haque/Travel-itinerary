import redisClient from "../../config/redisClient.js";
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
      new AppError("You already have itinerary which overlaps these dates", 400)
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

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort;
  const order = req.query.order === "asc" ? 1 : -1;
  const sortFilter = sort
    ? { [sort]: order, _id: 1 }
    : { createdAt: order, _id: 1 };
  const destination = req.query.destination;
  const filter = destination
    ? { userId, destination: { $regex: destination, $options: "i" } }
    : { userId };

  const itineraries = await ItineraryModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sortFilter);

  const total = await ItineraryModel.countDocuments({ userId });
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    message: itineraries?.length ? "success" : "No itinerary found",
    data: itineraries,
    page,
    totalPages,
    total,
  });
});

export const getItineraryById = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const itineraryId = req.params.id;
  let itinerary;

  if (!itineraryId) {
    return next(new AppError("Itinerary Id missing", 400));
  }

  const cahedData = await redisClient.get(itineraryId);

  if (cahedData) {
    itinerary = [JSON.parse(cahedData)];
  } else {
    itinerary = await ItineraryModel.find({
      userId,
      _id: itineraryId,
      status: true,
    });

    if (itinerary.length > 0) {
      await redisClient.set(itineraryId, JSON.stringify(itinerary), {
        EX: 300,
      });
    }
  }

  res.status(200).json({
    message: itinerary?.length ? "success" : "No itinerary found",
    data: itinerary,
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
  await redisClient.set(itineraryId, JSON.stringify(itinerary), { EX: 300 });

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
    redisClient.del(itineraryId);
    return next(new AppError("Itinerary not found", 404));
  }

  itinerary.status = false;
  itinerary.save();
  redisClient.del(itineraryId);

  return res.status(200).json({
    status: "success",
  });
});
