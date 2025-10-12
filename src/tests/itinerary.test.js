import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app.js";
import { UserModel } from "../models/UserModel.js";
import { ItineraryModel } from "../models/ItineraryModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await UserModel.create({
    first_name: "Alice",
    email: "alice@example.com",
    phone: "+919837612365",
    password: hashedPassword,
  });

  userId = user._id;
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "testsecret");
});

afterAll(async () => {
  await UserModel.deleteMany();
  await ItineraryModel.deleteMany();
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await ItineraryModel.deleteMany();
});

describe("Itinerary API tests", () => {
  it("should create a new itinerary", async () => {
    const res = await request(app)
      .post("/api/itineraries/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Trip to India",
        destination: "Delhi",
        startDate: "2025-12-20",
        endDate: "2025-12-25",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Trip to India");
  });

  it("should not allow overlapping itineraries", async () => {
    await ItineraryModel.create({
      userId,
      title: "Existing Trip",
      destination: "Delhi",
      startDate: new Date("2025-12-20"),
      endDate: new Date("2025-12-25"),
      status: true,
    });

    const res = await request(app)
      .post("/api/itineraries/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Overlap Trip",
        destination: "Delhi",
        startDate: "2025-12-22",
        endDate: "2025-12-26",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/overlaps/);
  });

  it("should fetch all itineraries with pagination", async () => {
    await ItineraryModel.create({
      userId,
      title: "Trip 1",
      destination: "Delhi",
      startDate: new Date("2025-12-01"),
      endDate: new Date("2025-12-05"),
      status: true,
    });
    await ItineraryModel.create({
      userId,
      title: "Trip 2",
      destination: "Mumbai",
      startDate: new Date("2025-12-06"),
      endDate: new Date("2025-12-10"),
      status: true,
    });

    const res = await request(app)
      .get("/api/itineraries?page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.total).toBe(2);
    expect(res.body.totalPages).toBe(2);
  });

  it("should fetch itinerary by ID", async () => {
    const itinerary = await ItineraryModel.create({
      userId,
      title: "Trip 3",
      destination: "Paris",
      startDate: new Date("2025-12-11"),
      endDate: new Date("2025-12-15"),
      status: true,
    });

    const res = await request(app)
      .get(`/api/itineraries/${itinerary._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe("Trip 3");
  });

  it("should update an itinerary", async () => {
    const itinerary = await ItineraryModel.create({
      userId,
      title: "Trip 4",
      destination: "London",
      startDate: new Date("2025-12-16"),
      endDate: new Date("2025-12-20"),
      status: true,
    });

    const res = await request(app)
      .put(`/api/itineraries/${itinerary._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Trip 4" });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Updated Trip 4");
  });

  it("should soft delete an itinerary", async () => {
    const itinerary = await ItineraryModel.create({
      userId,
      title: "Trip 5",
      destination: "Tokyo",
      startDate: new Date("2025-12-21"),
      endDate: new Date("2025-12-25"),
      status: true,
    });

    const res = await request(app)
      .delete(`/api/itineraries/${itinerary._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const deleted = await ItineraryModel.findById(itinerary._id);
    expect(deleted.status).toBe(false);
  });
});
