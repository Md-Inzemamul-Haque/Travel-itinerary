import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/AppError.js";
import { UserModel } from "../models/UserModel.js";

export const createUser = catchAsync(async (req, res, next) => {
  const { first_name, last_name, mobile: phone, email, password } = req.body;

  if (!first_name || !phone || !email || !password) {
    return next(new AppError("All fields are required.", 400));
  }

  if (typeof email !== "string" || !validator.isEmail(email)) {
    return next(new AppError("Invalid email format.", 400));
  }

  if (
    typeof phone !== "string" ||
    !validator.isMobilePhone(phone, "any", { strictMode: true })
  ) {
    return next(new AppError("Invalid phone number.", 400));
  }

  const existingUser = await UserModel.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    return next(
      new AppError(
        existingUser.email === email
          ? "Email is already registered"
          : "Phone number is already registered",
        400
      )
    );
  }

  const hashPass = await bcrypt.hash(password, 10);

  const newUser = await UserModel.create({
    first_name,
    last_name,
    email,
    phone,
    password: hashPass,
  });

  res.status(201).json({
    status: "success",
    message: "User created successfully",
    data: {
      id: newUser._id,
      email: newUser.email,
      name: `${newUser.first_name} ${newUser.last_name}`,
    },
  });
});

export const loginUser = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError("Username and password are required.", 400));
  }

  if (
    typeof username !== "string" ||
    (!validator.isEmail(username) && !validator.isMobilePhone(username))
  ) {
    return next(new AppError("Invalid username format.", 400));
  }

  const query = validator.isEmail(username)
    ? { email: username }
    : { phone: username };

  const existingUser = await UserModel.findOne(query);

  if (!existingUser) {
    return next(new AppError("User not registered", 400));
  }

  const isMatch = await bcrypt.compare(password, existingUser.password);

  if (!isMatch) {
    return next(new AppError("Incorrect password", 401));
  }

  const token = jwt.sign(
    {
      id: existingUser._id,
      email: existingUser.email,
      name: existingUser.first_name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.status(200).json({
    status: "success",
    message: "Login successful",
    token,
    data: {
      id: existingUser._id,
      email: existingUser.email,
      name: `${existingUser.first_name} ${existingUser.last_name}`,
    },
  });
});
