import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../app";
import { UserModel } from "../models/UserModel";
import bcrypt from "bcryptjs";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await UserModel.deleteMany();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("User API tests", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      mobile: "+919837612365",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("john@example.com");
  });

  it("should not allow duplicate email", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);

    await UserModel.create({
      first_name: "Jane",
      email: "jane@example.com",
      phone: "+919876543210",
      password: hashedPassword,
    });

    const res = await request(app).post("/api/auth/register").send({
      first_name: "Jane",
      email: "jane@example.com",
      mobile: "+919876543210",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Email is already registered/);
  });

  it("should contain valid token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "jane@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
