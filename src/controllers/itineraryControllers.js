import redisClient from "../../config/redisClient.js";
import { ItineraryModel } from "../models/ItineraryModel.js";
import { UserModel } from "../models/UserModel.js";
import { sendEmail } from "../services/mailService.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { shareLinkGenerator } from "../utils/common.js";

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

  let newItinerary = await ItineraryModel.create({
    userId,
    title,
    destination,
    startDate,
    endDate,
    activities,
    status: true,
  });

  newItinerary = newItinerary.toObject();
  const shareLink = shareLinkGenerator(newItinerary._id);

  sendEmail({
    to: req.user.email,
    subject: "Itinerary created",
    text: `Hi ${req.user.name},

    Your itinerary "${title}" is successfully created.

    Have a great journey,
    Team Travel Itinerary App`,
    html: `<p>Hi ${req.user.name},</p>

    <p>Your itinerary "<strong>${title}</strong>" is successfully created.</p>
    <p>Itinerary Link: ${shareLink}</p>

    <p>Have a great journey,<br/>
    <strong>Team Travel Itinerary APP</strong></p>`,
  });

  return res.status(201).json({
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

  return res.status(200).json({
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

  if (req.query.share == "true") {
    const shareLink = shareLinkGenerator(itineraryId);
    return res.status(200).json({
      message: "Share link generated",
      data: shareLink,
    });
  }

  const cachedData = await redisClient.get(itineraryId);

  if (cachedData) {
    itinerary = JSON.parse(cachedData);
  } else {
    itinerary = await ItineraryModel.findOne({
      userId,
      _id: itineraryId,
      status: true,
    });

    if (itinerary) {
      itinerary = itinerary.toObject();
      await redisClient.set(itineraryId, JSON.stringify(itinerary), {
        EX: 300,
      });
    }
  }

  return res.status(200).json({
    message: itinerary ? "success" : "No itinerary found",
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

  return res.status(201).json({
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
    message: "Itinerary deleted",
  });
});

export const getSharedItineraryById = catchAsync(async (req, res, next) => {
  const itineraryId = req.params.shareableId;
  let itinerary;

  if (!itineraryId) {
    return next(new AppError("Itinerary Id missing", 400));
  }

  const cachedData = await redisClient.get(itineraryId);

  if (cachedData) {
    itinerary = JSON.parse(cachedData);
  } else {
    itinerary = await ItineraryModel.findOne({
      _id: itineraryId,
      status: true,
    });
    if (itinerary) {
      itinerary = itinerary.toObject();
      redisClient.set(itineraryId, JSON.stringify(itinerary), { EXP: 300 });
    }
  }

  if (itinerary) {
    delete itinerary._id;
    delete itinerary.userId;
    delete itinerary.__v;
  }

  return res.status(200).json({
    message: itinerary ? "success" : "No itinerary found",
    data: itinerary,
  });
});

export const getAllUserItineraryCount = catchAsync(async (req, res) => {
  const itineraries = await ItineraryModel.find();

  if (itineraries.length === 0) {
    throw new AppError("No itinerary foud", 400);
  }

  const userDetais = await UserModel.find();
  let userIdMap = {};
  userDetais.map((user) => {
    userIdMap[user._id] = user.first_name;
  });
  let userItineraryMap = {};

  itineraries.forEach((itinerary) => {
    if (!userItineraryMap[itinerary.userId]) {
      userItineraryMap[itinerary.userId] = {
        name: userIdMap[itinerary.userId],
        count: 1,
      };
    } else {
      userItineraryMap[itinerary.userId].count++;
    }
  });

  let result = {};
  Object.values(userItineraryMap).forEach((user) => {
    result[user.name] = user.count;
  });

  return res.status(200).json({
    status: "success",
    data: result,
  });
});
