import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email format"],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v) =>
          validator.isMobilePhone(v, "any", { strictMode: false }),
        message: "Invalid phone number",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    collection: "user_details",
    timestamps: true,
  }
);

export const UserModel = mongoose.model("User", userSchema);
