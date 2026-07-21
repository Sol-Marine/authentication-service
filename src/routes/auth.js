import { Hono } from "hono";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "../models/userModel.js";
import { createVerificationToken } from "../models/emailVerificationModel.js";

const auth = new Hono();

// Register
auth.post("/register", async (c) => {
  try {
    const body = await c.req.json();

    const { firstName, lastName, email, password } = body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save user
    const user = await createUser(
      firstName,
      lastName,
      email,
      passwordHash
    );

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // Save verification OTP
    await createVerificationToken(
      user.id,
      otp,
      expiresAt
    );

    // Temporary testing only
    console.log("Verification OTP:", otp);

    return c.json(
      {
        message: "User created successfully. Verify your email.",
        user,
      },
      201
    );

  } catch (error) {
    console.error(error);

    return c.json(
      {
        message: "Failed to create user",
      },
      500
    );
  }
});


// Login
auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();

    const { email, password } = body;

    // Find user
    const user = await findUserByEmail(email);

    if (!user) {
      return c.json(
        {
          message: "Invalid email or password",
        },
        401
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return c.json(
        {
          message: "Invalid email or password",
        },
        401
      );
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return c.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error(error);

    return c.json(
      {
        message: "Login failed",
      },
      500
    );
  }
});


export default auth;