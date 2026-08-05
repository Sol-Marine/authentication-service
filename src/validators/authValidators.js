import { z } from "zod";

// ======================
// Register
// ======================

export const registerSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required"),

  last_name: z
    .string()
    .min(1, "Last name is required"),

  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

// ======================
// Login
// ======================

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(1, "Password is required"),
});

// ======================
// Verify Email
// ======================

export const verifySchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  otp: z
    .string()
    .length(6, "OTP must be 6 digits"),
});

// ======================
// Resend Verification
// ======================

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),
});

// ======================
// Forgot Password
// ======================

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),
});

// ======================
// Reset Password
// ======================

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  otp: z
    .string()
    .length(6, "OTP must be 6 digits"),

  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

// ======================
// Update Profile
// ======================

export const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name cannot be empty")
    .optional(),

  last_name: z
    .string()
    .min(1, "Last name cannot be empty")
    .optional(),
});