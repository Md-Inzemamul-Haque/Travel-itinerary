import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  time: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true, index: true },
});

const itinerarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      trim: true,
    },
    endDate: {
      type: Date,
      required: true,
      trim: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    activities: [activitySchema],
  },
  {
    timestamps: true,
    collection: "travel_details",
  }
);

export const ItineraryModel = mongoose.model("Itinerary", itinerarySchema);
